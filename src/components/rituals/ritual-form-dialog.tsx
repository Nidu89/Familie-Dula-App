"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react"
import type { Ritual } from "@/lib/actions/rituals"
import type { RitualStep } from "@/lib/validations/rituals"

interface RitualFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ritual?: Ritual | null
  onSubmit: (data: {
    name: string
    description?: string
    steps: RitualStep[]
    timerDurationMinutes?: number | null
    rewardPoints?: number | null
  }) => Promise<boolean>
}

function generateStepId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function RitualFormDialog({
  open,
  onOpenChange,
  ritual,
  onSubmit,
}: RitualFormDialogProps) {
  const t = useTranslations("rituals.form")

  // Use a key to fully remount the inner form when the ritual changes
  // This avoids the need for an effect to reset state
  const formKey = ritual?.id ?? (open ? "new" : "closed")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {ritual ? t("editTitle") : t("createTitle")}
          </DialogTitle>
        </DialogHeader>

        {open && (
          <RitualFormInner
            key={formKey}
            ritual={ritual}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// --- Inner form component: fully controlled by initial props, no effects ---

interface RitualFormInnerProps {
  ritual?: Ritual | null
  onSubmit: (data: {
    name: string
    description?: string
    steps: RitualStep[]
    timerDurationMinutes?: number | null
    rewardPoints?: number | null
  }) => Promise<boolean>
  onCancel: () => void
}

function RitualFormInner({ ritual, onSubmit, onCancel }: RitualFormInnerProps) {
  const t = useTranslations("rituals.form")
  const tc = useTranslations("common")
  const isEditing = !!ritual

  const [name, setName] = useState(ritual?.name ?? "")
  const [description, setDescription] = useState(ritual?.description ?? "")
  const [steps, setSteps] = useState<RitualStep[]>(() => {
    if (ritual && ritual.steps.length > 0) {
      return [...ritual.steps].sort((a, b) => a.order - b.order)
    }
    return [{ id: generateStepId(), title: "", order: 0 }]
  })
  const [hasTimer, setHasTimer] = useState(
    ritual?.timerDurationMinutes != null && ritual.timerDurationMinutes > 0
  )
  const [timerMinutes, setTimerMinutes] = useState<number | "">(
    ritual?.timerDurationMinutes ?? 30
  )
  const [hasReward, setHasReward] = useState(
    ritual?.rewardPoints != null && ritual.rewardPoints > 0
  )
  const [rewardPoints, setRewardPoints] = useState<number | "">(
    ritual?.rewardPoints ?? 10
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addStep = useCallback(() => {
    if (steps.length >= 20) return
    setSteps((prev) => [
      ...prev,
      { id: generateStepId(), title: "", order: prev.length },
    ])
  }, [steps.length])

  const removeStep = useCallback(
    (index: number) => {
      if (steps.length <= 1) return
      setSteps((prev) => {
        const next = prev.filter((_, i) => i !== index)
        return next.map((s, i) => ({ ...s, order: i }))
      })
    },
    [steps.length]
  )

  const updateStepTitle = useCallback((index: number, title: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, title } : s))
    )
  }, [])

  const moveStep = useCallback((index: number, direction: "up" | "down") => {
    setSteps((prev) => {
      const next = [...prev]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(t("nameRequired"))
      return
    }

    const validSteps = steps.filter((s) => s.title.trim().length > 0)
    if (validSteps.length === 0) {
      setError(t("stepsRequired"))
      return
    }

    const normalizedSteps = validSteps.map((s, i) => ({
      ...s,
      title: s.title.trim(),
      order: i,
    }))

    setSubmitting(true)

    const success = await onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
      steps: normalizedSteps,
      timerDurationMinutes: hasTimer && timerMinutes !== "" ? timerMinutes : null,
      rewardPoints: hasReward && rewardPoints !== "" ? rewardPoints : null,
    })

    setSubmitting(false)

    if (success) {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="ritual-name" className="text-sm font-medium">
          {t("nameLabel")}
        </Label>
        <Input
          id="ritual-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          maxLength={80}
          className="rounded-2xl"
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label
          htmlFor="ritual-description"
          className="text-sm font-medium"
        >
          {t("descriptionLabel")}
        </Label>
        <Textarea
          id="ritual-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          maxLength={300}
          className="min-h-[80px] rounded-2xl resize-none"
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t("stepsLabel", { count: steps.length })}
        </Label>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {index + 1}
              </div>
              <Input
                value={step.title}
                onChange={(e) => updateStepTitle(index, e.target.value)}
                placeholder={t("stepPlaceholder", { index: index + 1 })}
                maxLength={100}
                className="flex-1 rounded-xl"
                aria-label={t("stepAria", { index: index + 1 })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveStep(index, "up")}
                disabled={index === 0}
                className="h-8 w-8 shrink-0 rounded-full"
                aria-label={t("moveUp")}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveStep(index, "down")}
                disabled={index === steps.length - 1}
                className="h-8 w-8 shrink-0 rounded-full"
                aria-label={t("moveDown")}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStep(index)}
                disabled={steps.length <= 1}
                className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                aria-label={t("removeStep", { index: index + 1 })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {steps.length < 20 && (
          <Button
            type="button"
            variant="ghost"
            onClick={addStep}
            className="w-full rounded-xl text-sm font-medium text-secondary"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addStep")}
          </Button>
        )}
      </div>

      {/* Timer toggle */}
      <div className="space-y-3 rounded-2xl bg-muted p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="ritual-timer-toggle" className="text-sm font-medium">
            {t("timerToggle")}
          </Label>
          <Switch
            id="ritual-timer-toggle"
            checked={hasTimer}
            onCheckedChange={setHasTimer}
          />
        </div>
        {hasTimer && (
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={120}
              value={timerMinutes}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === "") {
                  setTimerMinutes("")
                  return
                }
                const v = parseInt(raw, 10)
                if (!isNaN(v) && v >= 1 && v <= 120) {
                  setTimerMinutes(v)
                }
              }}
              onBlur={() => {
                if (timerMinutes === "" || timerMinutes < 1) setTimerMinutes(1)
              }}
              className="w-20 rounded-xl text-center"
              aria-label="Timer-Dauer in Minuten"
            />
            <span className="text-sm text-muted-foreground">{tc("minutes")}</span>
          </div>
        )}
      </div>

      {/* Reward toggle */}
      <div className="space-y-3 rounded-2xl bg-muted p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="ritual-reward-toggle" className="text-sm font-medium">
            {t("pointsToggle")}
          </Label>
          <Switch
            id="ritual-reward-toggle"
            checked={hasReward}
            onCheckedChange={setHasReward}
          />
        </div>
        {hasReward && (
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={100}
              value={rewardPoints}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === "") {
                  setRewardPoints("")
                  return
                }
                const v = parseInt(raw, 10)
                if (!isNaN(v) && v >= 0 && v <= 100) {
                  setRewardPoints(v)
                }
              }}
              onBlur={() => {
                if (rewardPoints === "") setRewardPoints(0)
              }}
              className="w-20 rounded-xl text-center"
              aria-label="Belohnungspunkte"
            />
            <span className="text-sm text-muted-foreground">{tc("points")}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <DialogFooter className="gap-3 sm:gap-0">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="rounded-full"
        >
          {tc("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] font-bold text-white hover:opacity-90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tc("saving")}
            </>
          ) : isEditing ? (
            tc("save")
          ) : (
            tc("create")
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
