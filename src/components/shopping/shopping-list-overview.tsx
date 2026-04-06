"use client"

import { useState, useCallback, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ShoppingBag } from "lucide-react"

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
import { ShoppingListCard } from "@/components/shopping/shopping-list-card"
import { CreateListDialog } from "@/components/shopping/create-list-dialog"
import {
  getShoppingListsAction,
  deleteShoppingListAction,
  type ShoppingList,
} from "@/lib/actions/shopping"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ShoppingListOverviewProps {
  initialLists: ShoppingList[]
  isAdultOrAdmin: boolean
}

export function ShoppingListOverview({
  initialLists,
  isAdultOrAdmin,
}: ShoppingListOverviewProps) {
  const t = useTranslations("shopping")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [lists, setLists] = useState<ShoppingList[]>(initialLists)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchLists = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getShoppingListsAction()
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setLists(result.lists)
    } catch {
      toast({
        title: tc("error"),
        description: t("loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, tc, t])

  // Realtime subscription for shopping_lists changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("shopping_lists_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_lists" },
        () => fetchLists()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items" },
        () => fetchLists()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLists])

  function handleDeleteRequest(listId: string) {
    setListToDelete(listId)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!listToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteShoppingListAction(listToDelete)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({ title: t("listDeleted") })
      fetchLists()
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setListToDelete(null)
    }
  }

  // Skeleton loading state
  if (isLoading && lists.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[2rem] bg-card p-7 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-8 md:mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
          {t("pageBreadcrumb")}
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-secondary">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-base md:text-lg text-muted-foreground">
          {t("pageSubtitle")}
        </p>
      </div>

      {/* Create new list button */}
      <div className="mb-8">
        <CreateListDialog onCreated={fetchLists} />
      </div>

      {/* Lists grid */}
      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 mb-6">
            <ShoppingBag className="h-10 w-10 text-secondary/40" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground mb-2">
            {t("emptyTitle")}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              isAdultOrAdmin={isAdultOrAdmin}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
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
              onClick={handleDeleteConfirm}
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
