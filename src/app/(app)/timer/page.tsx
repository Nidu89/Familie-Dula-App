import { redirect } from "next/navigation"

import { getAppSession } from "@/lib/session"
import { TimerPageClient } from "@/components/timer/timer-page-client"
import { TimerPageHeader } from "@/components/timer/timer-page-header"

export default async function TimerPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <TimerPageHeader />
      <TimerPageClient />
    </main>
  )
}
