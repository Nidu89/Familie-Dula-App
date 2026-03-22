"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, Settings, LogOut } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutAction } from "@/lib/actions/auth"

interface AppTopBarProps {
  displayName: string
  familyName: string
  isAdmin: boolean
}

export function AppTopBar({
  displayName,
  familyName,
  isAdmin,
}: AppTopBarProps) {
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
    <header
      className="fixed top-0 right-0 left-0 z-50 flex h-20 items-center justify-between bg-background px-6 md:pl-80"
      aria-label="Kopfleiste"
    >
      {/* Mobile: family name */}
      <span className="font-display text-xl font-black text-primary-foreground md:hidden">
        {familyName}
      </span>
      {/* Desktop: spacer */}
      <div className="hidden md:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Benachrichtigungen"
        >
          <Bell className="h-5 w-5 text-foreground" />
        </button>

        {isAdmin && (
          <Link
            href="/family/settings"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Einstellungen"
          >
            <Settings className="h-5 w-5 text-foreground" />
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full"
              aria-label="Benutzermenue"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                Familie {familyName}
              </p>
            </div>
            <DropdownMenuSeparator />
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
    </header>
  )
}
