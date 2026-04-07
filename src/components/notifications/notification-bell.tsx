"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Bell, CheckCheck, BellOff } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationItem } from "@/components/notifications/notification-item"
import {
  getNotificationsAction,
  getUnreadCountAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  triggerNotificationMaintenanceAction,
  type Notification,
} from "@/lib/actions/notifications"
import { createClient } from "@/lib/supabase/client"

interface NotificationBellProps {
  userId: string
  initialUnreadCount: number
}

export function NotificationBell({ userId, initialUnreadCount }: NotificationBellProps) {
  const t = useTranslations("notifications")
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const maintenanceRanRef = useRef(false)

  // Supabase Realtime: listen for new notifications
  useEffect(() => {
    const supabase = createClient()
    const subscription = supabase
      .channel(`notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const newNotif: Notification = {
            id: row.id as string,
            type: row.type as Notification["type"],
            title: row.title as string,
            body: (row.body as string) || null,
            referenceId: (row.reference_id as string) || null,
            referenceType: (row.reference_type as string) || null,
            isRead: false,
            createdAt: row.created_at as string,
          }
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((c) => c + 1)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === row.id
                ? {
                    ...n,
                    title: row.title as string,
                    body: (row.body as string) || null,
                    isRead: row.is_read as boolean,
                    createdAt: row.created_at as string,
                  }
                : n
            )
          )
          // Refresh unread count on updates
          getUnreadCountAction().then((r) => setUnreadCount(r.count))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [userId])

  // Load notifications when popover opens
  async function loadNotifications() {
    setIsLoading(true)
    const result = await getNotificationsAction({ limit: 20 })
    if ("notifications" in result && result.notifications) {
      setNotifications(result.notifications)
      setHasMore(result.notifications.length === 20)
    }
    setIsLoading(false)
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      loadNotifications()
      // Run maintenance (task_due check + cleanup) only once per session
      if (!maintenanceRanRef.current) {
        maintenanceRanRef.current = true
        triggerNotificationMaintenanceAction()
      }
    }
  }

  async function handleLoadMore() {
    if (notifications.length === 0) return
    const cursor = notifications[notifications.length - 1].createdAt
    const result = await getNotificationsAction({ cursor, limit: 20 })
    if ("notifications" in result && result.notifications) {
      setNotifications((prev) => [...prev, ...result.notifications])
      setHasMore(result.notifications.length === 20)
    }
  }

  async function handleMarkRead(notificationId: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
    await markNotificationReadAction({ notificationId })
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    await markAllNotificationsReadAction()
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label={t("title")}
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/15">
          <h3 className="font-display text-base font-bold text-secondary">
            {t("title")}
          </h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs text-secondary hover:text-secondary/80 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("markAllRead")}
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto scrollbar-none">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-8 px-4 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("empty")}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {t("emptyDescription")}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleMarkRead}
                />
              ))}
              {hasMore && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="w-full py-2.5 text-xs text-secondary hover:bg-muted transition-colors"
                >
                  {t("loadMore")}
                </button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
