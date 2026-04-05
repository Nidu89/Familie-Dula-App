"use client"

import { useState, useEffect, useCallback, useRef, startTransition } from "react"
import {
  getRitualsAction,
  createRitualAction,
  updateRitualAction,
  deleteRitualAction,
  type Ritual,
} from "@/lib/actions/rituals"
import type { RitualStep } from "@/lib/validations/rituals"

export type { Ritual }

interface UseRitualsReturn {
  rituals: Ritual[]
  loading: boolean
  error: string | null
  createRitual: (data: {
    name: string
    description?: string
    steps: RitualStep[]
    timerDurationMinutes?: number | null
    rewardPoints?: number | null
  }) => Promise<boolean>
  updateRitual: (data: {
    id: string
    name: string
    description?: string
    steps: RitualStep[]
    timerDurationMinutes?: number | null
    rewardPoints?: number | null
  }) => Promise<boolean>
  deleteRitual: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
}

const RATE_LIMIT_MS = 1000

export function useRituals(): UseRitualsReturn {
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastMutationRef = useRef<number>(0)

  const fetchRituals = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await getRitualsAction()

    if ("error" in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    setRituals(result.rituals)
    setLoading(false)
  }, [])

  useEffect(() => {
    startTransition(() => {
      void fetchRituals()
    })
  }, [fetchRituals])

  const createRitual = useCallback(
    async (data: {
      name: string
      description?: string
      steps: RitualStep[]
      timerDurationMinutes?: number | null
      rewardPoints?: number | null
    }): Promise<boolean> => {
      const now = Date.now()
      if (now - lastMutationRef.current < RATE_LIMIT_MS) {
        setError("Bitte warte einen Moment.")
        return false
      }
      lastMutationRef.current = now
      setError(null)

      const result = await createRitualAction(data)

      if ("error" in result) {
        setError(result.error)
        return false
      }

      await fetchRituals()
      return true
    },
    [fetchRituals]
  )

  const updateRitual = useCallback(
    async (data: {
      id: string
      name: string
      description?: string
      steps: RitualStep[]
      timerDurationMinutes?: number | null
      rewardPoints?: number | null
    }): Promise<boolean> => {
      const now = Date.now()
      if (now - lastMutationRef.current < RATE_LIMIT_MS) {
        setError("Bitte warte einen Moment.")
        return false
      }
      lastMutationRef.current = now
      setError(null)

      const result = await updateRitualAction(data)

      if ("error" in result) {
        setError(result.error)
        return false
      }

      await fetchRituals()
      return true
    },
    [fetchRituals]
  )

  const deleteRitual = useCallback(
    async (id: string): Promise<boolean> => {
      const now = Date.now()
      if (now - lastMutationRef.current < RATE_LIMIT_MS) {
        setError("Bitte warte einen Moment.")
        return false
      }
      lastMutationRef.current = now
      setError(null)

      const result = await deleteRitualAction({ id })

      if ("error" in result) {
        setError(result.error)
        return false
      }

      await fetchRituals()
      return true
    },
    [fetchRituals]
  )

  return {
    rituals,
    loading,
    error,
    createRitual,
    updateRitual,
    deleteRitual,
    refetch: fetchRituals,
  }
}
