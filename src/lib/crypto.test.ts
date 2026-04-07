import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// We need to set the env var BEFORE importing the module
const VALID_KEY =
  "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"

describe("crypto", () => {
  const originalEnv = process.env.AI_KEY_ENCRYPTION_SECRET

  beforeEach(() => {
    vi.resetModules()
    process.env.AI_KEY_ENCRYPTION_SECRET = VALID_KEY
  })

  afterEach(() => {
    process.env.AI_KEY_ENCRYPTION_SECRET = originalEnv
  })

  it("encrypt then decrypt returns original plaintext", async () => {
    const { encrypt, decrypt } = await import("./crypto")
    const plaintext = "sk-ant-api03-abc123xyz456"
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it("encrypted output is base64 and different from plaintext", async () => {
    const { encrypt } = await import("./crypto")
    const plaintext = "sk-ant-api03-test"
    const encrypted = encrypt(plaintext)
    // Should be valid base64
    expect(() => Buffer.from(encrypted, "base64")).not.toThrow()
    expect(encrypted).not.toBe(plaintext)
  })

  it("two encryptions of same plaintext produce different ciphertext (random IV)", async () => {
    const { encrypt } = await import("./crypto")
    const plaintext = "sk-ant-api03-same-key"
    const a = encrypt(plaintext)
    const b = encrypt(plaintext)
    expect(a).not.toBe(b)
  })

  it("decrypt fails on tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("./crypto")
    const encrypted = encrypt("sk-ant-test")
    // Tamper with the base64 string
    const tampered =
      encrypted.slice(0, -4) + "XXXX"
    expect(() => decrypt(tampered)).toThrow()
  })

  it("decrypt fails on too-short input", async () => {
    const { decrypt } = await import("./crypto")
    expect(() => decrypt("dG9vc2hvcnQ=")).toThrow("too short")
  })

  it("throws if AI_KEY_ENCRYPTION_SECRET is not set", async () => {
    delete process.env.AI_KEY_ENCRYPTION_SECRET
    const { encrypt } = await import("./crypto")
    expect(() => encrypt("test")).toThrow("AI_KEY_ENCRYPTION_SECRET")
  })

  it("throws if AI_KEY_ENCRYPTION_SECRET is wrong length", async () => {
    process.env.AI_KEY_ENCRYPTION_SECRET = "tooshort"
    const { encrypt } = await import("./crypto")
    expect(() => encrypt("test")).toThrow("64-character hex string")
  })

  it("maskApiKey masks correctly", async () => {
    const { maskApiKey } = await import("./crypto")
    expect(maskApiKey("sk-ant-api03-abc123xyz456789")).toBe("sk-ant...6789")
    expect(maskApiKey("short")).toBe("****")
    expect(maskApiKey("exactly12ch")).toBe("****")
    // "13characters!" = 13 chars, prefix=first 6, suffix=last 4
    expect(maskApiKey("13characters!")).toBe("13char...ers!")
  })
})
