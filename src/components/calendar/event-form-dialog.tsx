"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
  type CalendarEvent,
} from "@/lib/actions/calendar"

type SeriesMode = "single" | "following" | "all"

const CATEGORIES = [
  { value: "school", label: "Schule" },
  { value: "work", label: "Arbeit" },
  { value: "leisure", label: "Freizeit" },
  { value: "health", label: "Gesundheit" },
  { value: "other", label: "Sonstiges" },
]

const RECURRENCE_OPTIONS = [
  { value: "", label: "Keine Wiederholung" },
  { value: "FREQ=DAILY", label: "Taeglich" },
  { value: "FREQ=WEEKLY", label: "Woechentlich" },
  { value: "FREQ=MONTHLY", label: "Monatlich" },
  { value: "FREQ=YEARLY", label: "Jaehrlich" },
]

const REMINDER_OPTIONS = [
  { value: "none", label: "Keine Erinnerung" },
  { value: "15", label: "15 Minuten vorher" },
  { value: "30", label: "30 Minuten vorher" },
  { value: "60", label: "1 Stunde vorher" },
]

interface FamilyMember {
  id: string
  displayName: string
}

const eventFormSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  startTime: z.string().min(1, "Startzeit ist erforderlich"),
  endDate: z.string().min(1, "Enddatum ist erforderlich"),
  endTime: z.string().min(1, "Endzeit ist erforderlich"),
  allDay: z.boolean(),
  category: z.string(),
  recurrenceRule: z.string().optional().or(z.literal("")),
  reminderMinutes: z.string(),
  participantIds: z.array(z.string()),
})

type EventFormValues = z.infer<typeof eventFormSchema>

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  members: FamilyMember[]
  defaultDate?: Date
  onSuccess: () => void
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function toLocalTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${min}`
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  members,
  defaultDate,
  onSuccess,
}: EventFormDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [seriesMode, setSeriesMode] = useState<SeriesMode>("single")
  const isEditing = !!event
  const isRecurring = !!(event?.recurrenceRule || event?.recurrenceParentId)

  const now = defaultDate || new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      startDate: toLocalDateString(now),
      startTime: toLocalTimeString(now),
      endDate: toLocalDateString(oneHourLater),
      endTime: toLocalTimeString(oneHourLater),
      allDay: false,
      category: "other",
      recurrenceRule: "",
      reminderMinutes: "none",
      participantIds: [],
    },
  })

  useEffect(() => {
    setSeriesMode("single")
    if (event) {
      const start = new Date(event.startAt)
      const end = new Date(event.endAt)
      form.reset({
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        startDate: toLocalDateString(start),
        startTime: toLocalTimeString(start),
        endDate: toLocalDateString(end),
        endTime: toLocalTimeString(end),
        allDay: event.allDay,
        category: event.category,
        recurrenceRule: event.recurrenceRule || "",
        reminderMinutes:
          event.reminderMinutes != null
            ? String(event.reminderMinutes)
            : "none",
        participantIds: event.participants.map((p) => p.profileId),
      })
    } else {
      form.reset({
        title: "",
        description: "",
        location: "",
        startDate: toLocalDateString(now),
        startTime: toLocalTimeString(now),
        endDate: toLocalDateString(oneHourLater),
        endTime: toLocalTimeString(oneHourLater),
        allDay: false,
        category: "other",
        recurrenceRule: "",
        reminderMinutes: "none",
        participantIds: [],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, open])

  async function onSubmit(values: EventFormValues) {
    setIsSubmitting(true)
    try {
      const startAt = values.allDay
        ? `${values.startDate}T00:00:00`
        : `${values.startDate}T${values.startTime}:00`
      const endAt = values.allDay
        ? `${values.endDate}T23:59:59`
        : `${values.endDate}T${values.endTime}:00`

      const reminderMinutes =
        values.reminderMinutes === "none"
          ? null
          : parseInt(values.reminderMinutes)

      const payload = {
        title: values.title,
        description: values.description || undefined,
        location: values.location || undefined,
        startAt,
        endAt,
        allDay: values.allDay,
        category: values.category,
        recurrenceRule: values.recurrenceRule || undefined,
        reminderMinutes,
        participantIds: values.participantIds,
      }

      let result
      if (isEditing && event) {
        result = await updateEventAction(event.id, { ...payload, seriesMode })
      } else {
        result = await createEventAction(payload)
      }

      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: isEditing ? "Termin aktualisiert" : "Termin erstellt",
        description: isEditing
          ? "Der Termin wurde erfolgreich aktualisiert."
          : "Der Termin wurde erfolgreich erstellt.",
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    setIsDeleting(true)
    try {
      const result = await deleteEventAction(event.id, seriesMode)
      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Termin geloescht",
        description: "Der Termin wurde erfolgreich geloescht.",
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const watchAllDay = form.watch("allDay")

  function handleParticipantToggle(memberId: string) {
    const current = form.getValues("participantIds")
    if (current.includes(memberId)) {
      form.setValue(
        "participantIds",
        current.filter((id) => id !== memberId)
      )
    } else {
      form.setValue("participantIds", [...current, memberId])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Termin bearbeiten" : "Neuer Termin"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Aendere die Details dieses Termins."
              : "Erstelle einen neuen Termin fuer die Familie."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Elternabend" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optionale Beschreibung..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ort</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Schule, Raum 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Ganztaegig</FormLabel>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startdatum *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!watchAllDay && (
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startzeit *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enddatum *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!watchAllDay && (
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endzeit *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie waehlen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Participants */}
            <div>
              <FormLabel>Teilnehmende</FormLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {members.map((m) => {
                  const isSelected = form
                    .watch("participantIds")
                    .includes(m.id)
                  return (
                    <Button
                      key={m.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleParticipantToggle(m.id)}
                    >
                      {m.displayName}
                    </Button>
                  )
                })}
                {members.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Keine Familienmitglieder gefunden.
                  </p>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="recurrenceRule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wiederholung</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Keine Wiederholung" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((r) => (
                        <SelectItem key={r.value || "none"} value={r.value || "none"}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminderMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Erinnerung</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Keine Erinnerung" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REMINDER_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && isRecurring && (
              <div className="rounded-md border p-3 space-y-2">
                <FormLabel>Welche Termine bearbeiten?</FormLabel>
                <RadioGroup
                  value={seriesMode}
                  onValueChange={(v) => setSeriesMode(v as SeriesMode)}
                  className="space-y-1"
                >
                  {[
                    { value: "single", label: "Nur diesen Termin" },
                    { value: "following", label: "Diesen + alle folgenden" },
                    { value: "all", label: "Alle Termine der Serie" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`series-${opt.value}`} />
                      <FormLabel htmlFor={`series-${opt.value}`} className="font-normal cursor-pointer">
                        {opt.label}
                      </FormLabel>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || isSubmitting}
                >
                  {isDeleting ? "Loeschen..." : "Loeschen"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Speichern..."
                  : isEditing
                    ? "Speichern"
                    : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
