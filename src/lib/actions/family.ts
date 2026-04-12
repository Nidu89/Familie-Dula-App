"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  createFamilySchema,
  joinFamilyByCodeSchema,
  updateFamilyNameSchema,
  inviteByEmailSchema,
  updateRoleSchema,
  removeMemberSchema,
  updateLocaleSchema,
} from "@/lib/validations/family"

// ============================================================
// PROJ-2 Family Server Actions – Supabase Backend
// Reuses rate-limiting pattern from auth.ts
// ============================================================

// In-Memory Rate-Limiting (per Serverinstanz)
const attempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false
  entry.count++
  return true
}

async function getIP(): Promise<string> {
  const headersList = await headers()
  const realIP = headersList.get("x-real-ip")
  if (realIP) return realIP.trim()

  const forwarded = headersList.get("x-forwarded-for")
  if (forwarded) {
    const ips = forwarded.split(",")
    return ips[ips.length - 1].trim()
  }

  return "unknown"
}

// Helper: get current user's profile with family info
async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, family_id, role, display_name")
    .eq("id", user.id)
    .single()

  return profile
}

// Helper: verify caller is admin of their family
async function verifyAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet.", profile: null }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an.", profile: null }
  if (profile.role !== "admin")
    return { error: "Nur Admins duerfen diese Aktion ausfuehren.", profile: null }
  return { error: null, profile }
}

export async function createFamilyAction(familyName: string) {
  const parsed = createFamilySchema.safeParse({ familyName })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`createFamily:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nicht angemeldet." }
  }

  // Check if user already belongs to a family
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single()

  if (existingProfile?.family_id) {
    return { error: "Du gehoerst bereits einer Familie an." }
  }

  // Create family and join as admin atomically via SECURITY DEFINER RPC
  const { error: createError } = await supabase.rpc("create_family_and_join", {
    family_name: parsed.data.familyName,
  })

  if (createError) {
    if (createError.message.includes("Already in a family")) {
      return { error: "Du gehoerst bereits einer Familie an." }
    }
    if (createError.message.includes("Not authenticated")) {
      return { error: "Nicht angemeldet." }
    }
    return { error: "Familie konnte nicht erstellt werden. Bitte versuche es erneut." }
  }

  // Invalidate middleware family-status cache
  const cookieStore = await cookies()
  cookieStore.set("x-has-family", "1", { maxAge: 3600, httpOnly: true, sameSite: "lax", path: "/" })

  redirect("/dashboard")
}

export async function joinFamilyByCodeAction(code: string) {
  const parsed = joinFamilyByCodeSchema.safeParse({ code })
  if (!parsed.success) {
    return { error: "Bitte gib einen gueltigen 6-stelligen Code ein." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`joinFamily:${ip}`, 10, 15 * 60 * 1000)) {
    return { error: "Zu viele Versuche. Bitte versuche es spaeter erneut." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nicht angemeldet." }
  }

  // Check if user already belongs to a family
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single()

  if (existingProfile?.family_id) {
    return { error: "Du gehoerst bereits einer Familie an." }
  }

  // Atomically redeem the invite code: find, lock, mark used, join family
  const { error: redeemError } = await supabase.rpc("redeem_invite_code", {
    invite_code: parsed.data.code,
  })

  if (redeemError) {
    return { error: "Einladungscode ungueltig oder abgelaufen." }
  }

  // Invalidate middleware family-status cache
  const cookieStore = await cookies()
  cookieStore.set("x-has-family", "1", { maxAge: 3600, httpOnly: true, sameSite: "lax", path: "/" })

  redirect("/dashboard")
}

export async function inviteByEmailAction(email: string) {
  const parsed = inviteByEmailSchema.safeParse({ email })
  if (!parsed.success) {
    return { error: "Bitte gib eine gueltige E-Mail-Adresse ein." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`inviteEmail:${ip}`, 10, 60 * 60 * 1000)) {
    return { error: "Zu viele Einladungen. Bitte versuche es spaeter erneut." }
  }

  const { error: adminError, profile } = await verifyAdmin()
  if (adminError || !profile) {
    return { error: adminError || "Unbekannter Fehler." }
  }

  const supabase = await createClient()

  // Send invitation email via Supabase Auth (signInWithOtp as fallback-safe approach)
  // This sends a magic link email. If the user exists, they get a login link.
  // If not, they get invited to create an account.
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding%3Fset_password%3Dtrue`,
    },
  })

  if (otpError) {
    return { error: "E-Mail-Einladung konnte nicht gesendet werden. Bitte versuche es erneut." }
  }

  // Create family_invitations record of type 'email'
  const { error: insertError } = await supabase.from("family_invitations").insert({
    family_id: profile.family_id,
    type: "email",
    email: parsed.data.email,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: profile.id,
  })

  if (insertError) {
    return { error: "Einladung konnte nicht gespeichert werden. Die E-Mail wurde aber gesendet." }
  }

  return { success: true }
}

export async function generateInviteCodeAction() {
  const ip = await getIP()
  if (!checkRateLimit(`generateCode:${ip}`, 10, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const { error: adminError, profile } = await verifyAdmin()
  if (adminError || !profile) {
    return { error: adminError || "Unbekannter Fehler." }
  }

  const supabase = await createClient()

  // Invalidate old active codes for this family
  const { error: invalidateError } = await supabase.rpc("invalidate_family_codes", {
    target_family_id: profile.family_id,
  })

  if (invalidateError) {
    return { error: "Alte Codes konnten nicht deaktiviert werden. Bitte versuche es erneut." }
  }

  // Generate random 6-digit numeric code
  const code = String(Math.floor(100000 + Math.random() * 900000))

  // Insert new invitation with 7-day expiry
  const { error: insertError } = await supabase.from("family_invitations").insert({
    family_id: profile.family_id,
    type: "code",
    code,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: profile.id,
  })

  if (insertError) {
    return { error: "Code konnte nicht erstellt werden. Bitte versuche es erneut." }
  }

  return { success: true, code }
}

export async function updateFamilyNameAction(familyName: string) {
  const parsed = updateFamilyNameSchema.safeParse({ familyName })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`updateName:${ip}`, 10, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const { error: adminError, profile } = await verifyAdmin()
  if (adminError || !profile) {
    return { error: adminError || "Unbekannter Fehler." }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from("families")
    .update({ name: parsed.data.familyName })
    .eq("id", profile.family_id)

  if (updateError) {
    return { error: "Familienname konnte nicht aktualisiert werden." }
  }

  return { success: true }
}

export async function updateMemberRoleAction(memberId: string, role: string) {
  const parsed = updateRoleSchema.safeParse({ memberId, role })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`updateRole:${ip}`, 20, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const { error: adminError, profile } = await verifyAdmin()
  if (adminError || !profile) {
    return { error: adminError || "Unbekannter Fehler." }
  }

  const supabase = await createClient()

  // If changing someone away from admin, check we're not removing the last admin
  if (parsed.data.role !== "admin") {
    // Check if the target member is currently an admin
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", parsed.data.memberId)
      .eq("family_id", profile.family_id)
      .single()

    if (targetProfile?.role === "admin") {
      // Count admins in this family
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("family_id", profile.family_id)
        .eq("role", "admin")

      if (count !== null && count <= 1) {
        return { error: "Es muss mindestens ein Admin in der Familie verbleiben." }
      }
    }
  }

  // Verify target member belongs to the same family
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.memberId)
    .eq("family_id", profile.family_id)

  if (updateError) {
    return { error: "Rolle konnte nicht aktualisiert werden." }
  }

  return { success: true }
}

export async function removeMemberAction(memberId: string) {
  const parsed = removeMemberSchema.safeParse({ memberId })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`removeMember:${ip}`, 10, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const { error: adminError, profile } = await verifyAdmin()
  if (adminError || !profile) {
    return { error: adminError || "Unbekannter Fehler." }
  }

  // Cannot remove yourself via this action (use leaveFamilyAction)
  if (parsed.data.memberId === profile.id) {
    return { error: "Verwende 'Familie verlassen' um dich selbst zu entfernen." }
  }

  const supabase = await createClient()

  // Check if target is the last admin
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", parsed.data.memberId)
    .eq("family_id", profile.family_id)
    .single()

  if (!targetProfile) {
    return { error: "Mitglied nicht gefunden." }
  }

  if (targetProfile.role === "admin") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("family_id", profile.family_id)
      .eq("role", "admin")

    if (count !== null && count <= 1) {
      return { error: "Der letzte Admin kann nicht entfernt werden." }
    }
  }

  // Remove member: set family_id and role to null
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ family_id: null, role: null })
    .eq("id", parsed.data.memberId)
    .eq("family_id", profile.family_id)

  if (updateError) {
    return { error: "Mitglied konnte nicht entfernt werden." }
  }

  return { success: true }
}

export async function leaveFamilyAction() {
  const ip = await getIP()
  if (!checkRateLimit(`leaveFamily:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const profile = await getCurrentProfile()
  if (!profile) {
    return { error: "Nicht angemeldet." }
  }

  if (!profile.family_id) {
    return { error: "Du gehoerst keiner Familie an." }
  }

  // If admin, check if last admin
  if (profile.role === "admin") {
    const supabase = await createClient()
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("family_id", profile.family_id)
      .eq("role", "admin")

    if (count !== null && count <= 1) {
      return {
        error:
          "Du bist der letzte Admin. Bitte ernenne zuerst ein anderes Mitglied zum Admin, bevor du die Familie verlaesst.",
      }
    }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ family_id: null, role: null })
    .eq("id", profile.id)

  if (updateError) {
    return { error: "Familie konnte nicht verlassen werden." }
  }

  redirect("/onboarding")
}

export async function checkAndJoinEmailInvitationAction(): Promise<{ familyId: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { familyId: null }
  }

  // Check if user already has a family
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single()

  if (profile?.family_id) {
    return { familyId: null }
  }

  // Try to redeem an email invitation for this user's email
  const { data: familyId, error } = await supabase.rpc("join_family_by_email_invitation")

  if (error || !familyId) {
    return { familyId: null }
  }

  // Invalidate middleware family-status cache
  const cookieStore = await cookies()
  cookieStore.set("x-has-family", "1", { maxAge: 3600, httpOnly: true, sameSite: "lax", path: "/" })

  return { familyId: familyId as string }
}

export async function updateLocaleAction(locale: string) {
  const parsed = updateLocaleSchema.safeParse({ locale })
  if (!parsed.success) {
    return { error: "Ungueltige Sprache." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`updateLocale:${ip}`, 20, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nicht angemeldet." }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ locale: parsed.data.locale })
    .eq("id", user.id)

  if (updateError) {
    return { error: "Sprache konnte nicht aktualisiert werden." }
  }

  return { success: true }
}

export async function getFamilyDataAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nicht angemeldet." }
  }

  // Get caller's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.family_id) {
    return { error: "Du gehoerst keiner Familie an." }
  }

  // Load family name and week challenge task id
  const { data: family } = await supabase
    .from("families")
    .select("id, name, week_challenge_task_id")
    .eq("id", profile.family_id)
    .single()

  if (!family) {
    return { error: "Familie nicht gefunden." }
  }

  // Load all members (join via profiles)
  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name, email, role")
    .eq("family_id", profile.family_id)
    .order("role")
    .limit(50)

  // Load active invite code (only if admin)
  let activeInviteCode: { code: string; expiresAt: string } | null = null
  if (profile.role === "admin") {
    const { data: invite } = await supabase
      .from("family_invitations")
      .select("code, expires_at")
      .eq("family_id", profile.family_id)
      .eq("type", "code")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (invite) {
      activeInviteCode = {
        code: invite.code,
        expiresAt: invite.expires_at,
      }
    }
  }

  const isAdultOrAdmin = profile.role === "admin" || profile.role === "adult"

  return {
    family: {
      id: family.id,
      name: family.name,
    },
    members: (members || []).map((m) => ({
      id: m.id,
      displayName: m.display_name || "Unbekannt",
      // Only expose emails to adults/admins, not children
      email: isAdultOrAdmin ? (m.email || "") : "",
      role: m.role as "admin" | "adult" | "child",
    })),
    currentUserId: user.id,
    isAdmin: profile.role === "admin",
    activeInviteCode,
    weekChallengeTaskId: (family.week_challenge_task_id as string | null) ?? null,
  }
}

// ============================================================
// Family Quote – get/update custom dashboard quote
// ============================================================

export async function getFamilyQuoteAction(): Promise<
  { quote: string | null } | { error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Nicht angemeldet." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single()
  if (!profile?.family_id) return { error: "Keine Familie." }

  const { data: family } = await supabase
    .from("families")
    .select("custom_quote")
    .eq("id", profile.family_id)
    .single()

  return { quote: (family?.custom_quote as string | null) ?? null }
}

export async function updateFamilyQuoteAction(quote: string): Promise<
  { success: true } | { error: string }
> {
  if (quote.length > 500) return { error: "Zitat darf maximal 500 Zeichen lang sein." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Nicht angemeldet." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, role")
    .eq("id", user.id)
    .single()
  if (!profile?.family_id) return { error: "Keine Familie." }
  if (profile.role !== "admin") return { error: "Nur Admins können das Zitat ändern." }

  const { error: updateError } = await supabase
    .from("families")
    .update({ custom_quote: quote || null })
    .eq("id", profile.family_id)

  if (updateError) return { error: "Zitat konnte nicht gespeichert werden." }
  return { success: true }
}
