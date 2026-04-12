"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Pencil, Check, X } from "lucide-react"
import { getFamilyQuoteAction, updateFamilyQuoteAction } from "@/lib/actions/family"
import { useToast } from "@/hooks/use-toast"

interface DashboardQuoteProps {
  familyId: string
  isAdmin: boolean
}

export function DashboardQuote({ familyId, isAdmin }: DashboardQuoteProps) {
  const t = useTranslations("dashboard.quote")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const [quote, setQuote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const defaultQuote = t("default")

  useEffect(() => {
    async function load() {
      const result = await getFamilyQuoteAction()
      if ("quote" in result) {
        setQuote(result.quote)
      }
      setLoading(false)
    }
    load()
  }, [familyId])

  async function handleSave() {
    if (isSaving) return
    setIsSaving(true)
    try {
      const result = await updateFamilyQuoteAction(editValue.trim())
      if ("error" in result) {
        toast({ title: tc("error"), description: result.error, variant: "destructive" })
        return
      }
      setQuote(editValue.trim() || null)
      setIsEditing(false)
      toast({ description: t("saved") })
    } finally {
      setIsSaving(false)
    }
  }

  function startEditing() {
    setEditValue(quote || "")
    setIsEditing(true)
  }

  const displayQuote = quote || defaultQuote

  if (loading) return null

  return (
    <div
      className="relative flex items-start gap-4 bg-primary/10 p-8 italic text-muted-foreground"
      style={{
        borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
      }}
    >
      <span className="mt-0.5 shrink-0 text-xl text-primary-foreground">
        &ldquo;
      </span>

      {isEditing ? (
        <div className="flex-1 space-y-3 not-italic">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full min-h-[60px] bg-transparent text-sm font-medium text-foreground resize-none focus:outline-none"
            maxLength={500}
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <Check className="h-4 w-4 text-secondary" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="flex-1 text-sm font-medium">{displayQuote}</p>
          {isAdmin && (
            <button
              type="button"
              onClick={startEditing}
              className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors not-italic"
              aria-label={t("edit")}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </>
      )}
    </div>
  )
}
