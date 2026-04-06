"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Globe } from "lucide-react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useLocale } from "@/context/locale-context"

const LOCALES = [
  { value: "de" as const, flag: "\ud83c\udde9\ud83c\uddea" },
  { value: "en" as const, flag: "\ud83c\uddec\ud83c\udde7" },
  { value: "fr" as const, flag: "\ud83c\uddeb\ud83c\uddf7" },
]

export function LanguageSwitcher() {
  const t = useTranslations("family.language")
  const { locale, setLocale } = useLocale()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const handleSelect = async (newLocale: "de" | "en" | "fr") => {
    if (newLocale === locale || saving) return
    setSaving(true)
    try {
      await setLocale(newLocale)
      toast({ title: t("saved") })
    } catch {
      toast({ title: t("error"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-card border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-secondary">
          <Globe className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {LOCALES.map(({ value, flag }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={saving}
              className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                locale === value
                  ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg"
                  : "bg-surface-container-high text-foreground hover:bg-surface-container"
              }`}
            >
              <span className="text-lg">{flag}</span>
              {t(value)}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
