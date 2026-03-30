import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ShoppingCart } from "lucide-react"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopBar } from "@/components/layout/app-top-bar"
import { BottomNav } from "@/components/layout/bottom-nav"
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
import { KidsView, KidsViewSkeleton } from "@/components/dashboard/kids-view"

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

  const { user, family, role, memberCount } = result
  const isAdmin = role === "admin"
  const isChild = role === "child"

  return (
    <>
      <AppSidebar
        familyName={family.name}
        displayName={user.displayName}
        isAdmin={isAdmin}
      />
      <AppTopBar
        displayName={user.displayName}
        familyName={family.name}
        isAdmin={isAdmin}
      />

      <main className="md:ml-72 pt-20 pb-24 md:pb-8 px-4 sm:px-6 md:px-10">
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
          {/* Left column — 8 cols */}
          <div className="md:col-span-8 space-y-6">
            <Suspense fallback={<CalendarWidgetSkeleton />}>
              <CalendarWidget />
            </Suspense>

            {isChild && (
              <Suspense fallback={<KidsViewSkeleton />}>
                <KidsView displayName={user.displayName} userId={user.id} />
              </Suspense>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Suspense fallback={<TasksWidgetSkeleton />}>
                <TasksWidget />
              </Suspense>
              <Suspense fallback={<RewardsWidgetSkeleton />}>
                <RewardsWidget isAdmin={isAdmin} currentUserId={user.id} />
              </Suspense>
            </div>

            {/* Family Highlight placeholder */}
            <section className="relative h-72 rounded-[2rem] overflow-hidden bg-muted flex items-end">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="relative p-8">
                <span className="mb-3 inline-block rounded-full bg-[#ffd5c2] px-4 py-1 text-[10px] font-black uppercase tracking-widest text-foreground">
                  Woechentliches Highlight
                </span>
                <h3 className="font-display text-2xl font-bold text-white">
                  Familienmomente
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  Haltet besondere Erlebnisse fest — kommt bald.
                </p>
              </div>
            </section>
          </div>

          {/* Right column — 4 cols */}
          <div className="md:col-span-4 space-y-6">
            <MealPlanWidget />

            {/* Shopping list placeholder */}
            <section className="rounded-[2rem] bg-card p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">
                  Einkaufsliste
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
                + Hinzufuegen
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
                Familie ist nicht das Wichtigste. Es ist alles. – Michael J.
                Fox
              </p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  )
}
