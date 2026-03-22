"use client"

import { useState } from "react"
import { LogOut, Settings } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logoutAction } from "@/lib/actions/auth"

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
  })
}

export function DashboardHeader({
  displayName,
  familyName,
  isAdmin,
}: DashboardHeaderProps) {
  const greeting = getGreeting()
  const dateString = formatDate()

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutAction()
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          {dateString} &middot; Familie {familyName}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {greeting},<br className="sm:hidden" />{" "}
          <span className="text-primary">{displayName}!</span>
        </h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative mt-1 h-10 w-10 shrink-0 rounded-full"
            aria-label="Benutzermenue"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">Familie {familyName}</p>
          </div>
          <DropdownMenuSeparator />
          {isAdmin && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/family/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Einstellungen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Abmelden..." : "Abmelden"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
