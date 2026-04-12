"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import { AlertTriangle, Square, Clock, Star } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Skeleton } from "@/components/ui/skeleton"
import { getTasksAction, type Task } from "@/lib/actions/tasks"

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate) < today
}

export function TasksWidget() {
  const t = useTranslations("dashboard.tasks")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const result = await getTasksAction()
    const todayStr = new Date().toISOString().split("T")[0]

    if (!("error" in result)) {
      setTasks(
        result.tasks
          .filter(
            (t) =>
              t.status !== "done" &&
              (isOverdue(t.dueDate) || t.dueDate === todayStr || !t.dueDate)
          )
          .slice(0, 4)
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    startTransition(() => { void fetchTasks() })
  }, [fetchTasks])

  if (loading) return <TasksWidgetSkeleton />

  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate)).length

  return (
    <section className="flex flex-col rounded-[2rem] bg-card p-8 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h3 className="font-display text-xl font-bold">{t("title")}</h3>
        {overdueCount > 0 && (
          <span className="rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-black text-destructive">
            {overdueCount} {t("overdue")}
          </span>
        )}
      </div>

      {/* Content */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Square className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t("allDone")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate)
            return (
              <div
                key={task.id}
                className={`flex items-center gap-4 rounded-xl p-4 ${
                  overdue ? "bg-destructive/10" : "bg-muted"
                }`}
              >
                {overdue ? (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                ) : (
                  <Square className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{task.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.dueDate && (
                      <span
                        className={`flex items-center gap-0.5 ${overdue ? "font-medium text-destructive" : ""}`}
                      >
                        <Clock className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString("de-DE", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                    {task.assignedToName && (
                      <span>{task.assignedToName}</span>
                    )}
                    {task.points != null && task.points > 0 && (
                      <span className="flex items-center gap-0.5 text-accent-foreground">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        {task.points}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <Link
        href="/tasks"
        className="mt-6 block w-full rounded-full bg-muted py-3 text-center text-sm font-bold text-secondary transition-colors hover:bg-muted/80"
      >
        {t("viewAll")}
      </Link>
    </section>
  )
}

export function TasksWidgetSkeleton() {
  return (
    <section className="flex flex-col rounded-[2rem] bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-7 w-36" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </section>
  )
}
