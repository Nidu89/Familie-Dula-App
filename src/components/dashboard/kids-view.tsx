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
import { Skeleton } from "@/components/ui/skeleton"
import { getTasksAction } from "@/lib/actions/tasks"
import { getRewardsOverviewAction, type ChildPointsSummary } from "@/lib/actions/rewards"

interface KidsViewProps {
  displayName: string
  userId: string
}

export async function KidsView({ displayName, userId }: KidsViewProps) {
  const [tasksResult, rewardsResult] = await Promise.all([
    getTasksAction({ assignedTo: userId, status: "open" }),
    getRewardsOverviewAction(),
  ])

  const myTasks = !("error" in tasksResult)
    ? tasksResult.tasks.filter((t) => t.status !== "done").slice(0, 3)
    : []

  const points = !("error" in rewardsResult)
    ? (rewardsResult.children.find((c: ChildPointsSummary) => c.id === userId)?.pointsBalance ?? 0)
    : 0

  return (
    <Card className="border-0 bg-primary/8 shadow-sm">
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
            {points} Punkte
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
              <p className="text-sm font-medium">Meine Aufgaben</p>
              <p className="text-xs text-muted-foreground">
                {myTasks.length > 0 ? `${myTasks.length} offen` : "Alles erledigt!"}
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
              <p className="text-sm font-medium">Meine Punkte</p>
              <p className="text-xs text-muted-foreground">
                {points > 0
                  ? `${points} Punkte gesammelt`
                  : "Erledige Aufgaben, um Punkte zu sammeln!"}
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
