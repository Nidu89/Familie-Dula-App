"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Trash2 } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  toggleShoppingItemAction,
  deleteShoppingItemAction,
  type ShoppingItem,
} from "@/lib/actions/shopping"
import { useToast } from "@/hooks/use-toast"

interface ShoppingItemRowProps {
  item: ShoppingItem
  onUpdated: () => void
}

export function ShoppingItemRow({ item, onUpdated }: ShoppingItemRowProps) {
  const tc = useTranslations("common")
  const t = useTranslations("shopping")
  const { toast } = useToast()
  const [optimisticDone, setOptimisticDone] = useState(item.isDone)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleToggle(checked: boolean) {
    // Optimistic update
    setOptimisticDone(checked)

    try {
      const result = await toggleShoppingItemAction(item.id, checked)
      if ("error" in result) {
        setOptimisticDone(!checked) // revert
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      onUpdated()
    } catch {
      setOptimisticDone(!checked) // revert
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteShoppingItemAction(item.id)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      onUpdated()
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl p-3.5 min-h-16 transition-colors ${
        optimisticDone
          ? "bg-muted/50"
          : "bg-card hover:bg-muted/30"
      }`}
    >
      {/* Checkbox */}
      <Checkbox
        checked={optimisticDone}
        onCheckedChange={(checked) => handleToggle(checked === true)}
        className="h-6 w-6 rounded-lg border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        aria-label={t("toggleItem", { name: item.productName })}
      />

      {/* Product name + quantity */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium text-sm leading-tight transition-all ${
            optimisticDone
              ? "line-through text-muted-foreground/60"
              : "text-foreground"
          }`}
        >
          {item.productName}
        </p>
        {(item.quantity || item.unit) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {[item.quantity, item.unit].filter(Boolean).join(" ")}
          </p>
        )}
      </div>

      {/* Category badge */}
      {item.category && !optimisticDone && (
        <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary-container text-secondary whitespace-nowrap">
          {t(`categories.${item.category}`, { defaultMessage: item.category })}
        </span>
      )}

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
        aria-label={t("deleteItem")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
