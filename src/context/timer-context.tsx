"use client"

import {
  createContext,
  useContext,
  type ReactNode,
} from "react"
import { useTimer, type TimerState, type UseTimerReturn } from "@/hooks/use-timer"
import {
  useTimerTemplates,
  type TimerTemplate,
} from "@/hooks/use-timer-templates"

interface TimerContextValue {
  timer: UseTimerReturn
  templates: TimerTemplate[]
  templatesLoading: boolean
  templatesError: string | null
  createTemplate: (name: string, durationSeconds: number) => Promise<boolean>
  updateTemplate: (id: string, name: string, durationSeconds: number) => Promise<boolean>
  deleteTemplate: (id: string) => Promise<boolean>
  refetchTemplates: () => Promise<void>
  isAdult: boolean
  familyId: string | null
}

const TimerContext = createContext<TimerContextValue | null>(null)

interface TimerProviderProps {
  children: ReactNode
  familyId: string | null
  role: "admin" | "adult" | "child"
}

export function TimerProvider({ children, familyId, role }: TimerProviderProps) {
  const timer = useTimer()
  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: refetchTemplates,
  } = useTimerTemplates()

  const isAdult = role === "admin" || role === "adult"

  return (
    <TimerContext.Provider
      value={{
        timer,
        templates,
        templatesLoading,
        templatesError,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        refetchTemplates,
        isAdult,
        familyId,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext(): TimerContextValue {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error("useTimerContext must be used within a TimerProvider")
  }
  return context
}

/** Safe version that returns null when outside TimerProvider (e.g. before session loads) */
export function useOptionalTimerContext(): TimerContextValue | null {
  return useContext(TimerContext)
}

export type { TimerState }
