import { describe, it, expect } from "vitest"
import {
  createShoppingListSchema,
  updateShoppingListSchema,
  deleteShoppingListSchema,
  addShoppingItemSchema,
  toggleShoppingItemSchema,
  deleteShoppingItemSchema,
  clearCompletedItemsSchema,
} from "./shopping"

// ============================================================
// createShoppingListSchema
// ============================================================

describe("createShoppingListSchema", () => {
  it("accepts valid list name", () => {
    const result = createShoppingListSchema.safeParse({ name: "Wocheneinkauf" })
    expect(result.success).toBe(true)
  })

  it("trims whitespace from name", () => {
    const result = createShoppingListSchema.safeParse({
      name: "  Wocheneinkauf  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Wocheneinkauf")
    }
  })

  it("rejects empty name", () => {
    const result = createShoppingListSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects whitespace-only name", () => {
    const result = createShoppingListSchema.safeParse({ name: "   " })
    expect(result.success).toBe(false)
  })

  it("rejects name exceeding 100 characters", () => {
    const result = createShoppingListSchema.safeParse({
      name: "a".repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it("accepts name at exactly 100 characters", () => {
    const result = createShoppingListSchema.safeParse({
      name: "a".repeat(100),
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// updateShoppingListSchema
// ============================================================

describe("updateShoppingListSchema", () => {
  it("accepts valid name", () => {
    const result = updateShoppingListSchema.safeParse({ name: "Drogerie" })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = updateShoppingListSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// deleteShoppingListSchema
// ============================================================

describe("deleteShoppingListSchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteShoppingListSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID string", () => {
    const result = deleteShoppingListSchema.safeParse({ id: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("rejects empty string", () => {
    const result = deleteShoppingListSchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// addShoppingItemSchema
// ============================================================

describe("addShoppingItemSchema", () => {
  it("accepts valid item with all fields", () => {
    const result = addShoppingItemSchema.safeParse({
      listId: "550e8400-e29b-41d4-a716-446655440000",
      productName: "Milch",
      quantity: "2",
      unit: "Liter",
      category: "dairy",
    })
    expect(result.success).toBe(true)
  })

  it("accepts item with only required fields", () => {
    const result = addShoppingItemSchema.safeParse({
      listId: "550e8400-e29b-41d4-a716-446655440000",
      productName: "Brot",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty product name", () => {
    const result = addShoppingItemSchema.safeParse({
      listId: "550e8400-e29b-41d4-a716-446655440000",
      productName: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects product name exceeding 200 characters", () => {
    const result = addShoppingItemSchema.safeParse({
      listId: "550e8400-e29b-41d4-a716-446655440000",
      productName: "a".repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid list ID", () => {
    const result = addShoppingItemSchema.safeParse({
      listId: "not-a-uuid",
      productName: "Milch",
    })
    expect(result.success).toBe(false)
  })

  it("rejects quantity exceeding 20 characters", () => {
    const result = addShoppingItemSchema.safeParse({
      listId: "550e8400-e29b-41d4-a716-446655440000",
      productName: "Milch",
      quantity: "a".repeat(21),
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// toggleShoppingItemSchema
// ============================================================

describe("toggleShoppingItemSchema", () => {
  it("accepts valid toggle to done", () => {
    const result = toggleShoppingItemSchema.safeParse({
      itemId: "550e8400-e29b-41d4-a716-446655440000",
      isDone: true,
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid toggle to undone", () => {
    const result = toggleShoppingItemSchema.safeParse({
      itemId: "550e8400-e29b-41d4-a716-446655440000",
      isDone: false,
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID item ID", () => {
    const result = toggleShoppingItemSchema.safeParse({
      itemId: "abc",
      isDone: true,
    })
    expect(result.success).toBe(false)
  })

  it("rejects non-boolean isDone", () => {
    const result = toggleShoppingItemSchema.safeParse({
      itemId: "550e8400-e29b-41d4-a716-446655440000",
      isDone: "yes",
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// deleteShoppingItemSchema
// ============================================================

describe("deleteShoppingItemSchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteShoppingItemSchema.safeParse({
      itemId: "550e8400-e29b-41d4-a716-446655440000",
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID", () => {
    const result = deleteShoppingItemSchema.safeParse({
      itemId: "invalid",
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// clearCompletedItemsSchema
// ============================================================

describe("clearCompletedItemsSchema", () => {
  it("accepts valid UUID", () => {
    const result = clearCompletedItemsSchema.safeParse({
      listId: "550e8400-e29b-41d4-a716-446655440000",
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID", () => {
    const result = clearCompletedItemsSchema.safeParse({
      listId: "not-valid",
    })
    expect(result.success).toBe(false)
  })
})
