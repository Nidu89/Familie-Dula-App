"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useTimerContext } from "@/context/timer-context"
import { Bell } from "lucide-react"

export function TimerAlarmDialog() {
  const t = useTranslations("timer.alarm")
  const { timer, isAdult, alarmAudioRef } = useTimerContext()
  const isFinished = timer.state.status === "finished"
  const [audioBlocked, setAudioBlocked] = useState(false)

  useEffect(() => {
    if (!isFinished) return

    setAudioBlocked(false)

    // Use the pre-primed audio element (unlocked during user gesture in start())
    const audio = alarmAudioRef.current
    if (audio) {
      audio.currentTime = 0
      audio.volume = 1
      audio.loop = true
      audio.play().catch(() => setAudioBlocked(true))
    } else {
      // Fallback: create new audio (will likely be blocked, but try)
      const fallback = new Audio("/timer-alarm.mp3")
      fallback.loop = true
      fallback.play().catch(() => setAudioBlocked(true))
      alarmAudioRef.current = fallback
    }

    return () => {
      const a = alarmAudioRef.current
      if (a) {
        a.pause()
        a.currentTime = 0
      }
    }
  }, [isFinished, alarmAudioRef])

  if (!isFinished) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-label={t("ariaLabel")}
    >
      <div className="mx-4 flex max-w-sm flex-col items-center gap-6 rounded-[3rem] bg-card p-10 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Pulsing bell icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 animate-pulse">
          <Bell className="h-12 w-12 text-destructive" />
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("description")}
          </p>
          {audioBlocked && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("audioBlocked")}
            </p>
          )}
        </div>

        {isAdult ? (
          <Button
            onClick={timer.reset}
            className="h-14 w-full rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-base font-bold text-white shadow-lg hover:opacity-90"
          >
            {t("confirm")}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("childMessage")}
          </p>
        )}
      </div>
    </div>
  )
}
