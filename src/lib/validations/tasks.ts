import { z } from "zod"

export const taskStatusEnum = z.enum(["open", "in_progress", "done"])
export type TaskStatus = z.infer<typeof taskStatusEnum>

export const taskPriorityEnum = z.enum(["low", "medium", "high"])
export type TaskPriority = z.infer<typeof taskPriorityEnum>

export const seriesModeEnum = z.enum(["single", "following", "all"])
export type SeriesMode = z.infer<typeof seriesModeEnum>

export const subtaskSchema = z.object({
  title: z
    .string()
    .min(1, "Unteraufgaben-Titel ist erforderlich")
    .max(200, "Unteraufgaben-Titel darf maximal 200 Zeichen lang sein"),
  isDone: z.boolean().default(false),
  position: z.number().int().min(0),
})

export type SubtaskFormValues = z.infer<typeof subtaskSchema>

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(200, "Titel darf maximal 200 Zeichen lang sein"),
  description: z
    .string()
    .max(2000, "Beschreibung darf maximal 2000 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  status: taskStatusEnum.default("open"),
  priority: taskPriorityEnum.default("medium"),
  assignedTo: z.string().uuid("Ungueltige Mitglieds-ID").optional().or(z.literal("")),
  points: z
    .number()
    .int("Punkte muessen eine ganze Zahl sein")
    .min(0, "Punkte muessen mindestens 0 sein")
    .max(10000, "Maximal 10.000 Punkte")
    .optional()
    .nullable(),
  recurrenceRule: z
    .string()
    .max(500, "Wiederholungsregel zu lang")
    .optional()
    .or(z.literal("")),
  subtasks: z.array(subtaskSchema).default([]),
})

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>

export const updateTaskSchema = createTaskSchema.extend({
  seriesMode: seriesModeEnum.optional(),
})

export type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>

export const deleteTaskSchema = z.object({
  id: z.string().uuid("Ungueltige Aufgaben-ID"),
  seriesMode: seriesModeEnum.default("single"),
})

export type DeleteTaskFormValues = z.infer<typeof deleteTaskSchema>

export const getTasksFilterSchema = z.object({
  assignedTo: z.string().uuid().optional(),
  status: taskStatusEnum.optional(),
  dueGroup: z.enum(["today", "this_week", "overdue", "all"]).optional(),
})

export type GetTasksFilterValues = z.infer<typeof getTasksFilterSchema>

export const manualPointsSchema = z.object({
  profileId: z.string().uuid("Ungueltige Profil-ID"),
  amount: z
    .number()
    .int("Betrag muss eine ganze Zahl sein")
    .refine((val) => val !== 0, "Betrag darf nicht 0 sein"),
  comment: z
    .string()
    .max(500, "Kommentar darf maximal 500 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
})

export type ManualPointsFormValues = z.infer<typeof manualPointsSchema>
