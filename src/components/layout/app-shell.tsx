"use client"

import type { ReactNode } from "react"
import { TimerProvider } from "@/context/timer-context"
import { LocaleProvider } from "@/context/locale-context"
import { SessionProvider } from "@/context/session-context"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopBar } from "@/components/layout/app-top-bar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AssistantButton } from "@/components/assistant/assistant-button"

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
      <SessionProvider session={session}>
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
          <div className={session.familyName ? "md:ml-72 pt-20 pb-24 md:pb-8 overflow-x-hidden" : ""}>
            {children}
          </div>
          {session.familyName && (
            <>
              <BottomNav />
              <AssistantButton />
            </>
          )}
        </TimerProvider>
      </SessionProvider>
    </LocaleProvider>
  )
}
