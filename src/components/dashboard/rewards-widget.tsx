"use client"

import { useState, useEffect } from "react"
import { Star, ChevronRight, Trophy } from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getRewardsOverviewAction,
  type ChildPointsSummary,
} from "@/lib/actions/rewards"

function getLevel(points: number): { level: number; name: string; next: number } {
  if (points < 100) return { level: 1, name: "Starter", next: 100 }
  if (points < 250) return { level: 2, name: "Entdecker", next: 250 }
  if (points < 500) return { level: 3, name: "Abenteurer", next: 500 }
  if (points < 1000) return { level: 4, name: "Profi", next: 1000 }
  return { level: 5, name: "Meister", next: 1000 }
}

interface RewardsWidgetProps {
  isAdmin: boolean
  currentUserId: string
}

export function RewardsWidget({ isAdmin, currentUserId }: RewardsWidgetProps) {
  const [children, setChildren] = useState<ChildPointsSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await getRewardsOverviewAction()
        if (!("error" in result)) {
          setChildren(result.children)
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // For children: show only own points
  const displayChildren = isAdmin
    ? children
    : children.filter((c) => c.id === currentUserId)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Belohnungen</CardTitle>
              <CardDescription className="text-xs">
                {isAdmin ? "Punkte der Kinder" : "Deine Punkte"}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/rewards" className="gap-1 text-xs">
              Alle
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : displayChildren.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Star className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Noch keine Kinder in der Familie" : "Noch keine Punkte gesammelt"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayChildren.map((child) => {
              const { name: levelName, next } = getLevel(child.pointsBalance)
              const prevThreshold =
                child.pointsBalance < 100 ? 0
                : child.pointsBalance < 250 ? 100
                : child.pointsBalance < 500 ? 250
                : child.pointsBalance < 1000 ? 500
                : 1000
              const progress = Math.min(
                ((child.pointsBalance - prevThreshold) / (next - prevThreshold)) * 100,
                100
              )

              return (
                <div
                  key={child.id}
                  className="rounded-lg bg-muted/50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{child.displayName}</p>
                    <span className="flex items-center gap-1 text-sm font-semibold text-accent-foreground">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      {child.pointsBalance}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">
                      Level: {levelName} &middot; noch{" "}
                      {Math.max(next - child.pointsBalance, 0)} Punkte bis zum nächsten Level
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
