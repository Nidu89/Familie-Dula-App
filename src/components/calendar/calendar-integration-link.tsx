"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Calendar, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function CalendarIntegrationLink() {
  const t = useTranslations("calendarIntegrations")

  return (
    <Link href="/settings/calendar-integrations">
      <Card className="transition-colors hover:bg-surface-container-low">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
            <Calendar className="h-5 w-5 text-secondary" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-foreground">
              {t("settingsLinkTitle")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("settingsLinkDescription")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  )
}
