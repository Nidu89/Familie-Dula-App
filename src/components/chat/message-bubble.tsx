"use client"

import type { ChatMessage } from "@/lib/actions/chat"

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showSenderName: boolean
}

export function MessageBubble({ message, isOwn, showSenderName }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })

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

        {/* Bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl ${
            isOwn
              ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white rounded-br-lg"
              : "bg-surface-container-high text-foreground rounded-bl-lg"
          }`}
        >
          {/* Message text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Timestamp */}
          <p
            className={`text-[10px] mt-1 text-right ${
              isOwn ? "text-white/60" : "text-muted-foreground"
            }`}
          >
            {time}
          </p>
        </div>
      </div>
    </div>
  )
}
