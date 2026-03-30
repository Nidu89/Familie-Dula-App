"use client"

import { useState, useCallback } from "react"
import { Rocket, Target, Plus, CheckCircle2, PartyPopper } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ContributePointsDialog } from "@/components/rewards/contribute-points-dialog"
import { GoalFormDialog } from "@/components/rewards/goal-form-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getFamilyGoalAction,
  completeFamilyGoalAction,
  getCompletedGoalsAction,
  type FamilyGoal,
  type GoalContribution,
} from "@/lib/actions/rewards"

interface CommunityGoalProps {
  initialGoal: FamilyGoal | null
  initialContributions: GoalContribution[]
  initialCompletedGoals?: FamilyGoal[]
  userBalance: number
  isAdultOrAdmin: boolean
}

export function CommunityGoal({
  initialGoal,
  initialContributions,
  initialCompletedGoals = [],
  userBalance: initialBalance,
  isAdultOrAdmin,
}: CommunityGoalProps) {
  const { toast } = useToast()
  const [goal, setGoal] = useState<FamilyGoal | null>(initialGoal)
  const [contributions, setContributions] =
    useState<GoalContribution[]>(initialContributions)
  const [completedGoals, setCompletedGoals] = useState<FamilyGoal[]>(initialCompletedGoals)
  const [userBalance, setUserBalance] = useState(initialBalance)
  const [contributeOpen, setContributeOpen] = useState(false)
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const refreshGoal = useCallback(async () => {
    try {
      const [goalResult, completedResult] = await Promise.all([
        getFamilyGoalAction(),
        getCompletedGoalsAction(),
      ])
      if ("error" in goalResult) {
        toast({
          title: "Fehler",
          description: goalResult.error,
          variant: "destructive",
        })
        return
      }
      setGoal(goalResult.goal)
      setContributions(goalResult.contributions)
      if (!("error" in completedResult)) {
        setCompletedGoals(completedResult.goals)
      }
    } catch {
      toast({
        title: "Fehler",
        description: "Familienziel konnte nicht aktualisiert werden.",
        variant: "destructive",
      })
    }
  }, [toast])

  async function handleComplete() {
    if (!goal) return
    setIsCompleting(true)
    try {
      const result = await completeFamilyGoalAction(goal.id)
      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Ziel abgeschlossen!",
        description: `"${goal.title}" wurde als abgeschlossen markiert.`,
      })
      await refreshGoal()
    } catch {
      toast({
        title: "Fehler",
        description: "Ziel konnte nicht abgeschlossen werden.",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  // No active goal
  if (!goal) {
    return (
      <section aria-label="Familienziel">
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="font-display text-xl font-bold">Familienziel</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Community
          </span>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-card py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Target className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Kein aktives Familienziel vorhanden.
          </p>
          {isAdultOrAdmin && (
            <Button
              size="sm"
              className="mt-2 rounded-full"
              onClick={() => setGoalFormOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Neues Ziel starten
            </Button>
          )}
        </div>

        <GoalFormDialog
          open={goalFormOpen}
          onOpenChange={setGoalFormOpen}
          onSuccess={refreshGoal}
        />
      </section>
    )
  }

  const progressPercent = Math.min(
    100,
    Math.round((goal.collectedPoints / goal.targetPoints) * 100)
  )
  const remainingPoints = Math.max(0, goal.targetPoints - goal.collectedPoints)
  const isCompleted =
    goal.status === "completed" || goal.collectedPoints >= goal.targetPoints

  return (
    <section aria-label="Familienziel">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="font-display text-xl font-bold">Familienziel</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
          Community
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-accent p-6 sm:p-8">
        {/* Activity Bubble decoration */}
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 bg-tertiary-container/25"
          style={{
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          }}
          aria-hidden="true"
        />

        {/* Goal header */}
        <div className="mb-6 flex items-start gap-3">
          {goal.emoji && (
            <span className="text-4xl" aria-hidden="true">
              {goal.emoji}
            </span>
          )}
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-accent-foreground">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="mt-0.5 text-sm text-accent-foreground/70">
                {goal.description}
              </p>
            )}
          </div>
        </div>

        {/* Completed celebration */}
        {isCompleted && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-card/60 p-4 backdrop-blur-sm">
            <PartyPopper className="h-8 w-8 text-primary" />
            <div>
              <p className="font-display font-bold text-accent-foreground">
                Ziel erreicht!
              </p>
              <p className="text-sm text-accent-foreground/70">
                Die Familie hat gemeinsam{" "}
                {goal.collectedPoints.toLocaleString("de-DE")} Punkte
                gesammelt!
              </p>
            </div>
          </div>
        )}

        {/* Points display */}
        <div className="mb-4 flex items-baseline gap-2">
          <span className="font-display text-4xl font-black text-secondary">
            {goal.collectedPoints.toLocaleString("de-DE")}
          </span>
          <span className="text-sm text-accent-foreground/60">
            / {goal.targetPoints.toLocaleString("de-DE")} Pkt.
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-2 overflow-hidden rounded-full bg-white/40">
          <div
            className="flex h-8 items-center justify-end rounded-full pr-2 transition-all duration-700"
            style={{
              width: `${Math.max(progressPercent, 5)}%`,
              background: "linear-gradient(135deg, #6c5a00, #ffd709)",
            }}
          >
            {progressPercent >= 10 && (
              <span className="text-xs font-bold text-white">
                {progressPercent}%
              </span>
            )}
          </div>
        </div>

        {!isCompleted && (
          <p className="mb-6 text-xs text-accent-foreground/60">
            Noch {remainingPoints.toLocaleString("de-DE")} Punkte bis zum Ziel
          </p>
        )}

        {/* Recent contributions */}
        {contributions.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/50">
              Letzte Beitraege
            </p>
            {contributions.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg bg-card/40 px-3 py-2 text-xs backdrop-blur-sm"
              >
                <span className="font-medium text-accent-foreground">
                  {c.contributedByName || "Mitglied"}
                </span>
                <span className="font-bold text-secondary">
                  +{c.amount} Pkt.
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {!isCompleted && (
            <Button
              className="gap-1.5 rounded-full bg-card text-secondary hover:bg-card/80"
              onClick={() => setContributeOpen(true)}
            >
              <Rocket className="h-4 w-4" />
              Punkte beisteuern
            </Button>
          )}

          {isAdultOrAdmin && (
            <Button
              variant="outline"
              className="gap-1.5 rounded-full border-accent-foreground/20 text-accent-foreground hover:bg-card/30"
              onClick={isCompleted ? () => setGoalFormOpen(true) : handleComplete}
              disabled={isCompleting}
            >
              {isCompleted ? (
                <>
                  <Plus className="h-4 w-4" />
                  Neues Ziel
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleting ? "Wird abgeschlossen..." : "Abschliessen"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {goal && (
        <ContributePointsDialog
          open={contributeOpen}
          onOpenChange={setContributeOpen}
          goalId={goal.id}
          goalTitle={goal.title}
          userBalance={userBalance}
          onSuccess={async (newBalance: number) => {
            await refreshGoal()
            setUserBalance(newBalance)
          }}
        />
      )}

      <GoalFormDialog
        open={goalFormOpen}
        onOpenChange={setGoalFormOpen}
        onSuccess={refreshGoal}
      />

      {/* Completed goals history */}
      {completedGoals.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Vergangene Ziele verbergen" : `${completedGoals.length} vergangene${completedGoals.length === 1 ? "s" : ""} Ziel${completedGoals.length === 1 ? "" : "e"} anzeigen`}
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {completedGoals.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg bg-muted px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    {g.emoji && <span aria-hidden="true">{g.emoji}</span>}
                    <div>
                      <p className="text-sm font-medium">{g.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.status === "completed" ? "Erreicht" : "Abgebrochen"}
                        {g.completedAt && ` am ${new Date(g.completedAt).toLocaleDateString("de-DE")}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">
                    {g.collectedPoints.toLocaleString("de-DE")} / {g.targetPoints.toLocaleString("de-DE")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export function CommunityGoalSkeleton() {
  return (
    <section aria-label="Familienziel wird geladen">
      <div className="mb-4">
        <Skeleton className="h-7 w-40" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </section>
  )
}
