"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import { E } from "@/lib/error-codes"
import { encrypt, decrypt, maskApiKey } from "@/lib/crypto"
import { saveApiKeySchema } from "@/lib/validations/assistant"

// ============================================================
// PROJ-17: KI-Assistent – Server Actions (API Key Management)
// ============================================================

// Helper: get current user's profile with family + role info
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

// Helper: verify caller is admin
async function verifyAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN, profile: null }
  if (!profile.family_id)
    return { error: E.AUTH_NO_FAMILY, profile: null }
  if (profile.role !== "admin")
    return {
      error: E.PERM_ADMIN_ONLY,
      profile: null,
    }
  return { error: null, profile }
}

// ============================================================
// saveApiKeyAction – encrypt and store the Anthropic API key
// ============================================================

export async function saveApiKeyAction(data: {
  apiKey: string
}): Promise<{ success: true; masked: string } | { error: string }> {
  const parsed = saveApiKeySchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const ip = await getIP()
  if (!checkRateLimit(`saveApiKey:${ip}`, 10, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const { error: authError, profile } = await verifyAdmin()
  if (authError || !profile) return { error: authError || E.AUTH_UNKNOWN }

  // Encrypt the API key
  let encrypted: string
  try {
    encrypted = encrypt(parsed.data.apiKey)
  } catch (err) {
    console.error("[PROJ-17] Encryption failed:", err)
    return { error: E.ASST_KEY_ENCRYPT_FAILED }
  }

  const supabase = await createClient()

  // Upsert (family_id is PK, so this creates or updates)
  const { error: upsertError } = await supabase
    .from("family_ai_settings")
    .upsert(
      {
        family_id: profile.family_id,
        api_key_encrypted: encrypted,
        updated_by: profile.id,
      },
      { onConflict: "family_id" }
    )

  if (upsertError) {
    console.error("[PROJ-17] Upsert failed:", upsertError)
    return { error: E.ASST_KEY_SAVE_FAILED }
  }

  return { success: true, masked: maskApiKey(parsed.data.apiKey) }
}

// ============================================================
// deleteApiKeyAction – remove the stored API key
// ============================================================

export async function deleteApiKeyAction(): Promise<
  { success: true } | { error: string }
> {
  const ip = await getIP()
  if (!checkRateLimit(`deleteApiKey:${ip}`, 10, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const { error: authError, profile } = await verifyAdmin()
  if (authError || !profile) return { error: authError || E.AUTH_UNKNOWN }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from("family_ai_settings")
    .delete()
    .eq("family_id", profile.family_id)

  if (deleteError) {
    return { error: E.ASST_KEY_DELETE_FAILED }
  }

  return { success: true }
}

// ============================================================
// getApiKeyStatusAction – check if an API key is configured
// Returns masked key for admins, boolean for others
// ============================================================

export async function getApiKeyStatusAction(): Promise<
  { configured: boolean; masked?: string } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  if (profile.role === "admin") {
    // Admins can read the encrypted key directly (RLS allows it)
    const { data } = await supabase
      .from("family_ai_settings")
      .select("api_key_encrypted")
      .eq("family_id", profile.family_id)
      .maybeSingle()

    if (!data) {
      return { configured: false }
    }

    // Decrypt to show masked version
    try {
      const decrypted = decrypt(data.api_key_encrypted)
      return { configured: true, masked: maskApiKey(decrypted) }
    } catch {
      // If decryption fails, the key is corrupt — treat as not configured
      return { configured: false }
    }
  }

  // Non-admins: use the SECURITY DEFINER function to check existence
  const { data, error } = await supabase.rpc("get_family_ai_key", {
    p_family_id: profile.family_id,
  })

  if (error) {
    // RPC error means not authorized or key doesn't exist
    return { configured: false }
  }

  return { configured: !!data }
}
