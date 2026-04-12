"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useTimerContext } from "@/context/timer-context"
import { Bell, VolumeX } from "lucide-react"

const AUTO_STOP_MS = 60_000

export function TimerAlarmDialog() {
  const t = useTranslations("timer.alarm")
  const { timer, isAdult, playAlarm, stopAlarm } = useTimerContext()
  const isFinished = timer.state.status === "finished"
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [muted, setMuted] = useState(false)

  // Play alarm when timer finishes
  useEffect(() => {
    if (!isFinished) return

    playAlarm().then((ok) => setAudioBlocked(!ok))

    return () => {
      stopAlarm()
    }
  }, [isFinished, playAlarm, stopAlarm])

  // Auto-stop alarm after 60 seconds
  useEffect(() => {
    if (!isFinished || muted) return

    const timeout = setTimeout(() => {
      stopAlarm()
      setMuted(true)
    }, AUTO_STOP_MS)

    return () => clearTimeout(timeout)
  }, [isFinished, muted, stopAlarm])

  // Re-attempt alarm when tab becomes visible again (browser may have suspended audio)
  useEffect(() => {
    if (!isFinished || muted) return

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        playAlarm().then((ok) => setAudioBlocked(!ok))
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [isFinished, muted, playAlarm])

  if (!isFinished) return null

  function handleMute() {
    stopAlarm()
    setMuted(true)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-label={t("ariaLabel")}
    >
      <div className="mx-4 flex max-w-sm flex-col items-center gap-6 rounded-[3rem] bg-card p-10 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Pulsing bell icon */}
        <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 ${muted ? "" : "animate-pulse"}`}>
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
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-xs text-muted-foreground">
              {t("childMessage")}
            </p>
            {!muted && (
              <Button
                variant="outline"
                onClick={handleMute}
                className="h-14 w-full rounded-full text-base font-bold"
              >
                <VolumeX className="h-5 w-5 mr-2" />
                {t("muteSound")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
