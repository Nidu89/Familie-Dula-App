"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Bot, Send, Loader2, RotateCcw, Sparkles, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useSession } from "@/context/session-context"
import { useLocale } from "@/context/locale-context"
import { AssistantMessages } from "@/components/assistant/assistant-messages"
import { AssistantInput } from "@/components/assistant/assistant-input"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  toolResults?: ToolResult[]
  isError?: boolean
}

export interface ToolResult {
  toolName: string
  success: boolean
  data?: unknown
  error?: string
}

interface AssistantSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssistantSheet({ open, onOpenChange }: AssistantSheetProps) {
  const t = useTranslations("assistant")
  const session = useSession()
  const { locale } = useLocale()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasCheckedApiKey = useRef(false)

  // Check API key status when sheet opens for the first time
  useEffect(() => {
    if (!open || hasCheckedApiKey.current) return
    hasCheckedApiKey.current = true

    async function checkApiKey() {
      try {
        const res = await fetch("/api/assistant/status")
        if (res.ok) {
          const data = await res.json()
          setApiKeyConfigured(data.configured)
        } else {
          setApiKeyConfigured(false)
        }
      } catch {
        setApiKeyConfigured(false)
      }
    }

    checkApiKey()
  }, [open])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Ref to always have latest messages available (avoids stale closure in handleRetry)
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages

  const handleSend = useCallback(
    async (content: string, overrideHistory?: ChatMessage[]) => {
      if (!content.trim() || isLoading) return

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      try {
        // Use overrideHistory if provided (retry case), otherwise use ref for latest state
        const history = overrideHistory ?? messagesRef.current
        const apiMessages = [...history, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            locale,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.error || t("errorGeneric"),
            isError: true,
          }
          setMessages((prev) => [...prev, errorMessage])
          setError(data.error || t("errorGeneric"))
          return
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          toolResults: data.toolResults,
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: t("errorGeneric"),
          isError: true,
        }
        setMessages((prev) => [...prev, errorMessage])
        setError(t("errorGeneric"))
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, locale, t]
  )

  const handleRetry = useCallback(() => {
    // Find the last user message and retry
    const currentMessages = messagesRef.current
    const lastUserMessage = [...currentMessages].reverse().find((m) => m.role === "user")
    if (!lastUserMessage) return

    // Build cleaned history: remove trailing errors + the last user message
    const cleaned = [...currentMessages]
    while (cleaned.length > 0 && cleaned[cleaned.length - 1].isError) {
      cleaned.pop()
    }
    if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === "user") {
      cleaned.pop()
    }

    // Update state with cleaned messages, then send with the cleaned history
    setMessages(cleaned)
    handleSend(lastUserMessage.content, cleaned)
  }, [handleSend])

  const handleNewChat = useCallback(() => {
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md md:max-w-lg [&>button[class*='absolute']]:hidden"
      >
        {/* Header */}
        <SheetHeader className="flex-shrink-0 border-b border-border/15 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709]">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-left font-display text-lg font-bold text-secondary">
                  {t("title")}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {t("welcome")}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="h-8 gap-1.5 rounded-full text-xs text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("newChat")}
                </Button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4">
            {apiKeyConfigured === null ? (
              // Loading state
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !apiKeyConfigured ? (
              // No API key configured
              <NoApiKeyMessage message={t("noApiKey")} />
            ) : messages.length === 0 ? (
              // Welcome message
              <WelcomeMessage
                displayName={session.displayName}
              />
            ) : (
              // Chat messages
              <AssistantMessages
                messages={messages}
                displayName={session.displayName}
              />
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                  <span className="text-sm text-muted-foreground">
                    {t("sending")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-border/15 px-5 py-4">
          {apiKeyConfigured === false ? null : (
            <>
              {error && (
                <div className="mb-3 flex items-center justify-between rounded-xl bg-destructive/10 px-4 py-2.5">
                  <span className="text-sm text-destructive">{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {t("retry")}
                  </Button>
                </div>
              )}
              <AssistantInput
                onSend={handleSend}
                disabled={isLoading || apiKeyConfigured !== true}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function WelcomeMessage({ displayName }: { displayName: string }) {
  const t = useTranslations("assistant")
  const actions = t("welcomeActions").split(", ")

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709]">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl rounded-tl-md bg-surface-container-low px-4 py-3">
            <p className="text-sm text-foreground">
              {t("welcome")}
            </p>
          </div>
          <div className="rounded-2xl rounded-tl-md bg-surface-container-low px-4 py-3">
            <ul className="space-y-2">
              {actions.map((action) => (
                <li key={action} className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-foreground" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl rounded-tl-md bg-surface-container-low px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {t("welcomeHint")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NoApiKeyMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
        <Bot className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
