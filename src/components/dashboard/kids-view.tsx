"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import { Star, ListChecks } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getTasksAction, type Task } from "@/lib/actions/tasks"
import { getRewardsOverviewAction, type ChildPointsSummary } from "@/lib/actions/rewards"

interface KidsViewProps {
  displayName: string
  userId: string
}

export function KidsView({ displayName, userId }: KidsViewProps) {
  const t = useTranslations("dashboard.kidsView")
  const tc = useTranslations("common")
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [tasksResult, rewardsResult] = await Promise.all([
      getTasksAction({ assignedTo: userId, status: "open" }),
      getRewardsOverviewAction(),
    ])

    if (!("error" in tasksResult)) {
      setMyTasks(tasksResult.tasks.filter((t) => t.status !== "done").slice(0, 3))
    }

    if (!("error" in rewardsResult)) {
      setPoints(
        rewardsResult.children.find((c: ChildPointsSummary) => c.id === userId)?.pointsBalance ?? 0
      )
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    startTransition(() => { void fetchData() })
  }, [fetchData])

  if (loading) return <KidsViewSkeleton />

  return (
    <Card className="border-0 bg-primary/8 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {t("hello", { displayName })}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("subtitle")}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" />
            {points} {tc("points")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Tasks summary */}
          <Link
            href="/tasks"
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("myTasks")}</p>
              <p className="text-xs text-muted-foreground">
                {myTasks.length > 0 ? t("openTasks", { count: myTasks.length }) : t("allDone")}
              </p>
            </div>
          </Link>

          {/* Points summary */}
          <Link
            href="/rewards"
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-4/20 text-chart-4">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("myPoints")}</p>
              <p className="text-xs text-muted-foreground">
                {points > 0
                  ? t("pointsCollected", { count: points })
                  : t("earnPointsHint")}
              </p>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function KidsViewSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </CardContent>
    </Card>
  )
}
