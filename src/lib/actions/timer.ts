"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import {
  createTimerTemplateSchema,
  updateTimerTemplateSchema,
  deleteTimerTemplateSchema,
} from "@/lib/validations/timer"
import { E } from "@/lib/error-codes"

// ============================================================
// PROJ-13: Familien-Timer – Server Actions
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

export type TimerTemplate = {
  id: string
  familyId: string
  name: string
  durationSeconds: number
  isSystemDefault: boolean
  createdBy: string
  createdAt: string
}

// ============================================================
// getTimerTemplatesAction
// ============================================================

export async function getTimerTemplatesAction(): Promise<
  { templates: TimerTemplate[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("timer_templates")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("is_system_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) {
    return { error: E.TIMER_LOAD_FAILED }
  }

  const templates: TimerTemplate[] = (data || []).map((row) => ({
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    durationSeconds: row.duration_seconds,
    isSystemDefault: row.is_system_default,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }))

  return { templates }
}

// ============================================================
// createTimerTemplateAction
// ============================================================

export async function createTimerTemplateAction(data: {
  name: string
  durationSeconds: number
}): Promise<{ template: { id: string } } | { error: string }> {
  const parsed = createTimerTemplateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const ip = await getIP()
  if (!checkRateLimit(`timerTemplate:${ip}`, 20, 60 * 60 * 1000)) {
    return { error: E.RATE_LIMITED }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  const { data: template, error: insertError } = await supabase
    .from("timer_templates")
    .insert({
      family_id: profile.family_id,
      name: parsed.data.name.trim(),
      duration_seconds: parsed.data.durationSeconds,
      is_system_default: false,
      created_by: profile.id,
    })
    .select("id")
    .single()

  if (insertError || !template) {
    return { error: E.TIMER_CREATE_FAILED }
  }

  return { template: { id: template.id } }
}

// ============================================================
// updateTimerTemplateAction
// ============================================================

export async function updateTimerTemplateAction(data: {
  id: string
  name: string
  durationSeconds: number
}): Promise<{ success: true } | { error: string }> {
  const parsed = updateTimerTemplateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  // Verify template exists and belongs to the family
  const { data: existing, error: fetchError } = await supabase
    .from("timer_templates")
    .select("id, family_id")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: E.TIMER_NOT_FOUND }
  }

  const { error: updateError } = await supabase
    .from("timer_templates")
    .update({
      name: parsed.data.name.trim(),
      duration_seconds: parsed.data.durationSeconds,
    })
    .eq("id", parsed.data.id)

  if (updateError) {
    return { error: E.TIMER_UPDATE_FAILED }
  }

  return { success: true }
}

// ============================================================
// deleteTimerTemplateAction
// ============================================================

export async function deleteTimerTemplateAction(data: {
  id: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = deleteTimerTemplateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  // Verify template exists and belongs to the family
  const { data: existing, error: fetchError } = await supabase
    .from("timer_templates")
    .select("id, family_id")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: E.TIMER_NOT_FOUND }
  }

  const { error: deleteError } = await supabase
    .from("timer_templates")
    .delete()
    .eq("id", parsed.data.id)

  if (deleteError) {
    return { error: E.TIMER_DELETE_FAILED }
  }

  return { success: true }
}
