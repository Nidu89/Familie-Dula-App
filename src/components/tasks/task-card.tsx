"use client"

import { useState } from "react"
import { Check, Clock, Star, ChevronDown, ChevronRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { completeTaskAction, type Task } from "@/lib/actions/tasks"

const PRIORITY_CONFIG = {
  high: { label: "Hoch", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "Mittel", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  low: { label: "Niedrig", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
}

const STATUS_CONFIG = {
  open: { label: "Offen", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Bearbeitung", className: "bg-primary/10 text-primary" },
  done: { label: "Erledigt", className: "bg-chart-3/10 text-chart-3" },
}

interface TaskCardProps {
  task: Task
  isAdultOrAdmin: boolean
  currentUserId: string
  onEdit: (task: Task) => void
  onCompleted: () => void
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate) < today
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return ""
  return new Date(dueDate).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  })
}

export function TaskCard({
  task,
  isAdultOrAdmin,
  currentUserId,
  onEdit,
  onCompleted,
}: TaskCardProps) {
  const { toast } = useToast()
  const [isCompleting, setIsCompleting] = useState(false)
  const [subtasksOpen, setSubtasksOpen] = useState(false)

  const overdue = task.status !== "done" && isOverdue(task.dueDate)
  const canComplete =
    task.status !== "done" &&
    (isAdultOrAdmin || task.assignedTo === currentUserId)
  const canEdit = isAdultOrAdmin

  const subtasksDone = task.subtasks.filter((s) => s.isDone).length
  const subtasksTotal = task.subtasks.length
  const subtaskProgress =
    subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0

  async function handleComplete() {
    setIsCompleting(true)
    try {
      const result = await completeTaskAction(task.id)
      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      if (result.pointsAwarded && result.points) {
        toast({
          title: "Aufgabe erledigt!",
          description: `+${result.points} Punkte erhalten! Neuer Stand: ${result.newBalance} Punkte.`,
        })
      } else {
        toast({
          title: "Aufgabe erledigt!",
          description: "Die Aufgabe wurde als erledigt markiert.",
        })
      }
      // Show badge earned toasts
      if (result.awardedBadges && result.awardedBadges.length > 0) {
        for (const badge of result.awardedBadges) {
          toast({
            title: "Neues Abzeichen!",
            description: `Du hast das Abzeichen "${badge}" verdient!`,
          })
        }
      }
      onCompleted()
    } catch {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht als erledigt markiert werden.",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Card
      className={`transition-colors ${task.status === "done" ? "opacity-60" : ""} ${canEdit ? "cursor-pointer hover:border-primary/30" : ""}`}
      onClick={() => canEdit && onEdit(task)}
    >
      <CardContent className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <div
          className="pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={task.status === "done"}
            disabled={!canComplete || isCompleting}
            onCheckedChange={() => canComplete && handleComplete()}
            aria-label={`Aufgabe "${task.title}" als erledigt markieren`}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}
            >
              {task.title}
            </h3>

            <Badge
              variant="outline"
              className={`text-[10px] ${PRIORITY_CONFIG[task.priority].className}`}
            >
              {PRIORITY_CONFIG[task.priority].label}
            </Badge>

            <Badge
              variant="outline"
              className={`text-[10px] ${STATUS_CONFIG[task.status].className}`}
            >
              {STATUS_CONFIG[task.status].label}
            </Badge>
          </div>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <span
                className={`flex items-center gap-1 ${overdue ? "font-semibold text-destructive" : ""}`}
              >
                <Clock className="h-3 w-3" />
                {formatDueDate(task.dueDate)}
                {overdue && " (ueberfaellig)"}
              </span>
            )}

            {task.assignedToName && (
              <span className="flex items-center gap-1">
                {task.assignedToName}
              </span>
            )}

            {task.points != null && task.points > 0 && (
              <span className="flex items-center gap-1 text-chart-4">
                <Star className="h-3 w-3" />
                {task.points} Punkte
                {task.pointsAwarded && (
                  <Check className="h-3 w-3 text-chart-3" />
                )}
              </span>
            )}
          </div>

          {/* Subtasks */}
          {subtasksTotal > 0 && (
            <Collapsible
              open={subtasksOpen}
              onOpenChange={setSubtasksOpen}
              className="mt-2"
            >
              <CollapsibleTrigger
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  {subtasksOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {subtasksDone}/{subtasksTotal} Unteraufgaben
                </Button>
              </CollapsibleTrigger>
              <div className="mt-1">
                <Progress value={subtaskProgress} className="h-1.5" />
              </div>
              <CollapsibleContent
                className="mt-2 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={sub.isDone}
                      disabled
                      className="h-3.5 w-3.5"
                    />
                    <span
                      className={
                        sub.isDone ? "line-through text-muted-foreground" : ""
                      }
                    >
                      {sub.title}
                    </span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
