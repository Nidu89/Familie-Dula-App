import { describe, it, expect } from "vitest"
import {
  getNotificationsSchema,
  markNotificationReadSchema,
  updatePreferenceSchema,
  NOTIFICATION_TYPES,
} from "./notifications"

// ============================================================
// PROJ-10: Benachrichtigungen – Validation Schema Tests
// ============================================================

describe("getNotificationsSchema", () => {
  it("accepts empty input (defaults)", () => {
    const result = getNotificationsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
      expect(result.data.cursor).toBeUndefined()
    }
  })

  it("accepts valid cursor and limit", () => {
    const result = getNotificationsSchema.safeParse({
      cursor: "2026-04-07T12:00:00.000Z",
      limit: 50,
    })
    expect(result.success).toBe(true)
  })

  it("rejects limit below 1", () => {
    const result = getNotificationsSchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it("rejects limit above 100", () => {
    const result = getNotificationsSchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it("rejects invalid cursor format", () => {
    const result = getNotificationsSchema.safeParse({ cursor: "not-a-date" })
    expect(result.success).toBe(false)
  })
})

describe("markNotificationReadSchema", () => {
  it("accepts valid UUID", () => {
    const result = markNotificationReadSchema.safeParse({
      notificationId: "550e8400-e29b-41d4-a716-446655440000",
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID string", () => {
    const result = markNotificationReadSchema.safeParse({
      notificationId: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty string", () => {
    const result = markNotificationReadSchema.safeParse({
      notificationId: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing notificationId", () => {
    const result = markNotificationReadSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("updatePreferenceSchema", () => {
  it.each(NOTIFICATION_TYPES)(
    "accepts valid type: %s",
    (type) => {
      const result = updatePreferenceSchema.safeParse({
        notificationType: type,
        enabled: true,
      })
      expect(result.success).toBe(true)
    }
  )

  it("accepts enabled: false", () => {
    const result = updatePreferenceSchema.safeParse({
      notificationType: "chat_message",
      enabled: false,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.enabled).toBe(false)
    }
  })

  it("rejects invalid notification type", () => {
    const result = updatePreferenceSchema.safeParse({
      notificationType: "invalid_type",
      enabled: true,
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing enabled field", () => {
    const result = updatePreferenceSchema.safeParse({
      notificationType: "task_assigned",
    })
    expect(result.success).toBe(false)
  })

  it("rejects non-boolean enabled", () => {
    const result = updatePreferenceSchema.safeParse({
      notificationType: "task_assigned",
      enabled: "yes",
    })
    expect(result.success).toBe(false)
  })
})
