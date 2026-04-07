"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Calendar, CheckSquare, Clock, MessageCircle } from "lucide-react"

import type { Notification } from "@/lib/actions/notifications"

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
}

const TYPE_ICONS = {
  calendar_assigned: Calendar,
  task_assigned: CheckSquare,
  task_due: Clock,
  chat_message: MessageCircle,
} as const

const TYPE_ROUTES: Record<string, (n: Notification) => string> = {
  calendar_event: () => "/calendar",
  task: () => "/tasks",
  chat_channel: () => "/chat",
}

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return t("justNow")
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const t = useTranslations("notifications")
  const tc = useTranslations("common")
  const router = useRouter()

  const Icon = TYPE_ICONS[notification.type]

  function getDisplayText(): string {
    switch (notification.type) {
      case "calendar_assigned":
        return t("calendarAssigned", { title: notification.title })
      case "task_assigned":
        return t("taskAssigned", { title: notification.title })
      case "task_due":
        return t("taskDue", { title: notification.title })
      case "chat_message":
        return notification.body
          ? t("chatMessage", { sender: notification.title, preview: notification.body })
          : t("chatMessageFallback")
      default:
        return notification.title
    }
  }

  function handleClick() {
    if (!notification.isRead) {
      onRead(notification.id)
    }

    if (notification.referenceType) {
      const getRoute = TYPE_ROUTES[notification.referenceType]
      if (getRoute) {
        router.push(getRoute(notification))
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-start gap-3 w-full px-4 py-3 text-left transition-colors rounded-xl ${
        notification.isRead
          ? "opacity-60 hover:bg-muted/50"
          : "hover:bg-muted"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 mt-0.5 ${
          notification.isRead
            ? "bg-surface-container text-muted-foreground"
            : "bg-secondary-container text-secondary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notification.isRead ? "" : "font-medium"}`}>
          {getDisplayText()}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {timeAgo(notification.createdAt, tc)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </button>
  )
}
