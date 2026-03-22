"use server"

import { createClient } from "@/lib/supabase/server"
import { manualPointsSchema } from "@/lib/validations/tasks"

// ============================================================
// PROJ-6: Belohnungssystem – Server Actions
// ============================================================

// Helper: get current user's profile with family + role info
async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, family_id, role, display_name")
    .eq("id", user.id)
    .single()

  return profile
}

// ============================================================
// Types
// ============================================================

export type ChildPointsSummary = {
  id: string
  displayName: string
  pointsBalance: number
  role: string
}

export type PointsTransaction = {
  id: string
  profileId: string
  amount: number
  type: "task_completion" | "manual_add" | "manual_deduct"
  taskId: string | null
  taskTitle: string | null
  comment: string | null
  createdByName: string | null
  createdAt: string
}

// ============================================================
// getRewardsOverviewAction
// ============================================================

export async function getRewardsOverviewAction(): Promise<
  { children: ChildPointsSummary[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Fetch all children in the family with their points balance
  const { data: children, error: childError } = await supabase
    .from("profiles")
    .select("id, display_name, points_balance, role")
    .eq("family_id", profile.family_id)
    .eq("role", "child")
    .order("display_name")

  if (childError) {
    return { error: "Punkte-Uebersicht konnte nicht geladen werden." }
  }

  return {
    children: (children || []).map((c) => ({
      id: c.id,
      displayName: c.display_name || "Kind",
      pointsBalance: c.points_balance ?? 0,
      role: c.role || "child",
    })),
  }
}

// ============================================================
// getPointsHistoryAction
// ============================================================

export async function getPointsHistoryAction(
  profileId: string
): Promise<{ transactions: PointsTransaction[] } | { error: string }> {
  if (!profileId || typeof profileId !== "string") {
    return { error: "Ungueltige Profil-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  // Children can only see their own history
  if (profile.role === "child" && profileId !== profile.id) {
    return { error: "Du kannst nur deine eigene Punktehistorie einsehen." }
  }

  const supabase = await createClient()

  // Verify target belongs to same family
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, family_id")
    .eq("id", profileId)
    .eq("family_id", profile.family_id)
    .single()

  if (!targetProfile) {
    return { error: "Profil nicht gefunden oder nicht in deiner Familie." }
  }

  // Fetch transactions with task title and creator name via joins
  const { data: rawTransactions, error: txError } = await supabase
    .from("points_transactions")
    .select(
      `
      id,
      profile_id,
      amount,
      type,
      task_id,
      task:task_id (
        title
      ),
      comment,
      creator:created_by (
        display_name
      ),
      created_at
    `
    )
    .eq("profile_id", profileId)
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false })
    .limit(200)

  if (txError) {
    return { error: "Punktehistorie konnte nicht geladen werden." }
  }

  const transactions: PointsTransaction[] = (rawTransactions || []).map((tx) => ({
    id: tx.id,
    profileId: tx.profile_id,
    amount: tx.amount,
    type: tx.type as "task_completion" | "manual_add" | "manual_deduct",
    taskId: tx.task_id,
    taskTitle: (() => {
      const t = tx.task as unknown
      if (Array.isArray(t)) return (t[0] as { title: string } | undefined)?.title || null
      return (t as { title: string } | null)?.title || null
    })(),
    comment: tx.comment,
    createdByName: (() => {
      const c = tx.creator as unknown
      if (Array.isArray(c)) return (c[0] as { display_name: string | null } | undefined)?.display_name || null
      return (c as { display_name: string | null } | null)?.display_name || null
    })(),
    createdAt: tx.created_at,
  }))

  return { transactions }
}

// ============================================================
// manualPointsAction
// ============================================================

export type ManualPointsResult = {
  newBalance: number
  amountApplied: number
  type: string
}

export async function manualPointsAction(
  profileId: string,
  amount: number,
  comment?: string
): Promise<ManualPointsResult | { error: string }> {
  const parsed = manualPointsSchema.safeParse({ profileId, amount, comment })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Punkte manuell buchen." }
  }

  const supabase = await createClient()

  // Call the atomic RPC function
  const { data, error } = await supabase.rpc("manual_points_booking", {
    p_profile_id: parsed.data.profileId,
    p_amount: parsed.data.amount,
    p_comment: parsed.data.comment || null,
  })

  if (error) {
    if (error.message.includes("different family")) {
      return { error: "Nicht berechtigt – anderes Familienmitglied." }
    }
    if (error.message.includes("Amount must not be zero")) {
      return { error: "Betrag darf nicht 0 sein." }
    }
    return { error: "Punkte konnten nicht gebucht werden." }
  }

  const result = data as {
    new_balance: number
    amount_applied: number
    type: string
  }

  return {
    newBalance: result.new_balance,
    amountApplied: result.amount_applied,
    type: result.type,
  }
}
