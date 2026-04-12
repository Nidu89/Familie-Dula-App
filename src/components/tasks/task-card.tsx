"use client"

import { useState } from "react"
import { Check, CheckCheck, Timer, BadgeCheck, MoreVertical, Pin, PinOff, Pencil, Tag, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { completeTaskAction, pinWeekChallengeAction, type Task } from "@/lib/actions/tasks"

/* ── avatar helpers ────────────────────────────────────── */

const AVATAR_COLORS = [
  "bg-secondary/15 text-secondary",
  "bg-primary/20 text-primary-foreground",
  "bg-chart-3/15 text-chart-3",
  "bg-chart-5/15 text-chart-5",
  "bg-tertiary-container/50 text-foreground",
]

function getAvatarColor(name: string | null): string {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

/* ── time helpers ──────────────────────────────────────── */

type TimeInfoResult =
  | { type: "overdue"; isOverdue: true }
  | { type: "hoursLeft"; hours: number; isOverdue: false }
  | { type: "daysLeft"; days: number; isOverdue: false }

function getTimeInfo(dueDate: string | null): TimeInfoResult | null {
  if (!dueDate) return null

  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]

  if (dueDate < todayStr) {
    return { type: "overdue", isOverdue: true }
  }

  if (dueDate === todayStr) {
    const endOfDay = new Date(dueDate + "T23:59:59")
    const diffMs = endOfDay.getTime() - now.getTime()
    const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)))
    return { type: "hoursLeft", hours, isOverdue: false }
  }

  const due = new Date(dueDate)
  const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return { type: "daysLeft", days, isOverdue: false }
}

function formatTimeInfo(
  info: TimeInfoResult,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  switch (info.type) {
    case "overdue":
      return t("card.overdue")
    case "hoursLeft":
      return t("card.hoursLeft", { hours: info.hours })
    case "daysLeft":
      return t("card.daysLeft", { count: info.days })
  }
}

/* ── component ─────────────────────────────────────────── */

interface TaskCardProps {
  task: Task
  variant: "haushalt" | "eigene"
  isAdultOrAdmin: boolean
  currentUserId: string
  onEdit: (task: Task) => void
  onCompleted: () => void
  weekChallengeTaskId?: string | null
  onChallengeChanged?: () => void
}

export function TaskCard({
  task,
  variant,
  isAdultOrAdmin,
  currentUserId,
  onEdit,
  onCompleted,
  weekChallengeTaskId,
  onChallengeChanged,
}: TaskCardProps) {
  const t = useTranslations("tasks")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [isCompleting, setIsCompleting] = useState(false)
  const [isPinning, setIsPinning] = useState(false)

  const isDone = task.status === "done"
  const canComplete =
    !isDone && (isAdultOrAdmin || task.assignedTo === currentUserId)
  const canEdit = isAdultOrAdmin
  const timeInfo = !isDone ? getTimeInfo(task.dueDate) : null
  const isEigene = variant === "eigene"
  const isPinned = weekChallengeTaskId === task.id

  async function handleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!canComplete || isCompleting) return
    setIsCompleting(true)
    try {
      const result = await completeTaskAction(task.id)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      if (result.pointsAwarded && result.points) {
        toast({
          title: t("card.completed"),
          description: t("card.pointsAwarded", { points: result.points, balance: result.newBalance ?? 0 }),
        })
      } else {
        toast({
          title: t("card.completed"),
          description: t("card.markedDone"),
        })
      }
      if (result.awardedBadges?.length) {
        for (const badge of result.awardedBadges) {
          toast({
            title: t("card.newBadge"),
            description: t("card.badgeEarned", { badge }),
          })
        }
      }
      onCompleted()
    } catch {
      toast({
        title: tc("error"),
        description: t("card.completeFailed"),
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  async function handleTogglePin(e: React.MouseEvent) {
    e.stopPropagation()
    if (isPinning) return
    setIsPinning(true)
    try {
      const newId = isPinned ? null : task.id
      const result = await pinWeekChallengeAction(newId)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: isPinned ? t("list.unpinChallenge") : t("list.pinAsChallenge"),
      })
      onChallengeChanged?.()
    } catch {
      toast({
        title: tc("error"),
        description: t("card.completeFailed"),
        variant: "destructive",
      })
    } finally {
      setIsPinning(false)
    }
  }

  /* ── done state ─────────────────────────────────────── */

  if (isDone) {
    return (
      <div
        className={`bg-card p-6 rounded-[2rem] shadow-sm opacity-60 ${canEdit ? "cursor-pointer" : ""}`}
        onClick={() => canEdit && onEdit(task)}
      >
        <div className="flex justify-between items-start mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold grayscale ${getAvatarColor(task.assignedToName)}`}
          >
            {getInitials(task.assignedToName)}
          </div>
          <BadgeCheck className="h-5 w-5 text-secondary" />
        </div>
        <h4 className="font-display font-bold text-lg mb-1 line-through text-muted-foreground">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {task.description}
          </p>
        )}
      </div>
    )
  }

  /* ── active state ───────────────────────────────────── */

  return (
    <div
      className={`bg-card p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden ${
        isEigene ? "bg-gradient-to-r from-chart-3/10 to-transparent" : ""
      } ${canEdit ? "cursor-pointer" : ""}`}
      onClick={() => canEdit && onEdit(task)}
    >
      {/* activity bubble (haushalt only) */}
      {!isEigene && (
        <div
          className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-8 -mt-8 transition-transform group-hover:scale-110"
          style={{
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          }}
        />
      )}

      {/* avatar + points + context menu */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 border-card shadow-sm ${getAvatarColor(task.assignedToName)}`}
        >
          {getInitials(task.assignedToName)}
        </div>
        <div className="flex items-center gap-2">
          {task.points != null && task.points > 0 && (
            <span
              className={`font-display font-black text-lg ${isEigene ? "text-chart-3" : "text-primary-foreground"}`}
            >
              {t("card.pointsShort", { points: task.points })}
            </span>
          )}
          {isAdultOrAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-2.5 rounded-full hover:bg-muted transition-colors"
                  aria-label={tc("actions")}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(task)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {tc("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleTogglePin}
                  disabled={isPinning}
                >
                  {isPinned ? (
                    <>
                      <PinOff className="mr-2 h-4 w-4" />
                      {t("list.unpinChallenge")}
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-4 w-4" />
                      {t("list.pinAsChallenge")}
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* category badge */}
      {task.category && (
        <div className="flex items-center gap-1.5 mb-2">
          <Tag className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">
            {t(`form.category${task.category.charAt(0).toUpperCase()}${task.category.slice(1)}`)}
          </span>
        </div>
      )}

      {/* title */}
      <h4 className="font-display font-bold text-lg mb-2">{task.title}</h4>

      {/* description */}
      {task.description && (
        <p className="text-muted-foreground text-sm line-clamp-2">
          {task.description}
        </p>
      )}

      {/* timer / overdue chip */}
      {timeInfo && (
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full w-fit mt-4 ${
            timeInfo.isOverdue ? "bg-destructive/10" : "bg-muted"
          }`}
        >
          <Timer
            className={`h-4 w-4 ${timeInfo.isOverdue ? "text-destructive" : "text-chart-3"}`}
          />
          <span
            className={`text-xs font-bold uppercase ${timeInfo.isOverdue ? "text-destructive" : "text-chart-3"}`}
          >
            {formatTimeInfo(timeInfo, t)}
          </span>
        </div>
      )}

      {/* action button */}
      {canComplete && (
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className={`w-full mt-6 font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95 ${
            isEigene
              ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-md"
              : "bg-primary/10 text-primary-foreground hover:bg-primary/15"
          }`}
        >
          {isCompleting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isEigene ? (
            <CheckCheck className="h-5 w-5" />
          ) : (
            <Check className="h-5 w-5" />
          )}
          {isEigene ? t("card.doneOwn") : t("card.doneHousehold")}
        </button>
      )}
    </div>
  )
}
