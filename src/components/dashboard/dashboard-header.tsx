"use client"

import { useTranslations } from "next-intl"

interface DashboardHeaderProps {
  displayName: string
  familyName: string
  memberCount: number
}

function getGreetingKey(): string {
  const hour = new Date().getHours()
  if (hour < 6) return "greetingNight"
  if (hour < 12) return "greetingMorning"
  if (hour < 18) return "greetingAfternoon"
  return "greetingEvening"
}

export function DashboardHeader({
  displayName,
  familyName,
  memberCount,
}: DashboardHeaderProps) {
  const t = useTranslations("dashboard")
  const greetingKey = getGreetingKey()

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="font-display text-xs font-bold uppercase tracking-widest text-primary-foreground">
          {t(greetingKey)} &middot; {t("familyPrefix", { familyName })}
        </span>
        <h1 className="mt-2 font-display text-4xl font-black text-foreground md:text-5xl">
          {t("hello", { displayName })}
        </h1>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <span className="text-sm font-bold text-muted-foreground">
            +{memberCount}
          </span>
        </div>
      </div>
    </div>
  )
}
