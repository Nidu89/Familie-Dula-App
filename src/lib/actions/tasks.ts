"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  getTasksFilterSchema,
  pinWeekChallengeSchema,
  type SeriesMode,
  type GetTasksFilterValues,
} from "@/lib/validations/tasks"
import { checkAndAwardAchievementsAction } from "@/lib/actions/rewards"

// ============================================================
// PROJ-5: Aufgaben & To-Dos – Server Actions
// ============================================================

// Helper: get current user's profile with family + role info
async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, family_id, role, display_name")
    .eq("id", user.id)
    .single()

  return profile
}

// Helper: verify caller is adult or admin
async function verifyAdultOrAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet.", profile: null }
  if (!profile.family_id)
    return { error: "Du gehoerst keiner Familie an.", profile: null }
  if (!["adult", "admin"].includes(profile.role ?? ""))
    return {
      error: "Nur Erwachsene und Admins duerfen diese Aktion ausfuehren.",
      profile: null,
    }
  return { error: null, profile }
}

// ============================================================
// Types
// ============================================================

export type Subtask = {
  id: string
  title: string
  isDone: boolean
  position: number
}

export type Task = {
  id: string
  familyId: string
  createdBy: string
  assignedTo: string | null
  assignedToName: string | null
  title: string
  description: string | null
  dueDate: string | null
  status: "open" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  points: number | null
  pointsAwarded: boolean
  recurrenceRule: string | null
  recurrenceParentId: string | null
  isException: boolean
  createdAt: string
  updatedAt: string
  subtasks: Subtask[]
}

// ============================================================
// getTasksAction
// ============================================================

export async function getTasksAction(
  filters?: GetTasksFilterValues
): Promise<{ tasks: Task[] } | { error: string }> {
  if (filters) {
    const parsed = getTasksFilterSchema.safeParse(filters)
    if (!parsed.success) {
      return { error: "Ungueltige Filter." }
    }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  let query = supabase
    .from("tasks")
    .select(
      `
      id,
      family_id,
      created_by,
      assigned_to,
      assigned_profile:assigned_to (
        display_name
      ),
      title,
      description,
      due_date,
      status,
      priority,
      points,
      points_awarded,
      recurrence_rule,
      recurrence_parent_id,
      is_exception,
      created_at,
      updated_at,
      subtasks (
        id,
        title,
        is_done,
        position
      )
    `
    )
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false })

  // Apply filters
  if (filters?.assignedTo) {
    query = query.eq("assigned_to", filters.assignedTo)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.dueGroup) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]

    if (filters.dueGroup === "today") {
      query = query.eq("due_date", todayStr)
    } else if (filters.dueGroup === "overdue") {
      query = query.lt("due_date", todayStr).neq("status", "done")
    } else if (filters.dueGroup === "this_week") {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
      const endOfWeekStr = endOfWeek.toISOString().split("T")[0]
      query = query.gte("due_date", todayStr).lte("due_date", endOfWeekStr)
    }
    // "all" = no due_date filter
  }

  const { data: rawTasks, error: tasksError } = await query

  if (tasksError) {
    return { error: "Aufgaben konnten nicht geladen werden." }
  }

  const tasks: Task[] = (rawTasks || []).map((t) => ({
    id: t.id,
    familyId: t.family_id,
    createdBy: t.created_by,
    assignedTo: t.assigned_to,
    assignedToName: (() => {
      const ap = t.assigned_profile as unknown
      if (Array.isArray(ap)) return (ap[0] as { display_name: string | null } | undefined)?.display_name || null
      return (ap as { display_name: string | null } | null)?.display_name || null
    })(),
    title: t.title,
    description: t.description,
    dueDate: t.due_date,
    status: t.status as "open" | "in_progress" | "done",
    priority: t.priority as "low" | "medium" | "high",
    points: t.points,
    pointsAwarded: t.points_awarded,
    recurrenceRule: t.recurrence_rule,
    recurrenceParentId: t.recurrence_parent_id,
    isException: t.is_exception,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    subtasks: (
      (t.subtasks as Array<{
        id: string
        title: string
        is_done: boolean
        position: number
      }>) || []
    )
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        title: s.title,
        isDone: s.is_done,
        position: s.position,
      })),
  }))

  return { tasks }
}

// ============================================================
// createTaskAction
// ============================================================

export async function createTaskAction(data: {
  title: string
  description?: string
  dueDate?: string
  status?: string
  priority?: string
  assignedTo?: string
  points?: number | null
  recurrenceRule?: string
  subtasks?: Array<{ title: string; isDone?: boolean; position: number }>
}): Promise<{ task: { id: string } } | { error: string }> {
  const parsed = createTaskSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile) return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Insert task
  const { data: task, error: insertError } = await supabase
    .from("tasks")
    .insert({
      family_id: profile.family_id,
      created_by: profile.id,
      assigned_to: parsed.data.assignedTo || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_date: parsed.data.dueDate || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      points: parsed.data.points ?? null,
      recurrence_rule: parsed.data.recurrenceRule || null,
    })
    .select("id")
    .single()

  if (insertError || !task) {
    return { error: "Aufgabe konnte nicht erstellt werden." }
  }

  // Insert subtasks
  if (parsed.data.subtasks.length > 0) {
    const subtaskRows = parsed.data.subtasks.map((s) => ({
      task_id: task.id,
      title: s.title,
      is_done: s.isDone,
      position: s.position,
    }))

    const { error: subError } = await supabase
      .from("subtasks")
      .insert(subtaskRows)

    if (subError) {
      console.error("Failed to insert subtasks:", subError)
    }
  }

  return { task: { id: task.id } }
}

// ============================================================
// updateTaskAction
// ============================================================

export async function updateTaskAction(
  id: string,
  data: {
    title: string
    description?: string
    dueDate?: string
    status?: string
    priority?: string
    assignedTo?: string
    points?: number | null
    recurrenceRule?: string
    subtasks?: Array<{ title: string; isDone?: boolean; position: number }>
    seriesMode?: SeriesMode
  }
): Promise<{ success: true } | { error: string }> {
  const parsed = updateTaskSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile) return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Verify task exists and belongs to family
  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("id, family_id, recurrence_rule, recurrence_parent_id")
    .eq("id", id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: "Aufgabe nicht gefunden." }
  }

  const seriesMode = parsed.data.seriesMode || "single"
  const updatePayload = {
    title: parsed.data.title,
    description: parsed.data.description || null,
    due_date: parsed.data.dueDate || null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    assigned_to: parsed.data.assignedTo || null,
    points: parsed.data.points ?? null,
    recurrence_rule: parsed.data.recurrenceRule || null,
  }

  if (seriesMode === "single") {
    if (existing.recurrence_parent_id) {
      // Already a child/exception – just update
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ ...updatePayload, is_exception: true })
        .eq("id", id)

      if (updateError) return { error: "Aufgabe konnte nicht aktualisiert werden." }
    } else if (existing.recurrence_rule) {
      // This is a recurring parent – create exception
      const { data: exTask, error: exError } = await supabase
        .from("tasks")
        .insert({
          ...updatePayload,
          family_id: profile.family_id,
          created_by: profile.id,
          recurrence_parent_id: existing.id,
          is_exception: true,
          recurrence_rule: null,
        })
        .select("id")
        .single()

      if (exError || !exTask)
        return { error: "Ausnahme konnte nicht erstellt werden." }

      // Handle subtasks on the new exception
      if (parsed.data.subtasks && parsed.data.subtasks.length > 0) {
        await supabase.from("subtasks").insert(
          parsed.data.subtasks.map((s) => ({
            task_id: exTask.id,
            title: s.title,
            is_done: s.isDone,
            position: s.position,
          }))
        )
      }

      return { success: true }
    } else {
      // Simple non-recurring task
      const { error: updateError } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", id)

      if (updateError) return { error: "Aufgabe konnte nicht aktualisiert werden." }
    }
  } else if (seriesMode === "all") {
    const parentId = existing.recurrence_parent_id || existing.id

    const { error: updateError } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", parentId)

    if (updateError) return { error: "Serie konnte nicht aktualisiert werden." }

    // Remove all exceptions
    await supabase
      .from("tasks")
      .delete()
      .eq("recurrence_parent_id", parentId)
      .eq("is_exception", true)
  } else if (seriesMode === "following") {
    const parentId = existing.recurrence_parent_id || existing.id

    // Create new series from this point
    const { error: newError } = await supabase.from("tasks").insert({
      ...updatePayload,
      family_id: profile.family_id,
      created_by: profile.id,
      is_exception: false,
    })

    if (newError) return { error: "Neue Serie konnte nicht erstellt werden." }

    // Delete future exceptions from old parent
    if (parsed.data.dueDate) {
      await supabase
        .from("tasks")
        .delete()
        .eq("recurrence_parent_id", parentId)
        .eq("is_exception", true)
        .gte("due_date", parsed.data.dueDate)
    }
  }

  // Update subtasks (for single/non-series mode)
  if (seriesMode === "single" && parsed.data.subtasks) {
    // Delete existing subtasks
    await supabase.from("subtasks").delete().eq("task_id", id)

    // Insert new subtasks
    if (parsed.data.subtasks.length > 0) {
      await supabase.from("subtasks").insert(
        parsed.data.subtasks.map((s) => ({
          task_id: id,
          title: s.title,
          is_done: s.isDone,
          position: s.position,
        }))
      )
    }
  }

  return { success: true }
}

// ============================================================
// deleteTaskAction
// ============================================================

export async function deleteTaskAction(
  id: string,
  seriesMode: SeriesMode = "single"
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteTaskSchema.safeParse({ id, seriesMode })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile) return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("id, family_id, recurrence_rule, recurrence_parent_id, due_date")
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !existing) {
    return { error: "Aufgabe nicht gefunden." }
  }

  if (parsed.data.seriesMode === "single") {
    // Subtasks are cascaded via ON DELETE CASCADE
    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", parsed.data.id)

    if (deleteError) return { error: "Aufgabe konnte nicht geloescht werden." }
  } else if (parsed.data.seriesMode === "all") {
    const parentId = existing.recurrence_parent_id || existing.id

    // Delete all exceptions first
    await supabase
      .from("tasks")
      .delete()
      .eq("recurrence_parent_id", parentId)

    // Delete parent
    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", parentId)

    if (deleteError) return { error: "Serie konnte nicht geloescht werden." }
  } else if (parsed.data.seriesMode === "following") {
    const parentId = existing.recurrence_parent_id || existing.id

    // Delete future exceptions
    if (existing.due_date) {
      await supabase
        .from("tasks")
        .delete()
        .eq("recurrence_parent_id", parentId)
        .gte("due_date", existing.due_date)
    }

    // Delete this task if it's not the parent
    if (existing.recurrence_parent_id) {
      await supabase.from("tasks").delete().eq("id", existing.id)
    }
  }

  return { success: true }
}

// ============================================================
// completeTaskAction – CRITICAL: atomic status + points via RPC
// ============================================================

export type CompleteTaskResult = {
  status: "done"
  pointsAwarded: boolean
  points?: number
  newBalance?: number
  awardedBadges: string[]
}

export async function completeTaskAction(
  taskId: string
): Promise<CompleteTaskResult | { error: string }> {
  if (!taskId || typeof taskId !== "string") {
    return { error: "Ungueltige Aufgaben-ID." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`completeTask:${ip}`, 60, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Call the atomic RPC function
  const { data, error } = await supabase.rpc("award_task_points", {
    p_task_id: taskId,
  })

  if (error) {
    // Map known error messages to user-friendly responses
    if (error.message.includes("Children can only complete")) {
      return { error: "Du kannst nur dir zugewiesene Aufgaben erledigen." }
    }
    if (error.message.includes("Task not found")) {
      return { error: "Aufgabe nicht gefunden." }
    }
    if (error.message.includes("Not authorized")) {
      return { error: "Nicht berechtigt." }
    }
    return { error: "Aufgabe konnte nicht als erledigt markiert werden." }
  }

  const result = data as {
    status: string
    points_awarded: boolean
    points?: number
    new_balance?: number
  }

  // Check and award any newly earned achievements
  let awardedBadges: string[] = []
  try {
    const assigneeId = await (async () => {
      const supabase2 = await createClient()
      const { data: taskData } = await supabase2
        .from("tasks")
        .select("assigned_to")
        .eq("id", taskId)
        .single()
      return taskData?.assigned_to
    })()

    if (assigneeId) {
      const badgeResult = await checkAndAwardAchievementsAction(assigneeId)
      if (!("error" in badgeResult)) {
        awardedBadges = badgeResult.awarded
      }
    }
  } catch {
    // Achievement check is best-effort, don't fail the main action
  }

  return {
    status: "done",
    pointsAwarded: result.points_awarded,
    points: result.points,
    newBalance: result.new_balance,
    awardedBadges,
  }
}

// ============================================================
// PROJ-16: pinWeekChallengeAction – pin/unpin a task as the
// family's week challenge via SECURITY DEFINER RPC
// ============================================================

export async function pinWeekChallengeAction(
  taskId: string | null
): Promise<{ success: true } | { error: string }> {
  const parsed = pinWeekChallengeSchema.safeParse({ taskId })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile) return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  const { error } = await supabase.rpc("pin_week_challenge", {
    p_task_id: parsed.data.taskId,
  })

  if (error) {
    if (error.message.includes("Not authorized")) {
      return { error: "Nur Erwachsene und Admins duerfen diese Aktion ausfuehren." }
    }
    if (error.message.includes("Task not found")) {
      return { error: "Aufgabe nicht gefunden." }
    }
    if (error.message.includes("does not belong")) {
      return { error: "Diese Aufgabe gehoert nicht zu deiner Familie." }
    }
    return { error: "Wochen-Challenge konnte nicht aktualisiert werden." }
  }

  return { success: true }
}
