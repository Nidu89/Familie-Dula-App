"use client"

import { useTranslations } from "next-intl"

export function FamilySettingsHero() {
  const t = useTranslations("family")

  return (
    <section className="mb-16 relative">
      <div
        className="absolute -top-12 -right-8 w-48 h-48 bg-primary/20 -z-10"
        style={{
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}
      />
      <div className="max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
          {t("settingsBreadcrumb")}
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-secondary mb-4 leading-tight">
          {t("settingsTitle")}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground font-medium max-w-xl">
          {t("settingsSubtitle")}
        </p>
      </div>
    </section>
  )
}

interface FamilyActivitySummaryProps {
  memberCount: number
  adminCount: number
}

export function FamilyActivitySummary({
  memberCount,
  adminCount,
}: FamilyActivitySummaryProps) {
  const t = useTranslations("family")

  return (
    <section className="mt-20">
      <div className="bg-card p-10 rounded-xl flex flex-col lg:flex-row gap-10 items-center">
        <div className="flex-1">
          <h4 className="font-display text-3xl font-extrabold text-secondary mb-3">
            {t("activity")}
          </h4>
          <p className="text-muted-foreground max-w-md">
            {t("activityDescription")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full lg:w-auto">
          <div className="bg-background p-6 rounded-lg text-center">
            <span className="block text-3xl font-black text-secondary">
              {String(memberCount).padStart(2, "0")}
            </span>
            <span className="text-xs font-bold text-muted-foreground uppercase">
              {t("members")}
            </span>
          </div>
          <div className="bg-background p-6 rounded-lg text-center">
            <span className="block text-3xl font-black text-primary-foreground">
              {String(adminCount).padStart(2, "0")}
            </span>
            <span className="text-xs font-bold text-muted-foreground uppercase">
              {t("admins")}
            </span>
          </div>
          <div className="bg-tertiary-container p-6 rounded-lg text-center">
            <span className="block text-3xl font-black text-foreground">
              100%
            </span>
            <span className="text-xs font-bold text-foreground/60 uppercase">
              {t("funFactor")}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
