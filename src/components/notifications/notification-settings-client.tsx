"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Calendar, CheckSquare, Clock, MessageCircle } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  getNotificationPreferencesAction,
  updateNotificationPreferenceAction,
  type NotificationPreference,
} from "@/lib/actions/notifications"
import type { NotificationType } from "@/lib/validations/notifications"

const TYPE_CONFIG: {
  type: NotificationType
  icon: typeof Bell
  labelKey: string
}[] = [
  { type: "calendar_assigned", icon: Calendar, labelKey: "calendarAssigned" },
  { type: "task_assigned", icon: CheckSquare, labelKey: "taskAssigned" },
  { type: "task_due", icon: Clock, labelKey: "taskDue" },
  { type: "chat_message", icon: MessageCircle, labelKey: "chatMessage" },
]

export function NotificationSettingsClient() {
  const t = useTranslations("notifications.settings")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const router = useRouter()
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    getNotificationPreferencesAction().then((result) => {
      if ("preferences" in result && result.preferences) {
        setPreferences(result.preferences)
      }
      setLoading(false)
    })
  }, [])

  async function handleToggle(notificationType: NotificationType, enabled: boolean) {
    setUpdating(notificationType)
    // Optimistic update
    setPreferences((prev) =>
      prev.map((p) =>
        p.notificationType === notificationType ? { ...p, enabled } : p
      )
    )

    const result = await updateNotificationPreferenceAction({ notificationType, enabled })
    if ("error" in result) {
      // Revert
      setPreferences((prev) =>
        prev.map((p) =>
          p.notificationType === notificationType ? { ...p, enabled: !enabled } : p
        )
      )
      toast({ title: t("error"), variant: "destructive" })
    } else {
      toast({ title: t("saved") })
    }
    setUpdating(null)
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc("back")}
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
            <Bell className="h-5 w-5 text-secondary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-[52px]">
          {t("description")}
        </p>
      </div>

      {/* Preference toggles */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
          </div>
        ) : (
          TYPE_CONFIG.map(({ type, icon: Icon, labelKey }) => {
            const pref = preferences.find((p) => p.notificationType === type)
            const enabled = pref?.enabled ?? true

            return (
              <div
                key={type}
                className="flex items-center justify-between px-5 py-4 bg-surface-container-lowest rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container/50">
                    <Icon className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {t(labelKey)}
                  </span>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) => handleToggle(type, checked)}
                  disabled={updating === type}
                  aria-label={t(labelKey)}
                />
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
