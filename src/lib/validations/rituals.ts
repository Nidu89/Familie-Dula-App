import { z } from "zod"

// ============================================================
// PROJ-14: Familien-Rituale – Zod Validation Schemas
// ============================================================

export const ritualStepSchema = z.object({
  id: z.string().min(1),
  title: z
    .string()
    .min(1, "Schritt-Name ist erforderlich")
    .max(100, "Schritt-Name darf maximal 100 Zeichen lang sein"),
  order: z.number().int().min(0),
})

export type RitualStep = z.infer<typeof ritualStepSchema>

export const createRitualSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(80, "Name darf maximal 80 Zeichen lang sein"),
  description: z
    .string()
    .max(300, "Beschreibung darf maximal 300 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  steps: z
    .array(ritualStepSchema)
    .min(1, "Mindestens ein Schritt ist erforderlich")
    .max(20, "Maximal 20 Schritte erlaubt"),
  timerDurationMinutes: z
    .number()
    .int("Dauer muss eine ganze Zahl sein")
    .min(1, "Mindestdauer ist 1 Minute")
    .max(120, "Maximale Dauer ist 120 Minuten")
    .nullable()
    .optional(),
  rewardPoints: z
    .number()
    .int("Punkte muessen eine ganze Zahl sein")
    .min(0, "Mindestens 0 Punkte")
    .max(100, "Maximal 100 Punkte")
    .nullable()
    .optional(),
})

export type CreateRitualValues = z.infer<typeof createRitualSchema>

export const updateRitualSchema = z.object({
  id: z.string().uuid("Ungueltige Ritual-ID"),
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(80, "Name darf maximal 80 Zeichen lang sein"),
  description: z
    .string()
    .max(300, "Beschreibung darf maximal 300 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  steps: z
    .array(ritualStepSchema)
    .min(1, "Mindestens ein Schritt ist erforderlich")
    .max(20, "Maximal 20 Schritte erlaubt"),
  timerDurationMinutes: z
    .number()
    .int("Dauer muss eine ganze Zahl sein")
    .min(1, "Mindestdauer ist 1 Minute")
    .max(120, "Maximale Dauer ist 120 Minuten")
    .nullable()
    .optional(),
  rewardPoints: z
    .number()
    .int("Punkte muessen eine ganze Zahl sein")
    .min(0, "Mindestens 0 Punkte")
    .max(100, "Maximal 100 Punkte")
    .nullable()
    .optional(),
})

export type UpdateRitualValues = z.infer<typeof updateRitualSchema>

export const deleteRitualSchema = z.object({
  id: z.string().uuid("Ungueltige Ritual-ID"),
})

export type DeleteRitualValues = z.infer<typeof deleteRitualSchema>

export const awardRitualCompletionSchema = z.object({
  childProfileId: z.string().uuid("Ungueltige Profil-ID"),
  points: z
    .number()
    .int("Punkte muessen eine ganze Zahl sein")
    .min(1, "Mindestens 1 Punkt")
    .max(100, "Maximal 100 Punkte"),
  ritualName: z
    .string()
    .min(1, "Ritual-Name ist erforderlich")
    .max(100, "Ritual-Name darf maximal 100 Zeichen lang sein"),
})
