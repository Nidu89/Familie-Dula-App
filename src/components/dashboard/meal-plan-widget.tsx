"use client"

import { ChefHat, Timer } from "lucide-react"
import { useTranslations } from "next-intl"

export function MealPlanWidget() {
  const t = useTranslations("dashboard.mealPlan")
  const tc = useTranslations("common")
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-secondary p-8 text-white">
      {/* Decorative blob */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      {/* Icon + time badge */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
          <ChefHat className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-white/30 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest">
          {t("dinner")}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-3xl font-black">{t("title")}</h3>
      <p className="mt-1 text-sm italic text-white/60">
        {t("subtitle")}
      </p>

      {/* Prep time block */}
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-white/10 p-4">
        <Timer className="h-5 w-5 text-white/70" />
        <div>
          <p className="text-xs font-bold">{t("scheduling")}</p>
          <p className="text-[10px] text-white/60">
            {t("schedulingDescription")}
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        disabled
        className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-black uppercase tracking-widest text-primary-foreground opacity-60 cursor-not-allowed"
      >
        {tc("comingSoon")}
      </button>
    </section>
  )
}
