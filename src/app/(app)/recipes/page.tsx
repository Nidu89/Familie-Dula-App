import { redirect } from "next/navigation"

import { getAppSession } from "@/lib/session"
import { getRecipesAction } from "@/lib/actions/recipes"
import { getShoppingListsAction } from "@/lib/actions/shopping"
import { RecipesPage } from "@/components/recipes/recipes-page"

export default async function RecipesRoute() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const isAdultOrAdmin = session.role === "admin" || session.role === "adult"

  const [recipesResult, listsResult] = await Promise.all([
    getRecipesAction(),
    getShoppingListsAction(),
  ])
  const initialRecipes = "error" in recipesResult ? [] : recipesResult.recipes
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
