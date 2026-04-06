import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { getShoppingListsAction } from "@/lib/actions/shopping"
import { ShoppingListOverview } from "@/components/shopping/shopping-list-overview"

export default async function ShoppingPage() {
  const dashResult = await getDashboardDataAction()

  if ("error" in dashResult) {
    if (dashResult.error === "Nicht angemeldet.") redirect("/login")
    if (dashResult.error === "Du gehoerst keiner Familie an.")
      redirect("/onboarding")
    redirect("/login")
  }

  const { role } = dashResult
  const isAdultOrAdmin = role === "admin" || role === "adult"

  const listsResult = await getShoppingListsAction()
  const initialLists = "error" in listsResult ? [] : listsResult.lists

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-48 sm:px-6 sm:pt-8 md:pb-40">
      <ShoppingListOverview
        initialLists={initialLists}
        isAdultOrAdmin={isAdultOrAdmin}
      />
    </main>
  )
}
