"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { UtensilsCrossed } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Recipe } from "@/lib/actions/recipes"
import type { ShoppingList } from "@/lib/actions/shopping"
import {
  getRecipesAction,
  deleteRecipeAction,
} from "@/lib/actions/recipes"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useErrorTranslation } from "@/lib/use-error-translation"
import { TagFilterBar } from "@/components/recipes/tag-filter-bar"
import { RecipeCard } from "@/components/recipes/recipe-card"
import dynamic from "next/dynamic"

const RecipeFormDialog = dynamic(() =>
  import("@/components/recipes/recipe-form-dialog").then((m) => m.RecipeFormDialog)
)
const RecipeDetailSheet = dynamic(() =>
  import("@/components/recipes/recipe-detail-sheet").then((m) => m.RecipeDetailSheet)
)

interface RecipeListTabProps {
  recipes: Recipe[]
  setRecipes: (recipes: Recipe[]) => void
  shoppingLists: ShoppingList[]
  isAdultOrAdmin: boolean
}

export function RecipeListTab({
  recipes,
  setRecipes,
  shoppingLists,
  isAdultOrAdmin,
}: RecipeListTabProps) {
  const t = useTranslations("recipes")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const te = useErrorTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null)
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null)

  // Collect all unique tags from recipes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const recipe of recipes) {
      for (const tag of recipe.tags) {
        tagSet.add(tag)
      }
    }
    return Array.from(tagSet).sort()
  }, [recipes])

  // Filter recipes by selected tags
  const filteredRecipes = useMemo(() => {
    if (selectedTags.length === 0) return recipes
    return recipes.filter((recipe) =>
      selectedTags.every((tag) => recipe.tags.includes(tag))
    )
  }, [recipes, selectedTags])

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getRecipesAction()
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: te(result.error),
          variant: "destructive",
        })
        return
      }
      setRecipes(result.recipes)
    } catch {
      toast({
        title: tc("error"),
        description: t("loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, tc, t, te, setRecipes])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("recipes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recipes" },
        () => fetchRecipes()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recipe_ingredients" },
        () => fetchRecipes()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRecipes])

  function handleDeleteRequest(recipeId: string) {
    setRecipeToDelete(recipeId)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!recipeToDelete) return
    setIsDeleting(true)
    try {
      const result = await deleteRecipeAction(recipeToDelete)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: te(result.error),
          variant: "destructive",
        })
        return
      }
      toast({ title: t("recipeDeleted") })
      fetchRecipes()
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setRecipeToDelete(null)
    }
  }

  // Skeleton loading state
  if (isLoading && recipes.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[2rem] bg-card p-6 space-y-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Create new recipe button (adults only) */}
      {isAdultOrAdmin && (
        <div className="mb-8">
          <RecipeFormDialog
            mode="create"
            onSaved={fetchRecipes}
          />
        </div>
      )}

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="mb-8">
          <TagFilterBar
            allTags={allTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>
      )}

      {/* Recipe grid or empty state */}
      {filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 mb-6">
            <UtensilsCrossed className="h-10 w-10 text-secondary/40" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground mb-2">
            {selectedTags.length > 0 ? t("noFilterResults") : t("emptyTitle")}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {selectedTags.length > 0
              ? t("noFilterResultsDescription")
              : t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isAdultOrAdmin={isAdultOrAdmin}
              shoppingLists={shoppingLists}
              onView={() => setDetailRecipe(recipe)}
              onEdit={() => setEditRecipe(recipe)}
              onDelete={() => handleDeleteRequest(recipe.id)}
            />
          ))}
        </div>
      )}

      {/* Recipe detail sheet */}
      <RecipeDetailSheet
        recipe={detailRecipe}
        shoppingLists={shoppingLists}
        isAdultOrAdmin={isAdultOrAdmin}
        onClose={() => setDetailRecipe(null)}
        onEdit={(r) => {
          setDetailRecipe(null)
          setEditRecipe(r)
        }}
      />

      {/* Edit recipe dialog */}
      {editRecipe && (
        <RecipeFormDialog
          mode="edit"
          recipe={editRecipe}
          onSaved={() => {
            setEditRecipe(null)
            fetchRecipes()
          }}
          onClose={() => setEditRecipe(null)}
          autoOpen
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] sm:rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-bold text-secondary">
              {t("deleteRecipeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRecipeDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
            >
              {isDeleting ? tc("deleting") : tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
