"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import Link from "next/link"
import { Clock, Pause, Play, Timer } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useOptionalTimerContext } from "@/context/timer-context"
import { getTimerTemplatesAction, type TimerTemplate } from "@/lib/actions/timer"

interface WidgetTemplate {
  id: string
  name: string
  durationSeconds: number
}

interface TimerWidgetProps {
  familyId: string
  isAdult: boolean
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (s > 0) return `${m}:${String(s).padStart(2, "0")} Min.`
  return `${m} Min.`
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function TimerWidget({ familyId, isAdult }: TimerWidgetProps) {
  const timerCtx = useOptionalTimerContext()
  const [templates, setTemplates] = useState<WidgetTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    const result = await getTimerTemplatesAction()
    if (!("error" in result)) {
      setTemplates(
        result.templates.slice(0, 3).map((t: TimerTemplate) => ({
          id: t.id,
          name: t.name,
          durationSeconds: t.durationSeconds,
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    startTransition(() => { void fetchTemplates() })
  }, [fetchTemplates])

  const timerState = timerCtx?.timer.state
  const isActive =
    timerState?.status === "running" || timerState?.status === "paused"

  return (
    <section className="rounded-[2rem] bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Timer</h3>
        <Timer className="h-5 w-5 text-secondary" />
      </div>

      {/* Active timer display */}
      {isActive && timerState && (
        <Link
          href="/timer"
          className="mb-4 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#6c5a00]/10 to-[#ffd709]/10 p-4 transition-colors hover:from-[#6c5a00]/15 hover:to-[#ffd709]/15"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709]">
            {timerState.status === "running" ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-bold tabular-nums text-foreground">
              {formatCountdown(timerState.remainingSeconds)}
            </p>
            <p className="text-xs text-muted-foreground">
              {timerState.status === "running" ? "Laeuft" : "Pausiert"}
            </p>
          </div>
        </Link>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 && !isActive ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Noch keine Timer-Vorlagen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              href="/timer"
              className="flex items-center gap-4 rounded-xl bg-muted p-4 transition-colors hover:bg-muted/70"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Play className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {template.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(template.durationSeconds)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/timer"
        className="mt-6 block w-full rounded-full bg-muted py-3 text-center text-sm font-bold text-secondary transition-colors hover:bg-muted/80"
      >
        Timer oeffnen
      </Link>
    </section>
  )
}

export function TimerWidgetSkeleton() {
  return (
    <section className="rounded-[2rem] bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </section>
  )
}
