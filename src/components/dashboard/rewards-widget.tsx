import { Star, Trophy } from "lucide-react"
import Link from "next/link"

import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getRewardsOverviewAction,
  type ChildPointsSummary,
} from "@/lib/actions/rewards"

function getLevel(points: number): {
  level: number
  name: string
  next: number
} {
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

export async function RewardsWidget({ isAdmin, currentUserId }: RewardsWidgetProps) {
  const result = await getRewardsOverviewAction()
  const allChildren: ChildPointsSummary[] = !("error" in result)
    ? result.children
    : []

  const displayChildren = isAdmin
    ? allChildren
    : allChildren.filter((c) => c.id === currentUserId)

  return (
    <section className="flex flex-col rounded-[2rem] bg-card p-8 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-primary-foreground">
          Belohnungen
        </h3>
        <Trophy className="h-5 w-5 text-primary-foreground" />
      </div>

      {/* Content */}
      {displayChildren.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary">
            <span className="text-3xl font-black text-primary-foreground">
              0
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Noch keine Kinder in der Familie"
              : "Noch keine Punkte gesammelt"}
          </p>
          <p className="text-xs text-muted-foreground">
            Erledige Aufgaben, um Punkte zu sammeln
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayChildren.map((child) => {
            const { name: levelName, next } = getLevel(child.pointsBalance)
            const prevThreshold =
              child.pointsBalance < 100
                ? 0
                : child.pointsBalance < 250
                  ? 100
                  : child.pointsBalance < 500
                    ? 250
                    : child.pointsBalance < 1000
                      ? 500
                      : 1000
            const progress = Math.min(
              ((child.pointsBalance - prevThreshold) /
                (next - prevThreshold)) *
                100,
              100
            )

            return (
              <div key={child.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{child.displayName}</p>
                  <span className="flex items-center gap-1 text-sm font-semibold text-accent-foreground">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    {child.pointsBalance}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-[10px] text-muted-foreground">
                  {levelName} &middot; noch{" "}
                  {Math.max(next - child.pointsBalance, 0)} Punkte bis zum
                  naechsten Level
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <Link
        href="/rewards"
        className="mt-6 block w-full rounded-full bg-muted py-3 text-center text-sm font-bold text-secondary transition-colors hover:bg-muted/80"
      >
        Alle Belohnungen
      </Link>
    </section>
  )
}

export function RewardsWidgetSkeleton() {
  return (
    <section className="flex flex-col rounded-[2rem] bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </section>
  )
}
