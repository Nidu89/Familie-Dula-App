"use client"

import { ListChecks } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { RitualCard } from "./ritual-card"
import type { Ritual } from "@/lib/actions/rituals"

interface RitualsListProps {
  rituals: Ritual[]
  loading: boolean
  isAdult: boolean
  isActiveRunning: boolean
  onStart: (ritual: Ritual) => void
  onEdit: (ritual: Ritual) => void
  onDelete: (ritual: Ritual) => void
}

export function RitualsList({
  rituals,
  loading,
  isAdult,
  isActiveRunning,
  onStart,
  onEdit,
  onDelete,
}: RitualsListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[2rem] bg-card p-8">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <Skeleton className="mt-6 h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (rituals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-muted py-16 text-center">
        <ListChecks className="h-12 w-12 text-muted-foreground/50" />
        {isAdult ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">
              Noch keine Rituale erstellt.
            </p>
            <p className="text-xs text-muted-foreground">
              Erstelle ein neues Ritual, um wiederkehrende Ablaeufe zu
              organisieren.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-muted-foreground">
              Kein Ritual laeuft gerade.
            </p>
            <p className="text-xs text-muted-foreground">
              Frag Mama oder Papa!
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {rituals.map((ritual) => (
        <RitualCard
          key={ritual.id}
          ritual={ritual}
          isAdult={isAdult}
          isActiveRunning={isActiveRunning}
          onStart={onStart}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
