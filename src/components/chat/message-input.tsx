"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Send, ImagePlus, X, Loader2 } from "lucide-react"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

interface MessageInputProps {
  onSend: (content: string, file?: File) => void
  isSending: boolean
  isUploading?: boolean
}

export function MessageInput({ onSend, isSending, isUploading }: MessageInputProps) {
  const t = useTranslations("chat")
  const [content, setContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const busy = isSending || !!isUploading

  // Cleanup Object URL on unmount to prevent memory leak
  const previewUrlRef = useRef<string | null>(null)
  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset file input so the same file can be re-selected
    e.target.value = ""

    setFileError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(t("imageFormatError"))
      return
    }
    if (file.size > MAX_SIZE) {
      setFileError(t("imageSizeError"))
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setFileError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if ((!trimmed && !selectedFile) || busy) return

    onSend(trimmed, selectedFile ?? undefined)
    setContent("")
    clearFile()
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
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 sm:px-6 py-3 border-t border-outline-variant/15 bg-card shrink-0"
    >
      {/* File error */}
      {fileError && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-destructive/10 px-3 py-2">
          <span className="text-xs text-destructive">{fileError}</span>
          <button type="button" onClick={() => setFileError(null)} className="text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Image preview */}
      {previewUrl && (
        <div className="mb-2 relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={t("imagePreview")}
            className="h-20 w-20 rounded-xl object-cover"
          />
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          ) : (
            <button
              type="button"
              onClick={clearFile}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
              aria-label={t("removeImage")}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Image attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground disabled:opacity-50 shrink-0"
          aria-label={t("attachImage")}
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={t("messagePlaceholder")}
            maxLength={2000}
            rows={1}
            disabled={busy}
            className="w-full resize-none rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 scrollbar-none"
            aria-label={t("messagePlaceholder")}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={busy || (!content.trim() && !selectedFile)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shrink-0"
          aria-label={t("sendMessage")}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </form>
  )
}
