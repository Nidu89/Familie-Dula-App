"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import Link from "next/link"
import { ListChecks, Play, Clock, Star } from "lucide-react"
import { useTranslations } from "next-intl"
import { Skeleton } from "@/components/ui/skeleton"
import { getRitualsAction, type Ritual } from "@/lib/actions/rituals"

interface RitualsWidgetProps {
  isAdult: boolean
}

export function RitualsWidget({ isAdult }: RitualsWidgetProps) {
  const t = useTranslations("dashboard.rituals")
  const tc = useTranslations("common")
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRituals = useCallback(async () => {
    const result = await getRitualsAction()
    if (!("error" in result)) {
      setRituals(result.rituals.slice(0, 3))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    startTransition(() => {
      void fetchRituals()
    })
  }, [fetchRituals])

  return (
    <section className="rounded-[2rem] bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">{t("title")}</h3>
        <ListChecks className="h-5 w-5 text-secondary" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : rituals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <ListChecks className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t("noRituals")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rituals.map((ritual) => (
            <Link
              key={ritual.id}
              href="/rituals"
              className="flex items-center gap-4 rounded-xl bg-muted p-4 transition-colors hover:bg-muted/70"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20">
                <Play className="h-4 w-4 text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {ritual.name}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{ritual.steps.length} {tc("steps")}</span>
                  {ritual.timerDurationMinutes !== null &&
                    ritual.timerDurationMinutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {ritual.timerDurationMinutes} {tc("min")}
                      </span>
                    )}
                  {ritual.rewardPoints !== null &&
                    ritual.rewardPoints > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {ritual.rewardPoints}
                      </span>
                    )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/rituals"
        className="mt-6 block w-full rounded-full bg-muted py-3 text-center text-sm font-bold text-secondary transition-colors hover:bg-muted/80"
      >
        {t("open")}
      </Link>
    </section>
  )
}

export function RitualsWidgetSkeleton() {
  return (
    <section className="rounded-[2rem] bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </section>
  )
}
