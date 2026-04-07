"use client"

import { useState, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AssistantInputProps {
  onSend: (content: string) => void
  disabled: boolean
}

export function AssistantInput({ onSend, disabled }: AssistantInputProps) {
  const t = useTranslations("assistant")
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled) return
    onSend(value)
    setValue("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  // Auto-resize textarea
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      const textarea = e.target
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    },
    []
  )

  return (
    <div className="flex items-end gap-3">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={t("inputPlaceholder")}
          disabled={disabled}
          rows={1}
          className="w-full resize-none rounded-2xl bg-surface-container-lowest px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: "44px", maxHeight: "120px" }}
          aria-label={t("inputPlaceholder")}
        />
      </div>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        size="icon"
        className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white hover:opacity-90 disabled:opacity-40"
        aria-label={t("send")}
      >
        <Send className="h-4.5 w-4.5" />
      </Button>
    </div>
  )
}
