import { MessageCircle } from "lucide-react"

import { WidgetPlaceholder } from "@/components/dashboard/widget-placeholder"

export function ChatWidget() {
  // TODO: Replace with real chat messages when PROJ-9 is built
  return (
    <WidgetPlaceholder
      title="Familienchat"
      description="Letzte Nachrichten"
      icon={MessageCircle}
      comingSoonText="Noch keine Nachrichten"
    />
  )
}
