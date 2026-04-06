"use client"

import { useMemo } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns"
import { de } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

const CATEGORY_COLORS: Record<string, string> = {
  school: "hsl(260, 60%, 65%)",
  work: "hsl(340, 60%, 75%)",
  leisure: "hsl(170, 50%, 60%)",
  health: "hsl(40, 80%, 70%)",
  other: "hsl(20, 80%, 65%)",
}

interface CalendarEventMinimal {
  id: string
  startAt: string
  endAt: string
  allDay: boolean
  category: string
  title: string
}

interface CustomMonthGridProps {
  currentDate: Date
  selectedDate: Date
  events: CalendarEventMinimal[]
  onSelectDate: (date: Date) => void
  onNavigate: (action: "PREV" | "NEXT") => void
}

export function CustomMonthGrid({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
  onNavigate,
}: CustomMonthGridProps) {
  const t = useTranslations("calendar")
  const WEEKDAY_LABELS = [
    t("weekdays.mo"),
    t("weekdays.tu"),
    t("weekdays.we"),
    t("weekdays.th"),
    t("weekdays.fr"),
    t("weekdays.sa"),
    t("weekdays.su"),
  ]
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  )

  // Build a map of day string -> events for fast lookup
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEventMinimal[]> = {}
    for (const event of events) {
      const eventStart = new Date(event.startAt)
      const eventEnd = new Date(event.endAt)

      // For multi-day/all-day events, add them to each day they span
      const startDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
      const endDay = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
      const spanDays = eachDayOfInterval({ start: startDay, end: endDay })

      for (const day of spanDays) {
        const key = format(day, "yyyy-MM-dd")
        if (!map[key]) map[key] = []
        map[key].push(event)
      }
    }
    return map
  }, [events])

  const monthLabel = format(currentDate, "MMMM yyyy", { locale: de })
  // Capitalize first letter
  const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  return (
    <div className="flex flex-col gap-4">
      {/* Month header with navigation */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold text-foreground">
          {capitalizedLabel}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-surface-low hover:bg-surface-container"
            onClick={() => onNavigate("PREV")}
            aria-label={t("prevMonth")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-surface-low hover:bg-surface-container"
            onClick={() => onNavigate("NEXT")}
            aria-label={t("nextMonth")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd")
          const dayEvents = eventsByDay[key] || []
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)
          const selected = isSameDay(day, selectedDate)
          const maxDotsVisible = 3
          const overflow = dayEvents.length - maxDotsVisible

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              className={[
                "relative flex min-h-[4.5rem] sm:min-h-[5rem] flex-col items-center rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                // Off-range days
                !inMonth && "opacity-30",
                // Base background
                inMonth && !today && !selected && "bg-surface-low hover:bg-surface-container",
                // Today highlight
                today && !selected && "bg-primary/5 ring-2 ring-primary",
                // Selected day
                selected && "bg-primary/10 ring-2 ring-primary",
                // Off-range background
                !inMonth && "bg-surface-low/50",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={format(day, "EEEE, d. MMMM yyyy", { locale: de })}
              aria-current={today ? "date" : undefined}
            >
              {/* Day number */}
              <span
                className={[
                  "text-sm font-medium",
                  today && "font-bold text-primary-foreground",
                  selected && !today && "font-bold",
                  !inMonth && "text-muted-foreground",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {format(day, "d")}
              </span>

              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="mt-auto flex items-center gap-0.5 pt-1">
                  {dayEvents.slice(0, maxDotsVisible).map((evt, i) => (
                    <span
                      key={evt.id + "-" + i}
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[evt.category] ||
                          CATEGORY_COLORS.other,
                      }}
                    />
                  ))}
                  {overflow > 0 && (
                    <span className="text-[9px] font-medium text-muted-foreground">
                      +{overflow}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
