import { describe, it, expect } from "vitest"
import {
  createMomentSchema,
  deleteMomentSchema,
  getMomentsSchema,
  toggleReactionSchema,
  momentFileSchema,
} from "./moments"

describe("moments validation schemas", () => {
  // ── createMomentSchema ──────────────────────────────────

  describe("createMomentSchema", () => {
    it("accepts valid moment with all fields", () => {
      const result = createMomentSchema.safeParse({
        title: "Familienausflug zum See",
        description: "Ein wundervoller Tag am Bodensee mit der ganzen Familie.",
        momentDate: "2026-04-13",
      })
      expect(result.success).toBe(true)
    })

    it("accepts moment without description", () => {
      const result = createMomentSchema.safeParse({
        title: "Kurztrip",
        momentDate: "2026-04-13",
      })
      expect(result.success).toBe(true)
    })

    it("rejects empty title", () => {
      const result = createMomentSchema.safeParse({
        title: "",
        momentDate: "2026-04-13",
      })
      expect(result.success).toBe(false)
    })

    it("rejects title longer than 80 characters", () => {
      const result = createMomentSchema.safeParse({
        title: "A".repeat(81),
        momentDate: "2026-04-13",
      })
      expect(result.success).toBe(false)
    })

    it("rejects description longer than 500 characters", () => {
      const result = createMomentSchema.safeParse({
        title: "Test",
        description: "B".repeat(501),
        momentDate: "2026-04-13",
      })
      expect(result.success).toBe(false)
    })

    it("rejects invalid date format", () => {
      const result = createMomentSchema.safeParse({
        title: "Test",
        momentDate: "not-a-date",
      })
      expect(result.success).toBe(false)
    })

    it("rejects missing date", () => {
      const result = createMomentSchema.safeParse({
        title: "Test",
      })
      expect(result.success).toBe(false)
    })
  })

  // ── deleteMomentSchema ──────────────────────────────────

  describe("deleteMomentSchema", () => {
    it("accepts valid UUID", () => {
      const result = deleteMomentSchema.safeParse({
        momentId: "550e8400-e29b-41d4-a716-446655440000",
      })
      expect(result.success).toBe(true)
    })

    it("rejects empty string", () => {
      const result = deleteMomentSchema.safeParse({
        momentId: "",
      })
      expect(result.success).toBe(false)
    })
  })

  // ── getMomentsSchema ────────────────────────────────────

  describe("getMomentsSchema", () => {
    it("accepts valid pagination params", () => {
      const result = getMomentsSchema.safeParse({
        limit: 12,
      })
      expect(result.success).toBe(true)
    })

    it("applies default limit", () => {
      const result = getMomentsSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(12)
      }
    })

    it("accepts cursor for pagination", () => {
      const result = getMomentsSchema.safeParse({
        cursor: "2026-04-13T10:00:00.000Z",
        limit: 12,
      })
      expect(result.success).toBe(true)
    })
  })

  // ── toggleReactionSchema ────────────────────────────────

  describe("toggleReactionSchema", () => {
    it("accepts valid moment ID", () => {
      const result = toggleReactionSchema.safeParse({
        momentId: "550e8400-e29b-41d4-a716-446655440000",
      })
      expect(result.success).toBe(true)
    })

    it("rejects empty moment ID", () => {
      const result = toggleReactionSchema.safeParse({
        momentId: "",
      })
      expect(result.success).toBe(false)
    })
  })

  // ── momentFileSchema ────────────────────────────────────

  describe("momentFileSchema", () => {
    it("accepts valid JPEG", () => {
      const result = momentFileSchema.safeParse({
        type: "image/jpeg",
        size: 1_000_000,
      })
      expect(result.success).toBe(true)
    })

    it("accepts valid PNG", () => {
      const result = momentFileSchema.safeParse({
        type: "image/png",
        size: 2_000_000,
      })
      expect(result.success).toBe(true)
    })

    it("accepts valid WebP", () => {
      const result = momentFileSchema.safeParse({
        type: "image/webp",
        size: 500_000,
      })
      expect(result.success).toBe(true)
    })

    it("rejects file over 5 MB", () => {
      const result = momentFileSchema.safeParse({
        type: "image/jpeg",
        size: 6_000_000,
      })
      expect(result.success).toBe(false)
    })

    it("rejects non-image type", () => {
      const result = momentFileSchema.safeParse({
        type: "application/pdf",
        size: 1_000_000,
      })
      expect(result.success).toBe(false)
    })
  })
})
