"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { SessionData } from "@/components/layout/app-shell"

const SessionContext = createContext<SessionData | null>(null)

interface SessionProviderProps {
  session: SessionData
  children: ReactNode
}

export function SessionProvider({ session, children }: SessionProviderProps) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionData {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
