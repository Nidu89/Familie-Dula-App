import { z } from "zod"

export const eventCategoryEnum = z.enum([
  "school",
  "work",
  "leisure",
  "health",
  "other",
])

export type EventCategory = z.infer<typeof eventCategoryEnum>

export const seriesModeEnum = z.enum(["single", "following", "all"])
export type SeriesMode = z.infer<typeof seriesModeEnum>

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(1, "Titel ist erforderlich")
      .max(200, "Titel darf maximal 200 Zeichen lang sein"),
    description: z
      .string()
      .max(2000, "Beschreibung darf maximal 2000 Zeichen lang sein")
      .optional()
      .or(z.literal("")),
    location: z
      .string()
      .max(200, "Ort darf maximal 200 Zeichen lang sein")
      .optional()
      .or(z.literal("")),
    startAt: z.string().min(1, "Startzeit ist erforderlich"),
    endAt: z.string().min(1, "Endzeit ist erforderlich"),
    allDay: z.boolean().default(false),
    category: eventCategoryEnum.default("other"),
    recurrenceRule: z
      .string()
      .max(500, "Wiederholungsregel zu lang")
      .optional()
      .or(z.literal("")),
    reminderMinutes: z
      .number()
      .int()
      .min(0)
      .max(10080) // max 1 week
      .optional()
      .nullable(),
    participantIds: z
      .array(z.string().uuid("Ungueltige Teilnehmer-ID"))
      .default([]),
  })
  .refine(
    (data) => {
      const start = new Date(data.startAt)
      const end = new Date(data.endAt)
      return end >= start
    },
    {
      message: "Endzeit muss nach oder gleich der Startzeit sein",
      path: ["endAt"],
    }
  )

export type CreateEventFormValues = z.infer<typeof createEventSchema>

export const updateEventSchema = createEventSchema.extend({
  seriesMode: seriesModeEnum.default("single"),
})

export type UpdateEventFormValues = z.infer<typeof updateEventSchema>

export const deleteEventSchema = z.object({
  id: z.string().uuid("Ungueltige Event-ID"),
  seriesMode: seriesModeEnum.default("single"),
})

export type DeleteEventFormValues = z.infer<typeof deleteEventSchema>

export const getEventsForRangeSchema = z.object({
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  endDate: z.string().min(1, "Enddatum ist erforderlich"),
})

export type GetEventsForRangeFormValues = z.infer<typeof getEventsForRangeSchema>
