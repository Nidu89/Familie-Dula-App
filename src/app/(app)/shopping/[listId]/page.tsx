import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { getShoppingListDetailAction } from "@/lib/actions/shopping"
import { ShoppingListDetail } from "@/components/shopping/shopping-list-detail"

interface ShoppingListDetailPageProps {
  params: Promise<{ listId: string }>
}

export default async function ShoppingListDetailPage({
  params,
}: ShoppingListDetailPageProps) {
  const { listId } = await params
  const dashResult = await getDashboardDataAction()

  if ("error" in dashResult) {
    if (dashResult.error === "Nicht angemeldet.") redirect("/login")
    if (dashResult.error === "Du gehoerst keiner Familie an.")
      redirect("/onboarding")
    redirect("/login")
  }

  const { role } = dashResult
  const isAdultOrAdmin = role === "admin" || role === "adult"

  const detailResult = await getShoppingListDetailAction(listId)

  if ("error" in detailResult) {
    redirect("/shopping")
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-48 sm:px-6 sm:pt-8 md:pb-40">
      <ShoppingListDetail
        listId={listId}
        initialList={detailResult.list}
        initialItems={detailResult.items}
        isAdultOrAdmin={isAdultOrAdmin}
      />
    </main>
  )
}
