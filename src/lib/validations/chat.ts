import { z } from "zod"

// ============================================================
// PROJ-9: Chat & Kommunikation – Validation Schemas
// ============================================================

export const sendMessageSchema = z.object({
  channelId: z.string().uuid("Ungueltige Kanal-ID."),
  content: z
    .string()
    .trim()
    .min(1, "Nachricht darf nicht leer sein.")
    .max(2000, "Nachricht darf maximal 2000 Zeichen lang sein."),
})

export type SendMessageValues = z.infer<typeof sendMessageSchema>

export const getMessagesSchema = z.object({
  channelId: z.string().uuid("Ungueltige Kanal-ID."),
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
})

export type GetMessagesValues = z.infer<typeof getMessagesSchema>

export const createDirectChannelSchema = z.object({
  targetUserId: z.string().uuid("Ungueltige Nutzer-ID."),
})

export type CreateDirectChannelValues = z.infer<typeof createDirectChannelSchema>

export const markReadSchema = z.object({
  channelId: z.string().uuid("Ungueltige Kanal-ID."),
})

export type MarkReadValues = z.infer<typeof markReadSchema>
