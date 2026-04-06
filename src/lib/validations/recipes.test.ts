import { describe, it, expect } from "vitest"
import {
  createRecipeSchema,
  updateRecipeSchema,
  deleteRecipeSchema,
  upsertMealPlanEntrySchema,
  deleteMealPlanEntrySchema,
} from "./recipes"

// ============================================================
// PROJ-8: Essens- & Rezeptplanung – Validation Schema Tests
// ============================================================

describe("createRecipeSchema", () => {
  it("accepts valid recipe with all fields", () => {
    const result = createRecipeSchema.safeParse({
      title: "Spaghetti Bolognese",
      description: "Ein klassisches Rezept.",
      tags: ["schnell", "familienrezept"],
      imageUrl: "https://example.com/image.jpg",
      ingredients: [
        { name: "Spaghetti", quantity: "500", unit: "g" },
        { name: "Hackfleisch", quantity: "400", unit: "g" },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("accepts recipe with only title", () => {
    const result = createRecipeSchema.safeParse({ title: "Minimales Rezept" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe("")
      expect(result.data.tags).toEqual([])
      expect(result.data.imageUrl).toBeNull()
      expect(result.data.ingredients).toEqual([])
    }
  })

  it("rejects empty title", () => {
    const result = createRecipeSchema.safeParse({ title: "" })
    expect(result.success).toBe(false)
  })

  it("rejects whitespace-only title", () => {
    const result = createRecipeSchema.safeParse({ title: "   " })
    expect(result.success).toBe(false)
  })

  it("rejects title exceeding 200 characters", () => {
    const result = createRecipeSchema.safeParse({ title: "A".repeat(201) })
    expect(result.success).toBe(false)
  })

  it("rejects description exceeding 2000 characters", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test",
      description: "A".repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it("rejects more than 20 tags", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`)
    const result = createRecipeSchema.safeParse({ title: "Test", tags })
    expect(result.success).toBe(false)
  })

  it("rejects tag exceeding 50 characters", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test",
      tags: ["A".repeat(51)],
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid imageUrl", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test",
      imageUrl: "not-a-url",
    })
    expect(result.success).toBe(false)
  })

  it("accepts null imageUrl", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test",
      imageUrl: null,
    })
    expect(result.success).toBe(true)
  })

  it("rejects more than 100 ingredients", () => {
    const ingredients = Array.from({ length: 101 }, (_, i) => ({
      name: `Zutat ${i}`,
    }))
    const result = createRecipeSchema.safeParse({
      title: "Test",
      ingredients,
    })
    expect(result.success).toBe(false)
  })

  it("rejects ingredient with empty name", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test",
      ingredients: [{ name: "" }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects ingredient name exceeding 200 characters", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test",
      ingredients: [{ name: "A".repeat(201) }],
    })
    expect(result.success).toBe(false)
  })

  it("accepts ingredients with optional quantity and unit", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test",
      ingredients: [{ name: "Salz" }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ingredients[0].quantity).toBe("")
      expect(result.data.ingredients[0].unit).toBe("")
    }
  })
})

describe("updateRecipeSchema", () => {
  it("is identical to createRecipeSchema", () => {
    const data = { title: "Updated Recipe", tags: ["vegan"] }
    const createResult = createRecipeSchema.safeParse(data)
    const updateResult = updateRecipeSchema.safeParse(data)
    expect(createResult.success).toBe(updateResult.success)
  })
})

describe("deleteRecipeSchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteRecipeSchema.safeParse({
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID string", () => {
    const result = deleteRecipeSchema.safeParse({ id: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("rejects empty string", () => {
    const result = deleteRecipeSchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })
})

describe("upsertMealPlanEntrySchema", () => {
  it("accepts valid entry with recipe", () => {
    const result = upsertMealPlanEntrySchema.safeParse({
      weekKey: "2026-W15",
      weekday: 0,
      mealType: "breakfast",
      recipeId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid entry with free text", () => {
    const result = upsertMealPlanEntrySchema.safeParse({
      weekKey: "2026-W15",
      weekday: 3,
      mealType: "dinner",
      freeText: "Reste vom Vortag",
    })
    expect(result.success).toBe(true)
  })

  it("accepts entry with neither recipe nor text", () => {
    const result = upsertMealPlanEntrySchema.safeParse({
      weekKey: "2026-W01",
      weekday: 6,
      mealType: "lunch",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid week key format", () => {
    const cases = ["2026-15", "W15", "2026W15", "abc", "2026-W100"]
    for (const weekKey of cases) {
      const result = upsertMealPlanEntrySchema.safeParse({
        weekKey,
        weekday: 0,
        mealType: "breakfast",
      })
      expect(result.success).toBe(false)
    }
  })

  it("rejects weekday out of range", () => {
    for (const weekday of [-1, 7, 8, 100]) {
      const result = upsertMealPlanEntrySchema.safeParse({
        weekKey: "2026-W15",
        weekday,
        mealType: "breakfast",
      })
      expect(result.success).toBe(false)
    }
  })

  it("accepts all valid weekdays (0-6)", () => {
    for (let weekday = 0; weekday <= 6; weekday++) {
      const result = upsertMealPlanEntrySchema.safeParse({
        weekKey: "2026-W15",
        weekday,
        mealType: "lunch",
      })
      expect(result.success).toBe(true)
    }
  })

  it("rejects invalid meal type", () => {
    const result = upsertMealPlanEntrySchema.safeParse({
      weekKey: "2026-W15",
      weekday: 0,
      mealType: "snack",
    })
    expect(result.success).toBe(false)
  })

  it("accepts all valid meal types", () => {
    for (const mealType of ["breakfast", "lunch", "dinner"]) {
      const result = upsertMealPlanEntrySchema.safeParse({
        weekKey: "2026-W15",
        weekday: 0,
        mealType,
      })
      expect(result.success).toBe(true)
    }
  })

  it("rejects non-UUID recipeId", () => {
    const result = upsertMealPlanEntrySchema.safeParse({
      weekKey: "2026-W15",
      weekday: 0,
      mealType: "breakfast",
      recipeId: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })

  it("rejects free text exceeding 200 characters", () => {
    const result = upsertMealPlanEntrySchema.safeParse({
      weekKey: "2026-W15",
      weekday: 0,
      mealType: "breakfast",
      freeText: "A".repeat(201),
    })
    expect(result.success).toBe(false)
  })
})

describe("deleteMealPlanEntrySchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteMealPlanEntrySchema.safeParse({
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID string", () => {
    const result = deleteMealPlanEntrySchema.safeParse({ id: "abc" })
    expect(result.success).toBe(false)
  })
})
