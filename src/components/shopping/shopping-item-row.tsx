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
  onToggled: (itemId: string, isDone: boolean) => void
  onDeleted: (itemId: string) => void
  onRevert: (itemId: string, prevState: ShoppingItem) => void
}

export function ShoppingItemRow({
  item,
  onToggled,
  onDeleted,
  onRevert,
}: ShoppingItemRowProps) {
  const tc = useTranslations("common")
  const t = useTranslations("shopping")
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const isTempItem = item.id.startsWith("temp-")

  async function handleToggle(checked: boolean) {
    onToggled(item.id, checked)

    // Temp items haven't been persisted yet — skip server call
    if (isTempItem) return

    try {
      const result = await toggleShoppingItemAction(item.id, checked)
      if ("error" in result) {
        onRevert(item.id, item)
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      onRevert(item.id, item)
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    onDeleted(item.id)

    // Temp items haven't been persisted yet — no server call needed
    if (isTempItem) {
      setIsDeleting(false)
      return
    }

    try {
      const result = await deleteShoppingItemAction(item.id)
      if ("error" in result) {
        onRevert(item.id, item)
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      onRevert(item.id, item)
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
        item.isDone
          ? "bg-muted/50"
          : "bg-card hover:bg-muted/30"
      }`}
    >
      {/* Checkbox */}
      <Checkbox
        checked={item.isDone}
        onCheckedChange={(checked) => handleToggle(checked === true)}
        className="h-6 w-6 rounded-lg border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        aria-label={t("toggleItem", { name: item.productName })}
      />

      {/* Product name + quantity */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium text-sm leading-tight transition-all ${
            item.isDone
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
      {item.category && !item.isDone && (
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
