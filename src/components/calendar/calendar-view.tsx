"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type View,
  type Event as RBCEvent,
  type NavigateAction,
} from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { de } from "date-fns/locale"
import { RRule } from "rrule"

import "react-big-calendar/lib/css/react-big-calendar.css"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  CalendarHeader,
  type CalendarViewType,
} from "@/components/calendar/calendar-header"
import { EventFormDialog } from "@/components/calendar/event-form-dialog"
import {
  getEventsForRangeAction,
  type CalendarEvent,
} from "@/lib/actions/calendar"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

const locales = { "de-DE": de }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

interface CalendarEventRBC extends RBCEvent {
  resource: CalendarEvent
}

const CATEGORY_COLORS: Record<string, string> = {
  school: "hsl(260, 60%, 65%)",
  work: "hsl(340, 60%, 75%)",
  leisure: "hsl(170, 50%, 60%)",
  health: "hsl(40, 80%, 70%)",
  other: "hsl(20, 80%, 65%)",
}

interface FamilyMember {
  id: string
  displayName: string
}

interface CalendarViewProps {
  initialEvents: CalendarEvent[]
  members: FamilyMember[]
  isAdultOrAdmin: boolean
  currentUserId: string
}

export function CalendarView({
  initialEvents,
  members,
  isAdultOrAdmin,
  currentUserId,
}: CalendarViewProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [view, setView] = useState<CalendarViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  // Filters
  const [selectedMember, setSelectedMember] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const fetchEvents = useCallback(
    async (date: Date) => {
      setIsLoading(true)
      try {
        const rangeStart = new Date(date.getFullYear(), date.getMonth() - 1, 1)
        const rangeEnd = new Date(date.getFullYear(), date.getMonth() + 2, 0)

        const result = await getEventsForRangeAction(
          rangeStart.toISOString(),
          rangeEnd.toISOString()
        )

        if ("error" in result) {
          toast({
            title: "Fehler",
            description: result.error,
            variant: "destructive",
          })
          return
        }

        setEvents(result.events)
      } catch {
        toast({
          title: "Fehler",
          description: "Termine konnten nicht geladen werden.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    fetchEvents(currentDate)
  }, [currentDate, fetchEvents])

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.title === "__DELETED__") return false
      if (
        selectedMember !== "all" &&
        !e.participants.some((p) => p.profileId === selectedMember) &&
        e.createdBy !== selectedMember
      ) {
        return false
      }
      if (selectedCategory !== "all" && e.category !== selectedCategory) {
        return false
      }
      return true
    })
  }, [events, selectedMember, selectedCategory])

  // Map to react-big-calendar events, expanding RRULE recurring events into occurrences
  const rbcEvents: CalendarEventRBC[] = useMemo(() => {
    const result: CalendarEventRBC[] = []
    const rangeStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const rangeEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)

    // Track deleted exception dates per parent (from raw events incl. __DELETED__ markers)
    const deletedDatesByParent: Record<string, Set<string>> = {}
    for (const e of events) {
      if (e.recurrenceParentId && e.title === "__DELETED__") {
        if (!deletedDatesByParent[e.recurrenceParentId]) {
          deletedDatesByParent[e.recurrenceParentId] = new Set()
        }
        deletedDatesByParent[e.recurrenceParentId].add(new Date(e.startAt).toDateString())
      }
    }

    // Track non-deleted exceptions per parent (already filtered in filteredEvents)
    const overriddenDatesByParent: Record<string, Set<string>> = {}
    for (const e of filteredEvents) {
      if (e.recurrenceParentId) {
        if (!overriddenDatesByParent[e.recurrenceParentId]) {
          overriddenDatesByParent[e.recurrenceParentId] = new Set()
        }
        overriddenDatesByParent[e.recurrenceParentId].add(new Date(e.startAt).toDateString())
      }
    }

    for (const e of filteredEvents) {
      if (e.recurrenceParentId) {
        // Exception record – show directly (already filtered for __DELETED__)
        result.push({
          title: e.title,
          start: new Date(e.startAt),
          end: new Date(e.endAt),
          allDay: e.allDay,
          resource: e,
        })
        continue
      }

      if (e.recurrenceRule) {
        const startDate = new Date(e.startAt)
        const duration = new Date(e.endAt).getTime() - startDate.getTime()
        const deletedDates = deletedDatesByParent[e.id] ?? new Set<string>()
        const overriddenDates = overriddenDatesByParent[e.id] ?? new Set<string>()

        try {
          const ruleOptions = RRule.parseString(e.recurrenceRule)
          const rule = new RRule({ ...ruleOptions, dtstart: startDate })
          const occurrences = rule.between(rangeStart, rangeEnd, true)

          for (const occStart of occurrences) {
            const dateStr = occStart.toDateString()
            if (deletedDates.has(dateStr) || overriddenDates.has(dateStr)) continue
            const occEnd = new Date(occStart.getTime() + duration)
            result.push({
              title: e.title,
              start: occStart,
              end: occEnd,
              allDay: e.allDay,
              resource: { ...e, startAt: occStart.toISOString(), endAt: occEnd.toISOString() },
            })
          }
        } catch {
          // Fallback: show original event
          result.push({
            title: e.title,
            start: new Date(e.startAt),
            end: new Date(e.endAt),
            allDay: e.allDay,
            resource: e,
          })
        }
      } else {
        result.push({
          title: e.title,
          start: new Date(e.startAt),
          end: new Date(e.endAt),
          allDay: e.allDay,
          resource: e,
        })
      }
    }

    return result
  }, [events, filteredEvents, currentDate])

  function handleNavigate(action: "PREV" | "NEXT" | "TODAY") {
    const d = new Date(currentDate)
    if (action === "TODAY") {
      setCurrentDate(new Date())
    } else if (action === "PREV") {
      if (view === "month") d.setMonth(d.getMonth() - 1)
      else if (view === "week") d.setDate(d.getDate() - 7)
      else d.setDate(d.getDate() - 1)
      setCurrentDate(d)
    } else {
      if (view === "month") d.setMonth(d.getMonth() + 1)
      else if (view === "week") d.setDate(d.getDate() + 7)
      else d.setDate(d.getDate() + 1)
      setCurrentDate(d)
    }
  }

  function handleRBCNavigate(newDate: Date, _view: View, _action: NavigateAction) {
    setCurrentDate(newDate)
  }

  function handleSelectEvent(rbcEvent: CalendarEventRBC) {
    if (isAdultOrAdmin) {
      setSelectedEvent(rbcEvent.resource)
      setDialogOpen(true)
    }
  }

  function handleSelectSlot(slotInfo: { start: Date }) {
    if (isAdultOrAdmin) {
      setSelectedEvent(null)
      setSelectedDate(slotInfo.start)
      setDialogOpen(true)
    }
  }

  function handleNewEvent() {
    setSelectedEvent(null)
    setSelectedDate(new Date())
    setDialogOpen(true)
  }

  function handleSuccess() {
    fetchEvents(currentDate)
  }

  // Supabase Realtime: refresh events when other family members make changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("calendar_events_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_events" },
        () => {
          fetchEvents(currentDate)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentDate, fetchEvents])

  function eventStyleGetter(event: CalendarEventRBC) {
    const color =
      CATEGORY_COLORS[event.resource.category] || CATEGORY_COLORS.other
    const isPast = event.end && event.end < new Date()
    return {
      style: {
        backgroundColor: color,
        opacity: isPast ? 0.5 : 1,
        borderRadius: "4px",
        border: "none",
        color: "#fff",
        fontSize: "0.75rem",
        padding: "2px 4px",
      },
    }
  }

  // Custom toolbar is hidden (we use our own CalendarHeader)
  const components = useMemo(
    () => ({
      toolbar: () => null,
      event: ({ event }: { event: CalendarEventRBC }) => (
        <div className="truncate text-xs font-medium">{event.title}</div>
      ),
    }),
    []
  )

  const messages = {
    allDay: "Ganztaegig",
    previous: "Zurueck",
    next: "Weiter",
    today: "Heute",
    month: "Monat",
    week: "Woche",
    day: "Tag",
    agenda: "Liste",
    date: "Datum",
    time: "Uhrzeit",
    event: "Termin",
    noEventsInRange: "Keine Termine in diesem Zeitraum.",
    showMore: (total: number) => `+${total} weitere`,
  }

  return (
    <div className="flex flex-col gap-4">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={handleNavigate}
        onNewEvent={handleNewEvent}
        isAdultOrAdmin={isAdultOrAdmin}
        members={members}
        selectedMember={selectedMember}
        onMemberChange={setSelectedMember}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-2 sm:p-4 [&_.rbc-header]:border-border [&_.rbc-header]:bg-muted/50 [&_.rbc-header]:py-2 [&_.rbc-header]:text-xs [&_.rbc-header]:font-medium [&_.rbc-header]:text-muted-foreground [&_.rbc-month-row]:border-border [&_.rbc-day-bg]:border-border [&_.rbc-off-range-bg]:bg-muted/20 [&_.rbc-today]:bg-primary/5 [&_.rbc-time-view]:border-border [&_.rbc-timeslot-group]:border-border [&_.rbc-time-content]:border-border [&_.rbc-day-slot_.rbc-time-slot]:border-border/30 [&_.rbc-agenda-view_table]:border-border [&_.rbc-agenda-view_table_td]:border-border [&_.rbc-agenda-view_table_th]:border-border">
          <BigCalendar<CalendarEventRBC>
            localizer={localizer}
            events={rbcEvents}
            startAccessor="start"
            endAccessor="end"
            view={view as View}
            onView={(v) => setView(v as CalendarViewType)}
            date={currentDate}
            onNavigate={handleRBCNavigate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable={isAdultOrAdmin}
            eventPropGetter={eventStyleGetter}
            components={components}
            messages={messages}
            culture="de-DE"
            style={{ height: 600 }}
            popup
          />
        </div>
      )}

      {/* Category Legend */}
      <div className="flex flex-wrap gap-2" aria-label="Kategorien-Legende">
        {Object.entries(CATEGORY_COLORS).map(([key, color]) => {
          const label =
            key === "school"
              ? "Schule"
              : key === "work"
                ? "Arbeit"
                : key === "leisure"
                  ? "Freizeit"
                  : key === "health"
                    ? "Gesundheit"
                    : "Sonstiges"
          return (
            <Badge
              key={key}
              variant="outline"
              className="gap-1.5 text-xs"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </Badge>
          )
        })}
      </div>

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        members={members}
        defaultDate={selectedDate}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
