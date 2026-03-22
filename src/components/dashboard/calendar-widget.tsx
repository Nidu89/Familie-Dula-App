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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getEventsForRangeAction, type CalendarEvent } from "@/lib/actions/calendar"

const CATEGORY_COLORS: Record<string, string> = {
  school: "bg-primary/20 text-primary",
  work: "bg-secondary/20 text-secondary-foreground",
  leisure: "bg-chart-3/20 text-chart-3",
  health: "bg-chart-4/20 text-chart-4",
  other: "bg-chart-5/20 text-chart-5",
}

function formatEventTime(startAt: string, allDay: boolean): string {
  if (allDay) return "Ganztaegig"
  return new Date(startAt).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  })
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
          // Filter out deleted exceptions and take first 4
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
                Anstehende Termine
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
              <Skeleton key={i} className="h-12 w-full rounded-md" />
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
                className="flex items-center gap-3 rounded-md border p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventTime(event.startAt, event.allDay)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other}`}
                >
                  {event.category === "school"
                    ? "Schule"
                    : event.category === "work"
                      ? "Arbeit"
                      : event.category === "leisure"
                        ? "Freizeit"
                        : event.category === "health"
                          ? "Gesundheit"
                          : "Sonstiges"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
