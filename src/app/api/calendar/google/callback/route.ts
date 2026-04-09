import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exchangeGoogleCode } from "@/lib/calendar-providers/google"
import { encrypt } from "@/lib/crypto"

/**
 * GET /api/calendar/google/callback
 * Handles Google OAuth callback: exchanges code for tokens, stores encrypted credentials.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state") // user ID
  const error = searchParams.get("error")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  const settingsUrl = `${appUrl}/settings/calendar-integrations`

  if (error) {
    return NextResponse.redirect(
      `${settingsUrl}?error=google_denied`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${settingsUrl}?error=google_missing_params`
    )
  }

  // Verify the user matches the state
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== state) {
    return NextResponse.redirect(
      `${settingsUrl}?error=google_auth_mismatch`
    )
  }

  // Get user profile for family_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single()

  if (!profile?.family_id) {
    return NextResponse.redirect(
      `${settingsUrl}?error=no_family`
    )
  }

  try {
    // Exchange code for tokens
    const credentials = await exchangeGoogleCode(code)

    // Encrypt credentials
    const encryptedCredentials = encrypt(JSON.stringify(credentials))

    // Upsert integration (one Google connection per user)
    const { error: dbError } = await supabase
      .from("calendar_integrations")
      .upsert(
        {
          user_id: user.id,
          family_id: profile.family_id,
          provider: "google",
          status: "active",
          credentials_encrypted: encryptedCredentials,
          selected_calendars: [],
          last_error: null,
        },
        { onConflict: "user_id,provider" }
      )

    if (dbError) {
      return NextResponse.redirect(
        `${settingsUrl}?error=google_save_failed`
      )
    }

    return NextResponse.redirect(
      `${settingsUrl}?success=google_connected`
    )
  } catch {
    return NextResponse.redirect(
      `${settingsUrl}?error=google_token_exchange_failed`
    )
  }
}
