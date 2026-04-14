"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ShoppingCart, Check } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ShoppingList } from "@/lib/actions/shopping"
import { addRecipeIngredientsToShoppingListAction } from "@/lib/actions/recipes"
import { useToast } from "@/hooks/use-toast"
import { useErrorTranslation } from "@/lib/use-error-translation"

interface AddToShoppingListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipeId: string
  recipeTitle: string
  ingredientCount: number
  shoppingLists: ShoppingList[]
}

export function AddToShoppingListDialog({
  open,
  onOpenChange,
  recipeId,
  recipeTitle,
  ingredientCount,
  shoppingLists,
}: AddToShoppingListDialogProps) {
  const t = useTranslations("recipes")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const te = useErrorTranslation()
  const [isAdding, setIsAdding] = useState(false)
  const [addedListId, setAddedListId] = useState<string | null>(null)

  async function handleAddToList(listId: string) {
    if (ingredientCount === 0) {
      toast({
        title: t("noIngredientsToAdd"),
        variant: "destructive",
      })
      return
    }

    setIsAdding(true)
    try {
      const result = await addRecipeIngredientsToShoppingListAction({
        recipeId,
        listId,
      })
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: te(result.error),
          variant: "destructive",
        })
        return
      }
      setAddedListId(listId)
      toast({
        title: t("ingredientsAdded", { count: result.addedCount }),
      })
      setTimeout(() => {
        onOpenChange(false)
        setAddedListId(null)
      }, 800)
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] sm:rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-secondary">
            {t("addToShoppingListTitle")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          {t("addToShoppingListDescription", { recipe: recipeTitle })}
        </p>

        {shoppingLists.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t("noShoppingLists")}
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {shoppingLists.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => handleAddToList(list.id)}
                disabled={isAdding}
                className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 transition-all ${
                  addedListId === list.id
                    ? "bg-green-100 text-green-800"
                    : "hover:bg-muted active:scale-[0.98]"
                } disabled:opacity-50`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
                  {addedListId === list.id ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <ShoppingCart className="h-5 w-5 text-secondary" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{list.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {list.itemCount}{" "}
                    {list.itemCount === 1
                      ? t("item")
                      : t("items")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
