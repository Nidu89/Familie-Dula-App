"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Pause, Play, X, RotateCcw } from "lucide-react"
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
  const {
    state,
    timer,
    pauseRitual,
    resumeRitual,
    toggleStep,
    resetStep,
    completedCount,
    totalSteps,
  } = activeRitual

  const ritual = state.ritual
  if (!ritual) return null

  const hasTimer =
    ritual.timerDurationMinutes !== null && ritual.timerDurationMinutes > 0
  const timerStatus = timer.state.status
  const isTimerExpired = timerStatus === "finished"
  const progressPercent =
    totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  const isPaused = state.status === "paused"
  const isRunning = state.status === "running" || state.status === "timer_expired"

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
      </div>

      {/* Timer display (if applicable) */}
      {hasTimer && (
        <div className="flex flex-col items-center gap-2 rounded-[2rem] bg-card p-6">
          <p
            className={`font-display text-4xl font-bold tabular-nums tracking-tight ${
              isTimerExpired
                ? "text-destructive animate-pulse"
                : "text-foreground"
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {isTimerExpired
              ? "00:00"
              : formatTime(timer.state.remainingSeconds)}
          </p>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {timerStatus === "running" && "Laeuft"}
            {timerStatus === "paused" && "Pausiert"}
            {isTimerExpired && "Zeit abgelaufen!"}
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Fortschritt</span>
          <span className="font-bold text-secondary">
            {completedCount} von {totalSteps} Schritten
          </span>
        </div>
        <Progress
          value={progressPercent}
          className="h-3 rounded-full"
          aria-label={`${completedCount} von ${totalSteps} Schritten erledigt`}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-3" role="list" aria-label="Ritual-Schritte">
        {[...ritual.steps]
          .sort((a, b) => a.order - b.order)
          .map((step) => (
            <RitualStepItem
              key={step.id}
              stepId={step.id}
              title={step.title}
              order={step.order}
              isCompleted={state.completedStepIds.has(step.id)}
              isAdult={isAdult}
              onToggle={toggleStep}
              onReset={isAdult ? resetStep : undefined}
            />
          ))}
      </div>

      {/* Reward points hint */}
      {ritual.rewardPoints !== null && ritual.rewardPoints > 0 && (
        <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-4">
          <span className="text-lg">&#11088;</span>
          <p className="text-sm font-medium text-foreground">
            {ritual.rewardPoints} Punkte bei vollstaendigem Abschluss
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
              Pausieren
            </Button>
          )}
          {isPaused && (
            <Button
              onClick={resumeRitual}
              className="flex-1 rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] py-3 font-bold text-white hover:opacity-90"
            >
              <Play className="mr-2 h-4 w-4" />
              Fortsetzen
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
