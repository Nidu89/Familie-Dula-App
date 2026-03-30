import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { getRewardsOverviewAction } from "@/lib/actions/rewards"
import { RewardsOverview } from "@/components/rewards/rewards-overview"

export default async function RewardsPage() {
  const dashResult = await getDashboardDataAction()

  if ("error" in dashResult) {
    if (dashResult.error === "Nicht angemeldet.") redirect("/login")
    if (dashResult.error === "Du gehoerst keiner Familie an.")
      redirect("/onboarding")
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          Belohnungen konnten nicht geladen werden. Bitte Seite neu laden.
        </p>
      </main>
    )
  }

  const { role } = dashResult
  const isAdultOrAdmin = role === "admin" || role === "adult"

  // Load children with points
  const rewardsResult = await getRewardsOverviewAction()
  const initialChildren =
    "error" in rewardsResult ? [] : rewardsResult.children

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Belohnungen
        </h1>
        <p className="text-sm text-muted-foreground">
          Punktestand und Verlauf fuer alle Kinder
        </p>
      </div>

      <RewardsOverview
        initialChildren={initialChildren}
        isAdultOrAdmin={isAdultOrAdmin}
      />
    </main>
  )
}
