import { describe, it, expect } from "vitest"
import {
  sendMessageSchema,
  getMessagesSchema,
  createDirectChannelSchema,
  markReadSchema,
} from "./chat"

describe("sendMessageSchema", () => {
  it("accepts valid message", () => {
    const result = sendMessageSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      content: "Hello family!",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty content", () => {
    const result = sendMessageSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      content: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects whitespace-only content", () => {
    const result = sendMessageSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      content: "   ",
    })
    expect(result.success).toBe(false)
  })

  it("rejects content exceeding 2000 characters", () => {
    const result = sendMessageSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      content: "x".repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it("accepts content at exactly 2000 characters", () => {
    const result = sendMessageSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      content: "x".repeat(2000),
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid channel ID", () => {
    const result = sendMessageSchema.safeParse({
      channelId: "not-a-uuid",
      content: "Hello",
    })
    expect(result.success).toBe(false)
  })

  it("trims content whitespace", () => {
    const result = sendMessageSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      content: "  Hello  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe("Hello")
    }
  })
})

describe("getMessagesSchema", () => {
  it("accepts valid request with defaults", () => {
    const result = getMessagesSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
      expect(result.data.cursor).toBeUndefined()
    }
  })

  it("accepts custom limit", () => {
    const result = getMessagesSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      limit: 25,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(25)
    }
  })

  it("rejects limit above 100", () => {
    const result = getMessagesSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      limit: 101,
    })
    expect(result.success).toBe(false)
  })

  it("rejects limit of 0", () => {
    const result = getMessagesSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      limit: 0,
    })
    expect(result.success).toBe(false)
  })

  it("accepts cursor as ISO datetime", () => {
    const result = getMessagesSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      cursor: "2026-04-07T10:00:00.000Z",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid cursor format", () => {
    const result = getMessagesSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      cursor: "not-a-date",
    })
    expect(result.success).toBe(false)
  })
})

describe("createDirectChannelSchema", () => {
  it("accepts valid user ID", () => {
    const result = createDirectChannelSchema.safeParse({
      targetUserId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid user ID", () => {
    const result = createDirectChannelSchema.safeParse({
      targetUserId: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty string", () => {
    const result = createDirectChannelSchema.safeParse({
      targetUserId: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("markReadSchema", () => {
  it("accepts valid channel ID", () => {
    const result = markReadSchema.safeParse({
      channelId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid channel ID", () => {
    const result = markReadSchema.safeParse({
      channelId: "invalid",
    })
    expect(result.success).toBe(false)
  })
})
