"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { useTimer, type UseTimerReturn } from "@/hooks/use-timer"
import type { Ritual } from "@/lib/actions/rituals"
import type { RitualStep } from "@/lib/validations/rituals"

export type ActiveRitualStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "timer_expired"

export interface ActiveRitualState {
  status: ActiveRitualStatus
  ritual: Ritual | null
  completedStepIds: Set<string>
  startedAt: number | null
}

export interface UseActiveRitualReturn {
  state: ActiveRitualState
  timer: UseTimerReturn
  startRitual: (ritual: Ritual) => void
  pauseRitual: () => void
  resumeRitual: () => void
  cancelRitual: () => void
  toggleStep: (stepId: string) => void
  resetStep: (stepId: string) => void
  restartRitual: () => void
  completedCount: number
  totalSteps: number
  isAllComplete: boolean
}

export function useActiveRitual(): UseActiveRitualReturn {
  // Destructure timer methods for stable callback references (BUG-08 fix)
  const {
    state: timerState,
    start: timerStart,
    pause: timerPause,
    resume: timerResume,
    reset: timerReset,
  } = useTimer()

  const [state, setState] = useState<ActiveRitualState>({
    status: "idle",
    ritual: null,
    completedStepIds: new Set(),
    startedAt: null,
  })

  // Keep a ref to the ritual for restart
  const lastRitualRef = useRef<Ritual | null>(null)

  const startRitual = useCallback(
    (ritual: Ritual) => {
      lastRitualRef.current = ritual
      timerReset()

      setState({
        status: "running",
        ritual,
        completedStepIds: new Set(),
        startedAt: Date.now(),
      })

      // Start timer if the ritual has a duration
      if (ritual.timerDurationMinutes && ritual.timerDurationMinutes > 0) {
        timerStart(ritual.timerDurationMinutes * 60)
      }
    },
    [timerReset, timerStart]
  )

  const pauseRitual = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "running") return prev
      return { ...prev, status: "paused" }
    })
    timerPause()
  }, [timerPause])

  const resumeRitual = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "paused") return prev
      return { ...prev, status: "running" }
    })
    timerResume()
  }, [timerResume])

  const cancelRitual = useCallback(() => {
    timerReset()
    setState({
      status: "idle",
      ritual: null,
      completedStepIds: new Set(),
      startedAt: null,
    })
  }, [timerReset])

  const toggleStep = useCallback(
    (stepId: string) => {
      setState((prev) => {
        if (
          prev.status !== "running" &&
          prev.status !== "paused" &&
          prev.status !== "timer_expired"
        )
          return prev

        const newCompleted = new Set(prev.completedStepIds)
        if (newCompleted.has(stepId)) {
          // Children can't un-check; this is only for adults via resetStep
          return prev
        }
        newCompleted.add(stepId)

        const totalSteps = prev.ritual?.steps.length ?? 0
        const isAllDone = newCompleted.size >= totalSteps

        return {
          ...prev,
          completedStepIds: newCompleted,
          status: isAllDone ? "completed" : prev.status,
        }
      })
    },
    []
  )

  // BUG-06 fix: check timer state when reverting from completed
  const resetStep = useCallback((stepId: string) => {
    setState((prev) => {
      if (prev.status === "idle") return prev

      const newCompleted = new Set(prev.completedStepIds)
      newCompleted.delete(stepId)

      let newStatus = prev.status
      if (prev.status === "completed") {
        // Revert to correct status based on timer state
        newStatus = timerState.status === "finished" ? "timer_expired" : "running"
      }

      return {
        ...prev,
        completedStepIds: newCompleted,
        status: newStatus,
      }
    })
  }, [timerState.status])

  const restartRitual = useCallback(() => {
    const ritual = lastRitualRef.current
    if (!ritual) return
    startRitual(ritual)
  }, [startRitual])

  // Reconstruct stable timer object for consumers (BUG-08 fix)
  const timer: UseTimerReturn = useMemo(
    () => ({
      state: timerState,
      start: timerStart,
      pause: timerPause,
      resume: timerResume,
      reset: timerReset,
    }),
    [timerState, timerStart, timerPause, timerResume, timerReset]
  )

  const totalSteps = state.ritual?.steps.length ?? 0
  const completedCount = state.completedStepIds.size
  const isAllComplete = totalSteps > 0 && completedCount >= totalSteps

  return {
    state,
    timer,
    startRitual,
    pauseRitual,
    resumeRitual,
    cancelRitual,
    toggleStep,
    resetStep,
    restartRitual,
    completedCount,
    totalSteps,
    isAllComplete,
  }
}
