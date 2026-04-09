import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { decrypt } from "@/lib/crypto"
import { getProvider } from "@/lib/calendar-providers"
import type { ProviderCredentials } from "@/lib/calendar-providers"

/**
 * POST /api/calendar/sync
 * Cron-triggered sync for all active calendar integrations.
 * Protected by CRON_SECRET header.
 *
 * Can be called by:
 * - Vercel Cron Jobs (vercel.json)
 * - External cron services
 * - Manual trigger with secret
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Service role client bypasses RLS — required for cron (no user session)
  const supabase = createServiceClient()

  // Fetch all active integrations that are due for sync
  const { data: integrations, error: fetchError } = await supabase
    .from("calendar_integrations")
    .select(
      "id, user_id, family_id, provider, credentials_encrypted, selected_calendars, sync_interval_minutes, last_synced_at"
    )
    .eq("status", "active")
    .limit(100)

  if (fetchError || !integrations) {
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    )
  }

  const now = Date.now()
  const results: { id: string; status: string; events?: number; error?: string }[] = []

  for (const integration of integrations) {
    // Check if sync is due
    if (integration.last_synced_at) {
      const lastSync = new Date(integration.last_synced_at).getTime()
      const intervalMs = integration.sync_interval_minutes * 60 * 1000
      if (now - lastSync < intervalMs) {
        results.push({ id: integration.id, status: "skipped" })
        continue
      }
    }

    const selectedCalendars =
      (integration.selected_calendars as { id: string; name: string }[]) || []
    if (selectedCalendars.length === 0) {
      results.push({ id: integration.id, status: "no_calendars" })
      continue
    }

    try {
      const credentials: ProviderCredentials = JSON.parse(
        decrypt(integration.credentials_encrypted)
      )
      const provider = getProvider(integration.provider)

      // Sync window: 1 month back to 3 months ahead
      const nowDate = new Date()
      const startDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1)
      const endDate = new Date(nowDate.getFullYear(), nowDate.getMonth() + 3, 0)

      const calendarIds = selectedCalendars.map((c) => c.id)
      const events = await provider.fetchEvents(
        credentials,
        calendarIds,
        startDate,
        endDate
      )

      if (events.length > 0) {
        const rows = events.map((e) => ({
          integration_id: integration.id,
          user_id: integration.user_id,
          family_id: integration.family_id,
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

        await supabase
          .from("external_calendar_events")
          .upsert(rows, { onConflict: "integration_id,external_event_id" })
      }

      // Remove events not touched by this sync (no longer in external calendar)
      const syncTimestamp = new Date().toISOString()
      await supabase
        .from("external_calendar_events")
        .delete()
        .eq("integration_id", integration.id)
        .lt("last_synced_at", syncTimestamp)

      await supabase
        .from("calendar_integrations")
        .update({
          status: "active",
          last_synced_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", integration.id)

      results.push({ id: integration.id, status: "synced", events: events.length })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      await supabase
        .from("calendar_integrations")
        .update({ status: "error", last_error: errorMsg })
        .eq("id", integration.id)
      results.push({ id: integration.id, status: "error", error: errorMsg })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}
