import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { getEventsForRangeAction } from "@/lib/actions/calendar"
import { getFamilyDataAction } from "@/lib/actions/family"
import { CalendarView } from "@/components/calendar/calendar-view"

export default async function CalendarPage() {
  const dashResult = await getDashboardDataAction()

  if ("error" in dashResult) {
    if (dashResult.error === "Nicht angemeldet.") redirect("/login")
    if (dashResult.error === "Du gehoerst keiner Familie an.")
      redirect("/onboarding")
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          Kalender konnte nicht geladen werden. Bitte Seite neu laden.
        </p>
      </main>
    )
  }

  const { role } = dashResult
  const isAdultOrAdmin = role === "admin" || role === "adult"

  // Load initial events for current month range
  const now = new Date()
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  const eventsResult = await getEventsForRangeAction(
    rangeStart.toISOString(),
    rangeEnd.toISOString()
  )

  const initialEvents = "error" in eventsResult ? [] : eventsResult.events

  // Load family members for filters and participant selection
  const familyResult = await getFamilyDataAction()
  const members =
    "error" in familyResult
      ? []
      : familyResult.members.map((m) => ({
          id: m.id,
          displayName: m.displayName,
        }))

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Familienkalender
        </h1>
        <p className="text-sm text-muted-foreground">
          Alle Termine der Familie auf einen Blick
        </p>
      </div>

      <CalendarView
        initialEvents={initialEvents}
        members={members}
        isAdultOrAdmin={isAdultOrAdmin}
        currentUserId={dashResult.user.id}
      />
    </main>
  )
}
