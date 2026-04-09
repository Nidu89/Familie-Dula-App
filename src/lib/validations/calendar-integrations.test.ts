import { describe, it, expect } from "vitest"
import {
  connectICloudSchema,
  updateSelectedCalendarsSchema,
  disconnectIntegrationSchema,
  syncIntegrationSchema,
  updateSyncIntervalSchema,
} from "./calendar-integrations"

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

describe("connectICloudSchema", () => {
  it("accepts valid Apple ID and app password", () => {
    const result = connectICloudSchema.safeParse({
      appleId: "user@icloud.com",
      appPassword: "xxxx-xxxx-xxxx-xxxx",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty Apple ID", () => {
    const result = connectICloudSchema.safeParse({
      appleId: "",
      appPassword: "xxxx-xxxx-xxxx-xxxx",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email format", () => {
    const result = connectICloudSchema.safeParse({
      appleId: "not-an-email",
      appPassword: "xxxx-xxxx-xxxx-xxxx",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty app password", () => {
    const result = connectICloudSchema.safeParse({
      appleId: "user@icloud.com",
      appPassword: "",
    })
    expect(result.success).toBe(false)
  })

  it("trims whitespace", () => {
    const result = connectICloudSchema.safeParse({
      appleId: "  user@icloud.com  ",
      appPassword: "  xxxx-xxxx  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.appleId).toBe("user@icloud.com")
      expect(result.data.appPassword).toBe("xxxx-xxxx")
    }
  })
})

describe("updateSelectedCalendarsSchema", () => {
  it("accepts valid selection", () => {
    const result = updateSelectedCalendarsSchema.safeParse({
      integrationId: VALID_UUID,
      selectedCalendars: [{ id: "cal1", name: "Work" }],
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty calendar array", () => {
    const result = updateSelectedCalendarsSchema.safeParse({
      integrationId: VALID_UUID,
      selectedCalendars: [],
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid integration ID", () => {
    const result = updateSelectedCalendarsSchema.safeParse({
      integrationId: "invalid",
      selectedCalendars: [],
    })
    expect(result.success).toBe(false)
  })

  it("rejects calendar with empty ID", () => {
    const result = updateSelectedCalendarsSchema.safeParse({
      integrationId: VALID_UUID,
      selectedCalendars: [{ id: "", name: "Work" }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects calendar with empty name", () => {
    const result = updateSelectedCalendarsSchema.safeParse({
      integrationId: VALID_UUID,
      selectedCalendars: [{ id: "cal1", name: "" }],
    })
    expect(result.success).toBe(false)
  })
})

describe("disconnectIntegrationSchema", () => {
  it("accepts valid UUID", () => {
    const result = disconnectIntegrationSchema.safeParse({ integrationId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("rejects invalid UUID", () => {
    const result = disconnectIntegrationSchema.safeParse({ integrationId: "bad" })
    expect(result.success).toBe(false)
  })
})

describe("syncIntegrationSchema", () => {
  it("accepts valid UUID", () => {
    const result = syncIntegrationSchema.safeParse({ integrationId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("rejects invalid UUID", () => {
    const result = syncIntegrationSchema.safeParse({ integrationId: "" })
    expect(result.success).toBe(false)
  })
})

describe("updateSyncIntervalSchema", () => {
  it("accepts 15 minutes", () => {
    const result = updateSyncIntervalSchema.safeParse({
      integrationId: VALID_UUID,
      syncIntervalMinutes: 15,
    })
    expect(result.success).toBe(true)
  })

  it("accepts 60 minutes", () => {
    const result = updateSyncIntervalSchema.safeParse({
      integrationId: VALID_UUID,
      syncIntervalMinutes: 60,
    })
    expect(result.success).toBe(true)
  })

  it("accepts 30 minutes", () => {
    const result = updateSyncIntervalSchema.safeParse({
      integrationId: VALID_UUID,
      syncIntervalMinutes: 30,
    })
    expect(result.success).toBe(true)
  })

  it("rejects below 15 minutes", () => {
    const result = updateSyncIntervalSchema.safeParse({
      integrationId: VALID_UUID,
      syncIntervalMinutes: 14,
    })
    expect(result.success).toBe(false)
  })

  it("rejects above 60 minutes", () => {
    const result = updateSyncIntervalSchema.safeParse({
      integrationId: VALID_UUID,
      syncIntervalMinutes: 61,
    })
    expect(result.success).toBe(false)
  })

  it("rejects non-integer", () => {
    const result = updateSyncIntervalSchema.safeParse({
      integrationId: VALID_UUID,
      syncIntervalMinutes: 15.5,
    })
    expect(result.success).toBe(false)
  })
})
