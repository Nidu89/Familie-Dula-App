"use client"

import {
  CalendarPlus,
  ListTodo,
  ShoppingCart,
  UtensilsCrossed,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const actionDefs = [
  {
    key: "calendar" as const,
    icon: CalendarPlus,
    href: "/calendar",
    ready: true,
  },
  {
    key: "tasks" as const,
    icon: ListTodo,
    href: "/tasks",
    ready: true,
  },
  {
    key: "rewards" as const,
    icon: Star,
    href: "/rewards",
    ready: true,
  },
  {
    key: "shoppingList" as const,
    icon: ShoppingCart,
    href: "/shopping",
    ready: false,
  },
  {
    key: "mealPlan" as const,
    icon: UtensilsCrossed,
    href: "/meals",
    ready: false,
  },
] as const

export function QuickActions() {
  const t = useTranslations("dashboard.quickActions")
  const tc = useTranslations("common")
  const { toast } = useToast()

  function handleComingSoon(label: string) {
    toast({
      title: tc("comingSoon"),
      description: tc("comingSoonDescription", { label }),
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actionDefs.map((action) => {
        const label = t(action.key)
        return action.ready ? (
          <Button
            key={action.key}
            size="sm"
            className="rounded-full gap-1.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            asChild
          >
            <Link href={action.href} aria-label={label}>
              <action.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          </Button>
        ) : (
          <Button
            key={action.key}
            variant="ghost"
            size="sm"
            className="rounded-full gap-1.5 opacity-50"
            onClick={() => handleComingSoon(label)}
            aria-label={label}
          >
            <action.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        )
      })}
    </div>
  )
}
