"use client"

import { useState, useCallback, useRef, useMemo, useEffect } from "react"
import { useTimer, type UseTimerReturn } from "@/hooks/use-timer"
import { createClient } from "@/lib/supabase/client"
import {
  getActiveRitualSessionAction,
  startRitualSessionAction,
  updateRitualSessionAction,
  endRitualSessionAction,
  type Ritual,
} from "@/lib/actions/rituals"
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

interface UseActiveRitualOptions {
  familyId: string
  rituals: Ritual[]
}

const EMPTY_RITUALS: Ritual[] = []

export function useActiveRitual(options?: UseActiveRitualOptions): UseActiveRitualReturn {
  const familyId = options?.familyId
  const rituals = options?.rituals ?? EMPTY_RITUALS

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

  const lastRitualRef = useRef<Ritual | null>(null)
  const syncingRef = useRef(false)

  // Helper: find ritual by ID from the list
  const findRitual = useCallback(
    (ritualId: string): Ritual | null => {
      return rituals.find((r) => r.id === ritualId) ?? null
    },
    [rituals]
  )

  // Helper: calculate remaining timer seconds from startedAt
  const calcRemainingSeconds = useCallback(
    (ritual: Ritual, startedAt: string): number => {
      if (!ritual.timerDurationMinutes || ritual.timerDurationMinutes <= 0) return 0
      const totalSeconds = ritual.timerDurationMinutes * 60
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      return Math.max(0, totalSeconds - elapsed)
    },
    []
  )

  // Load active session from DB on mount
  useEffect(() => {
    if (!familyId || rituals.length === 0) return

    let cancelled = false

    async function loadSession() {
      const result = await getActiveRitualSessionAction()
      if (cancelled) return
      if ("error" in result || !result.session) return

      const session = result.session
      const ritual = rituals.find((r) => r.id === session.ritualId)
      if (!ritual) return

      lastRitualRef.current = ritual
      const completedSet = new Set(session.completedStepIds)
      const allDone = ritual.steps.length > 0 && completedSet.size >= ritual.steps.length

      setState({
        status: allDone ? "completed" : session.status === "paused" ? "paused" : "running",
        ritual,
        completedStepIds: completedSet,
        startedAt: new Date(session.startedAt).getTime(),
      })

      // Start timer with remaining time if applicable
      if (!allDone && session.status === "running" && ritual.timerDurationMinutes && ritual.timerDurationMinutes > 0) {
        const remaining = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        const totalSeconds = ritual.timerDurationMinutes * 60
        const left = Math.max(0, totalSeconds - remaining)
        if (left > 0) {
          timerStart(left)
        }
      }
    }

    void loadSession()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, rituals.length])

  // Subscribe to Realtime changes on active_ritual_sessions
  useEffect(() => {
    if (!familyId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`ritual_session_${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "active_ritual_sessions",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (syncingRef.current) return
          const row = payload.new as {
            ritual_id: string
            started_at: string
            completed_step_ids: string[]
            status: string
          }
          const ritual = rituals.find((r) => r.id === row.ritual_id)
          if (!ritual) return

          lastRitualRef.current = ritual
          timerReset()

          setState({
            status: "running",
            ritual,
            completedStepIds: new Set(row.completed_step_ids || []),
            startedAt: new Date(row.started_at).getTime(),
          })

          if (ritual.timerDurationMinutes && ritual.timerDurationMinutes > 0) {
            const remaining = Math.floor((Date.now() - new Date(row.started_at).getTime()) / 1000)
            const totalSeconds = ritual.timerDurationMinutes * 60
            const left = Math.max(0, totalSeconds - remaining)
            if (left > 0) {
              timerStart(left)
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "active_ritual_sessions",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (syncingRef.current) return
          const row = payload.new as {
            completed_step_ids: string[]
            status: string
          }

          setState((prev) => {
            if (!prev.ritual) return prev
            const completedSet = new Set(row.completed_step_ids || [])
            const allDone = prev.ritual.steps.length > 0 && completedSet.size >= prev.ritual.steps.length

            return {
              ...prev,
              completedStepIds: completedSet,
              status: allDone ? "completed" : row.status === "paused" ? "paused" : prev.status,
            }
          })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "active_ritual_sessions",
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          if (syncingRef.current) return
          timerReset()
          setState({
            status: "idle",
            ritual: null,
            completedStepIds: new Set(),
            startedAt: null,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, rituals.length])

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

      if (ritual.timerDurationMinutes && ritual.timerDurationMinutes > 0) {
        timerStart(ritual.timerDurationMinutes * 60)
      }

      // Persist to DB (fire-and-forget with sync guard)
      syncingRef.current = true
      void startRitualSessionAction(ritual.id).finally(() => {
        syncingRef.current = false
      })
    },
    [timerReset, timerStart]
  )

  const pauseRitual = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "running") return prev
      return { ...prev, status: "paused" }
    })
    timerPause()

    void updateRitualSessionAction({ status: "paused" })
  }, [timerPause])

  const resumeRitual = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "paused") return prev
      return { ...prev, status: "running" }
    })
    timerResume()

    void updateRitualSessionAction({ status: "running" })
  }, [timerResume])

  const cancelRitual = useCallback(() => {
    timerReset()
    setState({
      status: "idle",
      ritual: null,
      completedStepIds: new Set(),
      startedAt: null,
    })

    syncingRef.current = true
    void endRitualSessionAction().finally(() => {
      syncingRef.current = false
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
          return prev
        }
        newCompleted.add(stepId)

        const totalSteps = prev.ritual?.steps.length ?? 0
        const isAllDone = newCompleted.size >= totalSteps

        // Sync to DB
        syncingRef.current = true
        void updateRitualSessionAction({
          completedStepIds: Array.from(newCompleted),
          ...(isAllDone ? { status: "completed" } : {}),
        }).finally(() => {
          syncingRef.current = false
        })

        return {
          ...prev,
          completedStepIds: newCompleted,
          status: isAllDone ? "completed" : prev.status,
        }
      })
    },
    []
  )

  const resetStep = useCallback((stepId: string) => {
    setState((prev) => {
      if (prev.status === "idle") return prev

      const newCompleted = new Set(prev.completedStepIds)
      newCompleted.delete(stepId)

      let newStatus = prev.status
      if (prev.status === "completed") {
        newStatus = timerState.status === "finished" ? "timer_expired" : "running"
      }

      // Sync to DB
      syncingRef.current = true
      void updateRitualSessionAction({
        completedStepIds: Array.from(newCompleted),
        status: newStatus === "timer_expired" ? "running" : newStatus === "completed" ? "completed" : "running",
      }).finally(() => {
        syncingRef.current = false
      })

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
