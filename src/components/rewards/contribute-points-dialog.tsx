"use client"

import { useState } from "react"
import { Rocket } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { contributeToGoalAction } from "@/lib/actions/rewards"

interface ContributePointsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalId: string
  goalTitle: string
  userBalance: number
  onSuccess: (newBalance: number) => void
}

export function ContributePointsDialog({
  open,
  onOpenChange,
  goalId,
  goalTitle,
  userBalance,
  onSuccess,
}: ContributePointsDialogProps) {
  const t = useTranslations("rewards.contributeDialog")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [amount, setAmount] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Clamp max contribution to user's balance
  const maxAmount = Math.max(1, userBalance)
  const effectiveAmount = Math.min(amount, maxAmount)

  async function handleSubmit() {
    if (effectiveAmount < 1 || userBalance < 1) return
    setIsSubmitting(true)
    try {
      const result = await contributeToGoalAction(goalId, effectiveAmount)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }

      if (result.goalCompleted) {
        toast({
          title: t("goalReached"),
          description: t("goalReachedDescription", { goalTitle }),
        })
      } else {
        toast({
          title: t("success"),
          description: t("successDescription", { balance: result.newBalance }),
        })
      }

      onOpenChange(false)
      setAmount(1)
      onSuccess(result.newBalance)
    } catch {
      toast({
        title: tc("error"),
        description: t("error"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { goalTitle })}
          </DialogDescription>
        </DialogHeader>

        {userBalance === 0 ? (
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t("noPoints")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current balance */}
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">{t("balance")}</p>
              <p className="text-2xl font-bold">{userBalance} {tc("points")}</p>
            </div>

            {/* Amount selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="contribute-amount"
                  className="text-sm font-medium"
                >
                  {t("amountLabel")}
                </label>
                <Input
                  id="contribute-amount"
                  type="number"
                  min={1}
                  max={maxAmount}
                  value={effectiveAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setAmount(Math.max(1, Math.min(val, maxAmount)))
                  }}
                  className="w-24 text-center"
                />
              </div>
              <Slider
                value={[effectiveAmount]}
                onValueChange={(vals) => setAmount(vals[0])}
                min={1}
                max={maxAmount}
                step={1}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1</span>
                <span>{maxAmount}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-accent/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                {t("remainingBalance")}
              </p>
              <p className="text-xl font-bold">
                {userBalance - effectiveAmount} {tc("points")}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || userBalance === 0}
            className="gap-1.5"
          >
            <Rocket className="h-3.5 w-3.5" />
            {isSubmitting ? t("submitLoading") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
