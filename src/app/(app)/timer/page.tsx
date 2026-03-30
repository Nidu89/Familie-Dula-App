import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { TimerPageClient } from "@/components/timer/timer-page-client"

export default async function TimerPage() {
  const result = await getDashboardDataAction()

  if ("error" in result) {
    if (result.error === "Nicht angemeldet.") redirect("/login")
    if (result.error === "Du gehoerst keiner Familie an.") redirect("/onboarding")
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          Timer konnte nicht geladen werden. Bitte Seite neu laden.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Familien-Timer
        </h1>
        <p className="text-sm text-muted-foreground">
          Countdown-Timer fuer die ganze Familie
        </p>
      </div>

      <TimerPageClient />
    </main>
  )
}
