"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Home, User, Star, ListChecks, Plus, Trophy, CheckCircle2, CircleDashed, Pin } from "lucide-react"
import { RRule } from "rrule"
import { useTranslations } from "next-intl"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskFormDialog } from "@/components/tasks/task-form-dialog"
import { getTasksAction, type Task } from "@/lib/actions/tasks"
import { getFamilyDataAction } from "@/lib/actions/family"
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
  weekChallengeTaskId?: string | null
}

/* ── component ─────────────────────────────────────────── */

export function TasksList({
  initialTasks,
  members,
  isAdultOrAdmin,
  currentUserId,
  weekChallengeTaskId: initialWeekChallengeTaskId,
}: TasksListProps) {
  const t = useTranslations("tasks")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [weekChallengeTaskId, setWeekChallengeTaskId] = useState<string | null>(
    initialWeekChallengeTaskId ?? null
  )

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
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setTasks(result.tasks)
    } catch {
      toast({
        title: tc("error"),
        description: t("loadErrorToast"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, tc, t])

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

  // Find the pinned challenge task object
  const challengeTask = useMemo(() => {
    if (!weekChallengeTaskId) return null
    return adjustedTasks.find((t) => t.id === weekChallengeTaskId) ?? null
  }, [weekChallengeTaskId, adjustedTasks])

  // Refresh week challenge id from server
  const refreshWeekChallenge = useCallback(async () => {
    try {
      const result = await getFamilyDataAction()
      if (!("error" in result)) {
        setWeekChallengeTaskId(result.weekChallengeTaskId ?? null)
      }
    } catch {
      // best-effort
    }
    // Also re-fetch tasks so the UI is fully in sync
    fetchTasks()
  }, [fetchTasks])

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
            {t("newTask")}
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
              {t("list.household")}
            </h3>
            {activeHaushalt.length > 0 && (
              <span className="bg-accent text-secondary px-3 py-1 rounded-full text-xs font-bold">
                {activeHaushalt.length} {t("list.active")}
              </span>
            )}
          </div>

          {haushaltsAufgaben.length === 0 ? (
            <div className="bg-card p-8 rounded-lg text-center">
              <p className="text-muted-foreground text-sm">
                {t("list.noHouseholdTasks")}
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
                weekChallengeTaskId={weekChallengeTaskId}
                onChallengeChanged={refreshWeekChallenge}
              />
            ))
          )}
        </section>

        {/* ─── Eigene To-dos Column ───────────────────── */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-chart-3" />
              {t("list.ownTodos")}
            </h3>
          </div>

          {eigeneAufgaben.length === 0 ? (
            <div className="bg-card p-8 rounded-lg text-center">
              <p className="text-muted-foreground text-sm">
                {t("list.noOwnTasks")}
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
                weekChallengeTaskId={weekChallengeTaskId}
                onChallengeChanged={refreshWeekChallenge}
              />
            ))
          )}
        </section>

        {/* ─── Wochen-Challenge Column ────────────────── */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <Star className="h-5 w-5 text-secondary" />
              {t("list.weeklyChallenge")}
            </h3>
          </div>

          {challengeTask ? (
            <div className="bg-secondary text-secondary-foreground p-8 rounded-xl shadow-xl relative overflow-hidden min-h-[280px]">
              {/* decorative bubble */}
              <div
                className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 -mr-12 -mb-12"
                style={{
                  borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1.5">
                    <Pin className="h-3 w-3" />
                    {t("list.weeklyChallenge")}
                  </span>
                </div>

                <h4 className="font-display font-extrabold text-3xl mb-3 leading-tight">
                  {challengeTask.title}
                </h4>

                {challengeTask.description && (
                  <p className="text-white/80 mb-6 line-clamp-3">
                    {challengeTask.description}
                  </p>
                )}

                {/* status + points row */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {challengeTask.status === "done" ? (
                    <Badge className="bg-green-500/20 text-green-200 hover:bg-green-500/30 border-0 gap-1.5 py-1 px-3 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("list.challengeCompleted")}
                    </Badge>
                  ) : (
                    <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 gap-1.5 py-1 px-3 text-sm">
                      <CircleDashed className="h-4 w-4" />
                      {t("list.challengeOpen")}
                    </Badge>
                  )}
                  {challengeTask.points != null && challengeTask.points > 0 && (
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0 py-1 px-3 text-sm font-bold">
                      {t("card.pointsShort", { points: challengeTask.points })}
                    </Badge>
                  )}
                </div>

                {/* assigned to info */}
                {challengeTask.assignedToName && (
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg">
                    <p className="text-xs text-white/60 mb-1">
                      {challengeTask.status === "done"
                        ? t("list.completedBy")
                        : t("list.assignedTo")}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {getInitials(challengeTask.assignedToName)}
                        </span>
                      </div>
                      <span className="font-bold text-white text-sm">
                        {challengeTask.assignedToName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-secondary/5 p-8 rounded-xl text-center min-h-[200px] flex flex-col items-center justify-center gap-3">
              <Trophy className="h-10 w-10 text-secondary/30" />
              <p className="text-muted-foreground text-sm font-medium">
                {t("list.noChallengeTitle")}
              </p>
              <p className="text-muted-foreground/70 text-xs">
                {t("list.noChallengeDescription")}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ─── Bottom Progress Bar ─────────────────────── */}
      {totalTasks > 0 && (
        <div className="mt-8 mb-28 md:mb-8">
            <div className="bg-card p-5 md:p-6 rounded-lg flex flex-col md:flex-row items-center gap-4 md:gap-6">
              {/* icon + text */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center shadow-inner">
                  <ListChecks className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-secondary text-sm md:text-base">
                    {t("list.weekProgress")}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">
                    {completionPercent}% {t("list.percentDone")}
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
                  {t("list.percentRemaining", { percent: 100 - completionPercent })}
                </span>
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
