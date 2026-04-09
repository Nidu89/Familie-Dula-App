import { redirect } from "next/navigation"
import { getAppSession } from "@/lib/session"
import { CalendarIntegrationsClient } from "@/components/calendar/calendar-integrations-client"

export default async function CalendarIntegrationsPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  return <CalendarIntegrationsClient />
}
