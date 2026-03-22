"use client"

import { Star, History, PlusCircle } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { ChildPointsSummary } from "@/lib/actions/rewards"

interface ChildPointCardProps {
  child: ChildPointsSummary
  isAdultOrAdmin: boolean
  onShowHistory: (childId: string) => void
  onManualPoints: (childId: string) => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ChildPointCard({
  child,
  isAdultOrAdmin,
  onShowHistory,
  onManualPoints,
}: ChildPointCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials(child.displayName)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-base">{child.displayName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        {/* Points Display */}
        <div className="flex items-center justify-center gap-2 rounded-lg bg-chart-4/10 py-4">
          <Star className="h-6 w-6 text-chart-4" />
          <span className="text-3xl font-bold text-chart-4">
            {child.pointsBalance}
          </span>
          <span className="text-sm text-chart-4/70">Punkte</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onShowHistory(child.id)}
          >
            <History className="h-3.5 w-3.5" />
            Verlauf
          </Button>
          {isAdultOrAdmin && (
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onManualPoints(child.id)}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Punkte
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
