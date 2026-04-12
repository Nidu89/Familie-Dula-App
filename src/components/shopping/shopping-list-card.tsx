"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { ShoppingCart, Trash2, Check } from "lucide-react"

import type { ShoppingList } from "@/lib/actions/shopping"

interface ShoppingListCardProps {
  list: ShoppingList
  isAdultOrAdmin: boolean
  onDelete: (listId: string) => void
}

export function ShoppingListCard({
  list,
  isAdultOrAdmin,
  onDelete,
}: ShoppingListCardProps) {
  const t = useTranslations("shopping")
  const remaining = list.itemCount - list.doneCount
  const progress =
    list.itemCount > 0
      ? Math.round((list.doneCount / list.itemCount) * 100)
      : 0

  return (
    <div className="group relative bg-card rounded-[2rem] p-7 transition-all hover:shadow-lg hover:shadow-foreground/[0.04] hover:translate-y-[-2px]">
      <Link
        href={`/shopping/${list.id}`}
        className="absolute inset-0 rounded-[2rem] z-10"
        aria-label={list.name}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
            <ShoppingCart className="h-5 w-5 text-secondary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-lg text-foreground leading-tight truncate">
              {list.name}
            </h3>
            {list.createdByName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("createdBy", { name: list.createdByName })}
              </p>
            )}
          </div>
        </div>

        {/* Delete button for adults/admins */}
        {isAdultOrAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(list.id)
            }}
            className="relative z-20 p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label={t("deleteList")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Item count */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          {list.itemCount === 0
            ? t("noItems")
            : t("itemCount", { count: list.itemCount })}
        </span>
        {list.doneCount > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <Check className="h-3 w-3" />
            {t("doneCount", { count: list.doneCount })}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {list.itemCount > 0 && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Remaining text */}
      {remaining > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("remainingItems", { count: remaining })}
        </p>
      )}
    </div>
  )
}
