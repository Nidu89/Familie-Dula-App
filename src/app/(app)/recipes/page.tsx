import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { getRecipesAction } from "@/lib/actions/recipes"
import { getShoppingListsAction } from "@/lib/actions/shopping"
import { RecipesPage } from "@/components/recipes/recipes-page"

export default async function RecipesRoute() {
  const dashResult = await getDashboardDataAction()

  if ("error" in dashResult) {
    if (dashResult.error === "Nicht angemeldet.") redirect("/login")
    if (dashResult.error === "Du gehoerst keiner Familie an.")
      redirect("/onboarding")
    redirect("/login")
  }

  const { role } = dashResult
  const isAdultOrAdmin = role === "admin" || role === "adult"

  const recipesResult = await getRecipesAction()
  const initialRecipes = "error" in recipesResult ? [] : recipesResult.recipes

  const listsResult = await getShoppingListsAction()
  const shoppingLists = "error" in listsResult ? [] : listsResult.lists

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-48 sm:px-6 sm:pt-8 md:pb-40">
      <RecipesPage
        initialRecipes={initialRecipes}
        shoppingLists={shoppingLists}
        isAdultOrAdmin={isAdultOrAdmin}
      />
    </main>
  )
}
