"use server"

import { createClient } from "@/lib/supabase/server"
import { E } from "@/lib/error-codes"

// Simple in-memory rate limit: max 30 calls per user per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (entry.count >= 30) return true
  entry.count++
  return false
}

function sanitizeDisplayName(name: string | null): string {
  if (!name) return "Nutzer"
  return name.trim().replace(/[<>"'&]/g, "").slice(0, 50) || "Nutzer"
}

export type DashboardData = {
  user: {
    id: string
    displayName: string
    email: string
  }
  family: {
    id: string
    name: string
  }
  role: "admin" | "adult" | "child"
  memberCount: number
}

export async function getDashboardDataAction(): Promise<
  DashboardData | { error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: E.AUTH_NOT_LOGGED_IN }
  }

  if (isRateLimited(user.id)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  // Get caller's profile with family info
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, family_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.family_id) {
    return { error: E.AUTH_NO_FAMILY }
  }

  // Load family name and member count in parallel
  const [{ data: family }, { count }] = await Promise.all([
    supabase
      .from("families")
      .select("id, name")
      .eq("id", profile.family_id)
      .single(),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("family_id", profile.family_id),
  ])

  if (!family) {
    return { error: E.FAMILY_NOT_FOUND }
  }

  return {
    user: {
      id: user.id,
      displayName: sanitizeDisplayName(profile.display_name),
      email: profile.email || user.email || "",
    },
    family: {
      id: family.id,
      name: family.name,
    },
    role: (["admin", "adult", "child"] as const).includes(
      profile.role as "admin" | "adult" | "child"
    )
      ? (profile.role as "admin" | "adult" | "child")
      : "adult",
    memberCount: count || 0,
  }
}
