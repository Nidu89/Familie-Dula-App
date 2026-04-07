import { redirect } from "next/navigation"

import { getAppSession } from "@/lib/session"
import { getShoppingListDetailAction } from "@/lib/actions/shopping"
import { ShoppingListDetail } from "@/components/shopping/shopping-list-detail"

interface ShoppingListDetailPageProps {
  params: Promise<{ listId: string }>
}

export default async function ShoppingListDetailPage({
  params,
}: ShoppingListDetailPageProps) {
  const { listId } = await params
  const session = await getAppSession()
  if (!session) redirect("/login")

  const isAdultOrAdmin = session.role === "admin" || session.role === "adult"

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
