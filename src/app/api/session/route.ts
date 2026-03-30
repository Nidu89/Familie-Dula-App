import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(null, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json(null, { status: 404 })
  }

  return NextResponse.json({
    familyId: profile.family_id,
    role: profile.role ?? "child",
  })
}
