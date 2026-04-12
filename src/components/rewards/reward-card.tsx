"use client"

import { useState } from "react"
import { Gift, Lock, Pencil } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { redeemRewardAction, type Reward } from "@/lib/actions/rewards"

interface RewardCardProps {
  reward: Reward
  userBalance: number
  isAdultOrAdmin: boolean
  onRedeem: () => void
  onEdit?: (reward: Reward) => void
}

export function RewardCard({
  reward,
  userBalance,
  isAdultOrAdmin,
  onRedeem,
  onEdit,
}: RewardCardProps) {
  const t = useTranslations("rewards.rewardCard")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [isRedeeming, setIsRedeeming] = useState(false)
  const canAfford = userBalance >= reward.pointsCost
  const pointsNeeded = reward.pointsCost - userBalance

  async function handleRedeem() {
    setIsRedeeming(true)
    try {
      const result = await redeemRewardAction(reward.id)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: t("redeemed"),
        description: t("redeemedDescription", { title: result.rewardTitle, spent: result.pointsSpent, balance: result.newBalance, ptsLabel: tc("pts") }),
      })
      onRedeem()
    } catch {
      toast({
        title: tc("error"),
        description: t("redeemError"),
        variant: "destructive",
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  // Determine icon container color based on cost range
  const iconBg =
    reward.pointsCost <= 100
      ? "bg-primary/15"
      : reward.pointsCost <= 500
        ? "bg-accent"
        : "bg-tertiary-container"

  const isDeactivated = !reward.isActive

  return (
    <div className={`group relative flex flex-col rounded-[2rem] bg-card p-5 shadow-[0_0_3rem_rgba(42,47,50,0.06)] transition-transform hover:-translate-y-2 ${isDeactivated ? "opacity-50" : ""}`}>
      {/* Deactivated badge for parents */}
      {isDeactivated && isAdultOrAdmin && (
        <span className="absolute left-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {t("disabled")}
        </span>
      )}
      {/* Edit button for parents */}
      {isAdultOrAdmin && onEdit && (
        <button
          type="button"
          onClick={() => onEdit(reward)}
          className="absolute right-3 top-3 rounded-full p-2.5 text-muted-foreground opacity-100 md:opacity-0 transition-opacity hover:bg-muted md:group-hover:opacity-100"
          aria-label={t("editAria", { title: reward.title })}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Icon */}
      <div
        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl text-3xl ${iconBg}`}
        aria-hidden="true"
      >
        {reward.iconEmoji || <Gift className="h-7 w-7 text-muted-foreground" />}
      </div>

      {/* Title + Description */}
      <h3 className="font-display text-sm font-bold leading-tight">
        {reward.title}
      </h3>
      {reward.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {reward.description}
        </p>
      )}

      {/* Points chip */}
      <div className="mt-auto pt-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          {reward.pointsCost} {tc("pts")}
        </span>
      </div>

      {/* Redeem button (visible for all, hidden for deactivated) */}
      {!isDeactivated && (
        <div className="mt-3">
          {canAfford ? (
            <Button
              size="sm"
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleRedeem}
              disabled={isRedeeming}
            >
              {isRedeeming ? t("redeeming") : t("redeem")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-full opacity-60"
              disabled
            >
              <Lock className="mr-1.5 h-3 w-3" />
              {t("pointsNeeded", { points: pointsNeeded })}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
