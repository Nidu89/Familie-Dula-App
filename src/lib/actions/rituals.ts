"use server"

import { createClient } from "@/lib/supabase/server"
import {
  createRitualSchema,
  updateRitualSchema,
  deleteRitualSchema,
  type RitualStep,
} from "@/lib/validations/rituals"

// ============================================================
// PROJ-14: Familien-Rituale – Server Actions
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

// Helper: verify caller is adult or admin
async function verifyAdultOrAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet.", profile: null }
  if (!profile.family_id)
    return { error: "Du gehoerst keiner Familie an.", profile: null }
  if (!["adult", "admin"].includes(profile.role ?? ""))
    return {
      error: "Nur Erwachsene und Admins duerfen diese Aktion ausfuehren.",
      profile: null,
    }
  return { error: null, profile }
}

// ============================================================
// Types
// ============================================================

export type Ritual = {
  id: string
  familyId: string
  name: string
  description: string | null
  steps: RitualStep[]
  timerDurationMinutes: number | null
  rewardPoints: number | null
  isSystemTemplate: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ============================================================
// getRitualsAction
// ============================================================

export async function getRitualsAction(): Promise<
  { rituals: Ritual[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rituals")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) {
    return { error: "Rituale konnten nicht geladen werden." }
  }

  const rituals: Ritual[] = (data || []).map((row) => ({
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    description: row.description,
    steps: (row.steps as RitualStep[]) || [],
    timerDurationMinutes: row.timer_duration_minutes,
    rewardPoints: row.reward_points,
    isSystemTemplate: row.is_system_template,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return { rituals }
}

// ============================================================
// createRitualAction
// ============================================================

export async function createRitualAction(data: {
  name: string
  description?: string
  steps: RitualStep[]
  timerDurationMinutes?: number | null
  rewardPoints?: number | null
}): Promise<{ ritual: { id: string } } | { error: string }> {
  const parsed = createRitualSchema.safeParse(data)
  if (!parsed.success) {
    return {
      error:
        "Ungueltige Eingaben: " +
        parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Get current max sort_order
  const { data: existingRituals } = await supabase
    .from("rituals")
    .select("sort_order")
    .eq("family_id", profile.family_id)
    .order("sort_order", { ascending: false })
    .limit(1)

  const maxSortOrder =
    existingRituals && existingRituals.length > 0
      ? (existingRituals[0].sort_order ?? 0)
      : 0

  const { data: ritual, error: insertError } = await supabase
    .from("rituals")
    .insert({
      family_id: profile.family_id,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      steps: parsed.data.steps,
      timer_duration_minutes: parsed.data.timerDurationMinutes ?? null,
      reward_points: parsed.data.rewardPoints ?? null,
      is_system_template: false,
      sort_order: maxSortOrder + 1,
    })
    .select("id")
    .single()

  if (insertError || !ritual) {
    return { error: "Ritual konnte nicht erstellt werden." }
  }

  return { ritual: { id: ritual.id } }
}

// ============================================================
// updateRitualAction
// ============================================================

export async function updateRitualAction(data: {
  id: string
  name: string
  description?: string
  steps: RitualStep[]
  timerDurationMinutes?: number | null
  rewardPoints?: number | null
}): Promise<{ success: true } | { error: string }> {
  const parsed = updateRitualSchema.safeParse(data)
  if (!parsed.success) {
    return {
      error:
        "Ungueltige Eingaben: " +
        parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Verify ritual exists and belongs to the family
  const { data: existing, error: fetchError } = await supabase
    .from("rituals")
    .select("id, family_id")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: "Ritual nicht gefunden." }
  }

  const { error: updateError } = await supabase
    .from("rituals")
    .update({
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      steps: parsed.data.steps,
      timer_duration_minutes: parsed.data.timerDurationMinutes ?? null,
      reward_points: parsed.data.rewardPoints ?? null,
    })
    .eq("id", parsed.data.id)

  if (updateError) {
    return { error: "Ritual konnte nicht aktualisiert werden." }
  }

  return { success: true }
}

// ============================================================
// deleteRitualAction
// ============================================================

export async function deleteRitualAction(data: {
  id: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = deleteRitualSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Verify ritual exists and belongs to the family
  const { data: existing, error: fetchError } = await supabase
    .from("rituals")
    .select("id, family_id")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: "Ritual nicht gefunden." }
  }

  const { error: deleteError } = await supabase
    .from("rituals")
    .delete()
    .eq("id", parsed.data.id)

  if (deleteError) {
    return { error: "Ritual konnte nicht geloescht werden." }
  }

  return { success: true }
}

// ============================================================
// awardRitualCompletionAction
// Awards points when a ritual is completed — callable by any
// family member (children completing their own rituals).
// Uses a SECURITY DEFINER RPC to bypass adult-only checks.
// ============================================================

export async function awardRitualCompletionAction(
  childProfileId: string,
  points: number,
  ritualName: string
): Promise<{ newBalance: number } | { error: string }> {
  if (!childProfileId || typeof childProfileId !== "string") {
    return { error: "Ungueltige Profil-ID." }
  }
  if (points <= 0) {
    return { error: "Punkte muessen positiv sein." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("award_ritual_completion", {
    p_child_profile_id: childProfileId,
    p_points: points,
    p_ritual_name: `Ritual abgeschlossen: ${ritualName}`,
  })

  if (error) {
    if (error.message.includes("same family")) {
      return { error: "Nicht berechtigt – anderes Familienmitglied." }
    }
    return { error: "Punkte konnten nicht vergeben werden." }
  }

  const result = data as { new_balance: number }
  return { newBalance: result.new_balance }
}
