"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import {
  UtensilsCrossed,
  Pencil,
  ShoppingCart,
  X,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Recipe } from "@/lib/actions/recipes"
import type { ShoppingList } from "@/lib/actions/shopping"
import { PREDEFINED_TAGS } from "@/lib/validations/recipes"
import { AddToShoppingListDialog } from "@/components/recipes/add-to-shopping-list-dialog"

interface RecipeDetailSheetProps {
  recipe: Recipe | null
  shoppingLists: ShoppingList[]
  isAdultOrAdmin: boolean
  onClose: () => void
  onEdit: (recipe: Recipe) => void
}

export function RecipeDetailSheet({
  recipe,
  shoppingLists,
  isAdultOrAdmin,
  onClose,
  onEdit,
}: RecipeDetailSheetProps) {
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
      <Sheet open={!!recipe} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto rounded-l-[2rem] p-0"
        >
          {recipe && (
            <>
              {/* Image or placeholder */}
              <div className="relative h-56 bg-surface-container-low">
                {recipe.imageUrl ? (
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <UtensilsCrossed className="h-16 w-16 text-muted-foreground/20" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-md hover:bg-card transition-colors"
                  aria-label={t("close")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <SheetHeader className="space-y-1">
                  <SheetTitle className="font-display text-2xl font-extrabold text-secondary">
                    {recipe.title}
                  </SheetTitle>
                  {recipe.createdByName && (
                    <p className="text-xs text-muted-foreground">
                      {t("createdBy", { name: recipe.createdByName })}
                    </p>
                  )}
                </SheetHeader>

                {/* Tags */}
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary-container text-secondary"
                      >
                        {getTagLabel(tag)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {recipe.description && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      {t("descriptionLabel")}
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {recipe.description}
                    </p>
                  </div>
                )}

                {/* Ingredients */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {t("ingredientsLabel")}
                  </h4>
                  {recipe.ingredients.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      {t("noIngredients")}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ing) => (
                        <li
                          key={ing.id}
                          className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3"
                        >
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground flex-1">
                            {ing.name}
                          </span>
                          {(ing.quantity || ing.unit) && (
                            <span className="text-xs text-muted-foreground">
                              {[ing.quantity, ing.unit]
                                .filter(Boolean)
                                .join(" ")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {isAdultOrAdmin && (
                    <button
                      type="button"
                      onClick={() => onEdit(recipe)}
                      className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-surface-container-high text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                      {t("editRecipe")}
                    </button>
                  )}
                  {shoppingLists.length > 0 &&
                    recipe.ingredients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShoppingDialogOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {t("addToShoppingList")}
                      </button>
                    )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {recipe && (
        <AddToShoppingListDialog
          open={shoppingDialogOpen}
          onOpenChange={setShoppingDialogOpen}
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          ingredientCount={recipe.ingredients.length}
          shoppingLists={shoppingLists}
        />
      )}
    </>
  )
}
