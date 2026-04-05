"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Trophy,
  Timer,
  ListChecks,
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/tasks", label: "Aufgaben", icon: CheckSquare },
  { href: "/rewards", label: "Belohnungen", icon: Trophy },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/rituals", label: "Rituale", icon: ListChecks },
  { href: "/family/settings", label: "Familie", icon: Users },
]

export function AppSidebar({ familyName }: AppSidebarProps) {
  const pathname = usePathname()

  async function handleLogout() {
    await logoutAction()
  }

  return (
    <aside
      className="fixed left-0 top-0 z-[60] hidden h-screen w-72 flex-col bg-card rounded-r-[3rem] shadow-[3rem_0_3rem_rgba(42,47,50,0.06)] md:flex"
      aria-label="Seitennavigation"
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
            <p className="text-xs text-muted-foreground">Digital Sandbox</p>
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
              {link.label}
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
          Hilfe
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-6 py-3 rounded-full text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Abmelden
        </button>
      </div>
    </aside>
  )
}
