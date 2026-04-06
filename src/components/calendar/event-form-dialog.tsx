"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"

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

interface FamilyMember {
  id: string
  displayName: string
}

function createEventFormSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t("eventForm.titleRequired")).max(200),
    description: z.string().max(2000).optional().or(z.literal("")),
    location: z.string().max(200).optional().or(z.literal("")),
    startDate: z.string().min(1, t("eventForm.startDateRequired")),
    startTime: z.string().min(1, t("eventForm.startTimeRequired")),
    endDate: z.string().min(1, t("eventForm.endDateRequired")),
    endTime: z.string().min(1, t("eventForm.endTimeRequired")),
    allDay: z.boolean(),
    category: z.string(),
    recurrenceRule: z.string().optional().or(z.literal("")),
    reminderMinutes: z.string(),
    participantIds: z.array(z.string()),
  })
}

type EventFormValues = z.infer<ReturnType<typeof createEventFormSchema>>

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
  const t = useTranslations("calendar")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [seriesMode, setSeriesMode] = useState<SeriesMode>("single")
  const isEditing = !!event
  const isRecurring = !!(event?.recurrenceRule || event?.recurrenceParentId)

  const eventFormSchema = createEventFormSchema(t)

  const CATEGORIES = [
    { value: "school", label: t("categories.school") },
    { value: "work", label: t("categories.work") },
    { value: "leisure", label: t("categories.leisure") },
    { value: "health", label: t("categories.health") },
    { value: "other", label: t("categories.other") },
  ]

  const RECURRENCE_OPTIONS = [
    { value: "", label: t("eventForm.recurrenceNone") },
    { value: "FREQ=DAILY", label: t("eventForm.recurrenceDaily") },
    { value: "FREQ=WEEKLY", label: t("eventForm.recurrenceWeekly") },
    { value: "FREQ=MONTHLY", label: t("eventForm.recurrenceMonthly") },
    { value: "FREQ=YEARLY", label: t("eventForm.recurrenceYearly") },
  ]

  const REMINDER_OPTIONS = [
    { value: "none", label: t("eventForm.reminderNone") },
    { value: "15", label: t("eventForm.reminder15") },
    { value: "30", label: t("eventForm.reminder30") },
    { value: "60", label: t("eventForm.reminder60") },
  ]

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
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: isEditing ? t("eventForm.updated") : t("eventForm.created"),
        description: isEditing
          ? t("eventForm.updatedDescription")
          : t("eventForm.createdDescription"),
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
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
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: t("eventForm.deleted"),
        description: t("eventForm.deletedDescription"),
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
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
            {isEditing ? t("eventForm.editTitle") : t("eventForm.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("eventForm.editDescription")
              : t("eventForm.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("eventForm.titleLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("eventForm.titlePlaceholder")} {...field} />
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
                  <FormLabel>{tc("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={tc("descriptionPlaceholder")}
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
                  <FormLabel>{t("eventForm.locationLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("eventForm.locationPlaceholder")} {...field} />
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
                  <FormLabel className="font-normal">{tc("allDay")}</FormLabel>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("eventForm.startDate")}</FormLabel>
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
                      <FormLabel>{t("eventForm.startTime")}</FormLabel>
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
                    <FormLabel>{t("eventForm.endDate")}</FormLabel>
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
                      <FormLabel>{t("eventForm.endTime")}</FormLabel>
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
                  <FormLabel>{t("eventForm.category")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("eventForm.categoryPlaceholder")} />
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
              <label className="text-sm font-medium leading-none">{t("eventForm.participants")}</label>
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
                    {t("eventForm.noMembers")}
                  </p>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="recurrenceRule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("eventForm.recurrence")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("eventForm.recurrenceNone")} />
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
                <label className="text-sm font-medium leading-none">Welche Termine bearbeiten?</label>
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
                      <label htmlFor={`series-${opt.value}`} className="text-sm font-normal leading-none cursor-pointer">
                        {opt.label}
                      </label>
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
                  {isDeleting ? tc("deleting") : tc("delete")}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? tc("saving")
                  : isEditing
                    ? tc("save")
                    : tc("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
