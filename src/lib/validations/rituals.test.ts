import { describe, it, expect } from "vitest"
import { ritualStepSchema, createRitualSchema } from "./rituals"

// ============================================================
// PROJ-19: Test emoji field in ritual step schema
// ============================================================

const validStep = {
  id: "step_1",
  title: "Zähne putzen",
  order: 0,
}

describe("ritualStepSchema – emoji field", () => {
  it("accepts step without emoji (optional)", () => {
    const result = ritualStepSchema.safeParse(validStep)
    expect(result.success).toBe(true)
  })

  it("accepts step with emoji string", () => {
    const result = ritualStepSchema.safeParse({ ...validStep, emoji: "🦷" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.emoji).toBe("🦷")
    }
  })

  it("accepts step with emoji null", () => {
    const result = ritualStepSchema.safeParse({ ...validStep, emoji: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.emoji).toBeNull()
    }
  })

  it("accepts step with emoji undefined (treated as optional)", () => {
    const result = ritualStepSchema.safeParse({ ...validStep, emoji: undefined })
    expect(result.success).toBe(true)
  })

  it("rejects step with non-string emoji (number)", () => {
    const result = ritualStepSchema.safeParse({ ...validStep, emoji: 42 })
    expect(result.success).toBe(false)
  })

  it("accepts step with empty string emoji", () => {
    const result = ritualStepSchema.safeParse({ ...validStep, emoji: "" })
    expect(result.success).toBe(true)
  })

  it("preserves emoji through createRitualSchema", () => {
    const result = createRitualSchema.safeParse({
      name: "Test Ritual",
      steps: [
        { id: "s1", title: "Step 1", order: 0, emoji: "🦷" },
        { id: "s2", title: "Step 2", order: 1, emoji: null },
        { id: "s3", title: "Step 3", order: 2 },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.steps[0].emoji).toBe("🦷")
      expect(result.data.steps[1].emoji).toBeNull()
      expect(result.data.steps[2].emoji).toBeUndefined()
    }
  })

  it("rejects emoji longer than 32 characters (PROJ-19-SEC-02 fix)", () => {
    const longString = "A".repeat(33)
    const result = ritualStepSchema.safeParse({ ...validStep, emoji: longString })
    expect(result.success).toBe(false)
  })

  it("accepts emoji up to 32 characters", () => {
    const maxString = "A".repeat(32)
    const result = ritualStepSchema.safeParse({ ...validStep, emoji: maxString })
    expect(result.success).toBe(true)
  })

  it("preserves durationSeconds alongside emoji", () => {
    const result = ritualStepSchema.safeParse({
      ...validStep,
      emoji: "🚿",
      durationSeconds: 300,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.emoji).toBe("🚿")
      expect(result.data.durationSeconds).toBe(300)
    }
  })
})
