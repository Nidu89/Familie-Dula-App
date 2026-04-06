"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { UtensilsCrossed, CalendarDays } from "lucide-react"

import type { Recipe } from "@/lib/actions/recipes"
import type { ShoppingList } from "@/lib/actions/shopping"
import { RecipeListTab } from "@/components/recipes/recipe-list-tab"
import { MealPlanTab } from "@/components/recipes/meal-plan-tab"

interface RecipesPageProps {
  initialRecipes: Recipe[]
  shoppingLists: ShoppingList[]
  isAdultOrAdmin: boolean
}

type Tab = "recipes" | "mealplan"

export function RecipesPage({
  initialRecipes,
  shoppingLists,
  isAdultOrAdmin,
}: RecipesPageProps) {
  const t = useTranslations("recipes")
  const [activeTab, setActiveTab] = useState<Tab>("recipes")
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)

  return (
    <>
      {/* Page header */}
      <div className="mb-8 md:mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
          {t("pageBreadcrumb")}
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-secondary">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-base md:text-lg text-muted-foreground">
          {t("pageSubtitle")}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="mb-8 flex gap-3" role="tablist" aria-label={t("tabsAria")}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "recipes"}
          onClick={() => setActiveTab("recipes")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
            activeTab === "recipes"
              ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg"
              : "bg-surface-container-high text-foreground hover:bg-muted"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          {t("tabRecipes")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "mealplan"}
          onClick={() => setActiveTab("mealplan")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
            activeTab === "mealplan"
              ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg"
              : "bg-surface-container-high text-foreground hover:bg-muted"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          {t("tabMealPlan")}
        </button>
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === "recipes" && (
          <RecipeListTab
            recipes={recipes}
            setRecipes={setRecipes}
            shoppingLists={shoppingLists}
            isAdultOrAdmin={isAdultOrAdmin}
          />
        )}
        {activeTab === "mealplan" && (
          <MealPlanTab
            recipes={recipes}
            shoppingLists={shoppingLists}
          />
        )}
      </div>
    </>
  )
}
