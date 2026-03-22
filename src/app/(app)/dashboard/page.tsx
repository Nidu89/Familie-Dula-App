import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { TasksWidget } from "@/components/dashboard/tasks-widget"
import { MealPlanWidget } from "@/components/dashboard/meal-plan-widget"
import { ChatWidget } from "@/components/dashboard/chat-widget"
import { KidsView } from "@/components/dashboard/kids-view"
import { Separator } from "@/components/ui/separator"

export default async function DashboardPage() {
  const result = await getDashboardDataAction()

  if ("error" in result) {
    if (result.error === "Nicht angemeldet.") {
      redirect("/login")
    }
    if (result.error === "Du gehoerst keiner Familie an.") {
      redirect("/onboarding")
    }
    // Unexpected error (network, DB) – render inline instead of redirect
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
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <DashboardHeader
        displayName={user.displayName}
        familyName={family.name}
        isAdmin={isAdmin}
      />

      <Separator className="my-6" />

      {/* Quick Actions */}
      <section aria-label="Schnellzugriff" className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Schnellzugriff
        </h2>
        <QuickActions />
      </section>

      {/* Kids View (only for children) */}
      {isChild && (
        <section aria-label="Mein Bereich" className="mb-6">
          <KidsView displayName={user.displayName} />
        </section>
      )}

      {/* Widget Grid */}
      <section aria-label="Familienuebersicht">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {isChild ? "Familienuebersicht" : "Dein Tag auf einen Blick"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CalendarWidget />
          <TasksWidget />
          <MealPlanWidget />
          <ChatWidget />
        </div>
      </section>
    </main>
  )
}
