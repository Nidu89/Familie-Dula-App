import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

/**
 * Cached session loader — deduplicates DB queries within a single server request.
 * Both the app layout and individual pages call this, but queries only run once.
 */

export type AppSession = {
  userId: string
  email: string
  displayName: string
  familyId: string
  familyName: string
  role: "admin" | "adult" | "child"
  memberCount: number
  locale: "de" | "en" | "fr"
}

export const getAppSession = cache(
  async (): Promise<AppSession | null> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email, family_id, role, locale")
      .eq("id", user.id)
      .single()

    if (!profile?.family_id) return null

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

    if (!family) return null

    return {
      userId: user.id,
      email: profile.email || user.email || "",
      displayName:
        profile.display_name?.trim() ||
        user.email?.split("@")[0] ||
        "User",
      familyId: family.id,
      familyName: family.name,
      role: (["admin", "adult", "child"] as const).includes(
        profile.role as "admin" | "adult" | "child"
      )
        ? (profile.role as "admin" | "adult" | "child")
        : "adult",
      memberCount: count || 0,
      locale: (profile.locale as "de" | "en" | "fr") ?? "en",
    }
  }
)
