"use client"

import {
  CalendarPlus,
  ListTodo,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const actions = [
  {
    label: "Neuer Termin",
    icon: CalendarPlus,
    href: "/calendar/new",
    feature: "PROJ-4",
  },
  {
    label: "Neue Aufgabe",
    icon: ListTodo,
    href: "/tasks/new",
    feature: "PROJ-5",
  },
  {
    label: "Neue Einkaufsliste",
    icon: ShoppingCart,
    href: "/shopping/new",
    feature: "PROJ-7",
  },
  {
    label: "Neues Rezept",
    icon: UtensilsCrossed,
    href: "/meals/new",
    feature: "PROJ-8",
  },
] as const

export function QuickActions() {
  const { toast } = useToast()

  function handleClick(label: string) {
    toast({
      title: "Kommt bald",
      description: `${label} wird in einem zukuenftigen Update verfuegbar sein.`,
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => handleClick(action.label)}
          aria-label={action.label}
        >
          <action.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
