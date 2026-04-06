import { z } from "zod"

// ============================================================
// PROJ-7: Einkaufslisten – Validation Schemas
// ============================================================

export const createShoppingListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich.")
    .max(100, "Name darf maximal 100 Zeichen lang sein."),
})

export type CreateShoppingListValues = z.infer<typeof createShoppingListSchema>

export const updateShoppingListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich.")
    .max(100, "Name darf maximal 100 Zeichen lang sein."),
})

export type UpdateShoppingListValues = z.infer<typeof updateShoppingListSchema>

export const deleteShoppingListSchema = z.object({
  id: z.string().uuid("Ungueltige Listen-ID."),
})

export const addShoppingItemSchema = z.object({
  listId: z.string().uuid("Ungueltige Listen-ID."),
  productName: z
    .string()
    .trim()
    .min(1, "Produktname ist erforderlich.")
    .max(200, "Produktname darf maximal 200 Zeichen lang sein."),
  quantity: z
    .string()
    .trim()
    .max(20, "Menge darf maximal 20 Zeichen lang sein.")
    .optional()
    .default(""),
  unit: z
    .string()
    .trim()
    .max(20, "Einheit darf maximal 20 Zeichen lang sein.")
    .optional()
    .default(""),
  category: z
    .string()
    .trim()
    .max(50, "Kategorie darf maximal 50 Zeichen lang sein.")
    .optional()
    .default(""),
})

export type AddShoppingItemValues = z.infer<typeof addShoppingItemSchema>

export const toggleShoppingItemSchema = z.object({
  itemId: z.string().uuid("Ungueltige Artikel-ID."),
  isDone: z.boolean(),
})

export const deleteShoppingItemSchema = z.object({
  itemId: z.string().uuid("Ungueltige Artikel-ID."),
})

export const clearCompletedItemsSchema = z.object({
  listId: z.string().uuid("Ungueltige Listen-ID."),
})

// Predefined categories
export const SHOPPING_CATEGORIES = [
  "fruits_vegetables",
  "dairy",
  "meat_fish",
  "bakery",
  "beverages",
  "frozen",
  "snacks",
  "household",
  "personal_care",
  "other",
] as const

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number]
