"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createShoppingListAction } from "@/lib/actions/shopping"
import { useToast } from "@/hooks/use-toast"
import { useErrorTranslation } from "@/lib/use-error-translation"

interface CreateListDialogProps {
  onCreated: () => void
}

export function CreateListDialog({ onCreated }: CreateListDialogProps) {
  const t = useTranslations("shopping")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const te = useErrorTranslation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const result = await createShoppingListAction({ name: name.trim() })
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: te(result.error),
          variant: "destructive",
        })
        return
      }
      toast({ title: t("listCreated") })
      setName("")
      setOpen(false)
      onCreated()
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          aria-label={t("newList")}
        >
          <Plus className="h-5 w-5" />
          {t("newList")}
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] sm:rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-secondary">
            {t("newList")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="list-name">{t("listName")}</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("listNamePlaceholder")}
              maxLength={100}
              autoFocus
              className="rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-6 py-3 rounded-full text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? tc("creating") : tc("create")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
