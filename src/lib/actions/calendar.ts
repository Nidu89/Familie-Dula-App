"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import {
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
  getEventsForRangeSchema,
  type SeriesMode,
} from "@/lib/validations/calendar"
import { E } from "@/lib/error-codes"

// ============================================================
// PROJ-4: Familienkalender – Server Actions
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
// getEventsForRangeAction
// ============================================================

export type CalendarEvent = {
  id: string
  familyId: string
  createdBy: string
  title: string
  description: string | null
  location: string | null
  startAt: string
  endAt: string
  allDay: boolean
  category: string
  recurrenceRule: string | null
  recurrenceParentId: string | null
  isException: boolean
  reminderMinutes: number | null
  createdAt: string
  participants: { profileId: string; displayName: string }[]
}

export async function getEventsForRangeAction(
  startDate: string,
  endDate: string
): Promise<{ events: CalendarEvent[] } | { error: string }> {
  const parsed = getEventsForRangeSchema.safeParse({ startDate, endDate })
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  // Fetch events in range for the family
  // Also fetch recurring parent events that may generate instances in this range
  const { data: rawEvents, error: eventsError } = await supabase
    .from("calendar_events")
    .select(
      `
      id,
      family_id,
      created_by,
      title,
      description,
      location,
      start_at,
      end_at,
      all_day,
      category,
      recurrence_rule,
      recurrence_parent_id,
      is_exception,
      reminder_minutes,
      created_at,
      event_participants (
        profile_id,
        profiles:profile_id (
          display_name
        )
      )
    `
    )
    .eq("family_id", profile.family_id)
    .or(
      `and(start_at.lte.${parsed.data.endDate},end_at.gte.${parsed.data.startDate}),recurrence_rule.neq.`
    )
    .order("start_at", { ascending: true })

  if (eventsError) {
    return { error: E.CAL_LOAD_FAILED }
  }

  const events: CalendarEvent[] = (rawEvents || []).map((e) => ({
    id: e.id,
    familyId: e.family_id,
    createdBy: e.created_by,
    title: e.title,
    description: e.description,
    location: e.location,
    startAt: e.start_at,
    endAt: e.end_at,
    allDay: e.all_day,
    category: e.category,
    recurrenceRule: e.recurrence_rule,
    recurrenceParentId: e.recurrence_parent_id,
    isException: e.is_exception,
    reminderMinutes: e.reminder_minutes,
    createdAt: e.created_at,
    participants: (
      (e.event_participants as unknown as Array<{
        profile_id: string
        profiles: { display_name: string | null } | { display_name: string | null }[] | null
      }>) || []
    ).map((p) => {
      const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
      return {
        profileId: p.profile_id,
        displayName: prof?.display_name || "Unbekannt",
      }
    }),
  }))

  return { events }
}

// ============================================================
// createEventAction
// ============================================================

export async function createEventAction(data: {
  title: string
  description?: string
  location?: string
  startAt: string
  endAt: string
  allDay?: boolean
  category?: string
  recurrenceRule?: string
  reminderMinutes?: number | null
  participantIds?: string[]
}): Promise<{ event: { id: string } } | { error: string }> {
  const parsed = createEventSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const ip = await getIP()
  if (!checkRateLimit(`createEvent:${ip}`, 30, 60 * 60 * 1000)) {
    return { error: E.RATE_LIMITED }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile) return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  // Insert event
  const { data: event, error: insertError } = await supabase
    .from("calendar_events")
    .insert({
      family_id: profile.family_id,
      created_by: profile.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt,
      all_day: parsed.data.allDay,
      category: parsed.data.category,
      recurrence_rule: parsed.data.recurrenceRule || null,
      reminder_minutes: parsed.data.reminderMinutes ?? null,
    })
    .select("id")
    .single()

  if (insertError || !event) {
    return { error: E.CAL_CREATE_FAILED }
  }

  // Insert participants (validate they belong to the same family)
  if (parsed.data.participantIds.length > 0) {
    const { data: validMembers } = await supabase
      .from("profiles")
      .select("id")
      .eq("family_id", profile.family_id)
      .in("id", parsed.data.participantIds)

    const validIds = new Set((validMembers || []).map((m) => m.id))
    const filteredParticipants = parsed.data.participantIds.filter((pid) =>
      validIds.has(pid)
    )

    if (filteredParticipants.length > 0) {
      const participantRows = filteredParticipants.map((pid) => ({
        event_id: event.id,
        profile_id: pid,
      }))

      await supabase.from("event_participants").insert(participantRows)
    }
  }

  return { event: { id: event.id } }
}

// ============================================================
// updateEventAction
// ============================================================

export async function updateEventAction(
  id: string,
  data: {
    title: string
    description?: string
    location?: string
    startAt: string
    endAt: string
    allDay?: boolean
    category?: string
    recurrenceRule?: string
    reminderMinutes?: number | null
    participantIds?: string[]
    seriesMode?: SeriesMode
  }
): Promise<{ success: true } | { error: string }> {
  const parsed = updateEventSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile) return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  // Verify event exists and belongs to family
  const { data: existing, error: fetchError } = await supabase
    .from("calendar_events")
    .select("id, family_id, recurrence_rule, recurrence_parent_id")
    .eq("id", id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: E.CAL_NOT_FOUND }
  }

  const seriesMode = parsed.data.seriesMode || "single"
  const updatePayload = {
    title: parsed.data.title,
    description: parsed.data.description || null,
    location: parsed.data.location || null,
    start_at: parsed.data.startAt,
    end_at: parsed.data.endAt,
    all_day: parsed.data.allDay,
    category: parsed.data.category,
    recurrence_rule: parsed.data.recurrenceRule || null,
    reminder_minutes: parsed.data.reminderMinutes ?? null,
  }

  if (seriesMode === "single") {
    // If this is part of a series, create an exception instance
    if (existing.recurrence_parent_id || existing.recurrence_rule) {
      const parentId = existing.recurrence_parent_id || existing.id

      if (existing.recurrence_parent_id) {
        // Already an exception or child – just update
        const { error: updateError } = await supabase
          .from("calendar_events")
          .update({ ...updatePayload, is_exception: true })
          .eq("id", id)

        if (updateError) return { error: E.CAL_UPDATE_FAILED }
      } else {
        // This is the parent – create an exception for this instance
        const { error: exError } = await supabase.from("calendar_events").insert({
          ...updatePayload,
          family_id: profile.family_id,
          created_by: profile.id,
          recurrence_parent_id: parentId,
          is_exception: true,
          recurrence_rule: null,
        })

        if (exError) return { error: E.CAL_EXCEPTION_FAILED }
      }
    } else {
      // Simple non-recurring event
      const { error: updateError } = await supabase
        .from("calendar_events")
        .update(updatePayload)
        .eq("id", id)

      if (updateError) return { error: E.CAL_UPDATE_FAILED }
    }
  } else if (seriesMode === "all") {
    // Update the parent event (or self if parent)
    const parentId = existing.recurrence_parent_id || existing.id

    const { error: updateError } = await supabase
      .from("calendar_events")
      .update(updatePayload)
      .eq("id", parentId)

    if (updateError) return { error: E.CAL_SERIES_UPDATE_FAILED }

    // Remove all exceptions for this series
    await supabase
      .from("calendar_events")
      .delete()
      .eq("recurrence_parent_id", parentId)
      .eq("is_exception", true)
  } else if (seriesMode === "following") {
    // Update this event and truncate the parent's recurrence
    const parentId = existing.recurrence_parent_id || existing.id

    // Create a new series starting from this event
    const { error: newSeriesError } = await supabase
      .from("calendar_events")
      .insert({
        ...updatePayload,
        family_id: profile.family_id,
        created_by: profile.id,
        is_exception: false,
      })

    if (newSeriesError) return { error: E.CAL_SERIES_CREATE_FAILED }

    // Delete future exceptions from the old parent
    await supabase
      .from("calendar_events")
      .delete()
      .eq("recurrence_parent_id", parentId)
      .eq("is_exception", true)
      .gte("start_at", parsed.data.startAt)
  }

  // Update participants (for single mode only, series modes are more complex)
  if (seriesMode === "single" && parsed.data.participantIds) {
    // Delete existing participants
    await supabase.from("event_participants").delete().eq("event_id", id)

    // Insert new participants (validate they belong to the same family)
    if (parsed.data.participantIds.length > 0) {
      const { data: validMembers } = await supabase
        .from("profiles")
        .select("id")
        .eq("family_id", profile.family_id)
        .in("id", parsed.data.participantIds)

      const validIds = new Set((validMembers || []).map((m) => m.id))
      const filteredParticipants = parsed.data.participantIds.filter((pid) =>
        validIds.has(pid)
      )

      if (filteredParticipants.length > 0) {
        await supabase.from("event_participants").insert(
          filteredParticipants.map((pid) => ({
            event_id: id,
            profile_id: pid,
          }))
        )
      }
    }
  }

  return { success: true }
}

// ============================================================
// deleteEventAction
// ============================================================

export async function deleteEventAction(
  id: string,
  seriesMode: SeriesMode = "single"
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteEventSchema.safeParse({ id, seriesMode })
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile) return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  // Fetch event
  const { data: existing, error: fetchError } = await supabase
    .from("calendar_events")
    .select("id, family_id, recurrence_rule, recurrence_parent_id, start_at")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: E.CAL_NOT_FOUND }
  }

  if (parsed.data.seriesMode === "single") {
    if (existing.recurrence_rule && !existing.recurrence_parent_id) {
      // This is a parent with recurrence – mark this instance as exception (deleted)
      // In practice, the frontend will track deleted instances via exception records
      // For simplicity, we create a "deleted exception" marker
      await supabase.from("calendar_events").insert({
        family_id: profile.family_id,
        created_by: profile.id,
        title: "__DELETED__",
        start_at: existing.start_at,
        end_at: existing.start_at,
        recurrence_parent_id: existing.id,
        is_exception: true,
        category: "other",
      })
    } else {
      // Simple event or exception – just delete
      const { error: deleteError } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", parsed.data.id)

      if (deleteError) return { error: E.CAL_DELETE_FAILED }
    }
  } else if (parsed.data.seriesMode === "all") {
    const parentId = existing.recurrence_parent_id || existing.id

    // Delete all exceptions first
    await supabase
      .from("calendar_events")
      .delete()
      .eq("recurrence_parent_id", parentId)

    // Delete parent
    const { error: deleteError } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", parentId)

    if (deleteError) return { error: E.CAL_SERIES_DELETE_FAILED }
  } else if (parsed.data.seriesMode === "following") {
    const parentId = existing.recurrence_parent_id || existing.id

    // Delete this event and all future exceptions
    await supabase
      .from("calendar_events")
      .delete()
      .eq("recurrence_parent_id", parentId)
      .gte("start_at", existing.start_at)

    // If this is not the parent itself, also delete this event
    if (existing.recurrence_parent_id) {
      await supabase.from("calendar_events").delete().eq("id", existing.id)
    }

    // Note: The parent's RRULE should be truncated with an UNTIL.
    // The frontend or a more sophisticated approach would update the parent's
    // recurrence_rule with an UNTIL clause. For now, the parent remains and
    // the frontend should handle the truncation when expanding occurrences.
  }

  return { success: true }
}
