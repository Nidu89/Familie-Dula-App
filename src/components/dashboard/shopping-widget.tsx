"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ShoppingCart, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { getShoppingListsAction, type ShoppingList } from "@/lib/actions/shopping"

export function ShoppingWidget() {
  const t = useTranslations("dashboard.shoppingWidget")
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getShoppingListsAction()
      if ("lists" in result) {
        setLists(result.lists.slice(0, 3))
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalItems = lists.reduce((sum, l) => sum + l.itemCount, 0)
  const totalDone = lists.reduce((sum, l) => sum + l.doneCount, 0)
  const remaining = totalItems - totalDone

  return (
    <section className="rounded-[2rem] bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">{t("title")}</h3>
        <ShoppingCart className="h-5 w-5 text-secondary" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
        </div>
      ) : lists.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">{t("empty")}</p>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => {
            const progress = list.itemCount > 0
              ? Math.round((list.doneCount / list.itemCount) * 100)
              : 0
            return (
              <Link
                key={list.id}
                href={`/shopping/${list.id}`}
                className="flex items-center gap-3 rounded-xl bg-muted p-3 hover:bg-muted/80 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{list.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {list.itemCount === 0
                      ? t("noItems")
                      : t("itemStatus", { remaining: list.itemCount - list.doneCount, total: list.itemCount })}
                  </p>
                </div>
                {list.doneCount > 0 && list.doneCount === list.itemCount ? (
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                ) : list.itemCount > 0 ? (
                  <span className="text-xs font-bold text-secondary shrink-0">{progress}%</span>
                ) : null}
              </Link>
            )
          })}
        </div>
      )}

      {remaining > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t("remaining", { count: remaining })}
        </p>
      )}

      <Link
        href="/shopping"
        className="mt-4 flex items-center gap-2 text-sm font-bold text-secondary hover:text-secondary/80 transition-colors"
      >
        {t("viewAll")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  )
}
