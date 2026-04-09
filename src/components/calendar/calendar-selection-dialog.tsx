"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  fetchAvailableCalendarsAction,
  updateSelectedCalendarsAction,
  syncIntegrationAction,
} from "@/lib/actions/calendar-integrations"

interface CalendarSelectionDialogProps {
  integrationId: string
  onClose: () => void
}

interface AvailableCalendar {
  id: string
  name: string
  color?: string
}

export function CalendarSelectionDialog({
  integrationId,
  onClose,
}: CalendarSelectionDialogProps) {
  const t = useTranslations("calendarIntegrations")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const [calendars, setCalendars] = useState<AvailableCalendar[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await fetchAvailableCalendarsAction({ integrationId })
      if ("calendars" in result) {
        setCalendars(result.calendars)
      } else {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
      }
      setIsLoading(false)
    }
    load()
  }, [integrationId, toast, tc])

  function toggleCalendar(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const selectedCalendars = calendars
        .filter((c) => selected.has(c.id))
        .map((c) => ({ id: c.id, name: c.name }))

      const result = await updateSelectedCalendarsAction({
        integrationId,
        selectedCalendars,
      })

      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Trigger initial sync after selection
      if (selectedCalendars.length > 0) {
        await syncIntegrationAction({ integrationId })
      }

      toast({ description: t("calendarsSaved") })
      onClose()
    } catch {
      toast({
        title: tc("error"),
        description: t("calendarsSaveError"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-secondary">
            {t("selectCalendarsTitle")}
          </DialogTitle>
          <DialogDescription>{t("selectCalendarsDescription")}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : calendars.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("noCalendarsFound")}
          </p>
        ) : (
          <div className="max-h-[300px] space-y-2 overflow-y-auto py-2">
            {calendars.map((cal) => (
              <label
                key={cal.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-container-low"
              >
                <Checkbox
                  checked={selected.has(cal.id)}
                  onCheckedChange={() => toggleCalendar(cal.id)}
                />
                {cal.color && (
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: cal.color }}
                  />
                )}
                <span className="text-sm font-medium text-foreground">
                  {cal.name}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            {tc("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selected.size === 0}
            className="flex-1 gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("saveAndSync")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
