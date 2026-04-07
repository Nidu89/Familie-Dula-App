import { z } from "zod"

// ============================================================
// PROJ-17: KI-Assistent – Validation Schemas
// ============================================================

// --- API Key Management ---

export const saveApiKeySchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(1, "API-Key ist erforderlich.")
    .max(500, "API-Key darf maximal 500 Zeichen lang sein.")
    .refine(
      (key) => key.startsWith("sk-ant-"),
      "API-Key muss mit 'sk-ant-' beginnen."
    ),
})

export type SaveApiKeyValues = z.infer<typeof saveApiKeySchema>

// --- Chat Request ---

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
})

export type ChatMessage = z.infer<typeof chatMessageSchema>

export const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, "Mindestens eine Nachricht ist erforderlich.")
    .max(20, "Maximal 20 Nachrichten pro Anfrage."),
  locale: z.enum(["de", "en", "fr"]).default("de"),
})

export type ChatRequestValues = z.infer<typeof chatRequestSchema>

// --- Tool Input Schemas ---

export const listTasksInputSchema = z.object({
  status: z
    .enum(["open", "in_progress", "done", "all"])
    .optional()
    .default("open"),
  assignedTo: z.string().optional().describe("Profile ID of the assigned person"),
})

export type ListTasksInput = z.infer<typeof listTasksInputSchema>

export const createTaskInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().optional().describe("ISO date string, e.g. 2026-04-10"),
  assignedTo: z.string().optional().describe("Profile ID of the person to assign"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  points: z.number().int().min(0).max(10000).optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>

export const listCalendarEventsInputSchema = z.object({
  days: z.number().int().min(1).max(90).optional().default(7),
})

export type ListCalendarEventsInput = z.infer<typeof listCalendarEventsInputSchema>

export const createCalendarEventInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startAt: z.string().describe("ISO datetime string"),
  endAt: z.string().describe("ISO datetime string"),
  allDay: z.boolean().optional().default(false),
  category: z
    .enum(["school", "work", "leisure", "health", "other"])
    .optional()
    .default("other"),
})

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventInputSchema>

export const listShoppingItemsInputSchema = z.object({
  listId: z.string().uuid().describe("ID of the shopping list"),
})

export type ListShoppingItemsInput = z.infer<typeof listShoppingItemsInputSchema>

export const addShoppingItemInputSchema = z.object({
  listId: z.string().uuid().describe("ID of the shopping list"),
  productName: z.string().min(1).max(200),
  quantity: z.string().max(20).optional(),
  unit: z.string().max(20).optional(),
})

export type AddShoppingItemInput = z.infer<typeof addShoppingItemInputSchema>

export const getMealPlanInputSchema = z.object({
  weekKey: z
    .string()
    .regex(/^\d{4}-W\d{2}$/)
    .optional()
    .describe("Week key, e.g. 2026-W15. Defaults to current week."),
})

export type GetMealPlanInput = z.infer<typeof getMealPlanInputSchema>

export const addMealInputSchema = z.object({
  weekKey: z
    .string()
    .regex(/^\d{4}-W\d{2}$/)
    .describe("Week key, e.g. 2026-W15"),
  weekday: z.number().int().min(0).max(6).describe("0=Monday, 6=Sunday"),
  mealType: z.enum(["breakfast", "lunch", "dinner"]),
  freeText: z.string().max(200).describe("Name of the meal"),
})

export type AddMealInput = z.infer<typeof addMealInputSchema>
