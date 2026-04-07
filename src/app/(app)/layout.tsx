import { getAppSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { AppShell, type SessionData } from "@/components/layout/app-shell"

/**
 * App group layout — wraps all authenticated pages.
 * Server component: fetches session via cached helper (shared with pages).
 * Passes session to AppShell (client) which provides context providers + nav.
 */
export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const appSession = await getAppSession()

  // Fetch unread notification count in parallel (avoids extra client-side roundtrip)
  let unreadNotificationCount = 0
  if (appSession) {
    const supabase = await createClient()
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", appSession.userId)
      .eq("is_read", false)
    unreadNotificationCount = count || 0
  }

  const session: SessionData = appSession
    ? {
        userId: appSession.userId,
        familyId: appSession.familyId,
        role: appSession.role,
        displayName: appSession.displayName,
        familyName: appSession.familyName,
        locale: appSession.locale,
        unreadNotificationCount,
      }
    : {
        userId: null,
        familyId: null,
        role: "child",
        displayName: "User",
        familyName: null,
        locale: "en",
        unreadNotificationCount: 0,
      }

  return <AppShell session={session}>{children}</AppShell>
}
