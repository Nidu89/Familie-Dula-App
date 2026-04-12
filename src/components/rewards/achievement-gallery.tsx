"use client"

import { Award } from "lucide-react"
import { useTranslations } from "next-intl"
import { AchievementBadge } from "@/components/rewards/achievement-badge"
import type { Achievement } from "@/lib/actions/rewards"

interface AchievementGalleryProps {
  achievements: Achievement[]
}

export function AchievementGallery({ achievements }: AchievementGalleryProps) {
  if (achievements.length === 0) {
    return (
      <section aria-label="Achievements">
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="font-display text-xl font-bold">Deine Erfolge</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Badges
          </span>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-card py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Award className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Noch keine Abzeichen verfuegbar.
          </p>
        </div>
      </section>
    )
  }

  // Sort: earned first, then locked
  const sorted = [...achievements].sort((a, b) => {
    if (a.earned && !b.earned) return -1
    if (!a.earned && b.earned) return 1
    return 0
  })

  const earnedCount = achievements.filter((a) => a.earned).length

  return (
    <section aria-label="Achievements">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="font-display text-xl font-bold">Deine Erfolge</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
          {earnedCount} / {achievements.length}
        </span>
      </div>

      <div className="overflow-x-auto overflow-y-hidden pb-2 hide-scrollbar max-w-full">
        <div className="flex gap-6 px-1 py-2">
          {sorted.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>
    </section>
  )
}
