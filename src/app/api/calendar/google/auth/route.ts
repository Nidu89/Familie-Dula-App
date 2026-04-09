import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getGoogleAuthUrl } from "@/lib/calendar-providers/google"

/**
 * GET /api/calendar/google/auth
 * Redirects user to Google OAuth consent screen.
 * State parameter carries user ID for callback verification.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 })
  }

  const state = user.id
  const authUrl = getGoogleAuthUrl(state)

  return NextResponse.redirect(authUrl)
}
