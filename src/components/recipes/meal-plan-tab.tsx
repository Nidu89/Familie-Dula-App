"use client"

import { useState, useCallback, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Recipe, MealPlanEntry } from "@/lib/actions/recipes"
import type { ShoppingList } from "@/lib/actions/shopping"
import {
  getMealPlanAction,
  upsertMealPlanEntryAction,
  deleteMealPlanEntryAction,
} from "@/lib/actions/recipes"
import { addRecipeIngredientsToShoppingListAction } from "@/lib/actions/recipes"
import { getShoppingListsAction } from "@/lib/actions/shopping"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { MealPlanCell } from "@/components/recipes/meal-plan-cell"
import { AddToShoppingListDialog } from "@/components/recipes/add-to-shopping-list-dialog"
import { MEAL_TYPES } from "@/lib/validations/recipes"

// ── ISO week helpers ──────────────────────────────────────────

function getISOWeekKey(date: Date): string {
  // Calculate ISO week number
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

function offsetWeek(weekKey: string, offset: number): string {
  const [yearStr, weekStr] = weekKey.split("-W")
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)

  // Get the Monday of the given ISO week
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
  const dayOfWeek = simple.getUTCDay()
  const isoWeekStart = new Date(simple)
  isoWeekStart.setUTCDate(
    simple.getUTCDate() - dayOfWeek + (dayOfWeek <= 4 ? 1 : 8)
  )

  // Offset by the number of weeks
  isoWeekStart.setUTCDate(isoWeekStart.getUTCDate() + offset * 7)

  return getISOWeekKey(isoWeekStart)
}

function getWeekDates(weekKey: string): Date[] {
  const [yearStr, weekStr] = weekKey.split("-W")
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)

  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
  const dayOfWeek = simple.getUTCDay()
  const monday = new Date(simple)
  monday.setUTCDate(
    simple.getUTCDate() - dayOfWeek + (dayOfWeek <= 4 ? 1 : 8)
  )

  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
    dates.push(d)
  }
  return dates
}

// ── Component ─────────────────────────────────────────────────

interface MealPlanTabProps {
  recipes: Recipe[]
  shoppingLists: ShoppingList[]
}

export function MealPlanTab({ recipes, shoppingLists: initialLists }: MealPlanTabProps) {
  const t = useTranslations("recipes")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const [currentWeek, setCurrentWeek] = useState(() =>
    getISOWeekKey(new Date())
  )
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shoppingLists, setShoppingLists] = useState(initialLists)
  const [weeklyShoppingOpen, setWeeklyShoppingOpen] = useState(false)

  const weekDates = getWeekDates(currentWeek)
  const isCurrentWeek = currentWeek === getISOWeekKey(new Date())

  const fetchEntries = useCallback(
    async (week: string) => {
      setIsLoading(true)
      try {
        const result = await getMealPlanAction(week)
        if ("error" in result) {
          toast({
            title: tc("error"),
            description: result.error,
            variant: "destructive",
          })
          return
        }
        setEntries(result.entries)
      } catch {
        toast({
          title: tc("error"),
          description: t("mealPlanLoadError"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast, tc, t]
  )

  // Fetch entries when week changes
  useEffect(() => {
    fetchEntries(currentWeek)
  }, [currentWeek, fetchEntries])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("meal_plan_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meal_plan_entries" },
        () => fetchEntries(currentWeek)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEntries, currentWeek])

  function getEntry(weekday: number, mealType: string): MealPlanEntry | undefined {
    return entries.find(
      (e) => e.weekday === weekday && e.mealType === mealType
    )
  }

  async function handleUpsert(
    weekday: number,
    mealType: "breakfast" | "lunch" | "dinner",
    recipeId: string | null,
    freeText: string | null
  ) {
    const result = await upsertMealPlanEntryAction({
      weekKey: currentWeek,
      weekday,
      mealType,
      recipeId,
      freeText,
    })
    if ("error" in result) {
      toast({
        title: tc("error"),
        description: result.error,
        variant: "destructive",
      })
      return
    }
    fetchEntries(currentWeek)
  }

  async function handleDelete(entryId: string) {
    const result = await deleteMealPlanEntryAction(entryId)
    if ("error" in result) {
      toast({
        title: tc("error"),
        description: result.error,
        variant: "destructive",
      })
      return
    }
    fetchEntries(currentWeek)
  }

  async function handleAddWeekToShoppingList(listId: string) {
    // Get all recipe IDs used this week
    const recipeIds = entries
      .filter((e) => e.recipeId)
      .map((e) => e.recipeId!)
    const uniqueRecipeIds = [...new Set(recipeIds)]

    if (uniqueRecipeIds.length === 0) {
      toast({
        title: t("noRecipesThisWeek"),
        variant: "destructive",
      })
      return
    }

    let totalAdded = 0
    for (const recipeId of uniqueRecipeIds) {
      const result = await addRecipeIngredientsToShoppingListAction({
        recipeId,
        listId,
      })
      if (!("error" in result)) {
        totalAdded += result.addedCount
      }
    }

    toast({
      title: t("weekIngredientsAdded", { count: totalAdded }),
    })

    // Refresh shopping lists
    const listsResult = await getShoppingListsAction()
    if (!("error" in listsResult)) {
      setShoppingLists(listsResult.lists)
    }
  }

  const dayNames = [
    t("days.mon"),
    t("days.tue"),
    t("days.wed"),
    t("days.thu"),
    t("days.fri"),
    t("days.sat"),
    t("days.sun"),
  ]

  const mealLabels: Record<string, string> = {
    breakfast: t("meals.breakfast"),
    lunch: t("meals.lunch"),
    dinner: t("meals.dinner"),
  }

  // Week display label
  const weekLabel = (() => {
    const start = weekDates[0]
    const end = weekDates[6]
    const fmt = (d: Date) =>
      `${d.getUTCDate()}.${d.getUTCMonth() + 1}.`
    return `${fmt(start)} – ${fmt(end)}${end.getUTCFullYear()}`
  })()

  return (
    <>
      {/* Week navigator */}
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setCurrentWeek(offsetWeek(currentWeek, -1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-foreground hover:bg-muted transition-colors"
          aria-label={t("previousWeek")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 text-center">
          <p className="font-display text-lg font-bold text-secondary">
            {currentWeek}
          </p>
          <p className="text-xs text-muted-foreground">
            {weekLabel}
            {isCurrentWeek && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary-foreground text-[10px] font-bold uppercase">
                {t("thisWeek")}
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentWeek(offsetWeek(currentWeek, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-foreground hover:bg-muted transition-colors"
          aria-label={t("nextWeek")}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {!isCurrentWeek && (
          <button
            type="button"
            onClick={() => setCurrentWeek(getISOWeekKey(new Date()))}
            className="px-4 py-2 rounded-full text-xs font-bold text-secondary hover:bg-secondary/10 transition-colors"
          >
            {tc("today")}
          </button>
        )}
      </div>

      {/* Add all to shopping list button */}
      {shoppingLists.length > 0 && entries.some((e) => e.recipeId) && (
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setWeeklyShoppingOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            {t("addWeekToShoppingList")}
          </button>
        </div>
      )}

      {/* Meal plan grid */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((row) => (
            <div key={row}>
              <Skeleton className="h-5 w-24 mb-3" />
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                  <Skeleton
                    key={col}
                    className="h-24 rounded-2xl"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Desktop: show day headers */}
          <div className="hidden lg:grid lg:grid-cols-[120px_repeat(7,1fr)] gap-3">
            <div /> {/* Empty corner cell */}
            {dayNames.map((name, i) => (
              <div
                key={i}
                className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2"
              >
                <span>{name}</span>
                <br />
                <span className="text-[10px] font-normal">
                  {weekDates[i].getUTCDate()}.{weekDates[i].getUTCMonth() + 1}.
                </span>
              </div>
            ))}
          </div>

          {/* Rows: one per meal type */}
          {MEAL_TYPES.map((mealType) => (
            <div key={mealType}>
              {/* Mobile meal label */}
              <h3 className="lg:hidden text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {mealLabels[mealType]}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-[120px_repeat(7,1fr)] gap-3">
                {/* Desktop meal label */}
                <div className="hidden lg:flex items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {mealLabels[mealType]}
                  </span>
                </div>

                {/* Cells for each day */}
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const entry = getEntry(dayIndex, mealType)
                  return (
                    <MealPlanCell
                      key={`${mealType}-${dayIndex}`}
                      dayIndex={dayIndex}
                      dayName={dayNames[dayIndex]}
                      mealType={mealType}
                      entry={entry}
                      recipes={recipes}
                      onUpsert={(recipeId, freeText) =>
                        handleUpsert(dayIndex, mealType, recipeId, freeText)
                      }
                      onDelete={
                        entry ? () => handleDelete(entry.id) : undefined
                      }
                      showDayLabel
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly shopping list dialog (reusing a simplified version) */}
      {weeklyShoppingOpen && (
        <WeeklyShoppingDialog
          open={weeklyShoppingOpen}
          onOpenChange={setWeeklyShoppingOpen}
          shoppingLists={shoppingLists}
          onAddToList={handleAddWeekToShoppingList}
        />
      )}
    </>
  )
}

// ── Weekly Shopping Dialog ─────────────────────────────────────

function WeeklyShoppingDialog({
  open,
  onOpenChange,
  shoppingLists,
  onAddToList,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  shoppingLists: ShoppingList[]
  onAddToList: (listId: string) => Promise<void>
}) {
  const t = useTranslations("recipes")
  const [isAdding, setIsAdding] = useState(false)

  async function handleAdd(listId: string) {
    setIsAdding(true)
    await onAddToList(listId)
    setIsAdding(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] sm:rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-secondary">
            {t("addWeekToShoppingListTitle")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          {t("addWeekToShoppingListDescription")}
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {shoppingLists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => handleAdd(list.id)}
              disabled={isAdding}
              className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
                <ShoppingCart className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{list.name}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
