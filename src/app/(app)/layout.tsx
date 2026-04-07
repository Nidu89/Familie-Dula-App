import { getAppSession } from "@/lib/session"
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

  const session: SessionData = appSession
    ? {
        familyId: appSession.familyId,
        role: appSession.role,
        displayName: appSession.displayName,
        familyName: appSession.familyName,
        locale: appSession.locale,
      }
    : {
        familyId: null,
        role: "child",
        displayName: "User",
        familyName: null,
        locale: "en",
      }

  return <AppShell session={session}>{children}</AppShell>
}
