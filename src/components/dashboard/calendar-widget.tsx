import { Calendar } from "lucide-react"

import { WidgetPlaceholder } from "@/components/dashboard/widget-placeholder"

export function CalendarWidget() {
  // TODO: Replace with real calendar data when PROJ-4 is built
  return (
    <WidgetPlaceholder
      title="Kalender"
      description="Heutige & anstehende Termine"
      icon={Calendar}
    />
  )
}
