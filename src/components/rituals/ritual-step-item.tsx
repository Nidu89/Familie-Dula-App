"use client"

import { useRef, useCallback, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { RotateCcw, Timer, Check } from "lucide-react"
import confetti from "canvas-confetti"

interface RitualStepItemProps {
  stepId: string
  title: string
  emoji?: string | null
  order: number
  isCompleted: boolean
  isAdult: boolean
  isActiveStep?: boolean
  stepDurationSeconds?: number | null
  onToggle: (stepId: string) => void
  onReset?: (stepId: string) => void
}

const DEFAULT_EMOJI = "\u2B50"

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  return `${m} Min.`
}

/** Play a short success chime. Silently swallows errors (browser autoplay policy). */
function playStepSound() {
  try {
    const audio = new Audio("/step-complete.wav")
    audio.volume = 0.5
    audio.play().catch(() => {
      /* browser blocked autoplay - silently ignore */
    })
  } catch {
    /* no audio support */
  }
}

export function RitualStepItem({
  stepId,
  title,
  emoji,
  order,
  isCompleted,
  isAdult,
  isActiveStep,
  stepDurationSeconds,
  onToggle,
  onReset,
}: RitualStepItemProps) {
  const t = useTranslations("rituals.stepItem")
  const cardRef = useRef<HTMLDivElement>(null)
  const [animating, setAnimating] = useState(false)

  const displayEmoji = emoji || DEFAULT_EMOJI

  const handleComplete = useCallback(() => {
    if (isCompleted || animating) return

    setAnimating(true)

    // Fire confetti burst centered on this card
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x, y },
        startVelocity: 20,
        gravity: 0.8,
        ticks: 60,
        disableForReducedMotion: true,
        colors: ["#ffd709", "#006384", "#ffd5c2", "#6c5a00", "#cce8f2"],
      })
    }

    playStepSound()

    // Debounce: prevent stacking by waiting for animation to end
    setTimeout(() => {
      setAnimating(false)
    }, 1500)

    onToggle(stepId)
  }, [isCompleted, animating, stepId, onToggle])

  return (
    <div
      ref={cardRef}
      role="listitem"
      className={`relative rounded-2xl p-5 transition-all duration-300 ${
        isCompleted
          ? "bg-[#cce8f2]"
          : isActiveStep
            ? "bg-surface-container-lowest ring-2 ring-secondary/30 scale-[1.02]"
            : "bg-surface-container-lowest"
      }`}
      style={{ minHeight: "80px" }}
    >
      {/* Step number badge — top right */}
      <div
        className={`absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
          isCompleted
            ? "bg-secondary text-white"
            : isActiveStep
              ? "bg-secondary text-white"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {order + 1}
      </div>

      {/* Card content */}
      <div className="flex items-start gap-4">
        {/* Large emoji */}
        <span className="text-[2rem] leading-none shrink-0" aria-hidden="true">
          {displayEmoji}
        </span>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p
            className={`font-display text-lg font-semibold leading-snug transition-all ${
              isCompleted
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {title}
          </p>

          {/* Duration hint for uncompleted steps */}
          {!isCompleted && stepDurationSeconds != null && stepDurationSeconds > 0 && (
            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              {formatDuration(stepDurationSeconds)}
            </span>
          )}
        </div>

        {/* Reset button for adults on completed steps */}
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

      {/* Bottom area: either the "Erledigt!" button or the green checkmark */}
      <div className="mt-4">
        {isCompleted ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary/20 py-3">
            <Check className="h-6 w-6 text-secondary" />
            <span className="text-sm font-bold text-secondary">
              {t("done")}
            </span>
          </div>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={animating}
            className="w-full rounded-xl bg-gradient-to-br from-[#6c5a00] to-[#ffd709] py-3 text-base font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-70"
            aria-label={t("aria", { order: order + 1, title })}
          >
            {t("complete")}
          </Button>
        )}
      </div>
    </div>
  )
}
