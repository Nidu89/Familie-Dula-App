"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Calendar,
  Plus,
  CheckSquare,
  MoreHorizontal,
  Trophy,
  Timer,
  ListChecks,
  ShoppingCart,
  MessageSquare,
  UtensilsCrossed,
  Users,
  CalendarPlus,
  ClipboardPlus,
  TimerReset,
  X,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

/* ── nav items ───────────────────────────────────────────── */

const BOTTOM_LINKS = [
  { href: "/dashboard", labelKey: "home" as const, icon: LayoutDashboard },
  { href: "/calendar", labelKey: "calendar" as const, icon: Calendar },
  // FAB placeholder (rendered separately)
  { href: "/tasks", labelKey: "tasks" as const, icon: CheckSquare },
  // "Mehr" is rendered separately
]

const MORE_LINKS = [
  { href: "/rituals", labelKey: "rituals" as const, icon: ListChecks },
  { href: "/timer", labelKey: "timer" as const, icon: Timer },
  { href: "/rewards", labelKey: "rewards" as const, icon: Trophy },
  { href: "/shopping", labelKey: "shopping" as const, icon: ShoppingCart },
  { href: "/recipes", labelKey: "recipes" as const, icon: UtensilsCrossed },
  { href: "/chat", labelKey: "chat" as const, icon: MessageSquare },
  { href: "/family/settings", labelKey: "family" as const, icon: Users },
]

const QUICK_ACTIONS = [
  { href: "/tasks?new=1", labelKey: "newTask" as const, icon: ClipboardPlus },
  { href: "/calendar?new=1", labelKey: "newEvent" as const, icon: CalendarPlus },
  { href: "/timer", labelKey: "newTimer" as const, icon: TimerReset },
]

/* ── component ───────────────────────────────────────────── */

export function BottomNav() {
  const t = useTranslations("layout.bottomNav")
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const isMoreActive = MORE_LINKS.some((l) => isActive(l.href))

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-card rounded-t-[2rem] shadow-[0_-8px_24px_rgba(0,0,0,0.05)] h-20 px-4 md:hidden"
        aria-label={t("aria")}
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
              {t(link.labelKey)}
            </Link>
          )
        })}

        {/* Center FAB */}
        <div className="relative -top-5">
          <button
            type="button"
            onClick={() => setFabOpen(true)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg active:scale-95 transition-transform"
            aria-label={t("createNew")}
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>

        {/* Aufgaben link */}
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
              {t(link.labelKey)}
            </Link>
          )
        })}

        {/* Mehr button */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${
            isMoreActive
              ? "text-primary-foreground font-bold"
              : "text-foreground opacity-60"
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          {t("more")}
        </button>
      </nav>

      {/* ── FAB Quick Actions Sheet ──────────────────────── */}
      <Sheet open={fabOpen} onOpenChange={setFabOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] px-6 pb-10">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display text-xl font-bold text-secondary">
              {t("createTitle")}
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => {
                    setFabOpen(false)
                    router.push(action.href)
                  }}
                  className="flex flex-col items-center gap-3 rounded-2xl bg-muted p-5 active:scale-95 transition-transform"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-md">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {t(action.labelKey)}
                  </span>
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── More Links Sheet ─────────────────────────────── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] px-6 pb-10">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-xl font-bold text-secondary">
              {t("more")}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-1">
            {MORE_LINKS.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-all ${
                    active
                      ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-bold shadow-md"
                      : "text-foreground hover:bg-muted active:scale-[0.98]"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{t(link.labelKey)}</span>
                </Link>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
