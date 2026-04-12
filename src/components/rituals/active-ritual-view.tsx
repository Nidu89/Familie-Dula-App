"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Pause, Play } from "lucide-react"
import { RitualStepItem } from "./ritual-step-item"
import type { UseActiveRitualReturn } from "@/hooks/use-active-ritual"

interface ActiveRitualViewProps {
  activeRitual: UseActiveRitualReturn
  isAdult: boolean
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function ActiveRitualView({
  activeRitual,
  isAdult,
}: ActiveRitualViewProps) {
  const t = useTranslations("rituals.active")
  const tc = useTranslations("common")
  const {
    state,
    timer,
    pauseRitual,
    resumeRitual,
    toggleStep,
    resetStep,
    completedCount,
    totalSteps,
    activeTimerStep,
  } = activeRitual

  const ritual = state.ritual
  if (!ritual) return null

  const hasGlobalTimer =
    ritual.timerDurationMinutes !== null && ritual.timerDurationMinutes > 0
  const hasPerStepTimer = !hasGlobalTimer && activeTimerStep !== null
  const hasAnyTimer = hasGlobalTimer || hasPerStepTimer

  const timerStatus = timer.state.status
  const isTimerExpired = timerStatus === "finished"
  const progressPercent =
    totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  const isPaused = state.status === "paused"
  const isRunning = state.status === "running" || state.status === "timer_expired"

  // Assigned child display
  const assignedInfo = state.assignedToName
    ? t("assignedTo", { name: state.assignedToName })
    : null

  return (
    <div className="space-y-6">
      {/* Ritual name + description */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          {ritual.name}
        </h2>
        {ritual.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {ritual.description}
          </p>
        )}
        {assignedInfo && (
          <p className="mt-1 text-xs font-medium text-secondary">
            {assignedInfo}
          </p>
        )}
      </div>

      {/* Timer display with circular progress */}
      {hasAnyTimer && (() => {
        const { totalSeconds, remainingSeconds } = timer.state
        const timerProgress =
          timerStatus === "idle" || totalSeconds === 0
            ? 0
            : 1 - remainingSeconds / totalSeconds
        const size = hasPerStepTimer ? 160 : 200
        const strokeWidth = 10
        const radius = (size - strokeWidth) / 2
        const circumference = 2 * Math.PI * radius
        const dashOffset = circumference * (1 - timerProgress)

        return (
          <div className="flex flex-col items-center gap-2 rounded-[2rem] bg-card p-6">
            {/* Per-step timer label */}
            {hasPerStepTimer && activeTimerStep && (
              <p className="text-xs font-medium uppercase tracking-widest text-secondary">
                {activeTimerStep.title}
              </p>
            )}

            <div className="relative" style={{ width: size, height: size }}>
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="rotate-[-90deg]"
                aria-hidden="true"
              >
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={
                    isTimerExpired
                      ? "hsl(var(--destructive))"
                      : "url(#ritualTimerGradient)"
                  }
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-[stroke-dashoffset] duration-300 ease-linear"
                />
                <defs>
                  <linearGradient
                    id="ritualTimerGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#6c5a00" />
                    <stop offset="100%" stopColor="#ffd709" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p
                  className={`font-display text-3xl font-bold tabular-nums tracking-tight ${
                    isTimerExpired
                      ? "text-destructive animate-pulse"
                      : "text-foreground"
                  }`}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {isTimerExpired
                    ? "00:00"
                    : formatTime(remainingSeconds)}
                </p>
              </div>
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {timerStatus === "running" && t("running")}
              {timerStatus === "paused" && t("paused")}
              {isTimerExpired && t("timeUp")}
            </p>
          </div>
        )
      })()}

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">{t("progress")}</span>
          <span className="font-bold text-secondary">
            {completedCount} {t("of")} {totalSteps} {t("stepsLabel")}
          </span>
        </div>
        <Progress
          value={progressPercent}
          className="h-3 rounded-full"
          aria-label={`${completedCount} ${t("of")} ${totalSteps} ${t("stepsLabel")} ${t("doneAria")}`}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-3" role="list" aria-label={t("stepsAria")}>
        {[...ritual.steps]
          .sort((a, b) => a.order - b.order)
          .map((step) => {
            const isActiveStep = activeTimerStep?.id === step.id
            return (
              <RitualStepItem
                key={step.id}
                stepId={step.id}
                title={step.title}
                order={step.order}
                isCompleted={state.completedStepIds.has(step.id)}
                isAdult={isAdult}
                isActiveStep={isActiveStep}
                stepDurationSeconds={step.durationSeconds ?? null}
                onToggle={toggleStep}
                onReset={isAdult ? resetStep : undefined}
              />
            )
          })}
      </div>

      {/* Reward points hint */}
      {ritual.rewardPoints !== null && ritual.rewardPoints > 0 && (
        <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-4">
          <span className="text-lg">&#11088;</span>
          <p className="text-sm font-medium text-foreground">
            {ritual.rewardPoints} {tc("points")} {t("fullCompletion")}
            {state.assignedToName && (
              <span className="text-muted-foreground">
                {" "}({t("for")} {state.assignedToName})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Controls — only for adults */}
      {isAdult && (
        <div className="flex flex-wrap gap-3">
          {isRunning && (
            <Button
              onClick={pauseRitual}
              variant="secondary"
              className="flex-1 rounded-full py-3"
            >
              <Pause className="mr-2 h-4 w-4" />
              {t("pause")}
            </Button>
          )}
          {isPaused && (
            <Button
              onClick={resumeRitual}
              className="flex-1 rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] py-3 font-bold text-white hover:opacity-90"
            >
              <Play className="mr-2 h-4 w-4" />
              {t("resume")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
