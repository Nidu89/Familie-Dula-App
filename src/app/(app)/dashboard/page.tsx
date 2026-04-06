"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import { useTranslations } from "next-intl"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import {
  CalendarWidget,
  CalendarWidgetSkeleton,
} from "@/components/dashboard/calendar-widget"
import {
  TasksWidget,
  TasksWidgetSkeleton,
} from "@/components/dashboard/tasks-widget"
import {
  RewardsWidget,
  RewardsWidgetSkeleton,
} from "@/components/dashboard/rewards-widget"
import { MealPlanWidget } from "@/components/dashboard/meal-plan-widget"
import { TimerWidget } from "@/components/dashboard/timer-widget"
import { RitualsWidget } from "@/components/dashboard/rituals-widget"
import { KidsView, KidsViewSkeleton } from "@/components/dashboard/kids-view"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardData {
  user: { id: string; displayName: string }
  family: { id: string; name: string }
  role: string
  memberCount: number
}

export default function DashboardPage() {
  const t = useTranslations("dashboard")
  const tc = useTranslations("common")
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    const result = await getDashboardDataAction()

    if ("error" in result) {
      if (result.error === "Nicht angemeldet." || result.error === "Not logged in.") {
        router.replace("/login")
        return
      }
      if (result.error === "Du gehoerst keiner Familie an." || result.error === "You do not belong to a family.") {
        router.replace("/onboarding")
        return
      }
      setError(result.error)
      setLoading(false)
      return
    }

    setData(result)
    setLoading(false)
  }, [router])

  useEffect(() => {
    startTransition(() => { void fetchDashboard() })
  }, [fetchDashboard])

  if (loading) {
    return (
      <main className="px-4 sm:px-6 md:px-10">
        <header className="mb-10 pt-6 md:pt-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-12 w-72" />
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-8 space-y-6">
            <CalendarWidgetSkeleton />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TasksWidgetSkeleton />
              <RewardsWidgetSkeleton />
            </div>
          </div>
          <div className="md:col-span-4 space-y-6">
            <Skeleton className="h-64 rounded-[2rem]" />
            <Skeleton className="h-64 rounded-[2rem]" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          {t("loadError")}
        </p>
      </main>
    )
  }

  const { user, family, role, memberCount } = data
  const isAdmin = role === "admin"
  const isChild = role === "child"

  return (
      <main className="px-4 sm:px-6 md:px-10">
        {/* Header */}
        <header className="mb-10 pt-6 md:pt-10">
          <DashboardHeader
            displayName={user.displayName}
            familyName={family.name}
            memberCount={memberCount}
          />
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left column -- 8 cols */}
          <div className="md:col-span-8 space-y-6">
            <CalendarWidget />

            {isChild && (
              <KidsView displayName={user.displayName} userId={user.id} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TasksWidget />
              <RewardsWidget isAdmin={isAdmin} currentUserId={user.id} />
            </div>

            {/* Family Highlight placeholder */}
            <section className="relative h-72 rounded-[2rem] overflow-hidden bg-muted flex items-end">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="relative p-8">
                <span className="mb-3 inline-block rounded-full bg-[#ffd5c2] px-4 py-1 text-[10px] font-black uppercase tracking-widest text-foreground">
                  {t("weeklyHighlight")}
                </span>
                <h3 className="font-display text-2xl font-bold text-white">
                  {t("familyMoments")}
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  {t("familyMomentsDescription")}
                </p>
              </div>
            </section>
          </div>

          {/* Right column -- 4 cols */}
          <div className="md:col-span-4 space-y-6">
            <TimerWidget familyId={family.id} isAdult={isAdmin || role === "adult"} />
            <RitualsWidget isAdult={isAdmin || role === "adult"} />
            <MealPlanWidget />

            {/* Shopping list placeholder */}
            <section className="rounded-[2rem] bg-card p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">
                  {t("shoppingList")}
                </h3>
                <ShoppingCart className="h-5 w-5 text-secondary" />
              </div>
              <div className="space-y-3">
                {["Hafermilch", "Parmesan", "Avocados"].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl bg-muted p-3"
                  >
                    <div className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
                    <span className="font-medium text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-6 w-full rounded-xl border-2 border-dashed border-border py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted"
              >
                {t("addItem")}
              </button>
            </section>

            {/* Quote bubble */}
            <div
              className="flex items-start gap-4 bg-primary/10 p-8 italic text-muted-foreground"
              style={{
                borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
              }}
            >
              <span className="mt-0.5 shrink-0 text-xl text-primary-foreground">
                &ldquo;
              </span>
              <p className="text-sm font-medium">
                {t("familyQuote")}
              </p>
            </div>
          </div>
        </div>
      </main>
  )
}
