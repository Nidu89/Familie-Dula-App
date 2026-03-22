"use client"

import {
  CalendarPlus,
  ListTodo,
  ShoppingCart,
  UtensilsCrossed,
  Star,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const actions = [
  {
    label: "Kalender",
    icon: CalendarPlus,
    href: "/calendar",
    ready: true,
  },
  {
    label: "Aufgaben",
    icon: ListTodo,
    href: "/tasks",
    ready: true,
  },
  {
    label: "Belohnungen",
    icon: Star,
    href: "/rewards",
    ready: true,
  },
  {
    label: "Einkaufsliste",
    icon: ShoppingCart,
    href: "/shopping",
    ready: false,
  },
  {
    label: "Essensplan",
    icon: UtensilsCrossed,
    href: "/meals",
    ready: false,
  },
] as const

export function QuickActions() {
  const { toast } = useToast()

  function handleComingSoon(label: string) {
    toast({
      title: "Kommt bald",
      description: `${label} wird in einem zukuenftigen Update verfuegbar sein.`,
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) =>
        action.ready ? (
          <Button
            key={action.label}
            size="sm"
            className="rounded-full gap-1.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            asChild
          >
            <Link href={action.href} aria-label={action.label}>
              <action.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{action.label}</span>
            </Link>
          </Button>
        ) : (
          <Button
            key={action.label}
            variant="ghost"
            size="sm"
            className="rounded-full gap-1.5 opacity-50"
            onClick={() => handleComingSoon(action.label)}
            aria-label={action.label}
          >
            <action.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        )
      )}
    </div>
  )
}
