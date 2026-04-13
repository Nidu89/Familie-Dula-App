"use client"

import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { HeartButton } from "@/components/moments/heart-button"
import type { Moment } from "@/lib/actions/moments"

interface MomentCardProps {
  moment: Moment
  onClick: () => void
}

export function MomentCard({ moment, onClick }: MomentCardProps) {
  const t = useTranslations("moments")
  const locale = useLocale()

  const formattedDate = new Date(moment.momentDate).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="moment-card"
      className="group relative flex flex-col overflow-hidden rounded-[2rem] bg-card text-left transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Photo or gradient placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-low">
        {moment.photoUrl ? (
          <Image
            src={moment.photoUrl}
            alt={moment.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl"
            style={{
              background: `linear-gradient(135deg, hsl(${hashCode(moment.title) % 360}, 60%, 85%), hsl(${(hashCode(moment.title) + 40) % 360}, 50%, 75%))`,
            }}
          >
            📸
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="font-display text-base font-bold text-foreground line-clamp-2">
          {moment.title}
        </h3>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>

        {/* Heart */}
        <div className="mt-auto pt-2">
          <HeartButton
            momentId={moment.id}
            initialLiked={moment.likedByMe}
            initialCount={moment.heartCount}
          />
        </div>
      </div>
    </button>
  )
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}
