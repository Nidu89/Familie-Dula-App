import { redirect } from "next/navigation"
import { getAppSession } from "@/lib/session"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const session = await getAppSession()

  if (!session) redirect("/login")

  return (
    <DashboardContent
      user={{ id: session.userId, displayName: session.displayName }}
      family={{ id: session.familyId, name: session.familyName }}
      role={session.role}
      memberCount={session.memberCount}
    />
  )
}
