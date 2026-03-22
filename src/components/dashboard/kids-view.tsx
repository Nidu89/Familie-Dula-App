import { Star, ListChecks } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface KidsViewProps {
  displayName: string
}

export function KidsView({ displayName }: KidsViewProps) {
  // TODO: Replace with real data when PROJ-5 (tasks) and PROJ-6 (rewards) are built
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Hallo, {displayName}!
            </CardTitle>
            <CardDescription className="text-xs">
              Deine persoenliche Uebersicht
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" />
            0 Punkte
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Tasks summary */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Meine Aufgaben</p>
              <p className="text-xs text-muted-foreground">
                Noch keine Aufgaben zugewiesen
              </p>
            </div>
          </div>

          {/* Points summary */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-4/20 text-chart-4">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Meine Punkte</p>
              <p className="text-xs text-muted-foreground">
                Erledige Aufgaben, um Punkte zu sammeln!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
