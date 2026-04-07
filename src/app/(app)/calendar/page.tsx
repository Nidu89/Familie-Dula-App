import { redirect } from "next/navigation"

import { getAppSession } from "@/lib/session"
import { getEventsForRangeAction } from "@/lib/actions/calendar"
import { getFamilyDataAction } from "@/lib/actions/family"
import { CalendarView } from "@/components/calendar/calendar-view"

export default async function CalendarPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const isAdultOrAdmin = session.role === "admin" || session.role === "adult"

  // Load events and family members in parallel
  const now = new Date()
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  const [eventsResult, familyResult] = await Promise.all([
    getEventsForRangeAction(rangeStart.toISOString(), rangeEnd.toISOString()),
    getFamilyDataAction(),
  ])

  const initialEvents = "error" in eventsResult ? [] : eventsResult.events
  const members =
    "error" in familyResult
      ? []
      : familyResult.members.map((m) => ({
          id: m.id,
          displayName: m.displayName,
        }))

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <CalendarView
        initialEvents={initialEvents}
        members={members}
        isAdultOrAdmin={isAdultOrAdmin}
        currentUserId={session.userId}
      />
    </main>
  )
}
