"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { Users, Loader2, MessageCircle } from "lucide-react"

import { MessageBubble } from "@/components/chat/message-bubble"
import { MessageInput } from "@/components/chat/message-input"
import { ImageLightbox } from "@/components/chat/image-lightbox"
import {
  getMessagesAction,
  sendMessageAction,
  markChannelReadAction,
  uploadChatImageAction,
  deleteChatImageAction,
  getSignedImageUrlAction,
  deleteMessageAction,
  editMessageAction,
  type ChatChannel,
  type ChatMessage,
} from "@/lib/actions/chat"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useErrorTranslation } from "@/lib/use-error-translation"

interface ChatThreadProps {
  channel: ChatChannel
  currentUserId: string
  currentUserName: string
  currentUserRole: string
  onChannelRead: (channelId: string) => void
  onNewMessage: (channelId: string, preview: string, senderName: string) => void
  onOpenMobileSidebar?: () => void
}

export function ChatThread({
  channel,
  currentUserId,
  currentUserName,
  currentUserRole,
  onChannelRead,
  onNewMessage,
  onOpenMobileSidebar,
}: ChatThreadProps) {
  const t = useTranslations("chat")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const te = useErrorTranslation()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pendingMutationRef = useRef(false)
  const isInitialLoadRef = useRef(true)

  const isAdminOrAdult = currentUserRole === "admin" || currentUserRole === "adult"

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  // Load initial messages
  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      isInitialLoadRef.current = true
      try {
        const result = await getMessagesAction({ channelId: channel.id })
        if (cancelled) return
        if ("error" in result) {
          toast({ title: tc("error"), description: te(result.error), variant: "destructive" })
          return
        }
        setMessages(result.messages)
        setHasMore(result.hasMore)
      } catch {
        if (!cancelled) {
          toast({ title: tc("error"), description: t("loadError"), variant: "destructive" })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [channel.id, toast, tc, t, te])

  // Scroll to bottom after initial load
  useEffect(() => {
    if (!isLoading && isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      setTimeout(() => scrollToBottom("instant"), 50)
    }
  }, [isLoading, scrollToBottom])

  // Mark channel as read
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      markChannelReadAction({ channelId: channel.id })
      onChannelRead(channel.id)
    }
  }, [channel.id, isLoading, messages.length, onChannelRead])

  // Realtime subscription for new messages
  useEffect(() => {
    const supabase = createClient()
    const subscription = supabase
      .channel(`chat_thread_${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        async (payload) => {
          // Skip if we just sent this message (optimistic already added it)
          if (pendingMutationRef.current) {
            pendingMutationRef.current = false
            return
          }

          const newMsg = payload.new as {
            id: string
            channel_id: string
            sender_id: string
            content: string
            image_url: string | null
            created_at: string
          }

          // Resolve signed URL for image if present
          let imageUrl = newMsg.image_url
          if (imageUrl) {
            const urlResult = await getSignedImageUrlAction({ path: imageUrl })
            imageUrl = "url" in urlResult ? urlResult.url : null
          }

          // Skip if already in list (dedup)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev

            const sender = channel.members.find((m) => m.id === newMsg.sender_id)
            const message: ChatMessage = {
              id: newMsg.id,
              channelId: newMsg.channel_id,
              senderId: newMsg.sender_id,
              senderName: sender?.displayName || "Unbekannt",
              content: newMsg.content,
              imageUrl,
              createdAt: newMsg.created_at,
            }

            return [...prev, message]
          })

          // Update sidebar preview
          const sender = channel.members.find((m) => m.id === newMsg.sender_id)
          const preview = newMsg.content
            ? newMsg.content.substring(0, 100)
            : t("chatImage")
          onNewMessage(channel.id, preview, sender?.displayName || "Unbekannt")

          // Mark as read & scroll
          markChannelReadAction({ channelId: channel.id })
          onChannelRead(channel.id)
          setTimeout(() => scrollToBottom(), 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channel.id, channel.members, onNewMessage, onChannelRead, scrollToBottom, t])

  // Load older messages
  async function handleLoadOlder() {
    if (isLoadingMore || !hasMore || messages.length === 0) return
    setIsLoadingMore(true)

    const container = scrollContainerRef.current
    const prevScrollHeight = container?.scrollHeight || 0

    try {
      const cursor = messages[0].createdAt
      const result = await getMessagesAction({ channelId: channel.id, cursor })
      if ("error" in result) return

      setMessages((prev) => [...result.messages, ...prev])
      setHasMore(result.hasMore)

      // Maintain scroll position
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight
        }
      })
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Send message (with optional image)
  async function handleSend(content: string, file?: File) {
    if (isSending) return
    setIsSending(true)
    pendingMutationRef.current = true

    let uploadedPath: string | null = null
    // Create a local blob URL for instant preview in optimistic message
    const localBlobUrl = file ? URL.createObjectURL(file) : null

    // Upload image first if present
    if (file) {
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const uploadResult = await uploadChatImageAction(formData)
        if ("error" in uploadResult) {
          toast({ title: tc("error"), description: te(uploadResult.error), variant: "destructive" })
          if (localBlobUrl) URL.revokeObjectURL(localBlobUrl)
          setIsUploading(false)
          setIsSending(false)
          pendingMutationRef.current = false
          return
        }
        uploadedPath = uploadResult.path
      } catch {
        toast({ title: tc("error"), description: t("imageUploadError"), variant: "destructive" })
        if (localBlobUrl) URL.revokeObjectURL(localBlobUrl)
        setIsUploading(false)
        setIsSending(false)
        pendingMutationRef.current = false
        return
      } finally {
        setIsUploading(false)
      }
    }

    // Optimistic add with local blob URL for instant image preview
    const tempId = `temp-${Date.now()}`
    const tempMsg: ChatMessage = {
      id: tempId,
      channelId: channel.id,
      senderId: currentUserId,
      senderName: currentUserName,
      content,
      imageUrl: localBlobUrl,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    const preview = content ? content.substring(0, 100) : t("chatImage")
    onNewMessage(channel.id, preview, currentUserName)
    setTimeout(() => scrollToBottom(), 50)

    try {
      const result = await sendMessageAction({
        channelId: channel.id,
        content,
        imageUrl: uploadedPath,
      })
      if ("error" in result) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        pendingMutationRef.current = false
        if (localBlobUrl) URL.revokeObjectURL(localBlobUrl)
        toast({ title: tc("error"), description: te(result.error), variant: "destructive" })
        return
      }

      // Get signed URL for the uploaded image, then revoke the blob URL
      let signedUrl: string | null = null
      if (uploadedPath) {
        const urlResult = await getSignedImageUrlAction({ path: uploadedPath })
        signedUrl = "url" in urlResult ? urlResult.url : null
      }
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl)

      // Replace temp with real
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: result.message.id, createdAt: result.message.createdAt, imageUrl: signedUrl }
            : m
        )
      )
      markChannelReadAction({ channelId: channel.id })
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      pendingMutationRef.current = false
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl)
      toast({ title: tc("error"), description: t("messageError"), variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  // Delete image from a message
  async function handleDeleteImage(messageId: string) {
    const result = await deleteChatImageAction({ messageId })
    if ("error" in result) {
      toast({ title: tc("error"), description: te(result.error), variant: "destructive" })
      return
    }
    // Remove imageUrl from local state
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, imageUrl: null } : m))
    )
    toast({ description: t("imageDeleted") })
  }

  // Delete a message
  async function handleDeleteMessage(messageId: string) {
    const result = await deleteMessageAction({ messageId })
    if ("error" in result) {
      toast({ title: tc("error"), description: te(result.error), variant: "destructive" })
      return
    }
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
    toast({ description: t("messageDeleted") })
  }

  // Edit a message
  async function handleEditMessage(messageId: string, content: string) {
    const result = await editMessageAction({ messageId, content })
    if ("error" in result) {
      toast({ title: tc("error"), description: te(result.error), variant: "destructive" })
      return
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content } : m))
    )
    toast({ description: t("messageEdited") })
  }

  // Group messages by date
  function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return t("today")
    if (date.toDateString() === yesterday.toDateString()) return t("yesterday")

    return date.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-outline-variant/15 shrink-0">
        {/* Mobile sidebar toggle */}
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
            aria-label="Chats"
          >
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 shrink-0">
          {channel.type === "family" ? (
            <Users className="h-5 w-5 text-secondary" />
          ) : (
            <span className="text-sm font-bold text-secondary">
              {channel.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-foreground truncate">
            {channel.type === "family" ? t("familyChannel") : channel.name}
          </h2>
          {channel.type === "family" && (
            <p className="text-xs text-muted-foreground">
              {channel.members.length} {tc("family").toLowerCase()}
            </p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1 scrollbar-none"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="font-display text-lg font-bold text-foreground mb-1">
              {t("noMessages")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("noMessagesDescription")}
            </p>
          </div>
        ) : (
          <>
            {/* Load older button */}
            {hasMore && (
              <div className="flex justify-center pb-4">
                <button
                  type="button"
                  onClick={handleLoadOlder}
                  disabled={isLoadingMore}
                  className="text-xs font-medium text-secondary hover:text-secondary/80 disabled:opacity-50 transition-colors"
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("loadOlder")
                  )}
                </button>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null
              const showDateSeparator =
                !prevMsg ||
                new Date(msg.createdAt).toDateString() !==
                  new Date(prevMsg.createdAt).toDateString()

              const showSenderName =
                channel.type === "family" &&
                msg.senderId !== currentUserId &&
                (!prevMsg || prevMsg.senderId !== msg.senderId || showDateSeparator)

              // Can delete image: own message or admin/adult
              const canDeleteImage =
                !!msg.imageUrl &&
                (msg.senderId === currentUserId || isAdminOrAdult)

              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center py-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-surface-container-low px-3 py-1 rounded-full">
                        {getDateLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={msg.senderId === currentUserId}
                    showSenderName={showSenderName}
                    canDeleteImage={canDeleteImage}
                    onImageClick={setLightboxSrc}
                    onDeleteImage={handleDeleteImage}
                    onDeleteMessage={handleDeleteMessage}
                    onEditMessage={handleEditMessage}
                  />
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <MessageInput onSend={handleSend} isSending={isSending} isUploading={isUploading} />

      {/* Lightbox */}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  )
}
