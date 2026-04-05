"use client"

import {
  createContext,
  useContext,
  useRef,
  useCallback,
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
  alarmAudioRef: React.RefObject<HTMLAudioElement | null>
}

const TimerContext = createContext<TimerContextValue | null>(null)

interface TimerProviderProps {
  children: ReactNode
  familyId: string | null
  role: "admin" | "adult" | "child"
}

export function TimerProvider({ children, familyId, role }: TimerProviderProps) {
  const timer = useTimer()
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null)
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

  // Prime alarm audio on user gesture (called during click → allowed by browser)
  const primeAlarm = useCallback(() => {
    if (!alarmAudioRef.current) {
      alarmAudioRef.current = new Audio("/timer-alarm.mp3")
      alarmAudioRef.current.loop = true
    }
    const audio = alarmAudioRef.current
    if (audio.paused) {
      audio.volume = 0
      audio.play().then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.volume = 1
      }).catch(() => {})
    }
  }, [])

  // Wrap timer.start to auto-prime alarm during the user gesture
  const startWithAlarm = useCallback((duration: number) => {
    primeAlarm()
    timer.start(duration)
  }, [primeAlarm, timer.start])

  const wrappedTimer: UseTimerReturn = {
    state: timer.state,
    start: startWithAlarm,
    pause: timer.pause,
    resume: timer.resume,
    reset: timer.reset,
  }

  return (
    <TimerContext.Provider
      value={{
        timer: wrappedTimer,
        templates,
        templatesLoading,
        templatesError,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        refetchTemplates,
        isAdult,
        familyId,
        alarmAudioRef,
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
