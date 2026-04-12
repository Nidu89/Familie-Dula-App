"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Plus, X, UtensilsCrossed, Type } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Recipe, MealPlanEntry } from "@/lib/actions/recipes"

interface MealPlanCellProps {
  dayIndex: number
  dayName: string
  mealType: "breakfast" | "lunch" | "dinner"
  entry?: MealPlanEntry
  recipes: Recipe[]
  onUpsert: (recipeId: string | null, freeText: string | null) => void
  onDelete?: () => void
  showDayLabel?: boolean
}

export function MealPlanCell({
  dayName,
  entry,
  recipes,
  onUpsert,
  onDelete,
  showDayLabel,
}: MealPlanCellProps) {
  const t = useTranslations("recipes")
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [freeTextMode, setFreeTextMode] = useState(false)
  const [freeTextValue, setFreeTextValue] = useState("")
  const [recipeSearch, setRecipeSearch] = useState("")

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(recipeSearch.toLowerCase())
  )

  function handleSelectRecipe(recipeId: string) {
    onUpsert(recipeId, null)
    setPopoverOpen(false)
    setRecipeSearch("")
  }

  function handleSubmitFreeText() {
    if (!freeTextValue.trim()) return
    onUpsert(null, freeTextValue.trim())
    setPopoverOpen(false)
    setFreeTextValue("")
    setFreeTextMode(false)
  }

  function handleRemove() {
    if (onDelete) {
      onDelete()
    }
  }

  // Cell content display
  const hasContent = entry && (entry.recipeTitle || entry.freeText)
  const isDeletedRecipe = entry && entry.recipeId && !entry.recipeTitle

  return (
    <div className="relative min-h-[6rem]">
      {/* Mobile day label */}
      {showDayLabel && (
        <span className="lg:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
          {dayName}
        </span>
      )}

      {hasContent || isDeletedRecipe ? (
        /* Filled cell */
        <div className="group relative h-full rounded-2xl bg-card p-3 transition-all hover:shadow-[0_0_2rem_rgba(42,47,50,0.04)]">
          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-destructive hover:text-white transition-all shadow-sm z-10"
            aria-label={t("removeMealEntry")}
          >
            <X className="h-3 w-3" />
          </button>

          {isDeletedRecipe ? (
            <p className="text-xs text-destructive italic">
              {t("recipeDeleted")}
            </p>
          ) : entry?.recipeTitle ? (
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10 shrink-0 mt-0.5">
                <UtensilsCrossed className="h-3.5 w-3.5 text-secondary" />
              </div>
              <p className="text-xs font-bold text-foreground line-clamp-3">
                {entry.recipeTitle}
              </p>
            </div>
          ) : entry?.freeText ? (
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tertiary-container shrink-0 mt-0.5">
                <Type className="h-3.5 w-3.5 text-foreground/60" />
              </div>
              <p className="text-xs font-medium text-foreground line-clamp-3">
                {entry.freeText}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        /* Empty cell: add button */
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-full w-full min-h-[6rem] items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/20 bg-surface-container-low hover:bg-muted hover:border-outline-variant/40 transition-all"
              aria-label={t("addMealEntry")}
            >
              <Plus className="h-5 w-5 text-muted-foreground/50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            className="w-72 rounded-2xl p-4"
          >
            {freeTextMode ? (
              /* Free text input */
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("freeTextLabel")}
                </p>
                <Input
                  value={freeTextValue}
                  onChange={(e) => setFreeTextValue(e.target.value)}
                  placeholder={t("freeTextPlaceholder")}
                  maxLength={200}
                  autoFocus
                  className="rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSubmitFreeText()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFreeTextMode(false)
                      setFreeTextValue("")
                    }}
                    className="flex-1 px-3 py-2 rounded-full text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {t("backToRecipes")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitFreeText}
                    disabled={!freeTextValue.trim()}
                    className="flex-1 px-3 py-2 rounded-full text-xs font-bold bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-sm disabled:opacity-50"
                  >
                    {t("addEntry")}
                  </button>
                </div>
              </div>
            ) : (
              /* Recipe selection */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("selectRecipe")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFreeTextMode(true)}
                    className="flex items-center gap-1 text-[10px] font-bold text-secondary hover:text-secondary/80 transition-colors"
                  >
                    <Type className="h-3 w-3" />
                    {t("orFreeText")}
                  </button>
                </div>

                <Input
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder={t("searchRecipes")}
                  className="rounded-lg"
                  autoFocus
                />

                <ScrollArea className="max-h-48">
                  {filteredRecipes.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {recipes.length === 0
                        ? t("noRecipesAvailable")
                        : t("noSearchResults")}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredRecipes.map((recipe) => (
                        <button
                          key={recipe.id}
                          type="button"
                          onClick={() => handleSelectRecipe(recipe.id)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted active:scale-[0.98] transition-all"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 shrink-0">
                            <UtensilsCrossed className="h-4 w-4 text-secondary" />
                          </div>
                          <span className="text-xs font-medium text-foreground line-clamp-1">
                            {recipe.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
