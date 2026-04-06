import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { getTasksAction } from "@/lib/actions/tasks"
import { getFamilyDataAction } from "@/lib/actions/family"
import { TasksList } from "@/components/tasks/tasks-list"

export default async function TasksPage() {
  const dashResult = await getDashboardDataAction()

  if ("error" in dashResult) {
    if (dashResult.error === "Nicht angemeldet.") redirect("/login")
    if (dashResult.error === "Du gehoerst keiner Familie an.")
      redirect("/onboarding")
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          Aufgaben konnten nicht geladen werden. Bitte Seite neu laden.
        </p>
      </main>
    )
  }

  const { role } = dashResult
  const isAdultOrAdmin = role === "admin" || role === "adult"

  // Load tasks and members in parallel
  const [tasksResult, familyResult] = await Promise.all([
    getTasksAction(),
    getFamilyDataAction(),
  ])

  const initialTasks = "error" in tasksResult ? [] : tasksResult.tasks
  const members =
    "error" in familyResult
      ? []
      : familyResult.members.map((m) => ({
          id: m.id,
          displayName: m.displayName,
        }))
  const weekChallengeTaskId =
    "error" in familyResult ? null : familyResult.weekChallengeTaskId

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-48 sm:px-6 sm:pt-8 md:pb-40">
      {/* Page header */}
      <div className="mb-8 md:mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
          Familien-Sandbox
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-secondary">
          Aufgaben-Spass
        </h1>
        <p className="mt-1 text-base md:text-lg text-muted-foreground">
          Was erledigen wir heute?
        </p>
      </div>

      <TasksList
        initialTasks={initialTasks}
        members={members}
        isAdultOrAdmin={isAdultOrAdmin}
        currentUserId={dashResult.user.id}
        weekChallengeTaskId={weekChallengeTaskId}
      />
    </main>
  )
}
