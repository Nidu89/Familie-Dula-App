"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export type TimerStatus = "idle" | "running" | "paused" | "finished"

export interface TimerState {
  status: TimerStatus
  totalSeconds: number
  remainingSeconds: number
}

export interface UseTimerReturn {
  state: TimerState
  start: (durationSeconds: number) => void
  pause: () => void
  resume: () => void
  reset: () => void
}

export function useTimer(): UseTimerReturn {
  const [state, setState] = useState<TimerState>({
    status: "idle",
    totalSeconds: 0,
    remainingSeconds: 0,
  })

  const endTimeRef = useRef<number | null>(null)
  const pausedRemainingRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    if (!endTimeRef.current) return

    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))

    if (remaining <= 0) {
      clearTimer()
      endTimeRef.current = null
      setState((prev) => ({
        ...prev,
        remainingSeconds: 0,
        status: "finished",
      }))
    } else {
      setState((prev) => ({
        ...prev,
        remainingSeconds: remaining,
      }))
    }
  }, [clearTimer])

  const start = useCallback(
    (durationSeconds: number) => {
      clearTimer()
      const now = Date.now()
      endTimeRef.current = now + durationSeconds * 1000

      setState({
        status: "running",
        totalSeconds: durationSeconds,
        remainingSeconds: durationSeconds,
      })

      intervalRef.current = setInterval(tick, 250)
    },
    [clearTimer, tick]
  )

  const pause = useCallback(() => {
    if (!endTimeRef.current) return
    clearTimer()

    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
    pausedRemainingRef.current = remaining
    endTimeRef.current = null

    setState((prev) => ({
      ...prev,
      remainingSeconds: remaining,
      status: "paused",
    }))
  }, [clearTimer])

  const resume = useCallback(() => {
    const remaining = pausedRemainingRef.current
    if (remaining <= 0) return

    const now = Date.now()
    endTimeRef.current = now + remaining * 1000

    setState((prev) => ({
      ...prev,
      status: "running",
    }))

    intervalRef.current = setInterval(tick, 250)
  }, [tick])

  const reset = useCallback(() => {
    clearTimer()
    endTimeRef.current = null
    pausedRemainingRef.current = 0

    setState({
      status: "idle",
      totalSeconds: 0,
      remainingSeconds: 0,
    })
  }, [clearTimer])

  // Recalculate on tab focus (handles background tab drift + iOS Safari app-switch)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && endTimeRef.current) {
        tick()
      }
    }
    // pageshow fires on iOS Safari bfcache restore (back/forward navigation)
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted && endTimeRef.current) {
        tick()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("pageshow", handlePageShow)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [tick])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return { state, start, pause, resume, reset }
}
