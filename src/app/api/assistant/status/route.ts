import { NextResponse } from "next/server"
import { getApiKeyStatusAction } from "@/lib/actions/assistant"

/**
 * GET /api/assistant/status
 * Returns whether an API key is configured for the current user's family.
 * Used by the floating assistant button to determine initial state.
 */
export async function GET() {
  try {
    const result = await getApiKeyStatusAction()

    if ("error" in result) {
      return NextResponse.json({ configured: false }, { status: 200 })
    }

    return NextResponse.json({ configured: result.configured })
  } catch {
    return NextResponse.json({ configured: false }, { status: 200 })
  }
}
