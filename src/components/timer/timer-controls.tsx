"use client"

import { useTranslations } from "next-intl"
import { Pause, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimerContext } from "@/context/timer-context"

export function TimerControls() {
  const t = useTranslations("timer.controls")
  const { timer, isAdult } = useTimerContext()
  const { status } = timer.state

  if (!isAdult) return null
  if (status === "idle" || status === "finished") return null

  return (
    <div className="flex items-center justify-center gap-4">
      {status === "running" && (
        <Button
          onClick={timer.pause}
          variant="secondary"
          className="h-14 w-14 rounded-full bg-muted text-foreground hover:bg-muted/70"
          aria-label={t("pause")}
        >
          <Pause className="h-6 w-6" />
        </Button>
      )}

      {status === "paused" && (
        <Button
          onClick={timer.resume}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg hover:opacity-90"
          aria-label={t("resume")}
        >
          <Play className="h-6 w-6" />
        </Button>
      )}

      <Button
        onClick={timer.reset}
        variant="secondary"
        className="h-14 w-14 rounded-full bg-muted text-foreground hover:bg-muted/70"
        aria-label={t("reset")}
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
    </div>
  )
}
