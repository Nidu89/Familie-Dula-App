"use client"

import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarViewType = "month" | "week" | "day" | "agenda"

const CATEGORIES = [
  { value: "all", label: "Alle Kategorien" },
  { value: "school", label: "Schule" },
  { value: "work", label: "Arbeit" },
  { value: "leisure", label: "Freizeit" },
  { value: "health", label: "Gesundheit" },
  { value: "other", label: "Sonstiges" },
]

interface FamilyMember {
  id: string
  displayName: string
}

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarViewType
  onViewChange: (view: CalendarViewType) => void
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void
  onNewEvent: () => void
  isAdultOrAdmin: boolean
  members: FamilyMember[]
  selectedMember: string
  onMemberChange: (memberId: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

function formatDateLabel(date: Date, view: CalendarViewType): string {
  const opts: Intl.DateTimeFormatOptions =
    view === "month"
      ? { month: "long", year: "numeric" }
      : view === "week"
        ? { day: "numeric", month: "long", year: "numeric" }
        : { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  return date.toLocaleDateString("de-DE", opts)
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onNewEvent,
  isAdultOrAdmin,
  members,
  selectedMember,
  onMemberChange,
  selectedCategory,
  onCategoryChange,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Title + Navigation + New Event */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate("PREV")}
            aria-label="Zurueck"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("TODAY")}
          >
            Heute
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate("NEXT")}
            aria-label="Vorwaerts"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-lg font-semibold">
            {formatDateLabel(currentDate, view)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Tabs
            value={view}
            onValueChange={(v) => onViewChange(v as CalendarViewType)}
          >
            <TabsList>
              <TabsTrigger value="month">Monat</TabsTrigger>
              <TabsTrigger value="week">Woche</TabsTrigger>
              <TabsTrigger value="day">Tag</TabsTrigger>
              <TabsTrigger value="agenda">Liste</TabsTrigger>
            </TabsList>
          </Tabs>

          {isAdultOrAdmin && (
            <Button size="sm" className="gap-1.5" onClick={onNewEvent}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Neuer Termin</span>
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={selectedMember} onValueChange={onMemberChange}>
          <SelectTrigger className="w-[180px]" aria-label="Nach Person filtern">
            <SelectValue placeholder="Alle Personen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Personen</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger
            className="w-[180px]"
            aria-label="Nach Kategorie filtern"
          >
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
