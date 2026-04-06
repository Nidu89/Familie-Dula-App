import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { TimerPageClient } from "@/components/timer/timer-page-client"
import { TimerPageHeader } from "@/components/timer/timer-page-header"

export default async function TimerPage() {
  const result = await getDashboardDataAction()

  if ("error" in result) {
    if (result.error === "Nicht angemeldet.") redirect("/login")
    if (result.error === "Du gehoerst keiner Familie an.") redirect("/onboarding")
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <TimerPageHeader showError />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <TimerPageHeader />
      <TimerPageClient />
    </main>
  )
}
