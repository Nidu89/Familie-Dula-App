import { z } from "zod"

// ============================================================
// PROJ-8: Essens- & Rezeptplanung – Validation Schemas
// ============================================================

// --- Recipes ---

export const createRecipeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Titel ist erforderlich.")
    .max(200, "Titel darf maximal 200 Zeichen lang sein."),
  description: z
    .string()
    .trim()
    .max(2000, "Beschreibung darf maximal 2000 Zeichen lang sein.")
    .optional()
    .default(""),
  tags: z
    .array(z.string().trim().max(50))
    .max(20, "Maximal 20 Tags erlaubt.")
    .optional()
    .default([]),
  imageUrl: z
    .string()
    .url("Ungueltige Bild-URL.")
    .max(500)
    .optional()
    .nullable()
    .default(null),
  ingredients: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Zutatenname ist erforderlich.")
          .max(200),
        quantity: z.string().trim().max(50).optional().default(""),
        unit: z.string().trim().max(50).optional().default(""),
      })
    )
    .max(100, "Maximal 100 Zutaten erlaubt.")
    .optional()
    .default([]),
})

export type CreateRecipeValues = z.infer<typeof createRecipeSchema>

export const updateRecipeSchema = createRecipeSchema

export type UpdateRecipeValues = z.infer<typeof updateRecipeSchema>

export const deleteRecipeSchema = z.object({
  id: z.string().uuid("Ungueltige Rezept-ID."),
})

// --- Meal Plan ---

export const MEAL_TYPES = [
  "breakfast",
  "lunch",
  "dinner",
] as const

export type MealType = (typeof MEAL_TYPES)[number]

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const // Mo=0 ... So=6

export const upsertMealPlanEntrySchema = z.object({
  weekKey: z
    .string()
    .regex(/^\d{4}-W\d{2}$/, "Ungueltige Wochenkennung (z.B. 2026-W15)."),
  weekday: z.number().int().min(0).max(6),
  mealType: z.enum(MEAL_TYPES),
  recipeId: z.string().uuid().optional().nullable().default(null),
  freeText: z.string().trim().max(200).optional().nullable().default(null),
})

export type UpsertMealPlanEntryValues = z.infer<
  typeof upsertMealPlanEntrySchema
>

export const deleteMealPlanEntrySchema = z.object({
  id: z.string().uuid("Ungueltige Eintrag-ID."),
})

// --- Predefined Tags ---

export const PREDEFINED_TAGS = [
  "schnell",
  "vegetarisch",
  "vegan",
  "glutenfrei",
] as const

export type PredefinedTag = (typeof PREDEFINED_TAGS)[number]
