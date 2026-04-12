"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Trophy,
  Timer,
  ListChecks,
  ShoppingCart,
  MessageSquare,
  UtensilsCrossed,
  Users,
  HelpCircle,
  LogOut,
} from "lucide-react"

import { logoutAction } from "@/lib/actions/auth"

interface AppSidebarProps {
  familyName: string
  displayName: string
  isAdmin: boolean
}

const NAV_LINKS = [
  { href: "/dashboard", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/calendar", labelKey: "calendar" as const, icon: Calendar },
  { href: "/tasks", labelKey: "tasks" as const, icon: CheckSquare },
  { href: "/rituals", labelKey: "rituals" as const, icon: ListChecks },
  { href: "/timer", labelKey: "timer" as const, icon: Timer },
  { href: "/rewards", labelKey: "rewards" as const, icon: Trophy },
  { href: "/shopping", labelKey: "shopping" as const, icon: ShoppingCart },
  { href: "/recipes", labelKey: "recipes" as const, icon: UtensilsCrossed },
  { href: "/chat", labelKey: "chat" as const, icon: MessageSquare },
  { href: "/family/settings", labelKey: "family" as const, icon: Users },
]

export function AppSidebar({ familyName }: AppSidebarProps) {
  const t = useTranslations("layout.sidebar")
  const pathname = usePathname()

  async function handleLogout() {
    if (!window.confirm(t("logoutConfirm"))) return
    await logoutAction()
  }

  return (
    <aside
      className="fixed left-0 top-0 z-[60] hidden h-screen w-72 flex-col bg-card rounded-r-[3rem] shadow-[3rem_0_3rem_rgba(42,47,50,0.06)] md:flex"
      aria-label={t("navigation")}
    >
      {/* Family branding */}
      <div className="px-8 pt-10 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-secondary">
              {familyName}
            </h2>
            <p className="text-xs text-muted-foreground">{t("tagline")}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-1">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg scale-[0.98]"
                  : "text-foreground hover:bg-muted hover:translate-x-1"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {t(link.labelKey)}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-6 pb-10 space-y-1">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-6 py-3 rounded-full text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <HelpCircle className="h-5 w-5 shrink-0" />
          {t("help")}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-6 py-3 rounded-full text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {t("logout")}
        </button>
      </div>
    </aside>
  )
}
