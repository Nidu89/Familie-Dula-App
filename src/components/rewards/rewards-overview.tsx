"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Star } from "lucide-react"

import { ChildPointCard } from "@/components/rewards/child-point-card"
import dynamic from "next/dynamic"

const PointsHistorySheet = dynamic(() =>
  import("@/components/rewards/points-history-sheet").then((m) => m.PointsHistorySheet)
)
const ManualPointsDialog = dynamic(() =>
  import("@/components/rewards/manual-points-dialog").then((m) => m.ManualPointsDialog)
)
import {
  getRewardsOverviewAction,
  type ChildPointsSummary,
} from "@/lib/actions/rewards"
import { useToast } from "@/hooks/use-toast"

interface RewardsOverviewProps {
  initialChildren: ChildPointsSummary[]
  isAdultOrAdmin: boolean
}

export function RewardsOverview({
  initialChildren,
  isAdultOrAdmin,
}: RewardsOverviewProps) {
  const { toast } = useToast()
  const t = useTranslations("rewards")
  const tc = useTranslations("common")
  const [children, setChildren] = useState<ChildPointsSummary[]>(initialChildren)

  // History sheet state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyChildId, setHistoryChildId] = useState<string | null>(null)
  const [historyChildName, setHistoryChildName] = useState("")

  // Manual points dialog state
  const [manualOpen, setManualOpen] = useState(false)
  const [manualChildId, setManualChildId] = useState<string | null>(null)
  const [manualChildName, setManualChildName] = useState("")
  const [manualChildBalance, setManualChildBalance] = useState(0)

  const refreshChildren = useCallback(async () => {
    try {
      const result = await getRewardsOverviewAction()
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setChildren(result.children)
    } catch {
      toast({
        title: tc("error"),
        description: t("refreshError"),
        variant: "destructive",
      })
    }
  }, [toast, tc, t])

  // History balance state
  const [historyBalance, setHistoryBalance] = useState(0)

  function handleShowHistory(childId: string) {
    const child = children.find((c) => c.id === childId)
    setHistoryChildId(childId)
    setHistoryChildName(child?.displayName || t("childFallback"))
    setHistoryBalance(child?.pointsBalance || 0)
    setHistoryOpen(true)
  }

  function handleManualPoints(childId: string) {
    const child = children.find((c) => c.id === childId)
    setManualChildId(childId)
    setManualChildName(child?.displayName || t("childFallback"))
    setManualChildBalance(child?.pointsBalance || 0)
    setManualOpen(true)
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Star className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-muted-foreground">
            {t("overview.noChildren")}
          </p>
          <p className="text-sm text-muted-foreground/70">
            {t("overview.noChildrenDescription")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <ChildPointCard
            key={child.id}
            child={child}
            isAdultOrAdmin={isAdultOrAdmin}
            onShowHistory={handleShowHistory}
            onManualPoints={handleManualPoints}
          />
        ))}
      </div>

      <PointsHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        childId={historyChildId}
        childName={historyChildName}
        currentBalance={historyBalance}
      />

      <ManualPointsDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        childId={manualChildId}
        childName={manualChildName}
        currentBalance={manualChildBalance}
        onSuccess={refreshChildren}
      />
    </div>
  )
}
