import { headers } from "next/headers"

// In-Memory Rate-Limiting (per server instance)
const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false
  entry.count++
  return true
}

export async function getIP(): Promise<string> {
  const headersList = await headers()
  const realIP = headersList.get("x-real-ip")
  if (realIP) return realIP.trim()

  const forwarded = headersList.get("x-forwarded-for")
  if (forwarded) {
    const ips = forwarded.split(",")
    return ips[ips.length - 1].trim()
  }

  return "unknown"
}
