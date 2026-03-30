"use client"

import { useEffect, useState } from "react"
import { TimerProvider } from "@/context/timer-context"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopBar } from "@/components/layout/app-top-bar"
import { BottomNav } from "@/components/layout/bottom-nav"

/**
 * App group layout — wraps all authenticated pages.
 * TimerProvider lives here so timer state survives route transitions.
 * Navigation (sidebar, top bar, bottom nav) is rendered here for all pages.
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<{
    familyId: string | null
    role: "admin" | "adult" | "child"
    displayName: string
    familyName: string | null
  } | null>(null)

  useEffect(() => {
    fetch("/api/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSession({
            familyId: data.familyId,
            role: data.role,
            displayName: data.displayName,
            familyName: data.familyName,
          })
        }
      })
      .catch(() => {
        // Session fetch failed — nav and timer won't initialize
      })
  }, [])

  const isAdmin = session?.role === "admin"

  return (
    <TimerProvider
      familyId={session?.familyId ?? null}
      role={session?.role ?? "child"}
    >
      {session?.familyName && (
        <>
          <AppSidebar
            familyName={session.familyName}
            displayName={session.displayName}
            isAdmin={isAdmin}
          />
          <AppTopBar
            displayName={session.displayName}
            familyName={session.familyName}
            isAdmin={isAdmin}
          />
        </>
      )}
      <div className={session?.familyName ? "md:ml-72 pt-20 pb-24 md:pb-8" : ""}>
        {children}
      </div>
      {session?.familyName && <BottomNav />}
    </TimerProvider>
  )
}
