"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Trash2, Loader2 } from "lucide-react"
import type { ChatMessage } from "@/lib/actions/chat"

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showSenderName: boolean
  canDeleteImage?: boolean
  onImageClick?: (src: string) => void
  onDeleteImage?: (messageId: string) => Promise<void>
}

export function MessageBubble({
  message,
  isOwn,
  showSenderName,
  canDeleteImage,
  onImageClick,
  onDeleteImage,
}: MessageBubbleProps) {
  const t = useTranslations("chat")
  const [isDeleting, setIsDeleting] = useState(false)

  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })

  const hasImage = !!message.imageUrl
  const hasText = !!message.content
  const isEmpty = !hasImage && !hasText

  async function handleDeleteImage() {
    if (!onDeleteImage || isDeleting) return
    setIsDeleting(true)
    try {
      await onDeleteImage(message.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} ${
        showSenderName ? "mt-3" : "mt-0.5"
      }`}
    >
      <div className={`max-w-[80%] sm:max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name */}
        {showSenderName && (
          <p className="text-[10px] font-semibold text-secondary mb-1 px-3">
            {message.senderName}
          </p>
        )}

        {/* Image thumbnail */}
        {hasImage && (
          <div className="relative group mb-1">
            <button
              type="button"
              onClick={() => onImageClick?.(message.imageUrl!)}
              className="block rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label={t("imageFullView")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl!}
                alt={t("chatImage")}
                className="max-w-full sm:max-w-[300px] max-h-[300px] object-cover rounded-2xl"
                loading="lazy"
              />
            </button>

            {/* Delete button overlay */}
            {canDeleteImage && (
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={isDeleting}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 hover:bg-destructive disabled:opacity-100"
                aria-label={t("deleteImage")}
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Text bubble (only if there's text content) */}
        {hasText && (
          <div
            className={`relative px-4 py-2.5 rounded-2xl ${
              isOwn
                ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white rounded-br-lg"
                : "bg-surface-container-high text-foreground rounded-bl-lg"
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
            <p
              className={`text-[10px] mt-1 text-right ${
                isOwn ? "text-white/60" : "text-muted-foreground"
              }`}
            >
              {time}
            </p>
          </div>
        )}

        {/* Deleted image placeholder */}
        {isEmpty && (
          <div className="rounded-2xl rounded-bl-lg bg-surface-container-high px-4 py-2.5">
            <p className="text-sm italic text-muted-foreground">{t("imageRemoved")}</p>
            <p className="text-[10px] mt-1 text-right text-muted-foreground">{time}</p>
          </div>
        )}

        {/* Timestamp for image-only messages */}
        {hasImage && !hasText && (
          <p className={`text-[10px] px-1 ${isOwn ? "text-right" : "text-left"} text-muted-foreground`}>
            {time}
          </p>
        )}
      </div>
    </div>
  )
}
