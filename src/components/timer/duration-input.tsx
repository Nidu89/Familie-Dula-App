"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface DurationInputProps {
  onStart: (durationSeconds: number) => void
}

const QUICK_MINUTES = [5, 10, 15, 20, 30, 45]

export function DurationInput({ onStart }: DurationInputProps) {
  const t = useTranslations("timer.duration")
  const [minutes, setMinutes] = useState(10)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const total = minutes * 60 + seconds
  const isValid = total >= 60 && total <= 3600

  function handleStart() {
    if (total < 60) {
      setError(t("minDuration"))
      return
    }
    if (total > 3600) {
      setError(t("maxDuration"))
      return
    }
    setError(null)
    onStart(total)
  }

  function handleQuickStart(mins: number) {
    onStart(mins * 60)
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Custom duration picker */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex flex-col items-center">
          <label
            htmlFor="timer-minutes"
            className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
          >
            {t("minutesLabel")}
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMinutes((m) => Math.max(0, m - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground font-bold text-lg transition-colors hover:bg-muted/70"
              aria-label={t("decreaseMinutes")}
            >
              -
            </button>
            <input
              id="timer-minutes"
              type="number"
              min={0}
              max={60}
              value={minutes}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v >= 0 && v <= 60) {
                  setMinutes(v)
                  setError(null)
                }
              }}
              className="w-14 sm:w-16 rounded-2xl bg-card text-center font-display text-2xl sm:text-3xl font-bold tabular-nums text-foreground outline-none focus:ring-2 focus:ring-primary py-3"
              aria-label={t("minutesLabel")}
            />
            <button
              type="button"
              onClick={() => setMinutes((m) => Math.min(60, m + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground font-bold text-lg transition-colors hover:bg-muted/70"
              aria-label={t("increaseMinutes")}
            >
              +
            </button>
          </div>
        </div>

        <span className="mt-6 font-display text-2xl font-bold text-muted-foreground">
          :
        </span>

        <div className="flex flex-col items-center">
          <label
            htmlFor="timer-seconds"
            className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
          >
            {t("secondsLabel")}
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (seconds <= 0) {
                  if (minutes > 0) {
                    setMinutes((m) => m - 1)
                    setSeconds(55)
                  }
                } else {
                  setSeconds((s) => s - 5)
                }
                setError(null)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground font-bold text-lg transition-colors hover:bg-muted/70"
              aria-label={t("decreaseSeconds")}
            >
              -
            </button>
            <input
              id="timer-seconds"
              type="number"
              min={0}
              max={59}
              step={5}
              value={seconds}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v >= 0 && v <= 59) {
                  setSeconds(v)
                  setError(null)
                }
              }}
              className="w-14 sm:w-16 rounded-2xl bg-card text-center font-display text-2xl sm:text-3xl font-bold tabular-nums text-foreground outline-none focus:ring-2 focus:ring-primary py-3"
              aria-label={t("secondsLabel")}
            />
            <button
              type="button"
              onClick={() => {
                if (seconds >= 55) {
                  if (minutes < 60) {
                    setMinutes((m) => m + 1)
                    setSeconds(0)
                  }
                } else {
                  setSeconds((s) => s + 5)
                }
                setError(null)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground font-bold text-lg transition-colors hover:bg-muted/70"
              aria-label={t("increaseSeconds")}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Start button */}
      <Button
        onClick={handleStart}
        disabled={!isValid}
        className="h-14 w-full max-w-xs rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-base font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
        aria-label={t("start")}
      >
        <Play className="mr-2 h-5 w-5" />
        {t("start")}
      </Button>

      {/* Quick start chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleQuickStart(m)}
            className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("quickMin", { min: m })}
          </button>
        ))}
      </div>
    </div>
  )
}
