"use client"

import { useTranslations } from "next-intl"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { TasksWidget } from "@/components/dashboard/tasks-widget"
import { RewardsWidget } from "@/components/dashboard/rewards-widget"
import { MealPlanWidget } from "@/components/dashboard/meal-plan-widget"
import { ShoppingWidget } from "@/components/dashboard/shopping-widget"
import { TimerWidget } from "@/components/dashboard/timer-widget"
import { RitualsWidget } from "@/components/dashboard/rituals-widget"
import { KidsView } from "@/components/dashboard/kids-view"
import { DashboardQuote } from "@/components/dashboard/dashboard-quote"

interface DashboardContentProps {
  user: { id: string; displayName: string }
  family: { id: string; name: string }
  role: string
  memberCount: number
}

export function DashboardContent({
  user,
  family,
  role,
  memberCount,
}: DashboardContentProps) {
  const t = useTranslations("dashboard")
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left column -- 8 cols */}
        <div className="lg:col-span-8 space-y-6">
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
        <div className="lg:col-span-4 space-y-6">
          <TimerWidget
            familyId={family.id}
            isAdult={isAdmin || role === "adult"}
          />
          <RitualsWidget isAdult={isAdmin || role === "adult"} />
          <MealPlanWidget />
          <ShoppingWidget />
          <DashboardQuote familyId={family.id} isAdmin={isAdmin} />
        </div>
      </div>
    </main>
  )
}
