"use client"

import { useTranslations } from "next-intl"
import { useTimerContext } from "@/context/timer-context"
import { TimerDisplay } from "./timer-display"
import { TimerControls } from "./timer-controls"
import { DurationInput } from "./duration-input"
import { TemplatesList } from "./templates-list"
import { TimerAlarmDialog } from "./timer-alarm-dialog"

export function TimerPageClient() {
  const t = useTranslations("timer")
  const { timer, isAdult } = useTimerContext()
  const { status } = timer.state

  return (
    <div className="space-y-10">
      {/* Timer display — always visible */}
      <div className="flex justify-center">
        <TimerDisplay />
      </div>

      {/* Controls — only for adults when timer is active */}
      <TimerControls />

      {/* Duration input — only for adults when idle */}
      {status === "idle" && isAdult && (
        <DurationInput onStart={timer.start} />
      )}

      {/* Read-only message for children when idle */}
      {status === "idle" && !isAdult && (
        <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-muted py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t("childIdleMessage")}
          </p>
        </div>
      )}

      {/* Templates */}
      <TemplatesList />

      {/* Alarm overlay */}
      <TimerAlarmDialog />
    </div>
  )
}
