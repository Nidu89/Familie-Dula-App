"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Bot } from "lucide-react"
import { useSession } from "@/context/session-context"
import { AssistantSheet } from "@/components/assistant/assistant-sheet"

export function AssistantButton() {
  const t = useTranslations("assistant")
  const session = useSession()
  const [open, setOpen] = useState(false)

  const handleOpen = useCallback(() => {
    setOpen(true)
  }, [])

  // Don't render if not logged in or no family
  if (!session.userId || !session.familyId) return null

  return (
    <>
      {/* Floating button — bottom right, above BottomNav on mobile */}
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-8 md:right-8 md:h-16 md:w-16"
        aria-label={t("floatingButtonLabel")}
      >
        <Bot className="h-6 w-6 md:h-7 md:w-7" />
      </button>

      {/* Assistant Chat Sheet */}
      <AssistantSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
