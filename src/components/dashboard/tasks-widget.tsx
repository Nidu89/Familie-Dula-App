import { ListTodo } from "lucide-react"

import { WidgetPlaceholder } from "@/components/dashboard/widget-placeholder"

export function TasksWidget() {
  // TODO: Replace with real tasks data when PROJ-5 is built
  return (
    <WidgetPlaceholder
      title="Aufgaben"
      description="Ueberfaellige & heute faellige"
      icon={ListTodo}
    />
  )
}
