"use client"

import { useTranslations } from "next-intl"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

interface RitualStepItemProps {
  stepId: string
  title: string
  order: number
  isCompleted: boolean
  isAdult: boolean
  onToggle: (stepId: string) => void
  onReset?: (stepId: string) => void
}

export function RitualStepItem({
  stepId,
  title,
  order,
  isCompleted,
  isAdult,
  onToggle,
  onReset,
}: RitualStepItemProps) {
  const t = useTranslations("rituals.stepItem")

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl p-4 transition-all ${
        isCompleted
          ? "bg-primary/10"
          : "bg-surface-container-lowest"
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
        {order + 1}
      </div>

      <Checkbox
        id={`step-${stepId}`}
        checked={isCompleted}
        onCheckedChange={() => {
          if (!isCompleted) {
            onToggle(stepId)
          }
        }}
        disabled={isCompleted}
        className="h-6 w-6 shrink-0 rounded-lg"
        aria-label={t("aria", { order: order + 1, title })}
      />

      <label
        htmlFor={`step-${stepId}`}
        className={`flex-1 text-sm font-medium transition-all ${
          isCompleted
            ? "text-muted-foreground line-through"
            : "text-foreground"
        }`}
      >
        {title}
      </label>

      {/* Reset button — only for adults, only when completed */}
      {isCompleted && isAdult && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReset(stepId)}
          className="h-8 w-8 shrink-0 rounded-full p-0 text-muted-foreground hover:text-foreground"
          aria-label={t("resetAria", { title })}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
