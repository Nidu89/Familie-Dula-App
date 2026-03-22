"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { ListChecks } from "lucide-react"
import { RRule } from "rrule"

import { Skeleton } from "@/components/ui/skeleton"
import { TasksHeader } from "@/components/tasks/tasks-header"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskFormDialog } from "@/components/tasks/task-form-dialog"
import { getTasksAction, type Task } from "@/lib/actions/tasks"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

// For open recurring tasks, adjust the dueDate to the next upcoming occurrence
function adjustRecurringDueDate(task: Task): Task {
  if (!task.recurrenceRule || !task.dueDate || task.status === "done") return task

  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)

  try {
    const dtstart = new Date(task.dueDate + "T00:00:00Z")
    const ruleOptions = RRule.parseString(task.recurrenceRule)
    const rule = new RRule({ ...ruleOptions, dtstart })
    const next = rule.after(todayUTC, true)
    if (next) {
      return { ...task, dueDate: next.toISOString().split("T")[0] }
    }
  } catch {
    // Keep original due date on parse error
  }

  return task
}

interface FamilyMember {
  id: string
  displayName: string
}

interface TasksListProps {
  initialTasks: Task[]
  members: FamilyMember[]
  isAdultOrAdmin: boolean
  currentUserId: string
}

function groupTasks(tasks: Task[]): Record<string, Task[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split("T")[0]

  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
  const endOfWeekStr = endOfWeek.toISOString().split("T")[0]

  const groups: Record<string, Task[]> = {
    overdue: [],
    today: [],
    thisWeek: [],
    later: [],
    done: [],
  }

  for (const task of tasks) {
    if (task.status === "done") {
      groups.done.push(task)
      continue
    }

    if (!task.dueDate) {
      groups.later.push(task)
      continue
    }

    if (task.dueDate < todayStr) {
      groups.overdue.push(task)
    } else if (task.dueDate === todayStr) {
      groups.today.push(task)
    } else if (task.dueDate <= endOfWeekStr) {
      groups.thisWeek.push(task)
    } else {
      groups.later.push(task)
    }
  }

  return groups
}

const SECTION_LABELS: Record<string, string> = {
  overdue: "Ueberfaellig",
  today: "Heute",
  thisWeek: "Diese Woche",
  later: "Spaeter",
  done: "Erledigt",
}

export function TasksList({
  initialTasks,
  members,
  isAdultOrAdmin,
  currentUserId,
}: TasksListProps) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Filters
  const [selectedMember, setSelectedMember] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDueGroup, setSelectedDueGroup] = useState("all")

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const filters: Record<string, string> = {}
      if (selectedMember !== "all" && selectedMember !== "unassigned") {
        filters.assignedTo = selectedMember
      }
      if (selectedStatus !== "all") {
        filters.status = selectedStatus
      }
      if (selectedDueGroup !== "all") {
        filters.dueGroup = selectedDueGroup
      }

      const result = await getTasksAction(
        Object.keys(filters).length > 0 ? filters : undefined
      )

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
  }, [selectedMember, selectedStatus, selectedDueGroup, toast])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Client-side filter for "unassigned" + adjust recurring task due dates
  const filteredTasks = useMemo(() => {
    const base =
      selectedMember === "unassigned"
        ? tasks.filter((t) => !t.assignedTo)
        : tasks
    return base.map(adjustRecurringDueDate)
  }, [tasks, selectedMember])

  const groups = useMemo(() => groupTasks(filteredTasks), [filteredTasks])

  // Supabase Realtime: refresh tasks when other family members make changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("tasks_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          fetchTasks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTasks])

  function handleNewTask() {
    setSelectedTask(null)
    setDialogOpen(true)
  }

  function handleEditTask(task: Task) {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <TasksHeader
        isAdultOrAdmin={isAdultOrAdmin}
        onNewTask={handleNewTask}
        members={members}
        selectedMember={selectedMember}
        onMemberChange={setSelectedMember}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedDueGroup={selectedDueGroup}
        onDueGroupChange={setSelectedDueGroup}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ListChecks className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              Keine Aufgaben gefunden
            </p>
            <p className="text-sm text-muted-foreground/70">
              {isAdultOrAdmin
                ? "Erstelle eine neue Aufgabe, um loszulegen."
                : "Dir wurden noch keine Aufgaben zugewiesen."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(["overdue", "today", "thisWeek", "later", "done"] as const).map(
            (section) => {
              const sectionTasks = groups[section]
              if (sectionTasks.length === 0) return null

              return (
                <div key={section}>
                  <h3
                    className={`mb-2 text-sm font-semibold ${section === "overdue" ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {SECTION_LABELS[section]} ({sectionTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {sectionTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isAdultOrAdmin={isAdultOrAdmin}
                        currentUserId={currentUserId}
                        onEdit={handleEditTask}
                        onCompleted={fetchTasks}
                      />
                    ))}
                  </div>
                </div>
              )
            }
          )}
        </div>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        members={members}
        onSuccess={fetchTasks}
      />
    </div>
  )
}
