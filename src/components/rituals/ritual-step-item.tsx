"use client"

import { useTranslations } from "next-intl"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { RotateCcw, Timer } from "lucide-react"

interface RitualStepItemProps {
  stepId: string
  title: string
  order: number
  isCompleted: boolean
  isAdult: boolean
  isActiveStep?: boolean
  stepDurationSeconds?: number | null
  onToggle: (stepId: string) => void
  onReset?: (stepId: string) => void
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  return `${m} Min.`
}

export function RitualStepItem({
  stepId,
  title,
  order,
  isCompleted,
  isAdult,
  isActiveStep,
  stepDurationSeconds,
  onToggle,
  onReset,
}: RitualStepItemProps) {
  const t = useTranslations("rituals.stepItem")

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl p-4 transition-all ${
        isCompleted
          ? "bg-primary/10"
          : isActiveStep
            ? "bg-secondary/5 ring-2 ring-secondary/20"
            : "bg-surface-container-lowest"
      }`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        isActiveStep && !isCompleted
          ? "bg-secondary text-white"
          : "bg-muted text-muted-foreground"
      }`}>
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

      <div className="flex-1">
        <label
          htmlFor={`step-${stepId}`}
          className={`block text-sm font-medium transition-all ${
            isCompleted
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {title}
        </label>
        {/* Show step duration hint for uncompleted steps */}
        {!isCompleted && stepDurationSeconds && stepDurationSeconds > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Timer className="h-3 w-3" />
            {formatDuration(stepDurationSeconds)}
          </span>
        )}
      </div>

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
