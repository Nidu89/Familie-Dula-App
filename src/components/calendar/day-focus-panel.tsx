"use client"

import { useMemo } from "react"
import { format, isSameDay } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarDays, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CalendarEvent } from "@/lib/actions/calendar"

const CATEGORY_COLORS: Record<string, string> = {
  school: "hsl(260, 60%, 65%)",
  work: "hsl(340, 60%, 75%)",
  leisure: "hsl(170, 50%, 60%)",
  health: "hsl(40, 80%, 70%)",
  other: "hsl(20, 80%, 65%)",
}

const CATEGORY_LABELS: Record<string, string> = {
  school: "Schule",
  work: "Arbeit",
  leisure: "Freizeit",
  health: "Gesundheit",
  other: "Sonstiges",
}

interface FamilyMember {
  id: string
  displayName: string
}

interface DayFocusPanelProps {
  selectedDate: Date
  events: CalendarEvent[]
  members: FamilyMember[]
  isAdultOrAdmin: boolean
  onAddEvent: () => void
  onSelectEvent: (event: CalendarEvent) => void
}

export function DayFocusPanel({
  selectedDate,
  events,
  members,
  isAdultOrAdmin,
  onAddEvent,
  onSelectEvent,
}: DayFocusPanelProps) {
  // Filter events for the selected day
  const dayEvents = useMemo(() => {
    return events.filter((event) => {
      const eventStart = new Date(event.startAt)
      const eventEnd = new Date(event.endAt)

      // All-day events or events that span across this day
      if (event.allDay) {
        const startDay = new Date(
          eventStart.getFullYear(),
          eventStart.getMonth(),
          eventStart.getDate()
        )
        const endDay = new Date(
          eventEnd.getFullYear(),
          eventEnd.getMonth(),
          eventEnd.getDate()
        )
        return selectedDate >= startDay && selectedDate <= endDay
      }

      // Check if the event falls on this day
      return (
        isSameDay(eventStart, selectedDate) ||
        isSameDay(eventEnd, selectedDate) ||
        (eventStart < selectedDate && eventEnd > selectedDate)
      )
    })
  }, [events, selectedDate])

  // Sort events by start time
  const sortedEvents = useMemo(() => {
    return [...dayEvents].sort((a, b) => {
      // All-day events first
      if (a.allDay && !b.allDay) return -1
      if (!a.allDay && b.allDay) return 1
      return new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    })
  }, [dayEvents])

  const dayName = format(selectedDate, "EEEE", { locale: de })
  const capitalizedDayName =
    dayName.charAt(0).toUpperCase() + dayName.slice(1)
  const dateLabel = format(selectedDate, "d. MMM.", { locale: de })

  // Build member lookup for participant badges
  const memberMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of members) {
      map[m.id] = m.displayName
    }
    return map
  }, [members])

  return (
    <div className="flex flex-col gap-5 rounded-lg bg-card p-5 sm:p-6">
      {/* Panel header */}
      <div>
        <p className="font-display text-xs font-bold uppercase tracking-widest text-secondary">
          Tagesfokus
        </p>
        <h3 className="mt-1 font-display text-lg font-extrabold text-foreground">
          {capitalizedDayName},{" "}
          <span className="font-semibold">{dateLabel}</span>
        </h3>
      </div>

      {/* Event list or empty state */}
      {sortedEvents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-low">
            <CalendarDays className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Keine Termine an diesem Tag
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedEvents.map((event) => {
            const categoryColor =
              CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other
            const categoryLabel =
              CATEGORY_LABELS[event.category] || CATEGORY_LABELS.other

            const timeLabel = event.allDay
              ? "Ganztaegig"
              : `${format(new Date(event.startAt), "HH:mm")} - ${format(new Date(event.endAt), "HH:mm")}`

            return (
              <button
                key={event.id + "-" + event.startAt}
                type="button"
                onClick={() => onSelectEvent(event)}
                className="group flex w-full flex-col gap-2.5 rounded-lg bg-card p-4 text-left transition-colors hover:bg-surface-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  borderLeft: `4px solid ${categoryColor}`,
                }}
              >
                {/* Title */}
                <p className="font-body text-sm font-bold text-foreground group-hover:text-foreground/90">
                  {event.title}
                </p>

                {/* Description (truncated) */}
                {event.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {event.description}
                  </p>
                )}

                {/* Time badge */}
                <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {timeLabel}
                </span>

                {/* Participant + category badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {categoryLabel}
                  </span>
                  {event.participants.map((p) => (
                    <span
                      key={p.profileId}
                      className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground"
                    >
                      {p.displayName}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Add event button (adults only) */}
      {isAdultOrAdmin && (
        <Button
          variant="ghost"
          className="mt-auto flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-transparent text-sm font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
          onClick={onAddEvent}
        >
          <Plus className="h-4 w-4" />
          Termin hinzufuegen
        </Button>
      )}
    </div>
  )
}
