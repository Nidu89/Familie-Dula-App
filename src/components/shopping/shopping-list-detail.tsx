"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  Trash2,
  CheckCheck,
  ShoppingBag,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShoppingItemRow } from "@/components/shopping/shopping-item-row"
import { QuickAddInput } from "@/components/shopping/quick-add-input"
import { SuggestionsBar } from "@/components/shopping/suggestions-bar"
import {
  getShoppingListDetailAction,
  deleteShoppingListAction,
  clearCompletedItemsAction,
  type ShoppingList,
  type ShoppingItem,
} from "@/lib/actions/shopping"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ShoppingListDetailProps {
  listId: string
  initialList: ShoppingList
  initialItems: ShoppingItem[]
  isAdultOrAdmin: boolean
}

export function ShoppingListDetail({
  listId,
  initialList,
  initialItems,
  isAdultOrAdmin,
}: ShoppingListDetailProps) {
  const t = useTranslations("shopping")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const router = useRouter()
  const [list, setList] = useState<ShoppingList>(initialList)
  const [items, setItems] = useState<ShoppingItem[]>(initialItems)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClearingCompleted, setIsClearingCompleted] = useState(false)

  const fetchDetail = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getShoppingListDetailAction(listId)
      if ("error" in result) {
        // List might have been deleted
        if (result.error === "Einkaufsliste nicht gefunden.") {
          toast({ title: t("listDeletedToast") })
          router.push("/shopping")
          return
        }
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setList(result.list)
      setItems(result.items)
    } catch {
      toast({
        title: tc("error"),
        description: t("loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [listId, toast, tc, t, router])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`shopping_detail_${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_items",
          filter: `list_id=eq.${listId}`,
        },
        () => fetchDetail()
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "shopping_lists",
        },
        (payload) => {
          // Check if our list was deleted
          if (payload.old && (payload.old as { id?: string }).id === listId) {
            toast({ title: t("listDeletedToast") })
            router.push("/shopping")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId, fetchDetail, toast, t, router])

  // Group items by category, with unchecked first, then checked at bottom
  const { activeItems, completedItems, groupedActive } = useMemo(() => {
    const active = items.filter((i) => !i.isDone)
    const completed = items.filter((i) => i.isDone)

    // Group active items by category
    const groups = new Map<string, ShoppingItem[]>()
    for (const item of active) {
      const cat = item.category || "uncategorized"
      if (!groups.has(cat)) groups.set(cat, [])
      groups.get(cat)!.push(item)
    }

    return {
      activeItems: active,
      completedItems: completed,
      groupedActive: groups,
    }
  }, [items])

  const completedCount = completedItems.length

  async function handleDeleteList() {
    setIsDeleting(true)
    try {
      const result = await deleteShoppingListAction(listId)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({ title: t("listDeleted") })
      router.push("/shopping")
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  async function handleClearCompleted() {
    setIsClearingCompleted(true)
    try {
      const result = await clearCompletedItemsAction(listId)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: t("clearedCompleted", { count: result.deletedCount }),
      })
      fetchDetail()
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsClearingCompleted(false)
    }
  }

  // Category label helper
  function getCategoryLabel(category: string): string {
    if (category === "uncategorized") return t("uncategorized")
    return t(`categories.${category}`, { defaultMessage: category })
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={() => router.push("/shopping")}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label={tc("back")}
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
            {t("breadcrumb")}
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-secondary truncate">
            {list.name}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clear completed */}
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              disabled={isClearingCompleted}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
              aria-label={t("clearCompleted")}
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{t("clearCompleted")}</span>
              <span className="sm:hidden">{completedCount}</span>
            </button>
          )}

          {/* Delete list (adults only) */}
          {isAdultOrAdmin && (
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              className="p-2.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label={t("deleteList")}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick add input */}
      <div className="mb-6 mt-6">
        <QuickAddInput listId={listId} onAdded={fetchDetail} />
      </div>

      {/* Suggestions */}
      <div className="mb-6">
        <SuggestionsBar listId={listId} onAdded={fetchDetail} />
      </div>

      {/* Items list */}
      {items.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 mb-4">
            <ShoppingBag className="h-8 w-8 text-secondary/40" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground mb-1">
            {t("emptyListTitle")}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {t("emptyListDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active items grouped by category */}
          {groupedActive.size > 0 && (
            <div className="space-y-6">
              {[...groupedActive.entries()].map(([category, categoryItems]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3 px-1">
                    {getCategoryLabel(category)}
                  </h3>
                  <div className="space-y-1.5">
                    {categoryItems.map((item) => (
                      <ShoppingItemRow
                        key={item.id}
                        item={item}
                        onUpdated={fetchDetail}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed items */}
          {completedItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                {t("completedSection", { count: completedItems.length })}
              </h3>
              <div className="space-y-1.5">
                {completedItems.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onUpdated={fetchDetail}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete list confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] sm:rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-bold text-secondary">
              {t("deleteListTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteListDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
            >
              {isDeleting ? tc("deleting") : tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
