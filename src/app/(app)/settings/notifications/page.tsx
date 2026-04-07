import { redirect } from "next/navigation"
import { getAppSession } from "@/lib/session"
import { NotificationSettingsClient } from "@/components/notifications/notification-settings-client"

export default async function NotificationSettingsPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  return <NotificationSettingsClient />
}
