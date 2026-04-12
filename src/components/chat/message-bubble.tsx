"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Trash2, Loader2, MoreVertical, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ChatMessage } from "@/lib/actions/chat"

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showSenderName: boolean
  canDeleteImage?: boolean
  onImageClick?: (src: string) => void
  onDeleteImage?: (messageId: string) => Promise<void>
  onDeleteMessage?: (messageId: string) => Promise<void>
  onEditMessage?: (messageId: string, content: string) => Promise<void>
}

export function MessageBubble({
  message,
  isOwn,
  showSenderName,
  canDeleteImage,
  onImageClick,
  onDeleteImage,
  onDeleteMessage,
  onEditMessage,
}: MessageBubbleProps) {
  const t = useTranslations("chat")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingMsg, setIsDeletingMsg] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const time = new Date(message.createdAt).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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

  async function handleDeleteMessage() {
    if (!onDeleteMessage || isDeletingMsg) return
    setIsDeletingMsg(true)
    try {
      await onDeleteMessage(message.id)
    } finally {
      setIsDeletingMsg(false)
    }
  }

  async function handleSaveEdit() {
    if (!onEditMessage || isSavingEdit || !editContent.trim()) return
    setIsSavingEdit(true)
    try {
      await onEditMessage(message.id, editContent.trim())
      setIsEditing(false)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const canShowMenu = isOwn && (onDeleteMessage || onEditMessage)

  return (
    <div
      className={`group flex ${isOwn ? "justify-end" : "justify-start"} ${
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
          <div className="relative group/img mb-1">
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
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-100 sm:opacity-0 transition-opacity sm:group-hover/img:opacity-100 hover:bg-destructive disabled:opacity-100"
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

        {/* Text bubble — editing mode */}
        {isEditing && hasText && (
          <div className="rounded-2xl bg-surface-container-high p-3 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[60px] rounded-xl bg-surface-container-lowest p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={2000}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditContent(message.content) }}
                className="text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                {t("editCancel")}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editContent.trim()}
                className="text-xs font-medium text-white bg-secondary px-3 py-1.5 rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition-colors"
              >
                {isSavingEdit ? t("editSaving") : t("editSave")}
              </button>
            </div>
          </div>
        )}

        {/* Text bubble — normal display */}
        {hasText && !isEditing && (
          <div className="relative">
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

            {/* Context menu for own messages */}
            {canShowMenu && (
              <div className={`absolute top-1 ${isOwn ? "-left-8" : "-right-8"} opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity`}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
                    >
                      <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? "start" : "end"} className="min-w-[140px]">
                    {onEditMessage && hasText && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        {t("editMessage")}
                      </DropdownMenuItem>
                    )}
                    {onDeleteMessage && (
                      <DropdownMenuItem
                        onClick={handleDeleteMessage}
                        disabled={isDeletingMsg}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        {t("deleteMessage")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
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
