"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import {
  UtensilsCrossed,
  MoreVertical,
  Pencil,
  Trash2,
  ShoppingCart,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Recipe } from "@/lib/actions/recipes"
import type { ShoppingList } from "@/lib/actions/shopping"
import { PREDEFINED_TAGS } from "@/lib/validations/recipes"
import { AddToShoppingListDialog } from "@/components/recipes/add-to-shopping-list-dialog"

interface RecipeCardProps {
  recipe: Recipe
  isAdultOrAdmin: boolean
  shoppingLists: ShoppingList[]
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function RecipeCard({
  recipe,
  isAdultOrAdmin,
  shoppingLists,
  onView,
  onEdit,
  onDelete,
}: RecipeCardProps) {
  const t = useTranslations("recipes")
  const [shoppingDialogOpen, setShoppingDialogOpen] = useState(false)

  function getTagLabel(tag: string) {
    const isPredefined = PREDEFINED_TAGS.includes(
      tag as (typeof PREDEFINED_TAGS)[number]
    )
    return isPredefined ? t(`tags.${tag}`) : tag
  }

  return (
    <>
      <article
        className="group relative rounded-[2rem] bg-card overflow-hidden transition-all hover:shadow-[0_0_3rem_rgba(42,47,50,0.06)] cursor-pointer"
        onClick={onView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onView()
          }
        }}
        aria-label={recipe.title}
      >
        {/* Image or placeholder */}
        <div className="relative h-44 bg-surface-container-low overflow-hidden">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Actions menu (adults only) */}
          {isAdultOrAdmin && (
            <div
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-md hover:bg-card transition-colors"
                    aria-label={t("recipeActions")}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("editRecipe")}
                  </DropdownMenuItem>
                  {shoppingLists.length > 0 && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setShoppingDialogOpen(true)
                      }}
                      className="gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {t("addToShoppingList")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("deleteRecipe")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-display text-lg font-bold text-foreground line-clamp-1">
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          )}

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {recipe.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-secondary"
                >
                  {getTagLabel(tag)}
                </span>
              ))}
              {recipe.tags.length > 4 && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-muted-foreground">
                  +{recipe.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Ingredient count */}
          <p className="mt-3 text-xs text-muted-foreground">
            {recipe.ingredients.length > 0
              ? t("ingredientCount", { count: recipe.ingredients.length })
              : t("noIngredients")}
          </p>
        </div>
      </article>

      {/* Add to shopping list dialog */}
      <AddToShoppingListDialog
        open={shoppingDialogOpen}
        onOpenChange={setShoppingDialogOpen}
        recipeId={recipe.id}
        recipeTitle={recipe.title}
        ingredientCount={recipe.ingredients.length}
        shoppingLists={shoppingLists}
      />
    </>
  )
}
