import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { getAppSession } from "@/lib/session"
import { getRewardShopAction } from "@/lib/actions/rewards"
import { RewardShop } from "@/components/rewards/reward-shop"

export default async function RewardShopPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const isAdultOrAdmin = session.role === "admin" || session.role === "adult"

  const shopResult = await getRewardShopAction()
  const shopRewards = "error" in shopResult ? [] : shopResult.rewards
  const shopBalance = "error" in shopResult ? 0 : shopResult.userBalance

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
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
