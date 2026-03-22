import { UtensilsCrossed } from "lucide-react"

import { WidgetPlaceholder } from "@/components/dashboard/widget-placeholder"

export function MealPlanWidget() {
  // TODO: Replace with real meal plan data when PROJ-8 is built
  return (
    <WidgetPlaceholder
      title="Essensplan"
      description="Heute & morgen"
      icon={UtensilsCrossed}
    />
  )
}
