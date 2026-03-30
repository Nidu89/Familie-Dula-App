import { z } from "zod"

// ============================================================
// PROJ-6 Expansion: Belohnungssystem Validation Schemas
// ============================================================

export const createRewardSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(50, "Titel darf maximal 50 Zeichen lang sein"),
  description: z
    .string()
    .max(200, "Beschreibung darf maximal 200 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  iconEmoji: z
    .string()
    .min(1, "Ein Emoji ist erforderlich")
    .max(8, "Maximal ein Emoji erlaubt"),
  pointsCost: z
    .number()
    .int("Punktekosten muessen eine ganze Zahl sein")
    .min(1, "Mindestens 1 Punkt")
    .max(9999, "Maximal 9.999 Punkte"),
})

export type CreateRewardFormValues = z.infer<typeof createRewardSchema>

export const updateRewardSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(50, "Titel darf maximal 50 Zeichen lang sein")
    .optional(),
  description: z
    .string()
    .max(200, "Beschreibung darf maximal 200 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  iconEmoji: z
    .string()
    .min(1, "Ein Emoji ist erforderlich")
    .optional(),
  pointsCost: z
    .number()
    .int("Punktekosten muessen eine ganze Zahl sein")
    .min(1, "Mindestens 1 Punkt")
    .max(9999, "Maximal 9.999 Punkte")
    .optional(),
  isActive: z.boolean().optional(),
})

export type UpdateRewardFormValues = z.infer<typeof updateRewardSchema>

export const createGoalSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(100, "Titel darf maximal 100 Zeichen lang sein"),
  description: z
    .string()
    .max(200, "Beschreibung darf maximal 200 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  emoji: z
    .string()
    .min(1, "Ein Emoji ist erforderlich")
    .optional(),
  targetPoints: z
    .number()
    .int("Zielpunkte muessen eine ganze Zahl sein")
    .min(100, "Mindestens 100 Punkte")
    .max(100000, "Maximal 100.000 Punkte"),
})

export type CreateGoalFormValues = z.infer<typeof createGoalSchema>

export const contributeToGoalSchema = z.object({
  goalId: z.string().uuid("Ungueltige Ziel-ID"),
  amount: z
    .number()
    .int("Betrag muss eine ganze Zahl sein")
    .min(1, "Mindestens 1 Punkt")
    .max(99999, "Maximal 99.999 Punkte"),
})

export type ContributeToGoalFormValues = z.infer<typeof contributeToGoalSchema>

export const redeemRewardSchema = z.object({
  rewardId: z.string().uuid("Ungueltige Belohnungs-ID"),
})

export type RedeemRewardFormValues = z.infer<typeof redeemRewardSchema>
