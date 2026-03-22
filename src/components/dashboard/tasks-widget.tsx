"use client"

import { useState, useEffect } from "react"
import { ListTodo, ChevronRight, Clock, Star } from "lucide-react"
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

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-chart-4/10 text-chart-4",
  low: "bg-chart-3/10 text-chart-3",
}

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
          // Show overdue and today's tasks, max 4
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

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListTodo className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Aufgaben</CardTitle>
              <CardDescription className="text-xs">
                Ueberfaellige & heute faellige
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
              <Skeleton key={i} className="h-12 w-full rounded-md" />
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
                  className="flex items-center gap-3 rounded-md border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {task.title}
                    </p>
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
                        <span className="flex items-center gap-0.5 text-chart-4">
                          <Star className="h-3 w-3" />
                          {task.points}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${PRIORITY_COLORS[task.priority] || ""}`}
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
