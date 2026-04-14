"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useErrorTranslation } from "@/lib/use-error-translation"
import {
  listIntegrationsAction,
  disconnectIntegrationAction,
  syncIntegrationAction,
  updateSyncIntervalAction,
  type CalendarIntegration,
} from "@/lib/actions/calendar-integrations"
import { AddProviderSheet } from "@/components/calendar/add-provider-sheet"
import { CalendarSelectionDialog } from "@/components/calendar/calendar-selection-dialog"

const PROVIDER_INFO: Record<
  string,
  { name: string; icon: string; color: string }
> = {
  google: { name: "Google Calendar", icon: "G", color: "bg-red-500" },
  icloud: { name: "iCloud", icon: "iC", color: "bg-blue-500" },
}

export function CalendarIntegrationsClient() {
  const t = useTranslations("calendarIntegrations")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const te = useErrorTranslation()
  const searchParams = useSearchParams()

  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [calendarSelectId, setCalendarSelectId] = useState<string | null>(null)

  const loadIntegrations = useCallback(async () => {
    const result = await listIntegrationsAction()
    if ("integrations" in result) {
      setIntegrations(result.integrations)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  // Handle OAuth callback success/error from URL params
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "google_connected") {
      toast({ description: t("googleConnected") })
      loadIntegrations()
      // Find the new Google integration and open calendar selection
      setTimeout(async () => {
        const result = await listIntegrationsAction()
        if ("integrations" in result) {
          const google = result.integrations.find((i) => i.provider === "google")
          if (google && google.selectedCalendars.length === 0) {
            setCalendarSelectId(google.id)
          }
        }
      }, 500)
    }
    if (error) {
      toast({
        title: tc("error"),
        description: t("connectionError"),
        variant: "destructive",
      })
    }

    // Clean URL params
    if (success || error) {
      window.history.replaceState(null, "", "/settings/calendar-integrations")
    }
  }, [searchParams, toast, t, tc, loadIntegrations])

  async function handleSync(integrationId: string) {
    setSyncingId(integrationId)
    try {
      const result = await syncIntegrationAction({ integrationId })
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: te(result.error),
          variant: "destructive",
        })
      } else {
        toast({ description: t("syncSuccess", { count: result.eventsImported }) })
        loadIntegrations()
      }
    } catch {
      toast({
        title: tc("error"),
        description: t("syncError"),
        variant: "destructive",
      })
    } finally {
      setSyncingId(null)
    }
  }

  async function handleDisconnect(integrationId: string) {
    const result = await disconnectIntegrationAction({ integrationId })
    if ("error" in result) {
      toast({
        title: tc("error"),
        description: te(result.error),
        variant: "destructive",
      })
    } else {
      toast({ description: t("disconnected") })
      loadIntegrations()
    }
  }

  function handleProviderAdded() {
    setAddSheetOpen(false)
    loadIntegrations()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/family/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToSettings")}
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-secondary">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Integration cards */}
          {integrations.map((integration) => {
            const info = PROVIDER_INFO[integration.provider]
            const isSyncing = syncingId === integration.id
            const hasCalendars = integration.selectedCalendars.length > 0

            return (
              <Card key={integration.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Provider info */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${info.color} text-white text-xs font-bold`}
                      >
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-foreground">
                          {info.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {integration.status === "active" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span
                            className={`text-xs ${
                              integration.status === "active"
                                ? "text-emerald-600"
                                : "text-destructive"
                            }`}
                          >
                            {integration.status === "active"
                              ? t("statusConnected")
                              : t("statusError")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(integration.id)}
                        disabled={isSyncing || !hasCalendars}
                        className="h-8 gap-1.5"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
                        />
                        {t("sync")}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("disconnectTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("disconnectDescription", { provider: info.name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDisconnect(integration.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {t("disconnect")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Calendar selection */}
                  <div className="mt-4 border-t border-outline-variant/15 pt-3">
                    {hasCalendars ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("selectedCalendars")}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCalendarSelectId(integration.id)}
                            className="h-6 text-xs text-secondary"
                          >
                            {t("changeCalendars")}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {integration.selectedCalendars.map((cal) => (
                            <span
                              key={cal.id}
                              className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-secondary"
                            >
                              <Calendar className="h-3 w-3" />
                              {cal.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCalendarSelectId(integration.id)}
                        className="h-8 gap-1.5 text-secondary"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {t("selectCalendars")}
                      </Button>
                    )}

                    {/* Sync interval */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {t("syncInterval")}
                      </span>
                      <Select
                        value={String(integration.syncIntervalMinutes)}
                        onValueChange={async (val) => {
                          await updateSyncIntervalAction({
                            integrationId: integration.id,
                            syncIntervalMinutes: Number(val),
                          })
                          loadIntegrations()
                        }}
                      >
                        <SelectTrigger className="h-7 w-[100px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 Min</SelectItem>
                          <SelectItem value="30">30 Min</SelectItem>
                          <SelectItem value="60">60 Min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Last sync info */}
                    {integration.lastSyncedAt && (
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {t("lastSync")}{" "}
                        {new Date(integration.lastSyncedAt).toLocaleString()}
                      </p>
                    )}
                    {integration.lastError && (
                      <p className="mt-1 text-[10px] text-destructive">
                        {integration.lastError}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Empty state */}
          {integrations.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-low py-12 text-center">
              <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <h3 className="font-display font-bold text-foreground">
                {t("emptyTitle")}
              </h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                {t("emptyDescription")}
              </p>
            </div>
          )}

          {/* Add provider button */}
          <Button
            onClick={() => setAddSheetOpen(true)}
            className="w-full gap-2 rounded-full"
          >
            <Plus className="h-4 w-4" />
            {t("addProvider")}
          </Button>
        </div>
      )}

      {/* Add provider sheet */}
      <AddProviderSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onProviderAdded={handleProviderAdded}
        existingProviders={integrations.map((i) => i.provider)}
      />

      {/* Calendar selection dialog */}
      {calendarSelectId && (
        <CalendarSelectionDialog
          integrationId={calendarSelectId}
          onClose={() => {
            setCalendarSelectId(null)
            loadIntegrations()
          }}
        />
      )}
    </div>
  )
}
