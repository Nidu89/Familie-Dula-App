"use client"

import { useTimerContext } from "@/context/timer-context"

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function TimerDisplay() {
  const { timer } = useTimerContext()
  const { status, totalSeconds, remainingSeconds } = timer.state

  const progress =
    status === "idle" || totalSeconds === 0
      ? 0
      : 1 - remainingSeconds / totalSeconds

  // SVG circle dimensions
  const size = 280
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  const isFinished = status === "finished"
  const isRunning = status === "running"

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg]"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={
              isFinished
                ? "hsl(var(--destructive))"
                : "url(#timerGradient)"
            }
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
          />
          <defs>
            <linearGradient
              id="timerGradient"
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

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isFinished ? (
            <div className="text-center">
              <p
                className="font-display text-4xl font-bold text-destructive animate-pulse"
                aria-live="assertive"
              >
                00:00
              </p>
              <p className="mt-2 text-sm font-medium text-destructive">
                Zeit abgelaufen!
              </p>
            </div>
          ) : (
            <p
              className={`font-display text-5xl font-bold tabular-nums tracking-tight ${
                isRunning ? "text-foreground" : "text-muted-foreground"
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              {status === "idle"
                ? "--:--"
                : formatTime(remainingSeconds)}
            </p>
          )}
        </div>
      </div>

      {/* Status label */}
      {status !== "idle" && (
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {status === "running" && "Laeuft"}
          {status === "paused" && "Pausiert"}
          {status === "finished" && "Abgelaufen"}
        </p>
      )}
    </div>
  )
}
