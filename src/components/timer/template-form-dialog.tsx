"use client"

import { useState, useEffect, startTransition } from "react"
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
import { useTimerContext } from "@/context/timer-context"
import type { TimerTemplate } from "@/hooks/use-timer-templates"

interface TemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: TimerTemplate | null
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
}: TemplateFormDialogProps) {
  const t = useTranslations("timer.templateForm")
  const tc = useTranslations("common")
  const { createTemplate, updateTemplate } = useTimerContext()

  const [name, setName] = useState("")
  const [minutes, setMinutes] = useState(10)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!template

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setName(template ? template.name : "")
        setMinutes(template ? Math.round(template.durationSeconds / 60) : 10)
        setError(null)
      })
    }
  }, [open, template])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(t("nameError"))
      return
    }
    if (minutes < 1 || minutes > 60) {
      setError(t("durationError"))
      return
    }

    setSaving(true)
    setError(null)

    const durationSeconds = minutes * 60
    let success: boolean

    if (isEditing && template) {
      success = await updateTemplate(template.id, trimmedName, durationSeconds)
    } else {
      success = await createTemplate(trimmedName, durationSeconds)
    }

    setSaving(false)

    if (success) {
      onOpenChange(false)
    } else {
      setError(t("saveError"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? t("editTitle") : t("createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="template-name">{t("nameLabel")}</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={50}
              className="rounded-2xl"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-minutes">{t("durationLabel")}</Label>
            <Input
              id="template-minutes"
              type="number"
              min={1}
              max={60}
              value={minutes}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) setMinutes(Math.max(1, Math.min(60, v)))
              }}
              className="rounded-2xl"
            />
            <p className="text-xs text-muted-foreground">
              {t("durationHint")}
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white hover:opacity-90"
            >
              {saving ? t("saving") : isEditing ? tc("save") : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
