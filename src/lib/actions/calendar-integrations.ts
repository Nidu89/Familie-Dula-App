"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import { E } from "@/lib/error-codes"
import { encrypt, decrypt } from "@/lib/crypto"
import { getProvider } from "@/lib/calendar-providers"
import type { ICloudCredentials, ProviderCredentials } from "@/lib/calendar-providers"
import {
  connectICloudSchema,
  disconnectIntegrationSchema,
  syncIntegrationSchema,
  updateSelectedCalendarsSchema,
  updateSyncIntervalSchema,
} from "@/lib/validations/calendar-integrations"

// ============================================================
// Helpers
// ============================================================

async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, family_id, role")
    .eq("id", user.id)
    .single()

  return profile
}

// ============================================================
// Types
// ============================================================

export type CalendarIntegration = {
  id: string
  userId: string
  provider: "google" | "icloud"
  status: "active" | "error" | "disconnected"
  selectedCalendars: { id: string; name: string }[]
  syncIntervalMinutes: number
  lastSyncedAt: string | null
  lastError: string | null
  createdAt: string
}

export type ExternalCalendarEvent = {
  id: string
  integrationId: string
  externalEventId: string
  title: string
  description: string | null
  location: string | null
  startAt: string
  endAt: string
  allDay: boolean
  calendarName: string | null
  provider: "google" | "icloud"
}

// ============================================================
// listIntegrationsAction
// ============================================================

export async function listIntegrationsAction(): Promise<
  { integrations: CalendarIntegration[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("calendar_integrations")
    .select(
      "id, user_id, provider, status, selected_calendars, sync_interval_minutes, last_synced_at, last_error, created_at"
    )
    .eq("user_id", profile.id)
    .neq("status", "disconnected")
    .order("created_at", { ascending: true })
    .limit(10)

  if (error) return { error: E.CAL_INT_LOAD_FAILED }

  const integrations: CalendarIntegration[] = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    provider: row.provider as "google" | "icloud",
    status: row.status as "active" | "error" | "disconnected",
    selectedCalendars: (row.selected_calendars as { id: string; name: string }[]) || [],
    syncIntervalMinutes: row.sync_interval_minutes,
    lastSyncedAt: row.last_synced_at,
    lastError: row.last_error,
    createdAt: row.created_at,
  }))

  return { integrations }
}

// ============================================================
// connectICloudAction
// ============================================================

export async function connectICloudAction(data: {
  appleId: string
  appPassword: string
}): Promise<{ integrationId: string } | { error: string }> {
  const parsed = connectICloudSchema.safeParse(data)
  if (!parsed.success) return { error: E.VAL_INVALID }

  const ip = await getIP()
  if (!checkRateLimit(`calConnect:${ip}`, 5, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  // Build credentials and validate
  const credentials: ICloudCredentials = {
    provider: "icloud",
    appleId: parsed.data.appleId,
    appPassword: parsed.data.appPassword,
    caldavUrl: "https://caldav.icloud.com",
  }

  const provider = getProvider("icloud")
  const isValid = await provider.validateCredentials(credentials)
  if (!isValid) {
    return {
      error: E.VAL_INVALID,
    }
  }

  const encryptedCredentials = encrypt(JSON.stringify(credentials))

  const supabase = await createClient()
  const { data: row, error: dbError } = await supabase
    .from("calendar_integrations")
    .upsert(
      {
        user_id: profile.id,
        family_id: profile.family_id,
        provider: "icloud",
        status: "active",
        credentials_encrypted: encryptedCredentials,
        selected_calendars: [],
        last_error: null,
      },
      { onConflict: "user_id,provider" }
    )
    .select("id")
    .single()

  if (dbError || !row) {
    return { error: E.CAL_INT_SAVE_FAILED }
  }

  return { integrationId: row.id }
}

// ============================================================
// fetchAvailableCalendarsAction
// ============================================================

export async function fetchAvailableCalendarsAction(data: {
  integrationId: string
}): Promise<
  { calendars: { id: string; name: string; color?: string }[] } | { error: string }
> {
  const ip = await getIP()
  if (!checkRateLimit(`calFetch:${ip}`, 10, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }

  const supabase = await createClient()
  const { data: integration } = await supabase
    .from("calendar_integrations")
    .select("id, provider, credentials_encrypted")
    .eq("id", data.integrationId)
    .eq("user_id", profile.id)
    .single()

  if (!integration) return { error: E.CAL_INT_NOT_FOUND }

  try {
    const credentials: ProviderCredentials = JSON.parse(
      decrypt(integration.credentials_encrypted)
    )
    const provider = getProvider(integration.provider)
    const calendars = await provider.fetchCalendars(credentials)
    return { calendars }
  } catch {
    return { error: E.CAL_INT_CALENDARS_FAILED }
  }
}

// ============================================================
// updateSelectedCalendarsAction
// ============================================================

export async function updateSelectedCalendarsAction(data: {
  integrationId: string
  selectedCalendars: { id: string; name: string }[]
}): Promise<{ success: true } | { error: string }> {
  const parsed = updateSelectedCalendarsSchema.safeParse(data)
  if (!parsed.success) return { error: E.VAL_INVALID }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from("calendar_integrations")
    .update({ selected_calendars: parsed.data.selectedCalendars })
    .eq("id", parsed.data.integrationId)
    .eq("user_id", profile.id)

  if (updateError) return { error: E.CAL_INT_CALENDARS_UPDATE_FAILED }
  return { success: true }
}

// ============================================================
// updateSyncIntervalAction
// ============================================================

export async function updateSyncIntervalAction(data: {
  integrationId: string
  syncIntervalMinutes: number
}): Promise<{ success: true } | { error: string }> {
  const parsed = updateSyncIntervalSchema.safeParse(data)
  if (!parsed.success) return { error: E.VAL_INVALID }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from("calendar_integrations")
    .update({ sync_interval_minutes: parsed.data.syncIntervalMinutes })
    .eq("id", parsed.data.integrationId)
    .eq("user_id", profile.id)

  if (updateError) return { error: E.CAL_INT_SYNC_INTERVAL_FAILED }
  return { success: true }
}

// ============================================================
// disconnectIntegrationAction
// ============================================================

export async function disconnectIntegrationAction(data: {
  integrationId: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = disconnectIntegrationSchema.safeParse(data)
  if (!parsed.success) return { error: E.VAL_INVALID }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }

  const supabase = await createClient()

  // Delete all imported events first (CASCADE would handle this, but be explicit)
  await supabase
    .from("external_calendar_events")
    .delete()
    .eq("integration_id", parsed.data.integrationId)
    .eq("user_id", profile.id)

  // Delete the integration itself
  const { error: deleteError } = await supabase
    .from("calendar_integrations")
    .delete()
    .eq("id", parsed.data.integrationId)
    .eq("user_id", profile.id)

  if (deleteError) return { error: E.CAL_INT_DISCONNECT_FAILED }
  return { success: true }
}

// ============================================================
// syncIntegrationAction — manual sync trigger
// ============================================================

export async function syncIntegrationAction(data: {
  integrationId: string
}): Promise<{ eventsImported: number } | { error: string }> {
  const parsed = syncIntegrationSchema.safeParse(data)
  if (!parsed.success) return { error: E.VAL_INVALID }

  const ip = await getIP()
  if (!checkRateLimit(`calSync:${ip}`, 5, 60 * 1000)) {
    return { error: E.RATE_SYNC_LIMITED }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()
  const { data: integration } = await supabase
    .from("calendar_integrations")
    .select("id, provider, credentials_encrypted, selected_calendars")
    .eq("id", parsed.data.integrationId)
    .eq("user_id", profile.id)
    .single()

  if (!integration) return { error: E.CAL_INT_NOT_FOUND }

  const selectedCalendars =
    (integration.selected_calendars as { id: string; name: string }[]) || []
  if (selectedCalendars.length === 0) {
    return { error: E.CAL_INT_NO_CALENDARS }
  }

  try {
    const credentials: ProviderCredentials = JSON.parse(
      decrypt(integration.credentials_encrypted)
    )
    const provider = getProvider(integration.provider)

    // Sync window: 1 month back to 3 months ahead
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)

    const calendarIds = selectedCalendars.map((c) => c.id)
    const events = await provider.fetchEvents(
      credentials,
      calendarIds,
      startDate,
      endDate
    )

    // Upsert events (dedup by integration_id + external_event_id)
    if (events.length > 0) {
      const rows = events.map((e) => ({
        integration_id: integration.id,
        user_id: profile.id,
        family_id: profile.family_id,
        external_event_id: e.externalEventId,
        title: e.title,
        description: e.description || null,
        location: e.location || null,
        start_at: e.startAt,
        end_at: e.endAt,
        all_day: e.allDay,
        calendar_name: e.calendarName || null,
        provider: integration.provider,
        last_synced_at: new Date().toISOString(),
      }))

      const { error: upsertError } = await supabase
        .from("external_calendar_events")
        .upsert(rows, {
          onConflict: "integration_id,external_event_id",
        })

      if (upsertError) {
        await supabase
          .from("calendar_integrations")
          .update({ status: "error", last_error: upsertError.message })
          .eq("id", integration.id)
        return { error: E.CAL_INT_EVENTS_SAVE_FAILED }
      }
    }

    // Remove events that were not touched by this sync (i.e., no longer in external calendar)
    const syncTimestamp = new Date().toISOString()
    await supabase
      .from("external_calendar_events")
      .delete()
      .eq("integration_id", integration.id)
      .lt("last_synced_at", syncTimestamp)

    // Update integration status
    await supabase
      .from("calendar_integrations")
      .update({
        status: "active",
        last_synced_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", integration.id)

    return { eventsImported: events.length }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    await supabase
      .from("calendar_integrations")
      .update({ status: "error", last_error: errorMsg })
      .eq("id", integration.id)
    return { error: E.CAL_INT_SYNC_FAILED }
  }
}

// ============================================================
// getExternalEventsForRangeAction — for calendar display
// ============================================================

export async function getExternalEventsForRangeAction(
  startDate: string,
  endDate: string
): Promise<{ events: ExternalCalendarEvent[] } | { error: string }> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("external_calendar_events")
    .select(
      "id, integration_id, external_event_id, title, description, location, start_at, end_at, all_day, calendar_name, provider"
    )
    .eq("family_id", profile.family_id)
    .gte("end_at", startDate)
    .lte("start_at", endDate)
    .order("start_at", { ascending: true })
    .limit(500)

  if (error) return { error: E.CAL_INT_EXTERNAL_LOAD_FAILED }

  const events: ExternalCalendarEvent[] = (data || []).map((row) => ({
    id: row.id,
    integrationId: row.integration_id,
    externalEventId: row.external_event_id,
    title: row.title,
    description: row.description,
    location: row.location,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    calendarName: row.calendar_name,
    provider: row.provider as "google" | "icloud",
  }))

  return { events }
}
