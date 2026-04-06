"use client"

import { useTranslations } from "next-intl"

interface RitualsPageHeaderProps {
  showError?: boolean
}

export function RitualsPageHeader({ showError }: RitualsPageHeaderProps) {
  const t = useTranslations("rituals")

  if (showError) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("loadError")}
      </p>
    )
  }

  return null
}
