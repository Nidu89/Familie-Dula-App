import { createClient } from "@/lib/supabase/server"
import { AppShell, type SessionData } from "@/components/layout/app-shell"

/**
 * App group layout — wraps all authenticated pages.
 * Server component: fetches session data on the server (no client roundtrip).
 * Passes session to AppShell (client) which provides context providers + nav.
 */
export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let session: SessionData = {
    familyId: null,
    role: "child",
    displayName: "User",
    familyName: null,
    locale: "en",
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id, role, display_name, locale")
      .eq("id", user.id)
      .single()

    if (profile) {
      let familyName: string | null = null
      if (profile.family_id) {
        const { data: family } = await supabase
          .from("families")
          .select("name")
          .eq("id", profile.family_id)
          .single()
        familyName = family?.name ?? null
      }

      session = {
        familyId: profile.family_id,
        role: (["admin", "adult", "child"] as const).includes(
          profile.role as "admin" | "adult" | "child"
        )
          ? (profile.role as "admin" | "adult" | "child")
          : "child",
        displayName:
          profile.display_name?.trim() ||
          user.email?.split("@")[0] ||
          "User",
        familyName,
        locale: (profile.locale as "de" | "en" | "fr") ?? "en",
      }
    }
  }

  return <AppShell session={session}>{children}</AppShell>
}
