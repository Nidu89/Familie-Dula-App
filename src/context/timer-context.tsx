"use client"

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react"

// Module-level audio element (single instance, "use client" only)
let alarmAudio: HTMLAudioElement | null = null
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
  playAlarm: () => Promise<boolean>
  stopAlarm: () => void
  resetAlarm: () => void
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

  // Prime alarm audio on user gesture (called during click → allowed by browser)
  const primeAlarm = useCallback(() => {
    if (!alarmAudio) {
      alarmAudio = new Audio("/timer-alarm.mp3")
      alarmAudio.loop = true
    }
    if (alarmAudio.paused) {
      alarmAudio.volume = 0
      alarmAudio.play().then(() => {
        alarmAudio!.pause()
        alarmAudio!.currentTime = 0
        alarmAudio!.volume = 1
      }).catch(() => {})
    }
  }, [])

  // Play alarm sound — returns true if playback started, false if blocked
  const playAlarm = useCallback(async (): Promise<boolean> => {
    if (!alarmAudio) {
      alarmAudio = new Audio("/timer-alarm.mp3")
    }
    alarmAudio.currentTime = 0
    alarmAudio.volume = 1
    alarmAudio.loop = true
    try {
      await alarmAudio.play()
      return true
    } catch {
      return false
    }
  }, [])

  // Stop alarm sound
  const stopAlarm = useCallback(() => {
    if (alarmAudio) {
      alarmAudio.pause()
      alarmAudio.currentTime = 0
    }
  }, [])

  // Reset alarm (for timer reset button)
  const resetAlarm = useCallback(() => {
    stopAlarm()
  }, [stopAlarm])

  // Wrap timer.start to auto-prime alarm during the user gesture
  const startWithAlarm = useCallback((duration: number) => {
    primeAlarm()
    timer.start(duration)
  }, [primeAlarm, timer])

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
        playAlarm,
        stopAlarm,
        resetAlarm,
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
