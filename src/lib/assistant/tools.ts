import { createClient } from "@/lib/supabase/server"
import type Anthropic from "@anthropic-ai/sdk"
import {
  listTasksInputSchema,
  createTaskInputSchema,
  listCalendarEventsInputSchema,
  createCalendarEventInputSchema,
  listShoppingItemsInputSchema,
  addShoppingItemInputSchema,
  getMealPlanInputSchema,
  addMealInputSchema,
} from "@/lib/validations/assistant"

// ============================================================
// PROJ-17: KI-Assistent – Agent Tool Implementations
// All tools execute under the identity of the calling user (RLS active).
// ============================================================

type Profile = {
  id: string
  family_id: string
  role: string
  display_name: string | null
}

type ToolResult = {
  success: boolean
  data?: unknown
  error?: string
}

// ============================================================
// Tool Definitions (for Claude API)
// ============================================================

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "list_tasks",
    description:
      "List open tasks for the family. Can filter by status (open, in_progress, done, all) and assignedTo (profile ID).",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["open", "in_progress", "done", "all"],
          description: "Filter by task status. Defaults to 'open'.",
        },
        assignedTo: {
          type: "string",
          description: "Profile ID to filter by assigned person.",
        },
      },
      required: [],
    },
  },
  {
    name: "create_task",
    description:
      "Create a new task for the family. The task is created by the current user. Children can create tasks via the assistant.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Task title (required, max 200 chars).",
        },
        description: {
          type: "string",
          description: "Optional task description.",
        },
        dueDate: {
          type: "string",
          description: "Due date in ISO format (e.g. 2026-04-10).",
        },
        assignedTo: {
          type: "string",
          description:
            "Profile ID of the person to assign. If not provided, the task is unassigned.",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Task priority. Defaults to 'medium'.",
        },
        points: {
          type: "number",
          description: "Reward points for completing the task (0-10000).",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "list_calendar_events",
    description:
      "List upcoming calendar events for the family. Returns events for the next N days (default 7, max 90).",
    input_schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "number",
          description: "Number of days to look ahead (1-90). Defaults to 7.",
        },
      },
      required: [],
    },
  },
  {
    name: "create_calendar_event",
    description:
      "Create a new calendar event for the family. Children can create events via the assistant.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Event title (required, max 200 chars).",
        },
        description: {
          type: "string",
          description: "Optional event description.",
        },
        startAt: {
          type: "string",
          description: "Start time in ISO datetime format (e.g. 2026-04-10T14:00:00).",
        },
        endAt: {
          type: "string",
          description: "End time in ISO datetime format (e.g. 2026-04-10T15:00:00).",
        },
        allDay: {
          type: "boolean",
          description: "Whether this is an all-day event. Defaults to false.",
        },
        category: {
          type: "string",
          enum: ["school", "work", "leisure", "health", "other"],
          description: "Event category. Defaults to 'other'.",
        },
      },
      required: ["title", "startAt", "endAt"],
    },
  },
  {
    name: "list_rituals",
    description: "List all family rituals/routines.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "create_ritual",
    description:
      "Create a new family ritual/routine. Children can create rituals via the assistant.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Ritual name (required, max 80 chars).",
        },
        description: {
          type: "string",
          description: "Optional description (max 300 chars).",
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
            },
            required: ["title"],
          },
          description: "List of steps for the ritual. At least one step is required.",
        },
        timerDurationMinutes: {
          type: "number",
          description: "Optional timer duration in minutes (1-120).",
        },
        rewardPoints: {
          type: "number",
          description: "Optional reward points for completing the ritual (0-100).",
        },
      },
      required: ["name", "steps"],
    },
  },
  {
    name: "list_shopping_lists",
    description:
      "List all shopping lists for the family with their item counts. Use this first to find the list ID before adding items or reading items.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_shopping_items",
    description:
      "List all items in a specific shopping list. Requires the list ID (use list_shopping_lists first to get it).",
    input_schema: {
      type: "object" as const,
      properties: {
        listId: {
          type: "string",
          description: "UUID of the shopping list.",
        },
      },
      required: ["listId"],
    },
  },
  {
    name: "add_shopping_item",
    description:
      "Add an item to a specific shopping list. Requires the list ID (use list_shopping_lists first to get it).",
    input_schema: {
      type: "object" as const,
      properties: {
        listId: {
          type: "string",
          description: "UUID of the shopping list.",
        },
        productName: {
          type: "string",
          description: "Name of the product to add (required, max 200 chars).",
        },
        quantity: {
          type: "string",
          description: "Optional quantity (e.g. '2', '500g').",
        },
        unit: {
          type: "string",
          description: "Optional unit (e.g. 'Stueck', 'kg', 'Liter').",
        },
      },
      required: ["listId", "productName"],
    },
  },
  {
    name: "get_meal_plan",
    description:
      "Get the meal plan for a specific week. Defaults to the current week if no weekKey is provided.",
    input_schema: {
      type: "object" as const,
      properties: {
        weekKey: {
          type: "string",
          description: "Week key in format YYYY-WNN (e.g. 2026-W15). Defaults to current week.",
        },
      },
      required: [],
    },
  },
  {
    name: "add_meal",
    description:
      "Add or update a meal in the meal plan for a specific day and meal type.",
    input_schema: {
      type: "object" as const,
      properties: {
        weekKey: {
          type: "string",
          description: "Week key in format YYYY-WNN (e.g. 2026-W15).",
        },
        weekday: {
          type: "number",
          description: "Day of the week: 0=Monday, 1=Tuesday, ..., 6=Sunday.",
        },
        mealType: {
          type: "string",
          enum: ["breakfast", "lunch", "dinner"],
          description: "Type of meal.",
        },
        freeText: {
          type: "string",
          description: "Name/description of the meal (max 200 chars).",
        },
      },
      required: ["weekKey", "weekday", "mealType", "freeText"],
    },
  },
]

// ============================================================
// Tool Execution
// ============================================================

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "list_tasks":
        return await executeListTasks(toolInput, profile)
      case "create_task":
        return await executeCreateTask(toolInput, profile)
      case "list_calendar_events":
        return await executeListCalendarEvents(toolInput, profile)
      case "create_calendar_event":
        return await executeCreateCalendarEvent(toolInput, profile)
      case "list_rituals":
        return await executeListRituals(profile)
      case "create_ritual":
        return await executeCreateRitual(toolInput, profile)
      case "list_shopping_lists":
        return await executeListShoppingLists(profile)
      case "list_shopping_items":
        return await executeListShoppingItems(toolInput, profile)
      case "add_shopping_item":
        return await executeAddShoppingItem(toolInput, profile)
      case "get_meal_plan":
        return await executeGetMealPlan(toolInput, profile)
      case "add_meal":
        return await executeAddMeal(toolInput, profile)
      default:
        return { success: false, error: `Unknown tool: ${toolName}` }
    }
  } catch (err) {
    console.error(`[PROJ-17] Tool execution error (${toolName}):`, err)
    return {
      success: false,
      error: `Tool '${toolName}' failed unexpectedly.`,
    }
  }
}

// ============================================================
// Helper: get current week key
// ============================================================

function getCurrentWeekKey(): string {
  const now = new Date()
  const year = now.getFullYear()

  // Calculate ISO week number
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )

  return `${year}-W${String(weekNo).padStart(2, "0")}`
}

// ============================================================
// Individual Tool Implementations
// ============================================================

async function executeListTasks(
  input: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  const parsed = listTasksInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Invalid input for list_tasks." }
  }

  const supabase = await createClient()

  let query = supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      description,
      due_date,
      status,
      priority,
      points,
      assigned_to,
      assigned_profile:assigned_to ( display_name ),
      created_at
    `
    )
    .eq("family_id", profile.family_id)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(50)

  if (parsed.data.status && parsed.data.status !== "all") {
    query = query.eq("status", parsed.data.status)
  }

  if (parsed.data.assignedTo) {
    query = query.eq("assigned_to", parsed.data.assignedTo)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: "Could not load tasks." }
  }

  const tasks = (data || []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    dueDate: t.due_date,
    status: t.status,
    priority: t.priority,
    points: t.points,
    assignedTo: t.assigned_to,
    assignedToName: (() => {
      const ap = t.assigned_profile as unknown
      if (Array.isArray(ap))
        return (ap[0] as { display_name: string | null } | undefined)?.display_name || null
      return (ap as { display_name: string | null } | null)?.display_name || null
    })(),
  }))

  return { success: true, data: { tasks, count: tasks.length } }
}

async function executeCreateTask(
  input: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  const parsed = createTaskInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input: " + parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  const supabase = await createClient()

  // Assistant-scoped insert: bypasses verifyAdultOrAdmin check.
  // Any family member (including children) can create tasks via the assistant.
  const { data: task, error: insertError } = await supabase
    .from("tasks")
    .insert({
      family_id: profile.family_id,
      created_by: profile.id,
      assigned_to: parsed.data.assignedTo || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_date: parsed.data.dueDate || null,
      status: "open",
      priority: parsed.data.priority,
      points: parsed.data.points ?? null,
    })
    .select("id, title")
    .single()

  if (insertError || !task) {
    return { success: false, error: "Could not create task." }
  }

  return {
    success: true,
    data: { id: task.id, title: task.title, message: "Task created successfully." },
  }
}

async function executeListCalendarEvents(
  input: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  const parsed = listCalendarEventsInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Invalid input for list_calendar_events." }
  }

  const now = new Date()
  const startDate = now.toISOString()
  const endDate = new Date(
    now.getTime() + parsed.data.days * 24 * 60 * 60 * 1000
  ).toISOString()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("calendar_events")
    .select(
      `
      id,
      title,
      description,
      location,
      start_at,
      end_at,
      all_day,
      category,
      created_at
    `
    )
    .eq("family_id", profile.family_id)
    .gte("start_at", startDate)
    .lte("start_at", endDate)
    .order("start_at", { ascending: true })
    .limit(50)

  if (error) {
    return { success: false, error: "Could not load calendar events." }
  }

  const events = (data || []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startAt: e.start_at,
    endAt: e.end_at,
    allDay: e.all_day,
    category: e.category,
  }))

  return {
    success: true,
    data: { events, count: events.length, periodDays: parsed.data.days },
  }
}

async function executeCreateCalendarEvent(
  input: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  const parsed = createCalendarEventInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input: " + parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  const supabase = await createClient()

  // Assistant-scoped insert: any family member can create events via the assistant.
  const { data: event, error: insertError } = await supabase
    .from("calendar_events")
    .insert({
      family_id: profile.family_id,
      created_by: profile.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt,
      all_day: parsed.data.allDay,
      category: parsed.data.category,
    })
    .select("id, title")
    .single()

  if (insertError || !event) {
    return { success: false, error: "Could not create calendar event." }
  }

  return {
    success: true,
    data: {
      id: event.id,
      title: event.title,
      message: "Calendar event created successfully.",
    },
  }
}

async function executeListRituals(profile: Profile): Promise<ToolResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rituals")
    .select("id, name, description, steps, timer_duration_minutes, reward_points")
    .eq("family_id", profile.family_id)
    .order("sort_order", { ascending: true })
    .limit(50)

  if (error) {
    return { success: false, error: "Could not load rituals." }
  }

  const rituals = (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    steps: r.steps,
    timerDurationMinutes: r.timer_duration_minutes,
    rewardPoints: r.reward_points,
  }))

  return { success: true, data: { rituals, count: rituals.length } }
}

async function executeCreateRitual(
  input: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  // Normalize steps: ensure each step has id and order
  const rawSteps = (input.steps as Array<{ title: string }>) || []
  const normalizedSteps = rawSteps.map((s, i) => ({
    id: crypto.randomUUID(),
    title: s.title,
    order: i,
  }))

  const supabase = await createClient()

  // Get current max sort_order
  const { data: existingRituals } = await supabase
    .from("rituals")
    .select("sort_order")
    .eq("family_id", profile.family_id)
    .order("sort_order", { ascending: false })
    .limit(1)

  const maxSortOrder =
    existingRituals && existingRituals.length > 0
      ? (existingRituals[0].sort_order ?? 0)
      : 0

  // Assistant-scoped insert: any family member can create rituals via the assistant.
  const { data: ritual, error: insertError } = await supabase
    .from("rituals")
    .insert({
      family_id: profile.family_id,
      name: (input.name as string || "").trim(),
      description: ((input.description as string) || "").trim() || null,
      steps: normalizedSteps,
      timer_duration_minutes:
        typeof input.timerDurationMinutes === "number"
          ? input.timerDurationMinutes
          : null,
      reward_points:
        typeof input.rewardPoints === "number" ? input.rewardPoints : null,
      is_system_template: false,
      sort_order: maxSortOrder + 1,
    })
    .select("id, name")
    .single()

  if (insertError || !ritual) {
    return { success: false, error: "Could not create ritual." }
  }

  return {
    success: true,
    data: {
      id: ritual.id,
      name: ritual.name,
      message: "Ritual created successfully.",
    },
  }
}

async function executeListShoppingLists(
  profile: Profile
): Promise<ToolResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("shopping_lists")
    .select(
      `
      id,
      name,
      created_at,
      updated_at,
      shopping_items ( is_done )
    `
    )
    .eq("family_id", profile.family_id)
    .order("updated_at", { ascending: false })
    .limit(20)

  if (error) {
    return { success: false, error: "Could not load shopping lists." }
  }

  const lists = (data || []).map((l) => {
    const items = (l.shopping_items as { is_done: boolean }[]) || []
    return {
      id: l.id,
      name: l.name,
      itemCount: items.length,
      doneCount: items.filter((i) => i.is_done).length,
      updatedAt: l.updated_at,
    }
  })

  return { success: true, data: { lists, count: lists.length } }
}

async function executeListShoppingItems(
  input: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  const parsed = listShoppingItemsInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Invalid input: listId is required (UUID)." }
  }

  const supabase = await createClient()

  // Verify list belongs to family
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id, name")
    .eq("id", parsed.data.listId)
    .eq("family_id", profile.family_id)
    .single()

  if (!list) {
    return { success: false, error: "Shopping list not found." }
  }

  const { data: items, error } = await supabase
    .from("shopping_items")
    .select("id, product_name, quantity, unit, category, is_done")
    .eq("list_id", parsed.data.listId)
    .order("is_done", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    return { success: false, error: "Could not load shopping items." }
  }

  const mappedItems = (items || []).map((i) => ({
    id: i.id,
    productName: i.product_name,
    quantity: i.quantity,
    unit: i.unit,
    category: i.category,
    isDone: i.is_done,
  }))

  return {
    success: true,
    data: {
      listName: list.name,
      items: mappedItems,
      count: mappedItems.length,
    },
  }
}

async function executeAddShoppingItem(
  input: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  const parsed = addShoppingItemInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input: " + parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  const supabase = await createClient()

  // RLS enforces family_id ownership
  const { data: item, error: insertError } = await supabase
    .from("shopping_items")
    .insert({
      list_id: parsed.data.listId,
      product_name: parsed.data.productName,
      quantity: parsed.data.quantity || null,
      unit: parsed.data.unit || null,
      category: null,
      is_done: false,
      created_by: profile.id,
    })
    .select("id, product_name")
    .single()

  if (insertError || !item) {
    return { success: false, error: "Could not add item to shopping list." }
  }

  return {
    success: true,
    data: {
      id: item.id,
      productName: item.product_name,
      message: "Item added to shopping list.",
    },
  }
}

async function executeGetMealPlan(
  input: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  const parsed = getMealPlanInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Invalid input for get_meal_plan." }
  }

  const weekKey = parsed.data.weekKey || getCurrentWeekKey()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("meal_plan_entries")
    .select(
      `
      id,
      week_key,
      weekday,
      meal_type,
      recipe_id,
      free_text,
      recipes ( title )
    `
    )
    .eq("family_id", profile.family_id)
    .eq("week_key", weekKey)
    .limit(21)

  if (error) {
    return { success: false, error: "Could not load meal plan." }
  }

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]

  const entries = (data || []).map((e) => ({
    id: e.id,
    weekday: e.weekday,
    dayName: dayNames[e.weekday] || `Day ${e.weekday}`,
    mealType: e.meal_type,
    meal: (() => {
      const r = e.recipes as unknown
      if (r && typeof r === "object" && "title" in (r as Record<string, unknown>))
        return (r as { title: string }).title
      return e.free_text || null
    })(),
    freeText: e.free_text,
  }))

  return {
    success: true,
    data: { weekKey, entries, count: entries.length },
  }
}

async function executeAddMeal(
  input: Record<string, unknown>,
  profile: Profile
): Promise<ToolResult> {
  const parsed = addMealInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input: " + parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  const supabase = await createClient()

  // Check if an entry already exists for this slot
  const { data: existing } = await supabase
    .from("meal_plan_entries")
    .select("id")
    .eq("family_id", profile.family_id)
    .eq("week_key", parsed.data.weekKey)
    .eq("weekday", parsed.data.weekday)
    .eq("meal_type", parsed.data.mealType)
    .maybeSingle()

  if (existing) {
    // Update existing entry
    const { error: updateError } = await supabase
      .from("meal_plan_entries")
      .update({
        free_text: parsed.data.freeText,
        recipe_id: null,
      })
      .eq("id", existing.id)

    if (updateError) {
      return { success: false, error: "Could not update meal plan entry." }
    }

    return {
      success: true,
      data: { id: existing.id, message: "Meal plan entry updated." },
    }
  }

  // Insert new entry
  const { data: entry, error: insertError } = await supabase
    .from("meal_plan_entries")
    .insert({
      family_id: profile.family_id,
      week_key: parsed.data.weekKey,
      weekday: parsed.data.weekday,
      meal_type: parsed.data.mealType,
      free_text: parsed.data.freeText,
      recipe_id: null,
    })
    .select("id")
    .single()

  if (insertError || !entry) {
    return { success: false, error: "Could not add meal plan entry." }
  }

  return {
    success: true,
    data: { id: entry.id, message: "Meal added to meal plan." },
  }
}

// ============================================================
// Helper: get family members for context
// ============================================================

export async function getFamilyMembers(
  familyId: string
): Promise<{ id: string; displayName: string; role: string }[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("family_id", familyId)
    .limit(20)

  return (data || []).map((p) => ({
    id: p.id,
    displayName: p.display_name || "Unbekannt",
    role: p.role || "child",
  }))
}
