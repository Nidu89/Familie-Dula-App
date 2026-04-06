"use client"

import { MessageCircle } from "lucide-react"
import { useTranslations } from "next-intl"

import { WidgetPlaceholder } from "@/components/dashboard/widget-placeholder"

export function ChatWidget() {
  const t = useTranslations("dashboard.chat")
  // TODO: Replace with real chat messages when PROJ-9 is built
  return (
    <WidgetPlaceholder
      title={t("title")}
      description={t("subtitle")}
      icon={MessageCircle}
      comingSoonText={t("empty")}
    />
  )
}
