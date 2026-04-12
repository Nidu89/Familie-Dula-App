"use client"

import { useState, useEffect } from "react"
import { ChefHat, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { getMealPlanAction, type MealPlanEntry } from "@/lib/actions/recipes"

function getCurrentWeekKey(): string {
  const now = new Date()
  const jan1 = new Date(now.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((now.getTime() - jan1.getTime()) / 86400000) + 1
  const weekNumber = Math.ceil((dayOfYear + jan1.getDay()) / 7)
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`
}

function getTodayWeekday(): number {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1 // Convert Sun=0 to Mon=0...Sun=6
}

const MEAL_LABELS = {
  breakfast: "mealBreakfast",
  lunch: "mealLunch",
  dinner: "mealDinner",
} as const

export function MealPlanWidget() {
  const t = useTranslations("dashboard.mealPlan")
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const weekKey = getCurrentWeekKey()
      const result = await getMealPlanAction(weekKey)
      if ("entries" in result) {
        const todayWeekday = getTodayWeekday()
        setEntries(result.entries.filter((e) => e.weekday === todayWeekday))
      }
      setLoading(false)
    }
    load()
  }, [])

  const hasMeals = entries.length > 0

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-secondary p-8 text-white">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
          <ChefHat className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-white/30 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest">
          {t("todayLabel")}
        </span>
      </div>

      <h3 className="font-display text-3xl font-black">{t("title")}</h3>

      {loading ? (
        <div className="mt-4 h-20 flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : hasMeals ? (
        <div className="mt-4 space-y-2">
          {(["breakfast", "lunch", "dinner"] as const).map((mealType) => {
            const entry = entries.find((e) => e.mealType === mealType)
            if (!entry) return null
            const label = entry.recipeTitle || entry.freeText || "—"
            return (
              <div key={mealType} className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 w-20 shrink-0">
                  {t(MEAL_LABELS[mealType])}
                </span>
                <span className="text-sm font-medium truncate">{label}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">{t("emptyToday")}</p>
      )}

      <Link
        href="/recipes?tab=mealPlan"
        className="mt-5 flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors"
      >
        {t("openMealPlan")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  )
}
