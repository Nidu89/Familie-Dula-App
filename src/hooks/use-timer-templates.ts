"use client"

import { useState, useEffect, useCallback, useRef, startTransition } from "react"
import {
  getTimerTemplatesAction,
  createTimerTemplateAction,
  updateTimerTemplateAction,
  deleteTimerTemplateAction,
  type TimerTemplate,
} from "@/lib/actions/timer"

export type { TimerTemplate }

interface UseTimerTemplatesReturn {
  templates: TimerTemplate[]
  loading: boolean
  error: string | null
  createTemplate: (name: string, durationSeconds: number) => Promise<boolean>
  updateTemplate: (
    id: string,
    name: string,
    durationSeconds: number
  ) => Promise<boolean>
  deleteTemplate: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
}

const RATE_LIMIT_MS = 1000

export function useTimerTemplates(): UseTimerTemplatesReturn {
  const [templates, setTemplates] = useState<TimerTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastMutationRef = useRef<number>(0)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await getTimerTemplatesAction()

    if ("error" in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    setTemplates(result.templates)
    setLoading(false)
  }, [])

  useEffect(() => {
    startTransition(() => { void fetchTemplates() })
  }, [fetchTemplates])

  const createTemplate = useCallback(
    async (name: string, durationSeconds: number): Promise<boolean> => {
      const now = Date.now()
      if (now - lastMutationRef.current < RATE_LIMIT_MS) {
        setError("Bitte warte einen Moment.")
        return false
      }
      lastMutationRef.current = now
      setError(null)

      const result = await createTimerTemplateAction({ name, durationSeconds })

      if ("error" in result) {
        setError(result.error)
        return false
      }

      await fetchTemplates()
      return true
    },
    [fetchTemplates]
  )

  const updateTemplate = useCallback(
    async (
      id: string,
      name: string,
      durationSeconds: number
    ): Promise<boolean> => {
      const now = Date.now()
      if (now - lastMutationRef.current < RATE_LIMIT_MS) {
        setError("Bitte warte einen Moment.")
        return false
      }
      lastMutationRef.current = now
      setError(null)

      const result = await updateTimerTemplateAction({
        id,
        name,
        durationSeconds,
      })

      if ("error" in result) {
        setError(result.error)
        return false
      }

      await fetchTemplates()
      return true
    },
    [fetchTemplates]
  )

  const deleteTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      const now = Date.now()
      if (now - lastMutationRef.current < RATE_LIMIT_MS) {
        setError("Bitte warte einen Moment.")
        return false
      }
      lastMutationRef.current = now
      setError(null)

      const result = await deleteTimerTemplateAction({ id })

      if ("error" in result) {
        setError(result.error)
        return false
      }

      await fetchTemplates()
      return true
    },
    [fetchTemplates]
  )

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  }
}
