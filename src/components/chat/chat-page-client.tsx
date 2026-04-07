"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { MessageSquare } from "lucide-react"

import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatThread } from "@/components/chat/chat-thread"
import type { ChatChannel } from "@/lib/actions/chat"

interface ChatPageClientProps {
  initialChannels: ChatChannel[]
  currentUserId: string
  currentUserName: string
  familyMembers: { id: string; displayName: string }[]
}

export function ChatPageClient({
  initialChannels,
  currentUserId,
  currentUserName,
  familyMembers,
}: ChatPageClientProps) {
  const t = useTranslations("chat")
  const [channels, setChannels] = useState<ChatChannel[]>(initialChannels)
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    initialChannels.find((c) => c.type === "family")?.id || initialChannels[0]?.id || null
  )

  const activeChannel = channels.find((c) => c.id === activeChannelId) || null

  const handleChannelCreated = useCallback(
    (channel: ChatChannel) => {
      setChannels((prev) => {
        if (prev.some((c) => c.id === channel.id)) return prev
        return [...prev, channel]
      })
      setActiveChannelId(channel.id)
    },
    []
  )

  const handleChannelRead = useCallback(
    (channelId: string) => {
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
      )
    },
    []
  )

  const handleNewMessage = useCallback(
    (channelId: string, preview: string, senderName: string) => {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId
            ? {
                ...c,
                lastMessage: preview,
                lastMessageAt: new Date().toISOString(),
                lastMessageSender: senderName,
                unreadCount:
                  c.id === activeChannelId ? 0 : c.unreadCount + 1,
              }
            : c
        )
      )
    },
    [activeChannelId]
  )

  return (
    <div className="mx-auto max-w-7xl px-0 sm:px-4 md:px-6">
      {/* Header */}
      <div className="px-4 sm:px-0 pt-4 sm:pt-6 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
          {t("pageBreadcrumb")}
        </span>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-secondary">
          {t("pageTitle")}
        </h1>
      </div>

      {/* Chat layout */}
      <div className="flex h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)] rounded-[2rem] overflow-hidden bg-card shadow-[0_0_3rem_rgba(42,47,50,0.06)]">
        {/* Sidebar */}
        <ChatSidebar
          channels={channels}
          activeChannelId={activeChannelId}
          currentUserId={currentUserId}
          familyMembers={familyMembers}
          onSelectChannel={setActiveChannelId}
          onChannelCreated={handleChannelCreated}
        />

        {/* Thread or empty state */}
        {activeChannel ? (
          <ChatThread
            key={activeChannel.id}
            channel={activeChannel}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onChannelRead={handleChannelRead}
            onNewMessage={handleNewMessage}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 mb-4">
              <MessageSquare className="h-8 w-8 text-secondary/40" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mb-1">
              {t("selectChat")}
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {t("selectChatDescription")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
