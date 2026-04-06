"use client"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Plus, ChevronDown } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addShoppingItemAction } from "@/lib/actions/shopping"
import { SHOPPING_CATEGORIES } from "@/lib/validations/shopping"
import { useToast } from "@/hooks/use-toast"

interface QuickAddInputProps {
  listId: string
  onAdded: () => void
}

export function QuickAddInput({ listId, onAdded }: QuickAddInputProps) {
  const t = useTranslations("shopping")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [productName, setProductName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [category, setCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productName.trim()) return

    setIsSubmitting(true)
    try {
      const result = await addShoppingItemAction({
        listId,
        productName: productName.trim(),
        quantity: quantity.trim() || undefined,
        category: category || undefined,
      })

      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setProductName("")
      setQuantity("")
      // Keep category for batch adding of same category
      onAdded()
      inputRef.current?.focus()
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Main input row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder={t("quickAddPlaceholder")}
            maxLength={200}
            disabled={isSubmitting}
            className="rounded-xl bg-card pr-10 h-14 text-base placeholder:text-muted-foreground/60"
            aria-label={t("quickAddLabel")}
          />
          {/* Expand options toggle */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
              showOptions ? "text-secondary" : "text-muted-foreground"
            }`}
            aria-label={t("moreOptions")}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showOptions ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Add button */}
        <button
          type="submit"
          disabled={isSubmitting || !productName.trim()}
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
          aria-label={t("addItem")}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Optional fields */}
      {showOptions && (
        <div className="flex flex-col sm:flex-row gap-2 animate-in slide-in-from-top-2 duration-200">
          <Input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={t("quantityPlaceholder")}
            maxLength={20}
            className="rounded-xl h-11 text-sm sm:w-32"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl h-11 text-sm sm:w-48">
              <SelectValue placeholder={t("categoryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noCategory")}</SelectItem>
              {SHOPPING_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </form>
  )
}
