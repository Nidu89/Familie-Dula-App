"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import { E } from "@/lib/error-codes"
import {
  createRitualSchema,
  updateRitualSchema,
  deleteRitualSchema,
  awardRitualCompletionSchema,
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
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN, profile: null }
  if (!profile.family_id)
    return { error: E.AUTH_NO_FAMILY, profile: null }
  if (!["adult", "admin"].includes(profile.role ?? ""))
    return {
      error: E.PERM_ADULT_REQUIRED,
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
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rituals")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) {
    return { error: E.RITUAL_LOAD_FAILED }
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
      error: E.VAL_INVALID,
    }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || E.AUTH_UNKNOWN }

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
    return { error: E.RITUAL_CREATE_FAILED }
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
      error: E.VAL_INVALID,
    }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  // Verify ritual exists and belongs to the family
  const { data: existing, error: fetchError } = await supabase
    .from("rituals")
    .select("id, family_id")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: E.RITUAL_NOT_FOUND }
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
    return { error: E.RITUAL_UPDATE_FAILED }
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
    return { error: E.VAL_INVALID }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  // Verify ritual exists and belongs to the family
  const { data: existing, error: fetchError } = await supabase
    .from("rituals")
    .select("id, family_id")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: E.RITUAL_NOT_FOUND }
  }

  const { error: deleteError } = await supabase
    .from("rituals")
    .delete()
    .eq("id", parsed.data.id)

  if (deleteError) {
    return { error: E.RITUAL_DELETE_FAILED }
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
  const parsed = awardRitualCompletionSchema.safeParse({
    childProfileId,
    points,
    ritualName,
  })
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const ip = await getIP()
  if (!checkRateLimit(`awardRitual:${ip}`, 30, 60 * 60 * 1000)) {
    return { error: E.RATE_LIMITED }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("award_ritual_completion", {
    p_child_profile_id: parsed.data.childProfileId,
    p_points: parsed.data.points,
    p_ritual_name: `Ritual abgeschlossen: ${parsed.data.ritualName}`,
  })

  if (error) {
    if (error.message.includes("same family")) {
      return { error: E.PERM_OTHER_FAMILY_MEMBER }
    }
    if (error.message.includes("Not authorized")) {
      return { error: E.PERM_DENIED }
    }
    if (error.message.includes("exceed maximum")) {
      return { error: E.REWARD_POINTS_EXCEEDED }
    }
    return { error: E.REWARD_POINTS_FAILED }
  }

  const result = data as { new_balance: number }
  return { newBalance: result.new_balance }
}

// ============================================================
// Active Ritual Session Actions — persist running ritual state
// so all family members (including children) can see it.
// ============================================================

export type ActiveRitualSession = {
  id: string
  familyId: string
  ritualId: string
  startedBy: string
  startedAt: string
  completedStepIds: string[]
  status: "running" | "paused" | "completed"
  assignedTo: string | null
  assignedToName: string | null
  completedBy: string | null
  pointsAwarded: boolean
}

export async function getActiveRitualSessionAction(): Promise<
  { session: ActiveRitualSession | null } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("active_ritual_sessions")
    .select("*")
    .eq("family_id", profile.family_id)
    .maybeSingle()

  if (error) {
    return { error: E.RITUAL_SESSION_LOAD_FAILED }
  }

  if (!data) return { session: null }

  return {
    session: {
      id: data.id,
      familyId: data.family_id,
      ritualId: data.ritual_id,
      startedBy: data.started_by,
      startedAt: data.started_at,
      completedStepIds: data.completed_step_ids || [],
      status: data.status as ActiveRitualSession["status"],
      assignedTo: data.assigned_to ?? null,
      assignedToName: data.assigned_to_name ?? null,
      completedBy: data.completed_by ?? null,
      pointsAwarded: data.points_awarded ?? false,
    },
  }
}

// ============================================================
// getFamilyChildrenAction — returns children in the family
// Used for the child selection picker when starting a ritual
// ============================================================

export async function getFamilyChildrenAction(): Promise<
  { children: { id: string; displayName: string }[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("family_id", profile.family_id)
    .eq("role", "child")
    .order("display_name")
    .limit(20)

  return {
    children: (data || []).map((c) => ({
      id: c.id,
      displayName: c.display_name || "Kind",
    })),
  }
}

export async function startRitualSessionAction(
  ritualId: string,
  assignedTo?: string | null,
  assignedToName?: string | null
): Promise<{ session: ActiveRitualSession } | { error: string }> {
  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile) return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  // Delete any existing session first (upsert pattern)
  await supabase
    .from("active_ritual_sessions")
    .delete()
    .eq("family_id", profile.family_id)

  const { data, error } = await supabase
    .from("active_ritual_sessions")
    .insert({
      family_id: profile.family_id,
      ritual_id: ritualId,
      started_by: profile.id,
      completed_step_ids: [],
      status: "running",
      assigned_to: assignedTo ?? null,
      assigned_to_name: assignedToName ?? null,
      points_awarded: false,
    })
    .select("*")
    .single()

  if (error || !data) {
    return { error: E.RITUAL_SESSION_START_FAILED }
  }

  return {
    session: {
      id: data.id,
      familyId: data.family_id,
      ritualId: data.ritual_id,
      startedBy: data.started_by,
      startedAt: data.started_at,
      completedStepIds: data.completed_step_ids || [],
      status: data.status as ActiveRitualSession["status"],
      assignedTo: data.assigned_to ?? null,
      assignedToName: data.assigned_to_name ?? null,
      completedBy: data.completed_by ?? null,
      pointsAwarded: data.points_awarded ?? false,
    },
  }
}

export async function updateRitualSessionAction(data: {
  completedStepIds?: string[]
  status?: "running" | "paused" | "completed"
}): Promise<{ success: true } | { error: string }> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = {}
  if (data.completedStepIds !== undefined) {
    updatePayload.completed_step_ids = data.completedStepIds
  }
  if (data.status !== undefined) {
    updatePayload.status = data.status
    if (data.status === "completed") {
      updatePayload.completed_by = profile.id
    }
  }

  const { error } = await supabase
    .from("active_ritual_sessions")
    .update(updatePayload)
    .eq("family_id", profile.family_id)

  if (error) {
    return { error: E.RITUAL_SESSION_UPDATE_FAILED }
  }

  // Auto-award points when ritual is completed (server-side, exactly once)
  if (data.status === "completed") {
    // Atomically claim the points_awarded flag to prevent double-awarding
    const { data: claimed } = await supabase
      .from("active_ritual_sessions")
      .update({ points_awarded: true })
      .eq("family_id", profile.family_id)
      .eq("points_awarded", false)
      .select("assigned_to, assigned_to_name, ritual_id")
      .maybeSingle()

    if (claimed?.assigned_to && claimed.ritual_id) {
      const { data: ritual } = await supabase
        .from("rituals")
        .select("reward_points, name")
        .eq("id", claimed.ritual_id)
        .single()

      if (ritual?.reward_points && ritual.reward_points > 0) {
        const { error: rpcError } = await supabase.rpc(
          "award_ritual_completion",
          {
            p_child_profile_id: claimed.assigned_to,
            p_points: ritual.reward_points,
            p_ritual_name: `Ritual abgeschlossen: ${ritual.name}`,
          }
        )

        if (rpcError) {
          // Reset flag so a retry is possible
          await supabase
            .from("active_ritual_sessions")
            .update({ points_awarded: false })
            .eq("family_id", profile.family_id)
        }
      }
    }
  }

  return { success: true }
}

export async function endRitualSessionAction(): Promise<
  { success: true } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  const { error } = await supabase
    .from("active_ritual_sessions")
    .delete()
    .eq("family_id", profile.family_id)

  if (error) {
    return { error: E.RITUAL_SESSION_END_FAILED }
  }

  return { success: true }
}
