"use client"

import { useTranslations } from "next-intl"

interface TimerPageHeaderProps {
  showError?: boolean
}

export function TimerPageHeader({ showError }: TimerPageHeaderProps) {
  const t = useTranslations("timer")

  if (showError) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("loadError")}
      </p>
    )
  }

  return (
    <div className="mb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        {t("pageTitle")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("pageSubtitle")}
      </p>
    </div>
  )
}
