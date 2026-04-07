import { z } from "zod"

// ============================================================
// PROJ-10: Benachrichtigungen – Validation Schemas
// ============================================================

export const NOTIFICATION_TYPES = [
  "calendar_assigned",
  "task_assigned",
  "task_due",
  "chat_message",
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const getNotificationsSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
})

export type GetNotificationsValues = z.infer<typeof getNotificationsSchema>

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid("Ungueltige Benachrichtigungs-ID."),
})

export type MarkNotificationReadValues = z.infer<typeof markNotificationReadSchema>

export const updatePreferenceSchema = z.object({
  notificationType: z.enum(NOTIFICATION_TYPES, {
    error: "Ungueltiger Benachrichtigungstyp.",
  }),
  enabled: z.boolean(),
})

export type UpdatePreferenceValues = z.infer<typeof updatePreferenceSchema>
