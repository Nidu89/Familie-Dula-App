"use client"

import {
  Sparkles,
  BookOpen,
  Sunrise,
  Users,
  Lock,
  Award,
} from "lucide-react"
import type { Achievement } from "@/lib/actions/rewards"

interface AchievementBadgeProps {
  achievement: Achievement
}

// Map achievement slugs/icons to lucide icons and colors
const BADGE_CONFIG: Record<
  string,
  {
    Icon: typeof Sparkles
    bgEarned: string
    bgLocked: string
  }
> = {
  "putz-profi": {
    Icon: Sparkles,
    bgEarned: "bg-primary/20",
    bgLocked: "bg-muted",
  },
  "fruehaufsteher": {
    Icon: Sunrise,
    bgEarned: "bg-tertiary-container",
    bgLocked: "bg-muted",
  },
  teamplayer: {
    Icon: Users,
    bgEarned: "bg-accent",
    bgLocked: "bg-muted",
  },
  leseratte: {
    Icon: BookOpen,
    bgEarned: "bg-secondary/15",
    bgLocked: "bg-muted",
  },
}

function getConfig(slug: string) {
  return (
    BADGE_CONFIG[slug] || {
      Icon: Award,
      bgEarned: "bg-primary/20",
      bgLocked: "bg-muted",
    }
  )
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const { Icon, bgEarned, bgLocked } = getConfig(achievement.slug)
  const isEarned = achievement.earned

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-transform ${
          isEarned
            ? `${bgEarned} rotate-3 hover:rotate-0`
            : `${bgLocked} opacity-40 grayscale`
        }`}
      >
        {isEarned ? (
          <Icon className="h-10 w-10 text-foreground/80" />
        ) : (
          <>
            <Icon className="h-10 w-10 text-muted-foreground" />
            <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-high">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          </>
        )}
      </div>

      <p className="max-w-[6rem] text-center font-display text-xs font-bold leading-tight">
        {achievement.title}
      </p>

      {isEarned && achievement.earnedAt && (
        <p className="text-[10px] text-muted-foreground">
          {new Date(achievement.earnedAt).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "short",
          })}
        </p>
      )}

      {!isEarned && achievement.description && (
        <p className="max-w-[7rem] text-center text-[10px] text-muted-foreground">
          {achievement.description}
        </p>
      )}
    </div>
  )
}
