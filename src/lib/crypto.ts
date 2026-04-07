import { randomBytes, createCipheriv, createDecipheriv } from "crypto"

// ============================================================
// PROJ-17: AES-256-GCM Encryption for API Key Storage
// Key: 32-byte hex string from AI_KEY_ENCRYPTION_SECRET env var
// Format: base64(iv:authTag:ciphertext)
// ============================================================

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits

function getEncryptionKey(): Buffer {
  const secret = process.env.AI_KEY_ENCRYPTION_SECRET
  if (!secret) {
    throw new Error(
      "AI_KEY_ENCRYPTION_SECRET environment variable is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    )
  }

  if (secret.length !== 64) {
    throw new Error(
      "AI_KEY_ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)."
    )
  }

  return Buffer.from(secret, "hex")
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing iv:authTag:ciphertext.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  // Concatenate iv + authTag + ciphertext and encode as base64
  const combined = Buffer.concat([iv, authTag, encrypted])
  return combined.toString("base64")
}

/**
 * Decrypts a base64-encoded string produced by encrypt().
 * Returns the original plaintext.
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedBase64, "base64")

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted data: too short.")
  }

  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}

/**
 * Masks an API key for safe display.
 * Example: "sk-ant-api03-abc123...xyz" -> "sk-ant-...xyz"
 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return "****"
  const prefix = key.substring(0, 6)
  const suffix = key.substring(key.length - 4)
  return `${prefix}...${suffix}`
}
