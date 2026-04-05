import { describe, it, expect } from "vitest"
import {
  createTimerTemplateSchema,
  updateTimerTemplateSchema,
  deleteTimerTemplateSchema,
} from "./timer"

describe("createTimerTemplateSchema", () => {
  it("accepts valid input", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "Anziehen",
      durationSeconds: 600,
    })
    expect(result.success).toBe(true)
  })

  it("accepts minimum duration (60 seconds)", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "Quick",
      durationSeconds: 60,
    })
    expect(result.success).toBe(true)
  })

  it("accepts maximum duration (3600 seconds)", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "Long",
      durationSeconds: 3600,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "",
      durationSeconds: 600,
    })
    expect(result.success).toBe(false)
  })

  it("rejects name longer than 50 characters", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "A".repeat(51),
      durationSeconds: 600,
    })
    expect(result.success).toBe(false)
  })

  it("accepts name with exactly 50 characters", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "A".repeat(50),
      durationSeconds: 600,
    })
    expect(result.success).toBe(true)
  })

  it("rejects duration below 60 seconds", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "Too short",
      durationSeconds: 59,
    })
    expect(result.success).toBe(false)
  })

  it("rejects duration above 3600 seconds", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "Too long",
      durationSeconds: 3601,
    })
    expect(result.success).toBe(false)
  })

  it("rejects non-integer duration", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "Float",
      durationSeconds: 90.5,
    })
    expect(result.success).toBe(false)
  })

  it("rejects zero duration", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "Zero",
      durationSeconds: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative duration", () => {
    const result = createTimerTemplateSchema.safeParse({
      name: "Negative",
      durationSeconds: -60,
    })
    expect(result.success).toBe(false)
  })
})

describe("updateTimerTemplateSchema", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000"

  it("accepts valid input with UUID", () => {
    const result = updateTimerTemplateSchema.safeParse({
      id: validUUID,
      name: "Updated",
      durationSeconds: 300,
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid UUID", () => {
    const result = updateTimerTemplateSchema.safeParse({
      id: "not-a-uuid",
      name: "Updated",
      durationSeconds: 300,
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing id", () => {
    const result = updateTimerTemplateSchema.safeParse({
      name: "Updated",
      durationSeconds: 300,
    })
    expect(result.success).toBe(false)
  })

  it("enforces same name and duration constraints as create", () => {
    const tooLong = updateTimerTemplateSchema.safeParse({
      id: validUUID,
      name: "A".repeat(51),
      durationSeconds: 300,
    })
    expect(tooLong.success).toBe(false)

    const tooShort = updateTimerTemplateSchema.safeParse({
      id: validUUID,
      name: "Test",
      durationSeconds: 30,
    })
    expect(tooShort.success).toBe(false)
  })
})

describe("deleteTimerTemplateSchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteTimerTemplateSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid UUID", () => {
    const result = deleteTimerTemplateSchema.safeParse({
      id: "invalid",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing id", () => {
    const result = deleteTimerTemplateSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
