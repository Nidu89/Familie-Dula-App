import { z } from "zod"

// ============================================================
// PROJ-9: Chat & Kommunikation – Validation Schemas
// ============================================================

export const sendMessageSchema = z
  .object({
    channelId: z.string().uuid("Ungueltige Kanal-ID."),
    content: z
      .string()
      .trim()
      .max(2000, "Nachricht darf maximal 2000 Zeichen lang sein.")
      .default(""),
    imageUrl: z.string().max(500).nullish(),
  })
  .refine((data) => (data.content && data.content.length > 0) || data.imageUrl, {
    message: "Nachricht oder Bild erforderlich.",
  })

export type SendMessageValues = z.infer<typeof sendMessageSchema>

// ============================================================
// PROJ-11: Bild-Upload im Chat – Validation Schemas
// ============================================================

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB

export const chatImageFileSchema = z.object({
  type: z.enum(ALLOWED_IMAGE_TYPES, {
    error: "Nur JPEG, PNG, GIF und WebP sind erlaubt.",
  }),
  size: z.number().max(MAX_IMAGE_SIZE, "Bild darf maximal 10 MB groß sein."),
})

export const deleteChatImageSchema = z.object({
  messageId: z.string().uuid("Ungueltige Nachrichten-ID."),
})

export type DeleteChatImageValues = z.infer<typeof deleteChatImageSchema>

export const getSignedImageUrlSchema = z.object({
  path: z.string().min(1, "Pfad erforderlich.").max(500),
})

export type GetSignedImageUrlValues = z.infer<typeof getSignedImageUrlSchema>

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
