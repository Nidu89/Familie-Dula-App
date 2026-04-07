"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Bot, Eye, EyeOff, Loader2, Check, Trash2, Pencil } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  saveApiKeyAction,
  deleteApiKeyAction,
  getApiKeyStatusAction,
} from "@/lib/actions/assistant"

export function ApiKeySection() {
  const t = useTranslations("assistant.apiKeySection")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [maskedKey, setMaskedKey] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [apiKeyValue, setApiKeyValue] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Fetch current API key status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const result = await getApiKeyStatusAction()
        if ("error" in result) {
          setConfigured(false)
        } else {
          setConfigured(result.configured)
          setMaskedKey(result.masked || null)
        }
      } catch {
        setConfigured(false)
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [])

  const handleSave = useCallback(async () => {
    if (!apiKeyValue.trim()) return
    setSaving(true)

    try {
      const result = await saveApiKeyAction({ apiKey: apiKeyValue.trim() })
      if ("error" in result) {
        toast({ title: result.error, variant: "destructive" })
      } else {
        setConfigured(true)
        setMaskedKey(result.masked)
        setEditing(false)
        setApiKeyValue("")
        setShowKey(false)
        toast({ title: t("saved") })
      }
    } catch {
      toast({ title: t("saveError"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }, [apiKeyValue, toast, t])

  const handleDelete = useCallback(async () => {
    setDeleting(true)

    try {
      const result = await deleteApiKeyAction()
      if ("error" in result) {
        toast({ title: result.error, variant: "destructive" })
      } else {
        setConfigured(false)
        setMaskedKey(null)
        setEditing(false)
        setApiKeyValue("")
        toast({ title: t("deleted") })
      }
    } catch {
      toast({ title: t("deleteError"), variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }, [toast, t])

  const handleCancel = useCallback(() => {
    setEditing(false)
    setApiKeyValue("")
    setShowKey(false)
  }, [])

  if (loading) {
    return (
      <Card className="bg-card border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-secondary">
            <Bot className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-secondary">
          <Bot className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status display */}
        {configured && !editing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("configured")}
                </p>
                {maskedKey && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {maskedKey}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="gap-1.5 rounded-full"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("change")}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full text-destructive hover:text-destructive"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    {t("delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Not configured — show status + setup button */}
        {!configured && !editing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <span>{t("notConfigured")}</span>
            </div>
            <Button
              onClick={() => setEditing(true)}
              size="sm"
              className="gap-1.5 rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white"
            >
              <Bot className="h-3.5 w-3.5" />
              {t("inputLabel")}
            </Button>
          </div>
        )}

        {/* Editing mode — input field + save/cancel */}
        {editing && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label
                htmlFor="api-key-input"
                className="text-sm font-medium text-foreground"
              >
                {t("inputLabel")}
              </label>
              <div className="relative">
                <Input
                  id="api-key-input"
                  type={showKey ? "text" : "password"}
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder={t("inputPlaceholder")}
                  className="pr-10 font-mono text-sm"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? tc("hidePassword") : tc("showPassword")}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t("inputHint")}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !apiKeyValue.trim()}
                size="sm"
                className="gap-1.5 rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {tc("saving")}
                  </>
                ) : (
                  tc("save")
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="rounded-full"
              >
                {tc("cancel")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
