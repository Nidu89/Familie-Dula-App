"use client"

import { useState, useEffect } from "react"
import { ListTodo, ChevronRight, Clock, Star, AlertCircle } from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getTasksAction, type Task } from "@/lib/actions/tasks"

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate) < today
}

export function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await getTasksAction()
        if (!("error" in result)) {
          const todayStr = new Date().toISOString().split("T")[0]
          const relevant = result.tasks
            .filter(
              (t) =>
                t.status !== "done" &&
                (isOverdue(t.dueDate) || t.dueDate === todayStr || !t.dueDate)
            )
            .slice(0, 4)
          setTasks(relevant)
        }
      } catch {
        // Silent fail for dashboard widget
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate)).length

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
              <ListTodo className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Aufgaben
                {!isLoading && overdueCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                    <AlertCircle className="h-2.5 w-2.5" />
                    {overdueCount} überfällig
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Überfällige &amp; heute fällige
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks" className="gap-1 text-xs">
              Alle
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <ListTodo className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              Alle Aufgaben erledigt!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate)
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg p-2.5 ${
                    overdue
                      ? "bg-destructive/8"
                      : task.priority === "high"
                        ? "bg-secondary/10"
                        : "bg-muted/50"
                  }`}
                >
                  <div
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      overdue
                        ? "bg-destructive"
                        : task.priority === "high"
                          ? "bg-secondary"
                          : task.priority === "medium"
                            ? "bg-accent"
                            : "bg-muted-foreground/40"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
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
                  <Badge
                    variant="outline"
                    className={`shrink-0 border-0 text-[10px] ${
                      task.priority === "high"
                        ? "bg-destructive/10 text-destructive"
                        : task.priority === "medium"
                          ? "bg-accent/20 text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {task.priority === "high"
                      ? "Hoch"
                      : task.priority === "medium"
                        ? "Mittel"
                        : "Niedrig"}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
