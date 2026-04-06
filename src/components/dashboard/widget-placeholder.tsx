"use client"

import type { LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface WidgetPlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
  comingSoonText?: string
}

export function WidgetPlaceholder({
  title,
  description,
  icon: Icon,
  comingSoonText,
}: WidgetPlaceholderProps) {
  const tc = useTranslations("common")
  const displayText = comingSoonText ?? tc("comingSoon")

  return (
    <Card className="flex flex-col border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pb-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {displayText}
          </p>
          <p className="max-w-[200px] text-xs text-muted-foreground/70">
            {tc("comingSoonDescription", { label: title })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
