import { z } from "zod"

// ============================================================
// PROJ-13: Familien-Timer – Zod Validation Schemas
// ============================================================

export const createTimerTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(50, "Name darf maximal 50 Zeichen lang sein"),
  durationSeconds: z
    .number()
    .int("Dauer muss eine ganze Zahl sein")
    .min(60, "Mindestdauer ist 1 Minute (60 Sekunden)")
    .max(3600, "Maximale Dauer ist 60 Minuten (3600 Sekunden)"),
})

export type CreateTimerTemplateValues = z.infer<typeof createTimerTemplateSchema>

export const updateTimerTemplateSchema = z.object({
  id: z.string().uuid("Ungueltige Vorlagen-ID"),
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(50, "Name darf maximal 50 Zeichen lang sein"),
  durationSeconds: z
    .number()
    .int("Dauer muss eine ganze Zahl sein")
    .min(60, "Mindestdauer ist 1 Minute (60 Sekunden)")
    .max(3600, "Maximale Dauer ist 60 Minuten (3600 Sekunden)"),
})

export type UpdateTimerTemplateValues = z.infer<typeof updateTimerTemplateSchema>

export const deleteTimerTemplateSchema = z.object({
  id: z.string().uuid("Ungueltige Vorlagen-ID"),
})

export type DeleteTimerTemplateValues = z.infer<typeof deleteTimerTemplateSchema>
