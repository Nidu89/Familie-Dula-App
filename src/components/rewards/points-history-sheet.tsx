"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Star, CheckCircle2, PenLine, Gift, Target } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  getPointsHistoryAction,
  type PointsTransaction,
} from "@/lib/actions/rewards"
import { useToast } from "@/hooks/use-toast"

interface PointsHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  childId: string | null
  childName: string
  currentBalance?: number
}

const TYPE_CONFIG = {
  task_completion: {
    labelKey: "taskCompleted" as const,
    icon: CheckCircle2,
    className: "text-chart-3",
  },
  manual_add: {
    labelKey: "manualAdd" as const,
    icon: PenLine,
    className: "text-primary",
  },
  manual_deduct: {
    labelKey: "manualSub" as const,
    icon: PenLine,
    className: "text-destructive",
  },
  reward_redemption: {
    labelKey: "rewardRedeemed" as const,
    icon: Gift,
    className: "text-secondary",
  },
  goal_contribution: {
    labelKey: "goalContribution" as const,
    icon: Target,
    className: "text-secondary",
  },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PointsHistorySheet({
  open,
  onOpenChange,
  childId,
  childName,
  currentBalance,
}: PointsHistorySheetProps) {
  const { toast } = useToast()
  const t = useTranslations("rewards.history")
  const tc = useTranslations("common")
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchHistory = useCallback(async () => {
    if (!childId) return
    setIsLoading(true)
    try {
      const result = await getPointsHistoryAction(childId)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setTransactions(result.transactions)
    } catch {
      toast({
        title: tc("error"),
        description: t("history.loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [childId, toast, tc, t])

  useEffect(() => {
    if (open && childId) {
      fetchHistory()
    }
  }, [open, childId, fetchHistory])

  // Compute running balance for each transaction (newest first)
  // runningBalances[0] = currentBalance, runningBalances[i] = balance after tx[i]
  const runningBalances = useMemo(() => {
    if (currentBalance == null || transactions.length === 0) return []
    const balances: number[] = new Array(transactions.length)
    balances[0] = currentBalance
    for (let i = 1; i < transactions.length; i++) {
      balances[i] = balances[i - 1] - transactions[i - 1].amount
    }
    return balances
  }, [currentBalance, transactions])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("title", { childName })}</SheetTitle>
          <SheetDescription>
            {t("description", { childName })}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Star className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("empty")}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx, index) => {
                const config = TYPE_CONFIG[tx.type]
                const Icon = config.icon
                const isPositive = tx.amount > 0
                const runningBalance = runningBalances[index]

                return (
                  <div key={tx.id}>
                    <div className="flex items-start gap-3 py-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${config.className}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {tx.taskTitle || t(config.labelKey)}
                          </p>
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-xs font-semibold ${isPositive ? "border-chart-3/30 text-chart-3" : "border-destructive/30 text-destructive"}`}
                            >
                              {isPositive ? "+" : ""}
                              {tx.amount}
                            </Badge>
                            {runningBalance != null && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {t("balance", { balance: runningBalance })}
                              </span>
                            )}
                          </div>
                        </div>
                        {tx.comment && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {tx.comment}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{formatDate(tx.createdAt)}</span>
                          {tx.createdByName && (
                            <span>von {tx.createdByName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
