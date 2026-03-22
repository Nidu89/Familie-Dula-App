"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronRight } from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getEventsForRangeAction, type CalendarEvent } from "@/lib/actions/calendar"

const CATEGORY_ACCENT: Record<string, string> = {
  school: "bg-primary",
  work: "bg-secondary",
  leisure: "bg-accent",
  health: "bg-chart-5",
  other: "bg-muted-foreground/40",
}

const CATEGORY_LABELS: Record<string, string> = {
  school: "Schule",
  work: "Arbeit",
  leisure: "Freizeit",
  health: "Gesundheit",
  other: "Sonstiges",
}

function formatEventTime(startAt: string, allDay: boolean): string {
  if (allDay) return "Ganztägig"
  return new Date(startAt).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatEventDate(startAt: string, allDay: boolean): string {
  const date = new Date(startAt)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) return "Heute"
  if (date.getTime() === tomorrow.getTime()) return "Morgen"
  return new Date(startAt).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const now = new Date()
        const endOfDay = new Date(now)
        endOfDay.setDate(endOfDay.getDate() + 3)

        const result = await getEventsForRangeAction(
          now.toISOString(),
          endOfDay.toISOString()
        )

        if (!("error" in result)) {
          const upcoming = result.events
            .filter((e) => e.title !== "__DELETED__")
            .slice(0, 4)
          setEvents(upcoming)
        }
      } catch {
        // Silent fail for dashboard widget
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Kalender</CardTitle>
              <CardDescription className="text-xs">
                Nächste Termine
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/calendar" className="gap-1 text-xs">
              Alle
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              Keine anstehenden Termine
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-stretch gap-0 rounded-lg bg-muted/50 overflow-hidden"
              >
                <div
                  className={`w-1 shrink-0 rounded-l-lg ${CATEGORY_ACCENT[event.category] ?? CATEGORY_ACCENT.other}`}
                />
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDate(event.startAt, event.allDay)}
                      {!event.allDay && (
                        <> &middot; {formatEventTime(event.startAt, event.allDay)}</>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {CATEGORY_LABELS[event.category] ?? CATEGORY_LABELS.other}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
