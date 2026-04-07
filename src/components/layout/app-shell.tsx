"use client"

import type { ReactNode } from "react"
import { TimerProvider } from "@/context/timer-context"
import { LocaleProvider } from "@/context/locale-context"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopBar } from "@/components/layout/app-top-bar"
import { BottomNav } from "@/components/layout/bottom-nav"

export interface SessionData {
  userId: string | null
  familyId: string | null
  role: "admin" | "adult" | "child"
  displayName: string
  familyName: string | null
  locale: "de" | "en" | "fr"
  unreadNotificationCount: number
}

interface AppShellProps {
  session: SessionData
  children: ReactNode
}

export function AppShell({ session, children }: AppShellProps) {
  const isAdmin = session.role === "admin"

  return (
    <LocaleProvider initialLocale={session.locale}>
      <TimerProvider
        familyId={session.familyId}
        role={session.role}
      >
        {session.familyName && (
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
              userId={session.userId || ""}
              initialUnreadCount={session.unreadNotificationCount}
            />
          </>
        )}
        <div className={session.familyName ? "md:ml-72 pt-20 pb-24 md:pb-8" : ""}>
          {children}
        </div>
        {session.familyName && <BottomNav />}
      </TimerProvider>
    </LocaleProvider>
  )
}
