"use client"

import { useState } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Filter, Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarViewType = "month" | "week" | "day" | "agenda"

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
  const t = useTranslations("calendar")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const monthYearLabel = format(currentDate, "MMMM yyyy", { locale: de }).toUpperCase()

  const VIEW_TABS = [
    { value: "month", label: t("viewMonth") },
    { value: "week", label: t("viewWeek") },
    { value: "day", label: t("viewDay") },
    { value: "agenda", label: t("viewList") },
  ] as const

  const CATEGORIES = [
    { value: "all", label: t("allCategories") },
    { value: "school", label: t("categories.school") },
    { value: "work", label: t("categories.work") },
    { value: "leisure", label: t("categories.leisure") },
    { value: "health", label: t("categories.health") },
    { value: "other", label: t("categories.other") },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Page title + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-widest text-secondary">
            {monthYearLabel}
          </p>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            {t("title")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View tabs (pill style) */}
          <div className="hidden items-center gap-1 rounded-full bg-muted p-1 sm:flex">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => onViewChange(tab.value)}
                className={[
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  view === tab.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters toggle */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-expanded={filtersOpen}
            aria-controls="calendar-filters"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("filter")}</span>
          </Button>

          {/* New event button */}
          {isAdultOrAdmin && (
            <button
              type="button"
              onClick={onNewEvent}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                background: "linear-gradient(135deg, #6c5a00, #ffd709)",
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("newEvent")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile view selector */}
      <div className="flex items-center gap-1 rounded-full bg-muted p-1 sm:hidden">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onViewChange(tab.value)}
            className={[
              "flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              view === tab.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Collapsible filter row */}
      {filtersOpen && (
        <div
          id="calendar-filters"
          className="flex flex-wrap gap-2 rounded-lg bg-surface-low p-3"
        >
          <Select value={selectedMember} onValueChange={onMemberChange}>
            <SelectTrigger
              className="w-[180px] rounded-full"
              aria-label={t("filterByPerson")}
            >
              <SelectValue placeholder={t("allPersons")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allPersons")}</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger
              className="w-[180px] rounded-full"
              aria-label={t("filterByCategory")}
            >
              <SelectValue placeholder={t("allCategories")} />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedMember !== "all" || selectedCategory !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-muted-foreground"
              onClick={() => {
                onMemberChange("all")
                onCategoryChange("all")
              }}
            >
              {t("resetFilters")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
