"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Sparkles, Plus } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  getSuggestedItemsAction,
  addShoppingItemAction,
} from "@/lib/actions/shopping"
import { useToast } from "@/hooks/use-toast"

interface SuggestionsBarProps {
  listId: string
  onAdded: () => void
}

export function SuggestionsBar({ listId, onAdded }: SuggestionsBarProps) {
  const t = useTranslations("shopping")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addingItem, setAddingItem] = useState<string | null>(null)

  const fetchSuggestions = useCallback(async () => {
    try {
      const result = await getSuggestedItemsAction(listId)
      if ("error" in result) return
      setSuggestions(result.suggestions)
    } catch {
      // best-effort
    } finally {
      setIsLoading(false)
    }
  }, [listId])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  async function handleAddSuggestion(name: string) {
    setAddingItem(name)
    try {
      const result = await addShoppingItemAction({
        listId,
        productName: name,
      })
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      // Remove from suggestions
      setSuggestions((prev) => prev.filter((s) => s !== name))
      onAdded()
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setAddingItem(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
          {t("suggestions")}
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestions.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => handleAddSuggestion(name)}
            disabled={addingItem === name}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-container text-secondary text-xs font-semibold whitespace-nowrap hover:bg-secondary/20 active:scale-95 transition-all disabled:opacity-50 shrink-0"
          >
            <Plus className="h-3 w-3" />
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
