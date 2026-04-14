"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import {
  ShoppingCart,
  PiggyBank,
  Heart,
  Sparkles,
  Star,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  allocatePointsToJarsAction,
  type SavingsJar,
} from "@/lib/actions/rewards"
import { useErrorTranslation } from "@/lib/use-error-translation"

interface AllocatePointsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pointsToAllocate: number
  jars: SavingsJar[]
  onSuccess: () => void
  sourceType?: "task" | "manual"
  sourceId?: string | null
}

const JAR_TYPE_ICONS = {
  spend: ShoppingCart,
  save: PiggyBank,
  donate: Heart,
  custom: Sparkles,
}

export function AllocatePointsDialog({
  open,
  onOpenChange,
  pointsToAllocate,
  jars,
  onSuccess,
  sourceType = "manual",
  sourceId = null,
}: AllocatePointsDialogProps) {
  const t = useTranslations("rewards.allocate")
  const tj = useTranslations("rewards.jars")
  const tc = useTranslations("common")
  const te = useErrorTranslation()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Allocations state: jarId -> amount
  const [allocations, setAllocations] = useState<Record<string, number>>({})

  // Reset allocations when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset allocations
      const initial: Record<string, number> = {}
      for (const jar of jars) {
        initial[jar.id] = 0
      }
      setAllocations(initial)
    }
    onOpenChange(newOpen)
  }

  const totalAllocated = useMemo(
    () => Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0),
    [allocations]
  )

  const remaining = pointsToAllocate - totalAllocated

  function setAllocation(jarId: string, amount: number) {
    const clamped = Math.max(0, Math.min(amount, pointsToAllocate))
    setAllocations((prev) => {
      const next = { ...prev, [jarId]: clamped }
      // Ensure total doesn't exceed available
      const total = Object.values(next).reduce((sum, val) => sum + (val || 0), 0)
      if (total > pointsToAllocate) {
        // Reduce the current allocation to fit
        const overshoot = total - pointsToAllocate
        next[jarId] = Math.max(0, clamped - overshoot)
      }
      return next
    })
  }

  async function handleSubmit() {
    if (totalAllocated === 0) {
      // Dismiss without allocating
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    try {
      const allocationList = Object.entries(allocations)
        .filter(([, amount]) => amount > 0)
        .map(([jarId, amount]) => ({ jarId, amount }))

      const result = await allocatePointsToJarsAction(allocationList, sourceType, sourceId)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: te(result.error),
          variant: "destructive",
        })
        return
      }

      toast({
        title: t("success"),
        description: t("successDescription", { points: totalAllocated }),
      })

      onOpenChange(false)
      onSuccess()
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

  if (jars.length === 0 || pointsToAllocate <= 0) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description", { points: pointsToAllocate })}
          </DialogDescription>
        </DialogHeader>

        {/* Points summary */}
        <div className="rounded-xl bg-primary/10 p-4 text-center">
          <p className="text-xs text-primary-foreground/70 mb-1">
            {t("available")}
          </p>
          <p className="text-3xl font-bold text-primary-foreground">
            {pointsToAllocate}
          </p>
        </div>

        {/* Allocation sliders per jar */}
        <div className="space-y-4 max-h-[40vh] overflow-y-auto py-2">
          {jars.map((jar) => {
            const Icon = JAR_TYPE_ICONS[jar.jarType] || Sparkles
            const allocated = allocations[jar.id] || 0

            return (
              <div key={jar.id} className="space-y-2 rounded-xl bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{jar.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      min={0}
                      max={pointsToAllocate}
                      value={allocated}
                      onChange={(e) =>
                        setAllocation(
                          jar.id,
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      className="h-8 w-20 text-center text-sm"
                      aria-label={t("amountFor", { jarName: jar.name })}
                    />
                  </div>
                </div>
                <Slider
                  value={[allocated]}
                  onValueChange={([val]) => setAllocation(jar.id, val)}
                  max={pointsToAllocate}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {tj("type." + jar.jarType)}: {jar.currentAmount}{jar.targetAmount > 0 ? ` / ${jar.targetAmount}` : ""}
                  </span>
                  <span>+{allocated}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary bar */}
        <div className="space-y-2 rounded-xl bg-card p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("allocated")}</span>
            <span className="font-bold">
              {totalAllocated} / {pointsToAllocate}
            </span>
          </div>
          <Progress
            value={(totalAllocated / pointsToAllocate) * 100}
            className="h-2"
          />
          {remaining > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {t("remainingUnallocated", { points: remaining })}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("later")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || totalAllocated === 0}
          >
            {isSubmitting ? t("submitting") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
