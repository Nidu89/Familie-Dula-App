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
  assignedTo: string | null
  assignedToName: string | null
}

export interface UseActiveRitualReturn {
  state: ActiveRitualState
  timer: UseTimerReturn
  startRitual: (ritual: Ritual, assignedTo?: string | null, assignedToName?: string | null) => void
  pauseRitual: () => void
  resumeRitual: () => void
  cancelRitual: () => void
  toggleStep: (stepId: string) => void
  resetStep: (stepId: string) => void
  restartRitual: () => void
  completedCount: number
  totalSteps: number
  isAllComplete: boolean
  /** For per-step timer: the step currently being timed */
  activeTimerStep: RitualStep | null
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
    assignedTo: null,
    assignedToName: null,
  })

  const lastRitualRef = useRef<Ritual | null>(null)
  const lastAssignedToRef = useRef<{ id: string | null; name: string | null }>({ id: null, name: null })
  const syncingRef = useRef(false)
  // Tracks which step ID the per-step timer is currently timing
  const stepTimerIdRef = useRef<string | null>(null)

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

  // Per-step timer: find the first uncompleted step that has a duration
  const getActiveTimerStep = useCallback(
    (ritual: Ritual | null, completedIds: Set<string>): RitualStep | null => {
      if (!ritual) return null
      // Only use per-step timers when there's no global timer
      if (ritual.timerDurationMinutes && ritual.timerDurationMinutes > 0) return null
      const sorted = [...ritual.steps].sort((a, b) => a.order - b.order)
      return sorted.find((s) => !completedIds.has(s.id)) ?? null
    },
    []
  )

  // Start per-step timer for the given step (if it has a duration)
  const startStepTimer = useCallback(
    (step: RitualStep | null) => {
      if (step?.durationSeconds && step.durationSeconds > 0) {
        stepTimerIdRef.current = step.id
        timerReset()
        timerStart(step.durationSeconds)
      } else {
        stepTimerIdRef.current = null
        timerReset()
      }
    },
    [timerReset, timerStart]
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
      lastAssignedToRef.current = { id: session.assignedTo, name: session.assignedToName }
      const completedSet = new Set(session.completedStepIds)
      const allDone = ritual.steps.length > 0 && completedSet.size >= ritual.steps.length

      setState({
        status: allDone ? "completed" : session.status === "paused" ? "paused" : "running",
        ritual,
        completedStepIds: completedSet,
        startedAt: new Date(session.startedAt).getTime(),
        assignedTo: session.assignedTo,
        assignedToName: session.assignedToName,
      })

      // Start timer with remaining time if applicable
      if (!allDone && session.status === "running") {
        if (ritual.timerDurationMinutes && ritual.timerDurationMinutes > 0) {
          // Global timer
          const remaining = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
          const totalSeconds = ritual.timerDurationMinutes * 60
          const left = Math.max(0, totalSeconds - remaining)
          if (left > 0) {
            timerStart(left)
          }
        } else {
          // Per-step timer: start the first uncompleted step's timer
          const sorted = [...ritual.steps].sort((a, b) => a.order - b.order)
          const currentStep = sorted.find((s) => !completedSet.has(s.id))
          if (currentStep?.durationSeconds && currentStep.durationSeconds > 0) {
            stepTimerIdRef.current = currentStep.id
            timerStart(currentStep.durationSeconds)
          }
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
            assigned_to: string | null
            assigned_to_name: string | null
          }
          const ritual = rituals.find((r) => r.id === row.ritual_id)
          if (!ritual) return

          lastRitualRef.current = ritual
          lastAssignedToRef.current = { id: row.assigned_to, name: row.assigned_to_name }
          timerReset()

          setState({
            status: "running",
            ritual,
            completedStepIds: new Set(row.completed_step_ids || []),
            startedAt: new Date(row.started_at).getTime(),
            assignedTo: row.assigned_to,
            assignedToName: row.assigned_to_name,
          })

          if (ritual.timerDurationMinutes && ritual.timerDurationMinutes > 0) {
            const remaining = Math.floor((Date.now() - new Date(row.started_at).getTime()) / 1000)
            const totalSeconds = ritual.timerDurationMinutes * 60
            const left = Math.max(0, totalSeconds - remaining)
            if (left > 0) {
              timerStart(left)
            }
          } else {
            // Per-step timer
            const sorted = [...ritual.steps].sort((a, b) => a.order - b.order)
            const firstStep = sorted[0]
            if (firstStep?.durationSeconds && firstStep.durationSeconds > 0) {
              stepTimerIdRef.current = firstStep.id
              timerStart(firstStep.durationSeconds)
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
            assigned_to: string | null
            assigned_to_name: string | null
          }

          setState((prev) => {
            if (!prev.ritual) return prev
            const completedSet = new Set(row.completed_step_ids || [])
            const allDone = prev.ritual.steps.length > 0 && completedSet.size >= prev.ritual.steps.length

            // Handle per-step timer advancement for remote updates
            if (!prev.ritual.timerDurationMinutes && completedSet.size > prev.completedStepIds.size) {
              const sorted = [...prev.ritual.steps].sort((a, b) => a.order - b.order)
              const nextStep = sorted.find((s) => !completedSet.has(s.id))
              if (nextStep?.durationSeconds && nextStep.durationSeconds > 0 && !allDone) {
                stepTimerIdRef.current = nextStep.id
                timerReset()
                timerStart(nextStep.durationSeconds)
              } else {
                stepTimerIdRef.current = null
                timerReset()
              }
            }

            return {
              ...prev,
              completedStepIds: completedSet,
              status: allDone ? "completed" : row.status === "paused" ? "paused" : prev.status,
              assignedTo: row.assigned_to ?? prev.assignedTo,
              assignedToName: row.assigned_to_name ?? prev.assignedToName,
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
          stepTimerIdRef.current = null
          setState({
            status: "idle",
            ritual: null,
            completedStepIds: new Set(),
            startedAt: null,
            assignedTo: null,
            assignedToName: null,
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
    (ritual: Ritual, assignedTo?: string | null, assignedToName?: string | null) => {
      lastRitualRef.current = ritual
      lastAssignedToRef.current = { id: assignedTo ?? null, name: assignedToName ?? null }
      timerReset()
      stepTimerIdRef.current = null

      setState({
        status: "running",
        ritual,
        completedStepIds: new Set(),
        startedAt: Date.now(),
        assignedTo: assignedTo ?? null,
        assignedToName: assignedToName ?? null,
      })

      if (ritual.timerDurationMinutes && ritual.timerDurationMinutes > 0) {
        // Global timer
        timerStart(ritual.timerDurationMinutes * 60)
      } else {
        // Per-step timer: start first step's timer
        const sorted = [...ritual.steps].sort((a, b) => a.order - b.order)
        const firstStep = sorted[0]
        if (firstStep?.durationSeconds && firstStep.durationSeconds > 0) {
          stepTimerIdRef.current = firstStep.id
          timerStart(firstStep.durationSeconds)
        }
      }

      // Persist to DB (fire-and-forget with sync guard)
      syncingRef.current = true
      void startRitualSessionAction(ritual.id, assignedTo, assignedToName).finally(() => {
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
    stepTimerIdRef.current = null
    setState({
      status: "idle",
      ritual: null,
      completedStepIds: new Set(),
      startedAt: null,
      assignedTo: null,
      assignedToName: null,
    })

    syncingRef.current = true
    void endRitualSessionAction().finally(() => {
      syncingRef.current = false
    })
  }, [timerReset])

  const toggleStep = useCallback(
    (stepId: string) => {
      let nextStepForTimer: RitualStep | null = null
      let shouldAdvanceStepTimer = false

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

        // Determine per-step timer advancement
        if (!isAllDone && prev.ritual && !prev.ritual.timerDurationMinutes) {
          shouldAdvanceStepTimer = true
          const sorted = [...prev.ritual.steps].sort((a, b) => a.order - b.order)
          nextStepForTimer = sorted.find((s) => !newCompleted.has(s.id)) ?? null
        } else if (isAllDone) {
          shouldAdvanceStepTimer = true
          nextStepForTimer = null
        }

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

      // Manage per-step timer outside setState (variables are set synchronously by updater)
      if (shouldAdvanceStepTimer) {
        const step = nextStepForTimer as RitualStep | null
        if (step?.durationSeconds && step.durationSeconds > 0) {
          stepTimerIdRef.current = step.id
          timerReset()
          timerStart(step.durationSeconds)
        } else {
          stepTimerIdRef.current = null
          timerReset()
        }
      }
    },
    [timerReset, timerStart]
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
    startRitual(ritual, lastAssignedToRef.current.id, lastAssignedToRef.current.name)
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

  // Active timer step for per-step timer display
  const activeTimerStep = useMemo(
    () => getActiveTimerStep(state.ritual, state.completedStepIds),
    [getActiveTimerStep, state.ritual, state.completedStepIds]
  )

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
    activeTimerStep,
  }
}
