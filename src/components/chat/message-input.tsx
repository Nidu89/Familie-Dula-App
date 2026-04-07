"use client"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Send } from "lucide-react"

interface MessageInputProps {
  onSend: (content: string) => void
  isSending: boolean
}

export function MessageInput({ onSend, isSending }: MessageInputProps) {
  const t = useTranslations("chat")
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || isSending) return
    onSend(trimmed)
    setContent("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-4 sm:px-6 py-3 border-t border-outline-variant/15 bg-card shrink-0"
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={t("messagePlaceholder")}
          maxLength={2000}
          rows={1}
          disabled={isSending}
          className="w-full resize-none rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 scrollbar-none"
          aria-label={t("messagePlaceholder")}
        />
      </div>

      <button
        type="submit"
        disabled={isSending || !content.trim()}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shrink-0"
        aria-label={t("sendMessage")}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  )
}
