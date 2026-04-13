import { z } from "zod"

export const createMomentSchema = z.object({
  title: z
    .string()
    .min(1, "Titel darf nicht leer sein.")
    .max(80, "Titel darf maximal 80 Zeichen lang sein."),
  description: z
    .string()
    .max(500, "Beschreibung darf maximal 500 Zeichen lang sein.")
    .optional(),
  momentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datumsformat."),
})

export const deleteMomentSchema = z.object({
  momentId: z.string().uuid("Ungültige Moment-ID."),
})

export const getMomentsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(12),
})

export const toggleReactionSchema = z.object({
  momentId: z.string().uuid("Ungültige Moment-ID."),
})

export const momentFileSchema = z.object({
  type: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"], {
    message: "Nur JPEG, PNG, WebP oder GIF erlaubt.",
  }),
  size: z
    .number()
    .max(5 * 1024 * 1024, "Datei darf maximal 5 MB groß sein."),
})
