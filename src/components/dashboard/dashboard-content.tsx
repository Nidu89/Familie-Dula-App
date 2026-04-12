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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
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

{/* Familienmomente — planned feature, placeholder removed */}
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
