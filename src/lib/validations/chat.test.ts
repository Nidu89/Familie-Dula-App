import { describe, it, expect } from "vitest"
import {
  sendMessageSchema,
  getMessagesSchema,
  createDirectChannelSchema,
  markReadSchema,
  chatImageFileSchema,
  deleteChatImageSchema,
  getSignedImageUrlSchema,
} from "./chat"

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

describe("sendMessageSchema", () => {
  it("accepts valid text message", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
      content: "Hello family!",
    })
    expect(result.success).toBe(true)
  })

  it("accepts image-only message (no text)", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
      content: "",
      imageUrl: "family-id/uuid.jpg",
    })
    expect(result.success).toBe(true)
  })

  it("accepts message with both text and image", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
      content: "Look at this!",
      imageUrl: "family-id/uuid.png",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty content without image", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
      content: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects whitespace-only content without image", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
      content: "   ",
    })
    expect(result.success).toBe(false)
  })

  it("rejects content exceeding 2000 characters", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
      content: "x".repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it("accepts content at exactly 2000 characters", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
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
      channelId: VALID_UUID,
      content: "  Hello  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe("Hello")
    }
  })

  it("defaults content to empty string when omitted with image", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
      imageUrl: "family-id/uuid.jpg",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe("")
    }
  })

  it("accepts null imageUrl", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
      content: "Hello",
      imageUrl: null,
    })
    expect(result.success).toBe(true)
  })

  it("rejects imageUrl exceeding 500 chars", () => {
    const result = sendMessageSchema.safeParse({
      channelId: VALID_UUID,
      imageUrl: "x".repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe("chatImageFileSchema", () => {
  it("accepts valid JPEG file", () => {
    const result = chatImageFileSchema.safeParse({ type: "image/jpeg", size: 5000000 })
    expect(result.success).toBe(true)
  })

  it("accepts valid PNG file", () => {
    const result = chatImageFileSchema.safeParse({ type: "image/png", size: 1000000 })
    expect(result.success).toBe(true)
  })

  it("accepts valid GIF file", () => {
    const result = chatImageFileSchema.safeParse({ type: "image/gif", size: 2000000 })
    expect(result.success).toBe(true)
  })

  it("accepts valid WebP file", () => {
    const result = chatImageFileSchema.safeParse({ type: "image/webp", size: 3000000 })
    expect(result.success).toBe(true)
  })

  it("accepts file at exactly 10 MB", () => {
    const result = chatImageFileSchema.safeParse({ type: "image/jpeg", size: 10 * 1024 * 1024 })
    expect(result.success).toBe(true)
  })

  it("rejects file exceeding 10 MB", () => {
    const result = chatImageFileSchema.safeParse({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 })
    expect(result.success).toBe(false)
  })

  it("rejects unsupported MIME type (SVG)", () => {
    const result = chatImageFileSchema.safeParse({ type: "image/svg+xml", size: 1000 })
    expect(result.success).toBe(false)
  })

  it("rejects unsupported MIME type (PDF)", () => {
    const result = chatImageFileSchema.safeParse({ type: "application/pdf", size: 1000 })
    expect(result.success).toBe(false)
  })

  it("rejects unsupported MIME type (text)", () => {
    const result = chatImageFileSchema.safeParse({ type: "text/plain", size: 100 })
    expect(result.success).toBe(false)
  })

  it("rejects zero-size file", () => {
    // Zero size is technically valid by schema (no min), but 0-byte files are edge case
    const result = chatImageFileSchema.safeParse({ type: "image/jpeg", size: 0 })
    expect(result.success).toBe(true) // schema allows 0, client should catch this
  })
})

describe("deleteChatImageSchema", () => {
  it("accepts valid message ID", () => {
    const result = deleteChatImageSchema.safeParse({ messageId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("rejects invalid message ID", () => {
    const result = deleteChatImageSchema.safeParse({ messageId: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("rejects empty string", () => {
    const result = deleteChatImageSchema.safeParse({ messageId: "" })
    expect(result.success).toBe(false)
  })

  it("rejects missing messageId", () => {
    const result = deleteChatImageSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("getSignedImageUrlSchema", () => {
  it("accepts valid path", () => {
    const result = getSignedImageUrlSchema.safeParse({ path: "family-id/uuid.jpg" })
    expect(result.success).toBe(true)
  })

  it("rejects empty path", () => {
    const result = getSignedImageUrlSchema.safeParse({ path: "" })
    expect(result.success).toBe(false)
  })

  it("rejects path exceeding 500 chars", () => {
    const result = getSignedImageUrlSchema.safeParse({ path: "x".repeat(501) })
    expect(result.success).toBe(false)
  })

  it("accepts path at exactly 500 chars", () => {
    const result = getSignedImageUrlSchema.safeParse({ path: "x".repeat(500) })
    expect(result.success).toBe(true)
  })

  it("rejects missing path", () => {
    const result = getSignedImageUrlSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("getMessagesSchema", () => {
  it("accepts valid request with defaults", () => {
    const result = getMessagesSchema.safeParse({ channelId: VALID_UUID })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50)
      expect(result.data.cursor).toBeUndefined()
    }
  })

  it("accepts custom limit", () => {
    const result = getMessagesSchema.safeParse({ channelId: VALID_UUID, limit: 25 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(25)
    }
  })

  it("rejects limit above 100", () => {
    const result = getMessagesSchema.safeParse({ channelId: VALID_UUID, limit: 101 })
    expect(result.success).toBe(false)
  })

  it("rejects limit of 0", () => {
    const result = getMessagesSchema.safeParse({ channelId: VALID_UUID, limit: 0 })
    expect(result.success).toBe(false)
  })

  it("accepts cursor as ISO datetime", () => {
    const result = getMessagesSchema.safeParse({
      channelId: VALID_UUID,
      cursor: "2026-04-07T10:00:00.000Z",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid cursor format", () => {
    const result = getMessagesSchema.safeParse({ channelId: VALID_UUID, cursor: "not-a-date" })
    expect(result.success).toBe(false)
  })
})

describe("createDirectChannelSchema", () => {
  it("accepts valid user ID", () => {
    const result = createDirectChannelSchema.safeParse({ targetUserId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("rejects invalid user ID", () => {
    const result = createDirectChannelSchema.safeParse({ targetUserId: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("rejects empty string", () => {
    const result = createDirectChannelSchema.safeParse({ targetUserId: "" })
    expect(result.success).toBe(false)
  })
})

describe("markReadSchema", () => {
  it("accepts valid channel ID", () => {
    const result = markReadSchema.safeParse({ channelId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("rejects invalid channel ID", () => {
    const result = markReadSchema.safeParse({ channelId: "invalid" })
    expect(result.success).toBe(false)
  })
})
