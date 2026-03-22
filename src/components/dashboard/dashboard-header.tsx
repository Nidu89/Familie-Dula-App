"use client"

import { Settings } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  displayName: string
  familyName: string
  isAdmin: boolean
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return "Gute Nacht"
  if (hour < 12) return "Guten Morgen"
  if (hour < 18) return "Guten Tag"
  return "Guten Abend"
}

function formatDate(): string {
  return new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function DashboardHeader({
  displayName,
  familyName,
  isAdmin,
}: DashboardHeaderProps) {
  const greeting = getGreeting()
  const dateString = formatDate()

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {greeting}, {displayName}!
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {dateString} &middot; Familie {familyName}
        </p>
      </div>
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 gap-2 self-start sm:mt-0 sm:self-auto"
          asChild
        >
          <Link href="/family/settings" aria-label="Familieneinstellungen">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Einstellungen</span>
          </Link>
        </Button>
      )}
    </div>
  )
}
