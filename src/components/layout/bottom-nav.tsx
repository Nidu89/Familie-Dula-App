"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Calendar,
  Plus,
  CheckSquare,
  Timer,
} from "lucide-react"

const BOTTOM_LINKS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  // FAB placeholder (rendered separately)
  { href: "/tasks", label: "Aufgaben", icon: CheckSquare },
  { href: "/timer", label: "Timer", icon: Timer },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-card rounded-t-[2rem] shadow-[0_-8px_24px_rgba(0,0,0,0.05)] h-20 px-4 md:hidden"
      aria-label="Mobile Navigation"
    >
      {/* First two links */}
      {BOTTOM_LINKS.slice(0, 2).map((link) => {
        const Icon = link.icon
        const active = isActive(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
              active
                ? "text-primary-foreground font-bold"
                : "text-foreground opacity-60"
            }`}
          >
            <Icon className="h-5 w-5" />
            {link.label}
          </Link>
        )
      })}

      {/* Center FAB */}
      <div className="relative -top-5">
        <button
          type="button"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg"
          aria-label="Neu erstellen"
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {/* Last two links */}
      {BOTTOM_LINKS.slice(2).map((link) => {
        const Icon = link.icon
        const active = isActive(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
              active
                ? "text-primary-foreground font-bold"
                : "text-foreground opacity-60"
            }`}
          >
            <Icon className="h-5 w-5" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
