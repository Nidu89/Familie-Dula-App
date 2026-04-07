import { redirect } from "next/navigation"

import { getAppSession } from "@/lib/session"
import { getShoppingListsAction } from "@/lib/actions/shopping"
import { ShoppingListOverview } from "@/components/shopping/shopping-list-overview"

export default async function ShoppingPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const isAdultOrAdmin = session.role === "admin" || session.role === "adult"

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
