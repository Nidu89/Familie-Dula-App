import { describe, it, expect } from "vitest"
import {
  saveApiKeySchema,
  chatRequestSchema,
  chatMessageSchema,
  listTasksInputSchema,
  createTaskInputSchema,
  listCalendarEventsInputSchema,
  createCalendarEventInputSchema,
  listShoppingItemsInputSchema,
  addShoppingItemInputSchema,
  getMealPlanInputSchema,
  addMealInputSchema,
} from "./assistant"

// ============================================================
// saveApiKeySchema
// ============================================================

describe("saveApiKeySchema", () => {
  it("accepts valid sk-ant- prefixed key", () => {
    const result = saveApiKeySchema.safeParse({
      apiKey: "sk-ant-api03-abc123def456",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty key", () => {
    const result = saveApiKeySchema.safeParse({ apiKey: "" })
    expect(result.success).toBe(false)
  })

  it("rejects key without sk-ant- prefix", () => {
    const result = saveApiKeySchema.safeParse({ apiKey: "sk-some-other-key" })
    expect(result.success).toBe(false)
  })

  it("rejects key longer than 500 chars", () => {
    const result = saveApiKeySchema.safeParse({
      apiKey: "sk-ant-" + "a".repeat(500),
    })
    expect(result.success).toBe(false)
  })

  it("trims whitespace", () => {
    const result = saveApiKeySchema.safeParse({
      apiKey: "  sk-ant-api03-test  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.apiKey).toBe("sk-ant-api03-test")
    }
  })
})

// ============================================================
// chatMessageSchema
// ============================================================

describe("chatMessageSchema", () => {
  it("accepts user message", () => {
    const result = chatMessageSchema.safeParse({
      role: "user",
      content: "Hello",
    })
    expect(result.success).toBe(true)
  })

  it("accepts assistant message", () => {
    const result = chatMessageSchema.safeParse({
      role: "assistant",
      content: "Hi there!",
    })
    expect(result.success).toBe(true)
  })

  it("rejects unknown role", () => {
    const result = chatMessageSchema.safeParse({
      role: "system",
      content: "test",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty content", () => {
    const result = chatMessageSchema.safeParse({ role: "user", content: "" })
    expect(result.success).toBe(false)
  })

  it("rejects content over 10000 chars", () => {
    const result = chatMessageSchema.safeParse({
      role: "user",
      content: "x".repeat(10001),
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// chatRequestSchema
// ============================================================

describe("chatRequestSchema", () => {
  it("accepts valid request with locale", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "user", content: "Hallo" }],
      locale: "de",
    })
    expect(result.success).toBe(true)
  })

  it("defaults locale to de", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "user", content: "Hi" }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.locale).toBe("de")
    }
  })

  it("rejects empty messages array", () => {
    const result = chatRequestSchema.safeParse({
      messages: [],
      locale: "en",
    })
    expect(result.success).toBe(false)
  })

  it("rejects more than 20 messages", () => {
    const messages = Array.from({ length: 21 }, (_, i) => ({
      role: "user" as const,
      content: `msg ${i}`,
    }))
    const result = chatRequestSchema.safeParse({ messages, locale: "de" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid locale", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "user", content: "test" }],
      locale: "es",
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// Tool Input Schemas
// ============================================================

describe("listTasksInputSchema", () => {
  it("defaults status to open", () => {
    const result = listTasksInputSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe("open")
  })

  it("accepts all valid statuses", () => {
    for (const status of ["open", "in_progress", "done", "all"]) {
      expect(listTasksInputSchema.safeParse({ status }).success).toBe(true)
    }
  })
})

describe("createTaskInputSchema", () => {
  it("accepts minimal task", () => {
    const result = createTaskInputSchema.safeParse({ title: "Test" })
    expect(result.success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = createTaskInputSchema.safeParse({ title: "" })
    expect(result.success).toBe(false)
  })

  it("accepts full task with all fields", () => {
    const result = createTaskInputSchema.safeParse({
      title: "Aufgabe",
      description: "Beschreibung",
      dueDate: "2026-04-10",
      assignedTo: "some-uuid",
      priority: "high",
      points: 50,
    })
    expect(result.success).toBe(true)
  })
})

describe("listCalendarEventsInputSchema", () => {
  it("defaults to 7 days", () => {
    const result = listCalendarEventsInputSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.days).toBe(7)
  })

  it("rejects more than 90 days", () => {
    expect(
      listCalendarEventsInputSchema.safeParse({ days: 91 }).success
    ).toBe(false)
  })
})

describe("createCalendarEventInputSchema", () => {
  it("accepts valid event", () => {
    const result = createCalendarEventInputSchema.safeParse({
      title: "Meeting",
      startAt: "2026-04-10T14:00:00",
      endAt: "2026-04-10T15:00:00",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing startAt", () => {
    const result = createCalendarEventInputSchema.safeParse({
      title: "Meeting",
      endAt: "2026-04-10T15:00:00",
    })
    expect(result.success).toBe(false)
  })
})

describe("listShoppingItemsInputSchema", () => {
  it("accepts valid UUID", () => {
    const result = listShoppingItemsInputSchema.safeParse({
      listId: "550e8400-e29b-41d4-a716-446655440000",
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID", () => {
    const result = listShoppingItemsInputSchema.safeParse({
      listId: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })
})

describe("addShoppingItemInputSchema", () => {
  it("accepts valid item", () => {
    const result = addShoppingItemInputSchema.safeParse({
      listId: "550e8400-e29b-41d4-a716-446655440000",
      productName: "Milch",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty product name", () => {
    const result = addShoppingItemInputSchema.safeParse({
      listId: "550e8400-e29b-41d4-a716-446655440000",
      productName: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("getMealPlanInputSchema", () => {
  it("accepts valid week key", () => {
    const result = getMealPlanInputSchema.safeParse({ weekKey: "2026-W15" })
    expect(result.success).toBe(true)
  })

  it("accepts empty for current week", () => {
    const result = getMealPlanInputSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("rejects invalid format", () => {
    const result = getMealPlanInputSchema.safeParse({ weekKey: "2026-15" })
    expect(result.success).toBe(false)
  })
})

describe("addMealInputSchema", () => {
  it("accepts valid meal", () => {
    const result = addMealInputSchema.safeParse({
      weekKey: "2026-W15",
      weekday: 0,
      mealType: "lunch",
      freeText: "Spaghetti",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid weekday", () => {
    const result = addMealInputSchema.safeParse({
      weekKey: "2026-W15",
      weekday: 7,
      mealType: "lunch",
      freeText: "Test",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid meal type", () => {
    const result = addMealInputSchema.safeParse({
      weekKey: "2026-W15",
      weekday: 0,
      mealType: "snack",
      freeText: "Test",
    })
    expect(result.success).toBe(false)
  })
})
