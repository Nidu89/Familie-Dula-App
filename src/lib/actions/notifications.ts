"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import {
  getNotificationsSchema,
  markNotificationReadSchema,
  updatePreferenceSchema,
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/lib/validations/notifications"

// ============================================================
// PROJ-10: Benachrichtigungen – Server Actions
// ============================================================

// Helper: get current authenticated user
async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// ============================================================
// Types
// ============================================================

export type Notification = {
  id: string
  type: NotificationType
  title: string
  body: string | null
  referenceId: string | null
  referenceType: string | null
  isRead: boolean
  createdAt: string
}

export type NotificationPreference = {
  notificationType: NotificationType
  enabled: boolean
}

// ============================================================
// getNotificationsAction
// Fetches paginated notifications for the current user.
// Also triggers task_due check and 30-day cleanup.
// ============================================================

export async function getNotificationsAction(
  input: { cursor?: string; limit?: number } = {}
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const parsed = getNotificationsSchema.safeParse(input)
  if (!parsed.success) return { error: "Ungueltige Eingaben." }

  const { cursor, limit } = parsed.data
  const supabase = await createClient()

  // Fetch notifications
  let query = supabase
    .from("notifications")
    .select("id, type, title, body, reference_id, reference_type, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt("created_at", cursor)
  }

  const { data, error } = await query

  if (error) return { error: "Benachrichtigungen konnten nicht geladen werden." }

  const notifications: Notification[] = (data || []).map((n) => ({
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    body: n.body,
    referenceId: n.reference_id,
    referenceType: n.reference_type,
    isRead: n.is_read,
    createdAt: n.created_at,
  }))

  return { notifications }
}

// ============================================================
// getUnreadCountAction
// Returns the count of unread notifications.
// ============================================================

export async function getUnreadCountAction() {
  const user = await getCurrentUser()
  if (!user) return { count: 0 }

  const supabase = await createClient()

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) return { count: 0 }

  return { count: count || 0 }
}

// ============================================================
// markNotificationReadAction
// Marks a single notification as read.
// ============================================================

export async function markNotificationReadAction(
  input: { notificationId: string }
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const ip = await getIP()
  if (!checkRateLimit(`markNotifRead:${ip}`, 60, 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte warte kurz." }
  }

  const parsed = markNotificationReadSchema.safeParse(input)
  if (!parsed.success) return { error: "Ungueltige Eingaben." }

  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", parsed.data.notificationId)
    .eq("user_id", user.id)

  if (error) return { error: "Benachrichtigung konnte nicht aktualisiert werden." }

  return { success: true }
}

// ============================================================
// markAllNotificationsReadAction
// Marks all unread notifications as read for the current user.
// ============================================================

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const ip = await getIP()
  if (!checkRateLimit(`markAllRead:${ip}`, 10, 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte warte kurz." }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) return { error: "Benachrichtigungen konnten nicht aktualisiert werden." }

  return { success: true }
}

// ============================================================
// getNotificationPreferencesAction
// Returns notification preferences for the current user.
// Missing preferences default to enabled.
// ============================================================

export async function getNotificationPreferencesAction() {
  const user = await getCurrentUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("notification_type, enabled")
    .eq("user_id", user.id)
    .limit(10)

  if (error) return { error: "Einstellungen konnten nicht geladen werden." }

  // Build full preference list (default: enabled)
  const prefMap = new Map(
    (data || []).map((p) => [p.notification_type, p.enabled])
  )

  const preferences: NotificationPreference[] = NOTIFICATION_TYPES.map((type) => ({
    notificationType: type,
    enabled: prefMap.get(type) ?? true,
  }))

  return { preferences }
}

// ============================================================
// updateNotificationPreferenceAction
// Updates a single notification preference for the current user.
// ============================================================

export async function updateNotificationPreferenceAction(
  input: { notificationType: string; enabled: boolean }
) {
  const user = await getCurrentUser()
  if (!user) return { error: "Nicht eingeloggt." }

  const ip = await getIP()
  if (!checkRateLimit(`updatePref:${ip}`, 20, 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte warte kurz." }
  }

  const parsed = updatePreferenceSchema.safeParse(input)
  if (!parsed.success) return { error: "Ungueltige Eingaben." }

  const supabase = await createClient()

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        notification_type: parsed.data.notificationType,
        enabled: parsed.data.enabled,
      },
      { onConflict: "user_id,notification_type" }
    )

  if (error) return { error: "Einstellung konnte nicht gespeichert werden." }

  return { success: true }
}

// ============================================================
// triggerNotificationMaintenanceAction
// Runs task_due check + 30-day cleanup. Called once per session.
// ============================================================

export async function triggerNotificationMaintenanceAction() {
  const user = await getCurrentUser()
  if (!user) return

  const supabase = await createClient()

  const [dueResult, cleanupResult] = await Promise.allSettled([
    supabase.rpc("create_task_due_notifications"),
    supabase.rpc("cleanup_old_notifications"),
  ])

  if (dueResult.status === "rejected") {
    console.error("[PROJ-10] create_task_due_notifications failed:", dueResult.reason)
  }
  if (cleanupResult.status === "rejected") {
    console.error("[PROJ-10] cleanup_old_notifications failed:", cleanupResult.reason)
  }
}
