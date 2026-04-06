"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import {
  createTimerTemplateSchema,
  updateTimerTemplateSchema,
  deleteTimerTemplateSchema,
} from "@/lib/validations/timer"

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
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("timer_templates")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("is_system_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) {
    return { error: "Vorlagen konnten nicht geladen werden." }
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
    return { error: "Ungueltige Eingaben." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`timerTemplate:${ip}`, 20, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

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
    return { error: "Vorlage konnte nicht erstellt werden." }
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
    return { error: "Ungueltige Eingaben." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Verify template exists and belongs to the family
  const { data: existing, error: fetchError } = await supabase
    .from("timer_templates")
    .select("id, family_id")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: "Vorlage nicht gefunden." }
  }

  const { error: updateError } = await supabase
    .from("timer_templates")
    .update({
      name: parsed.data.name.trim(),
      duration_seconds: parsed.data.durationSeconds,
    })
    .eq("id", parsed.data.id)

  if (updateError) {
    return { error: "Vorlage konnte nicht aktualisiert werden." }
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
    return { error: "Ungueltige Eingaben." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Verify template exists and belongs to the family
  const { data: existing, error: fetchError } = await supabase
    .from("timer_templates")
    .select("id, family_id")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: "Vorlage nicht gefunden." }
  }

  const { error: deleteError } = await supabase
    .from("timer_templates")
    .delete()
    .eq("id", parsed.data.id)

  if (deleteError) {
    return { error: "Vorlage konnte nicht geloescht werden." }
  }

  return { success: true }
}
