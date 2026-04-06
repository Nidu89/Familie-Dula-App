import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  // Block cross-origin requests to prevent session probing
  const origin = request.headers.get("origin")
  if (origin) {
    const url = new URL(request.url)
    if (origin !== url.origin) {
      return NextResponse.json(null, { status: 403 })
    }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(null, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, role, display_name, locale")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json(null, { status: 404 })
  }

  // Fetch family name for navigation
  let familyName: string | null = null
  if (profile.family_id) {
    const { data: family } = await supabase
      .from("families")
      .select("name")
      .eq("id", profile.family_id)
      .single()
    familyName = family?.name ?? null
  }

  return NextResponse.json({
    familyId: profile.family_id,
    role: profile.role ?? "child",
    displayName: profile.display_name ?? user.email?.split("@")[0] ?? "User",
    familyName,
    locale: profile.locale ?? "en",
  })
}
