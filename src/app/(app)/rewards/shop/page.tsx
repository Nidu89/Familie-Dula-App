import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { getRewardShopAction } from "@/lib/actions/rewards"
import { RewardShop } from "@/components/rewards/reward-shop"

export default async function RewardShopPage() {
  const dashResult = await getDashboardDataAction()

  if ("error" in dashResult) {
    if (dashResult.error === "Nicht angemeldet.") redirect("/login")
    if (dashResult.error === "Du gehoerst keiner Familie an.")
      redirect("/onboarding")
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          Shop konnte nicht geladen werden. Bitte Seite neu laden.
        </p>
      </main>
    )
  }

  const { role } = dashResult
  const isAdultOrAdmin = role === "admin" || role === "adult"

  const shopResult = await getRewardShopAction()
  const shopRewards = "error" in shopResult ? [] : shopResult.rewards
  const shopBalance = "error" in shopResult ? 0 : shopResult.userBalance

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back link */}
      <Link
        href="/rewards"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zu Belohnungen
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Belohnungs-Shop
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle verfuegbaren Belohnungen im Ueberblick.
        </p>
      </div>

      <RewardShop
        initialRewards={shopRewards}
        initialBalance={shopBalance}
        isAdultOrAdmin={isAdultOrAdmin}
        maxVisible={0}
        showViewAll={false}
      />
    </main>
  )
}
