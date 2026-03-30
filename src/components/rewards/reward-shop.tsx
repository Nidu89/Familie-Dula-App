"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Plus, Gift, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RewardCard } from "@/components/rewards/reward-card"
import { RewardFormDialog } from "@/components/rewards/reward-form-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getRewardShopAction,
  type Reward,
} from "@/lib/actions/rewards"

interface RewardShopProps {
  initialRewards: Reward[]
  initialBalance: number
  isAdultOrAdmin: boolean
  /** Show max N rewards (default: 6). Pass 0 for unlimited. */
  maxVisible?: number
  /** Show "Alle anzeigen" link */
  showViewAll?: boolean
}

export function RewardShop({
  initialRewards,
  initialBalance,
  isAdultOrAdmin,
  maxVisible = 6,
  showViewAll = true,
}: RewardShopProps) {
  const { toast } = useToast()
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [userBalance, setUserBalance] = useState(initialBalance)
  const [formOpen, setFormOpen] = useState(false)
  const [editReward, setEditReward] = useState<Reward | null>(null)

  const refreshShop = useCallback(async () => {
    try {
      const result = await getRewardShopAction()
      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setRewards(result.rewards)
      setUserBalance(result.userBalance)
    } catch {
      toast({
        title: "Fehler",
        description: "Shop konnte nicht aktualisiert werden.",
        variant: "destructive",
      })
    }
  }, [toast])

  function handleEdit(reward: Reward) {
    setEditReward(reward)
    setFormOpen(true)
  }

  function handleAdd() {
    setEditReward(null)
    setFormOpen(true)
  }

  const visibleRewards =
    maxVisible > 0 ? rewards.slice(0, maxVisible) : rewards
  const hasMore = maxVisible > 0 && rewards.length > maxVisible

  return (
    <section aria-label="Belohnungs-Shop">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-xl font-bold">Deine Belohnungen</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Shop
          </span>
        </div>
        {isAdultOrAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-full"
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            Neue Belohnung
          </Button>
        )}
      </div>

      {rewards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-card py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Gift className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Noch keine Belohnungen vorhanden.
          </p>
          {isAdultOrAdmin && (
            <Button
              size="sm"
              className="mt-2 rounded-full"
              onClick={handleAdd}
            >
              Erste Belohnung erstellen
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userBalance={userBalance}
                isAdultOrAdmin={isAdultOrAdmin}
                onRedeem={refreshShop}
                onEdit={isAdultOrAdmin ? handleEdit : undefined}
              />
            ))}
          </div>

          {showViewAll && hasMore && (
            <div className="mt-4 text-center">
              <Link
                href="/rewards/shop"
                className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"
              >
                Alle anzeigen
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </>
      )}

      <RewardFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editReward={editReward}
        onSuccess={refreshShop}
      />
    </section>
  )
}

export function RewardShopSkeleton() {
  return (
    <section aria-label="Belohnungs-Shop wird geladen">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </section>
  )
}
