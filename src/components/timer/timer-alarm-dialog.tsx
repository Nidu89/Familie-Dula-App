"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useTimerContext } from "@/context/timer-context"
import { Bell } from "lucide-react"

export function TimerAlarmDialog() {
  const { timer, isAdult } = useTimerContext()
  const isFinished = timer.state.status === "finished"
  const [audioBlocked, setAudioBlocked] = useState(false)

  useEffect(() => {
    if (!isFinished) return

    let audio: HTMLAudioElement | null = null

    async function playAlarm() {
      try {
        audio = new Audio("/timer-alarm.mp3")
        audio.loop = true
        await audio.play()
      } catch {
        setAudioBlocked(true)
      }
    }

    void playAlarm()

    return () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [isFinished])

  if (!isFinished) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-label="Timer abgelaufen"
    >
      <div className="mx-4 flex max-w-sm flex-col items-center gap-6 rounded-[3rem] bg-card p-10 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Pulsing bell icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 animate-pulse">
          <Bell className="h-12 w-12 text-destructive" />
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Zeit abgelaufen!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Der Timer ist abgelaufen.
          </p>
          {audioBlocked && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ton blockiert — bitte Autoplay im Browser erlauben.
            </p>
          )}
        </div>

        {isAdult ? (
          <Button
            onClick={timer.reset}
            className="h-14 w-full rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-base font-bold text-white shadow-lg hover:opacity-90"
          >
            OK, verstanden
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Ein Elternteil muss den Timer bestaetigen.
          </p>
        )}
      </div>
    </div>
  )
}
