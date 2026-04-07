"use client"

import { useTranslations } from "next-intl"
import {
  Bot,
  User,
  CheckCircle2,
  XCircle,
  ListChecks,
  CalendarPlus,
  ShoppingCart,
  UtensilsCrossed,
  Calendar,
  ClipboardList,
} from "lucide-react"
import type { ChatMessage, ToolResult } from "@/components/assistant/assistant-sheet"

interface AssistantMessagesProps {
  messages: ChatMessage[]
  displayName: string
}

// Map tool names to icons
const TOOL_ICONS: Record<string, typeof ListChecks> = {
  list_tasks: ClipboardList,
  create_task: ListChecks,
  list_calendar_events: Calendar,
  create_calendar_event: CalendarPlus,
  list_rituals: ListChecks,
  create_ritual: ListChecks,
  list_shopping_lists: ShoppingCart,
  list_shopping_items: ShoppingCart,
  add_shopping_item: ShoppingCart,
  get_meal_plan: UtensilsCrossed,
  add_meal: UtensilsCrossed,
}

export function AssistantMessages({
  messages,
  displayName,
}: AssistantMessagesProps) {
  const t = useTranslations("assistant")

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? (
            <UserBubble content={message.content} displayName={displayName} />
          ) : (
            <AssistantBubble
              content={message.content}
              toolResults={message.toolResults}
              isError={message.isError}
              t={t}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── User message bubble ─────────────────────────────────── */

function UserBubble({
  content,
  displayName,
}: {
  content: string
  displayName: string
}) {
  // Get user initials
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="max-w-[80%] space-y-1">
        <div className="rounded-2xl rounded-tr-md bg-gradient-to-br from-[#6c5a00] to-[#ffd709] px-4 py-3">
          <p className="text-sm text-white whitespace-pre-wrap">{content}</p>
        </div>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-white text-xs font-bold">
        {initials || <User className="h-4 w-4" />}
      </div>
    </div>
  )
}

/* ── Assistant message bubble ────────────────────────────── */

function AssistantBubble({
  content,
  toolResults,
  isError,
  t,
}: {
  content: string
  toolResults?: ToolResult[]
  isError?: boolean
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709]">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="max-w-[85%] space-y-2">
        {/* Tool result cards */}
        {toolResults && toolResults.length > 0 && (
          <div className="space-y-2">
            {toolResults.map((result, i) => (
              <ToolResultCard key={`${result.toolName}-${i}`} result={result} t={t} />
            ))}
          </div>
        )}

        {/* Text content */}
        {content && (
          <div
            className={`rounded-2xl rounded-tl-md px-4 py-3 ${
              isError
                ? "bg-destructive/10 text-destructive"
                : "bg-surface-container-low text-foreground"
            }`}
          >
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Tool result card ────────────────────────────────────── */

function ToolResultCard({
  result,
  t,
}: {
  result: ToolResult
  t: ReturnType<typeof useTranslations>
}) {
  const Icon = TOOL_ICONS[result.toolName] || ListChecks
  const label = t.has(`toolLabels.${result.toolName}`)
    ? t(`toolLabels.${result.toolName}` as Parameters<typeof t>[0])
    : result.toolName

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm ${
        result.success
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          result.success
            ? "bg-emerald-100 dark:bg-emerald-900/50"
            : "bg-destructive/20"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="font-medium">{label}</span>
      {result.success ? (
        <CheckCircle2 className="ml-auto h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="ml-auto h-4 w-4 shrink-0" />
      )}
    </div>
  )
}
