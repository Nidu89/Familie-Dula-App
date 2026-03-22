"use client"

import { useState, useEffect } from "react"
import { Star, ListChecks } from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTasksAction, type Task } from "@/lib/actions/tasks"
import { getRewardsOverviewAction, type ChildPointsSummary } from "@/lib/actions/rewards"

interface KidsViewProps {
  displayName: string
  userId: string
}

export function KidsView({ displayName, userId }: KidsViewProps) {
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [points, setPoints] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [tasksResult, rewardsResult] = await Promise.all([
          getTasksAction({ assignedTo: userId, status: "open" }),
          getRewardsOverviewAction(),
        ])

        if (!("error" in tasksResult)) {
          setMyTasks(tasksResult.tasks.filter((t) => t.status !== "done").slice(0, 3))
        }

        if (!("error" in rewardsResult)) {
          const me = rewardsResult.children.find((c: ChildPointsSummary) => c.id === userId)
          if (me) setPoints(me.pointsBalance)
        }
      } catch {
        // Silent fail for dashboard widget
      } finally {
        setLoaded(true)
      }
    }
    load()
  }, [userId])

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Hallo, {displayName}!
            </CardTitle>
            <CardDescription className="text-xs">
              Deine persoenliche Uebersicht
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" />
            {loaded ? `${points} Punkte` : "..."}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Tasks summary */}
          <Link
            href="/tasks"
            className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Meine Aufgaben</p>
              <p className="text-xs text-muted-foreground">
                {loaded
                  ? myTasks.length > 0
                    ? `${myTasks.length} offen`
                    : "Alles erledigt!"
                  : "Laden..."}
              </p>
            </div>
          </Link>

          {/* Points summary */}
          <Link
            href="/rewards"
            className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-4/20 text-chart-4">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Meine Punkte</p>
              <p className="text-xs text-muted-foreground">
                {loaded
                  ? points > 0
                    ? `${points} Punkte gesammelt`
                    : "Erledige Aufgaben, um Punkte zu sammeln!"
                  : "Laden..."}
              </p>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
