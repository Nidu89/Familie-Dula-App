"use client"

import { useTranslations } from "next-intl"

export function RewardsPageHeader() {
  const t = useTranslations("rewards")

  return (
    <div className="mb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("pageSubtitle")}
      </p>
    </div>
  )
}
