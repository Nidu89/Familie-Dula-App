"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Camera, Plus } from "lucide-react"
import { getLatestMomentAction } from "@/lib/actions/moments"
import type { Moment } from "@/lib/actions/moments"

export function MomentsHero() {
  const t = useTranslations("moments")
  const locale = useLocale()
  const [moment, setMoment] = useState<Moment | null | undefined>(undefined)

  useEffect(() => {
    async function load() {
      const result = await getLatestMomentAction()
      if ("moment" in result) {
        setMoment(result.moment)
      } else {
        setMoment(null)
      }
    }
    load()
  }, [])

  // Loading skeleton
  if (moment === undefined) {
    return (
      <div
        data-testid="moments-hero"
        className="animate-pulse rounded-[2rem] bg-surface-container-low h-48"
      />
    )
  }

  // Empty state
  if (!moment) {
    return (
      <Link
        href="/moments"
        data-testid="moments-hero-empty"
        className="group flex items-center gap-5 rounded-[2rem] bg-surface-container-low p-7 transition-all hover:bg-surface-container hover:shadow-md"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-container">
          <Camera className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t("dashboardHeroEmpty")}
          </p>
          <p className="mt-1 text-xs text-secondary font-medium flex items-center gap-1">
            <Plus className="h-3 w-3" />
            {t("dashboardHeroAction")}
          </p>
        </div>
      </Link>
    )
  }

  const formattedDate = new Date(moment.momentDate).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  // Hero with latest moment
  return (
    <Link
      href="/moments"
      data-testid="moments-hero"
      className="group relative block overflow-hidden rounded-[2rem] transition-all hover:shadow-lg"
    >
      <div className="relative aspect-[16/7] w-full bg-surface-container-low">
        {moment.photoUrl ? (
          <Image
            src={moment.photoUrl}
            alt={moment.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 800px"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-5xl"
            style={{
              background: `linear-gradient(135deg, hsl(${hashCode(moment.title) % 360}, 60%, 85%), hsl(${(hashCode(moment.title) + 40) % 360}, 50%, 75%))`,
            }}
          >
            📸
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="font-display text-lg font-bold text-white line-clamp-1">
            {moment.title}
          </h3>
          <p className="mt-1 text-xs text-white/80">{formattedDate}</p>
        </div>
      </div>

      {/* Link row */}
      <div className="bg-card px-6 py-3">
        <p className="text-xs font-medium text-secondary">
          {t("dashboardHeroLink")} →
        </p>
      </div>
    </Link>
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
