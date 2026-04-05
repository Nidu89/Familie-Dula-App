"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Home, User, Star, ListChecks, Plus, Trophy } from "lucide-react"
import { RRule } from "rrule"

import { Skeleton } from "@/components/ui/skeleton"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskFormDialog } from "@/components/tasks/task-form-dialog"
import { getTasksAction, type Task } from "@/lib/actions/tasks"
import type { FamilyGoal, GoalContribution } from "@/lib/actions/rewards"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

/* ── helpers ───────────────────────────────────────────── */

function adjustRecurringDueDate(task: Task): Task {
  if (!task.recurrenceRule || !task.dueDate || task.status === "done")
    return task
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)
  try {
    const dtstart = new Date(task.dueDate + "T00:00:00Z")
    const ruleOptions = RRule.parseString(task.recurrenceRule)
    const rule = new RRule({ ...ruleOptions, dtstart })
    const next = rule.after(todayUTC, true)
    if (next) return { ...task, dueDate: next.toISOString().split("T")[0] }
  } catch {
    /* keep original */
  }
  return task
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

/* ── types ─────────────────────────────────────────────── */

interface FamilyMember {
  id: string
  displayName: string
}

interface TasksListProps {
  initialTasks: Task[]
  members: FamilyMember[]
  isAdultOrAdmin: boolean
  currentUserId: string
  familyGoal: FamilyGoal | null
  goalContributions: GoalContribution[]
}

/* ── component ─────────────────────────────────────────── */

export function TasksList({
  initialTasks,
  members,
  isAdultOrAdmin,
  currentUserId,
  familyGoal,
  goalContributions,
}: TasksListProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Auto-open create dialog when ?new=1 is in the URL
  useEffect(() => {
    if (searchParams.get("new") === "1" && isAdultOrAdmin) {
      setSelectedTask(null)
      setDialogOpen(true)
      window.history.replaceState(null, "", "/tasks")
    }
  }, [searchParams, isAdultOrAdmin])

  /* ── data fetching ──────────────────────────────────── */

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getTasksAction()
      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setTasks(result.tasks)
    } catch {
      toast({
        title: "Fehler",
        description: "Aufgaben konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  /* ── realtime ───────────────────────────────────────── */

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("tasks_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => fetchTasks()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTasks])

  /* ── derived state ──────────────────────────────────── */

  const adjustedTasks = useMemo(
    () => tasks.map(adjustRecurringDueDate),
    [tasks]
  )

  const { haushaltsAufgaben, eigeneAufgaben } = useMemo(() => {
    const haushalt: Task[] = []
    const eigene: Task[] = []
    for (const task of adjustedTasks) {
      if (task.assignedTo === currentUserId) {
        eigene.push(task)
      } else {
        haushalt.push(task)
      }
    }
    return { haushaltsAufgaben: haushalt, eigeneAufgaben: eigene }
  }, [adjustedTasks, currentUserId])

  const activeHaushalt = haushaltsAufgaben.filter((t) => t.status !== "done")

  const totalTasks = adjustedTasks.length
  const doneTasks = adjustedTasks.filter((t) => t.status === "done").length
  const completionPercent =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const contributionsByMember = useMemo(() => {
    if (!familyGoal) return []
    const map = new Map<string, { name: string; total: number }>()
    for (const c of goalContributions) {
      const existing = map.get(c.contributedBy)
      if (existing) existing.total += c.amount
      else
        map.set(c.contributedBy, {
          name: c.contributedByName || "?",
          total: c.amount,
        })
    }
    return Array.from(map.entries()).map(([id, data]) => ({ id, ...data }))
  }, [goalContributions, familyGoal])

  /* ── handlers ───────────────────────────────────────── */

  function handleNewTask() {
    setSelectedTask(null)
    setDialogOpen(true)
  }

  function handleEditTask(task: Task) {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  /* ── skeleton loading ───────────────────────────────── */

  if (isLoading && adjustedTasks.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="lg:col-span-4 space-y-6">
            <Skeleton className="h-8 w-40 rounded-full" />
            <Skeleton className="h-52 w-full rounded-lg" />
            <Skeleton className="h-52 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  /* ── render ─────────────────────────────────────────── */

  return (
    <>
      {/* "Neue Aufgabe" button */}
      {isAdultOrAdmin && (
        <div className="mb-8">
          <button
            onClick={handleNewTask}
            className="bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="h-5 w-5" />
            Neue Aufgabe
          </button>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Haushalt Column ─────────────────────────── */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <Home className="h-5 w-5 text-primary-foreground" />
              Haushalt
            </h3>
            {activeHaushalt.length > 0 && (
              <span className="bg-accent text-secondary px-3 py-1 rounded-full text-xs font-bold">
                {activeHaushalt.length} Aktiv
              </span>
            )}
          </div>

          {haushaltsAufgaben.length === 0 ? (
            <div className="bg-card p-8 rounded-lg text-center">
              <p className="text-muted-foreground text-sm">
                Keine Haushalts-Aufgaben
              </p>
            </div>
          ) : (
            haushaltsAufgaben.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                variant="haushalt"
                isAdultOrAdmin={isAdultOrAdmin}
                currentUserId={currentUserId}
                onEdit={handleEditTask}
                onCompleted={fetchTasks}
              />
            ))
          )}
        </section>

        {/* ─── Eigene To-dos Column ───────────────────── */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-chart-3" />
              Eigene To-dos
            </h3>
          </div>

          {eigeneAufgaben.length === 0 ? (
            <div className="bg-card p-8 rounded-lg text-center">
              <p className="text-muted-foreground text-sm">
                Keine eigenen Aufgaben
              </p>
            </div>
          ) : (
            eigeneAufgaben.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                variant="eigene"
                isAdultOrAdmin={isAdultOrAdmin}
                currentUserId={currentUserId}
                onEdit={handleEditTask}
                onCompleted={fetchTasks}
              />
            ))
          )}
        </section>

        {/* ─── Wochen-Challenge Column ────────────────── */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <Star className="h-5 w-5 text-secondary" />
              Wochen-Challenge
            </h3>
          </div>

          {familyGoal ? (
            <div className="bg-secondary text-secondary-foreground p-8 rounded-xl shadow-xl relative overflow-hidden min-h-[400px]">
              {/* decorative bubble */}
              <div
                className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 -mr-12 -mb-12"
                style={{
                  borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
                }}
              />

              <div className="relative z-10">
                <span className="bg-white/20 text-white px-4 py-1 rounded-full text-xs font-bold uppercase mb-6 inline-block">
                  Gruppen-Aufgabe
                </span>

                <h4 className="font-display font-extrabold text-3xl mb-4 leading-tight">
                  {familyGoal.emoji && `${familyGoal.emoji} `}
                  {familyGoal.title}
                </h4>

                {familyGoal.description && (
                  <p className="text-white/80 mb-8">{familyGoal.description}</p>
                )}

                {/* per-member progress */}
                {contributionsByMember.length > 0 && (
                  <div className="space-y-4 mb-8">
                    {contributionsByMember.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white">
                            {getInitials(member.name)}
                          </span>
                        </div>
                        <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(100, (member.total / familyGoal.targetPoints) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-md border border-white/10">
                  <p className="font-display font-bold text-xl text-primary">
                    +{familyGoal.targetPoints - familyGoal.collectedPoints}{" "}
                    Familien-Punkte
                  </p>
                  <p className="text-xs text-white/60">
                    {familyGoal.collectedPoints} / {familyGoal.targetPoints}{" "}
                    erreicht
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary/5 p-8 rounded-xl text-center min-h-[200px] flex flex-col items-center justify-center gap-3">
              <Trophy className="h-10 w-10 text-secondary/30" />
              <p className="text-muted-foreground text-sm">
                Keine aktive Wochen-Challenge
              </p>
              <p className="text-muted-foreground/70 text-xs">
                Erstelle ein Familienziel unter Belohnungen
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ─── Bottom Progress Bar ─────────────────────── */}
      {totalTasks > 0 && (
        <div className="fixed bottom-24 md:bottom-0 left-0 right-0 md:left-72 z-30 p-4 md:p-8 pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <div className="bg-card/80 backdrop-blur-2xl p-5 md:p-6 rounded-lg shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border border-white/20 flex flex-col md:flex-row items-center gap-4 md:gap-6">
              {/* icon + text */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center shadow-inner">
                  {familyGoal?.emoji ? (
                    <span className="text-2xl">{familyGoal.emoji}</span>
                  ) : (
                    <ListChecks className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-display font-bold text-secondary text-sm md:text-base">
                    {familyGoal ? familyGoal.title : "Wochen-Fortschritt"}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">
                    {completionPercent}% der Aufgaben erledigt!
                  </p>
                </div>
              </div>

              {/* progress bar */}
              <div className="flex-1 w-full">
                <div className="h-5 md:h-6 bg-muted rounded-full p-1 relative overflow-hidden">
                  <div
                    className="h-full bg-primary-foreground rounded-full transition-all duration-1000"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              {/* remaining badge */}
              <div className="bg-accent px-5 py-2 rounded-full shrink-0">
                <span className="font-display font-bold text-secondary text-xs md:text-sm">
                  Noch {100 - completionPercent}% bis zum Ziel!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* task create / edit dialog */}
      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        members={members}
        onSuccess={fetchTasks}
      />
    </>
  )
}
