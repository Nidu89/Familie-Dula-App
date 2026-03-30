"use client"

import { useEffect, useState } from "react"
import { TimerProvider } from "@/context/timer-context"

/**
 * App group layout — wraps all authenticated pages.
 * TimerProvider lives here so timer state survives route transitions.
 * familyId and role are loaded once from the cookie-based session.
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<{
    familyId: string | null
    role: "admin" | "adult" | "child"
  } | null>(null)

  useEffect(() => {
    // Fetch session info once on mount
    fetch("/api/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSession({ familyId: data.familyId, role: data.role })
        }
      })
      .catch(() => {
        // Session fetch failed — timer just won't initialize
      })
  }, [])

  // Before session loads, render children without timer context
  if (!session) {
    return <>{children}</>
  }

  return (
    <TimerProvider familyId={session.familyId} role={session.role}>
      {children}
    </TimerProvider>
  )
}
