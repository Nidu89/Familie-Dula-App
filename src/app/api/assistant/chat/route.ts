import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/crypto"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import { chatRequestSchema } from "@/lib/validations/assistant"
import {
  TOOL_DEFINITIONS,
  executeTool,
  getFamilyMembers,
} from "@/lib/assistant/tools"

// ============================================================
// PROJ-17: KI-Assistent – POST /api/assistant/chat
// Agentic loop: sends messages to Claude, executes tool calls,
// returns the final assistant response.
// ============================================================

const MAX_TOOL_ITERATIONS = 5

// System prompts per locale
function getSystemPrompt(
  locale: string,
  familyMembers: { id: string; displayName: string; role: string }[],
  currentUser: { displayName: string; role: string; id: string }
): string {
  const memberList = familyMembers
    .map(
      (m) =>
        `- ${m.displayName} (${m.role}, ID: ${m.id})`
    )
    .join("\n")

  const today = new Date().toISOString().split("T")[0]

  const basePrompt = `You are a helpful family assistant for the Familie-Dula-App. You help family members manage their tasks, calendar events, rituals, shopping lists, and meal plans.

Current date: ${today}
Current user: ${currentUser.displayName} (${currentUser.role}, ID: ${currentUser.id})

Family members:
${memberList}

Important rules:
- Always be friendly and helpful.
- When creating tasks or events, confirm what you will create before doing it if the user's request is ambiguous.
- When the user mentions a family member by name, use their profile ID from the list above.
- For shopping lists: ALWAYS use list_shopping_lists first to show available lists and let the user choose which list to use. Never guess the list ID.
- For meal plans, the current week key can be calculated from today's date. Weekdays are 0=Monday through 6=Sunday.
- When listing items, format them in a clear, readable way.
- If a tool call fails, explain the error in a user-friendly way and suggest alternatives.
- Keep responses concise but informative.`

  if (locale === "de") {
    return (
      basePrompt +
      "\n\nAntworte IMMER auf Deutsch. Verwende eine freundliche, familiare Sprache."
    )
  } else if (locale === "fr") {
    return (
      basePrompt +
      "\n\nReponds TOUJOURS en francais. Utilise un ton amical et familial."
    )
  }

  return (
    basePrompt +
    "\n\nAlways respond in English. Use a friendly, family-oriented tone."
  )
}

export async function POST(request: NextRequest) {
  // Block cross-origin requests
  const origin = request.headers.get("origin")
  if (origin) {
    const url = new URL(request.url)
    if (origin !== url.origin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }
  }

  // 1. Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Nicht angemeldet." },
      { status: 401 }
    )
  }

  // 2. Rate limiting: 20 requests per minute per user
  const ip = await getIP()
  if (!checkRateLimit(`assistantChat:${user.id}:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warte kurz." },
      { status: 429 }
    )
  }

  // 3. Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, family_id, role, display_name")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.family_id) {
    return NextResponse.json(
      { error: "Profil oder Familie nicht gefunden." },
      { status: 400 }
    )
  }

  // 4. Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Ungueltige Anfrage." },
      { status: 400 }
    )
  }

  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Ungueltige Eingaben: " +
          parsed.error.issues.map((i) => i.message).join(", "),
      },
      { status: 400 }
    )
  }

  // 5. Trim to last 10 messages for token management
  const messages = parsed.data.messages.slice(-10)
  const locale = parsed.data.locale

  // 6. Get the encrypted API key via the SECURITY DEFINER function
  const { data: encryptedKey, error: keyError } = await supabase.rpc(
    "get_family_ai_key",
    { p_family_id: profile.family_id }
  )

  if (keyError || !encryptedKey) {
    return NextResponse.json(
      {
        error:
          "Kein API-Key konfiguriert. Bitte den Admin der Familie bitten, einen API-Key in den Einstellungen zu hinterlegen.",
      },
      { status: 400 }
    )
  }

  // 7. Decrypt the API key
  let apiKey: string
  try {
    apiKey = decrypt(encryptedKey as string)
  } catch {
    return NextResponse.json(
      {
        error:
          "API-Key konnte nicht entschluesselt werden. Bitte den Admin bitten, den Key neu zu setzen.",
      },
      { status: 500 }
    )
  }

  // 8. Get family members for context
  const familyMembers = await getFamilyMembers(profile.family_id)

  // 9. Build the system prompt
  const systemPrompt = getSystemPrompt(locale, familyMembers, {
    displayName: profile.display_name || "User",
    role: profile.role || "child",
    id: profile.id,
  })

  // 10. Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey,
  })

  // 11. Agentic loop
  let claudeMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  let iterations = 0
  let finalText = ""
  const toolResults: Array<{
    toolName: string
    success: boolean
    data?: unknown
    error?: string
  }> = []

  try {
    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        tools: TOOL_DEFINITIONS,
        messages: claudeMessages,
      })

      // Check if Claude wants to use tools
      const hasToolUse = response.content.some(
        (block) => block.type === "tool_use"
      )

      if (response.stop_reason === "end_turn" || !hasToolUse) {
        // Extract final text
        finalText = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n")
        break
      }

      // Process tool calls
      const assistantContent = response.content
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = []

      for (const block of assistantContent) {
        if (block.type === "tool_use") {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            profile as { id: string; family_id: string; role: string; display_name: string | null }
          )

          toolResults.push({
            toolName: block.name,
            success: result.success,
            data: result.data,
            error: result.error,
          })

          toolResultBlocks.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(
              result.success
                ? result.data
                : { error: result.error }
            ),
            is_error: !result.success,
          })
        }
      }

      // Add assistant response and tool results to message history
      claudeMessages = [
        ...claudeMessages,
        { role: "assistant", content: assistantContent },
        { role: "user", content: toolResultBlocks },
      ]
    }

    // If we exhausted iterations without a final text, use what we have
    if (!finalText && iterations >= MAX_TOOL_ITERATIONS) {
      finalText =
        locale === "de"
          ? "Ich habe mehrere Aktionen ausgefuehrt, aber die Verarbeitung hat zu lange gedauert. Bitte pruefe die Ergebnisse manuell."
          : locale === "fr"
            ? "J'ai effectue plusieurs actions, mais le traitement a pris trop de temps. Veuillez verifier les resultats manuellement."
            : "I performed several actions, but processing took too long. Please check the results manually."
    }

    return NextResponse.json({
      message: finalText,
      toolResults,
    })
  } catch (err: unknown) {
    console.error("[PROJ-17] Claude API error:", err)

    // Handle specific Anthropic errors
    const error = err as { status?: number; message?: string }
    if (error.status === 401) {
      return NextResponse.json(
        {
          error:
            "API-Key ist ungueltig. Bitte den Admin informieren, damit der Key in den Einstellungen aktualisiert wird.",
        },
        { status: 400 }
      )
    }

    if (error.status === 429) {
      return NextResponse.json(
        {
          error:
            "API-Limit erreicht. Bitte versuche es in einer Minute erneut.",
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      {
        error:
          "Ein Fehler ist beim KI-Assistenten aufgetreten. Bitte versuche es erneut.",
      },
      { status: 500 }
    )
  }
}
