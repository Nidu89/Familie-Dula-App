import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { TasksWidget } from "@/components/dashboard/tasks-widget"
import { MealPlanWidget } from "@/components/dashboard/meal-plan-widget"
import { ChatWidget } from "@/components/dashboard/chat-widget"
import { RewardsWidget } from "@/components/dashboard/rewards-widget"
import { KidsView } from "@/components/dashboard/kids-view"

export default async function DashboardPage() {
  const result = await getDashboardDataAction()

  if ("error" in result) {
    if (result.error === "Nicht angemeldet.") {
      redirect("/login")
    }
    if (result.error === "Du gehoerst keiner Familie an.") {
      redirect("/onboarding")
    }
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          Dashboard konnte nicht geladen werden. Bitte Seite neu laden.
        </p>
      </main>
    )
  }

  const { user, family, role } = result
  const isAdmin = role === "admin"
  const isChild = role === "child"

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <DashboardHeader
        displayName={user.displayName}
        familyName={family.name}
        isAdmin={isAdmin}
      />

      {/* Quick Actions */}
      <section aria-label="Schnellzugriff" className="mt-8">
        <QuickActions />
      </section>

      {/* Kids View (only for children) */}
      {isChild && (
        <section aria-label="Mein Bereich" className="mt-6">
          <KidsView displayName={user.displayName} userId={user.id} />
        </section>
      )}

      {/* Widget Grid */}
      <section aria-label="Familienübersicht" className="mt-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isChild ? "Familienübersicht" : "Dein Tag auf einen Blick"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <CalendarWidget />
          <TasksWidget />
          <RewardsWidget isAdmin={isAdmin} currentUserId={user.id} />
          <MealPlanWidget />
          <ChatWidget />
        </div>
      </section>
    </main>
  )
}
