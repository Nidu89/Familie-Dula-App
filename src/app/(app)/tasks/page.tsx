import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { getTasksAction } from "@/lib/actions/tasks"
import { getFamilyDataAction } from "@/lib/actions/family"
import { TasksList } from "@/components/tasks/tasks-list"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function TasksPage() {
  const dashResult = await getDashboardDataAction()

  if ("error" in dashResult) {
    if (dashResult.error === "Nicht angemeldet.") redirect("/login")
    if (dashResult.error === "Du gehoerst keiner Familie an.")
      redirect("/onboarding")
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          Aufgaben konnten nicht geladen werden. Bitte Seite neu laden.
        </p>
      </main>
    )
  }

  const { role } = dashResult
  const isAdultOrAdmin = role === "admin" || role === "adult"

  // Load initial tasks
  const tasksResult = await getTasksAction()
  const initialTasks = "error" in tasksResult ? [] : tasksResult.tasks

  // Load family members
  const familyResult = await getFamilyDataAction()
  const members =
    "error" in familyResult
      ? []
      : familyResult.members.map((m) => ({
          id: m.id,
          displayName: m.displayName,
        }))

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Zurueck zum Dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Aufgaben
          </h1>
          <p className="text-sm text-muted-foreground">
            Alle Aufgaben der Familie verwalten
          </p>
        </div>
      </div>

      <TasksList
        initialTasks={initialTasks}
        members={members}
        isAdultOrAdmin={isAdultOrAdmin}
        currentUserId={dashResult.user.id}
      />
    </main>
  )
}
