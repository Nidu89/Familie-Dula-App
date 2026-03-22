"use client"

import { useState, useEffect } from "react"
import { CalendarDays, Calendar } from "lucide-react"
import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"
import {
  getEventsForRangeAction,
  type CalendarEvent,
} from "@/lib/actions/calendar"

const CATEGORY_BG: Record<string, string> = {
  school: "bg-accent",
  leisure: "bg-[#ffd5c2]",
  health: "bg-muted",
  work: "bg-muted",
  other: "bg-muted",
}

const CATEGORY_LABELS: Record<string, string> = {
  school: "Schule",
  work: "Arbeit",
  leisure: "Freizeit",
  health: "Gesundheit",
  other: "Sonstiges",
}

function formatEventTime(startAt: string, allDay: boolean): string {
  if (allDay) return "Ganztaegig"
  return new Date(startAt).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatEventDate(startAt: string): string {
  const date = new Date(startAt)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  if (d.getTime() === today.getTime()) return "Heute"
  if (d.getTime() === tomorrow.getTime()) return "Morgen"
  return new Date(startAt).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
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
          const upcoming = result.events
            .filter((e) => e.title !== "__DELETED__")
            .slice(0, 6)
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
    <section className="rounded-[2rem] bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Naechste Termine</h3>
        <Link
          href="/calendar"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Zum Kalender"
        >
          <CalendarDays className="h-5 w-5 text-primary-foreground" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2].map((i) => (
            <Skeleton
              key={i}
              className="min-w-[220px] h-36 rounded-[1.5rem] shrink-0"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Keine anstehenden Termine
          </p>
        </div>
      ) : (
        <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`relative min-w-[220px] shrink-0 overflow-hidden rounded-[1.5rem] p-6 transition-transform hover:scale-[1.02] ${
                CATEGORY_BG[event.category] ?? CATEGORY_BG.other
              }`}
            >
              {/* Decorative circle */}
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/20" />

              <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">
                {formatEventDate(event.startAt)} &middot;{" "}
                {formatEventTime(event.startAt, event.allDay)}
              </p>
              <h4 className="mt-2 text-lg font-bold leading-tight">
                {event.title}
              </h4>
              <span className="mt-3 inline-block rounded-full bg-white/30 px-3 py-0.5 text-[10px] font-semibold">
                {CATEGORY_LABELS[event.category] ?? CATEGORY_LABELS.other}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
