"use client"

import { Button } from "@/components/ui/button"
import { PartyPopper, Star, RotateCcw } from "lucide-react"

interface RitualCompleteDialogProps {
  ritualName: string
  rewardPoints: number | null
  timeRemaining: number | null
  isAdult: boolean
  onRestart: () => void
  onClose: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function RitualCompleteDialog({
  ritualName,
  rewardPoints,
  timeRemaining,
  isAdult,
  onRestart,
  onClose,
}: RitualCompleteDialogProps) {
  const hasReward = rewardPoints !== null && rewardPoints > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Ritual abgeschlossen"
    >
      <div className="mx-4 flex max-w-sm flex-col items-center gap-6 rounded-[3rem] bg-card p-10 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Success icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
          <PartyPopper className="h-12 w-12 text-primary-foreground" />
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Ritual abgeschlossen!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            &quot;{ritualName}&quot; wurde erfolgreich abgeschlossen.
          </p>
        </div>

        {/* Reward points display */}
        {hasReward && (
          <div className="flex items-center gap-3 rounded-2xl bg-primary/10 px-6 py-4">
            <Star className="h-8 w-8 text-primary-foreground" />
            <div>
              <p className="font-display text-3xl font-bold text-primary-foreground">
                +{rewardPoints}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Punkte verdient
              </p>
            </div>
          </div>
        )}

        {/* Time remaining */}
        {timeRemaining !== null && timeRemaining > 0 && (
          <p className="text-sm text-muted-foreground">
            Zeit uebrig: {formatTime(timeRemaining)}
          </p>
        )}

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <Button
            onClick={onClose}
            className="h-14 w-full rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-base font-bold text-white shadow-lg hover:opacity-90"
          >
            Super!
          </Button>

          {isAdult && (
            <Button
              onClick={onRestart}
              variant="ghost"
              className="rounded-full text-sm font-medium text-secondary"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Nochmal starten
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
