"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import {
  createMomentSchema,
  deleteMomentSchema,
  getMomentsSchema,
  toggleReactionSchema,
  momentFileSchema,
} from "@/lib/validations/moments"

// ============================================================
// PROJ-18: Familienmomente – Server Actions
// ============================================================

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

// ============================================================
// Types
// ============================================================

export type Moment = {
  id: string
  familyId: string
  createdBy: string
  creatorName: string
  title: string
  description: string | null
  photoUrl: string | null
  momentDate: string
  createdAt: string
  heartCount: number
  likedByMe: boolean
}

// ============================================================
// getMomentsAction — paginated, newest first
// ============================================================

export async function getMomentsAction(
  data: { cursor?: string; limit?: number } = {}
): Promise<{ moments: Moment[]; hasMore: boolean } | { error: string }> {
  const parsed = getMomentsSchema.safeParse(data)
  if (!parsed.success) return { error: "Ungültige Eingaben." }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehörst keiner Familie an." }

  const supabase = await createClient()
  const limit = parsed.data.limit

  let query = supabase
    .from("family_moments")
    .select(
      `
      id,
      family_id,
      created_by,
      creator:created_by ( display_name ),
      title,
      description,
      photo_path,
      moment_date,
      created_at
    `
    )
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false })
    .limit(limit + 1)

  if (parsed.data.cursor) {
    query = query.lt("created_at", parsed.data.cursor)
  }

  const { data: rawMoments, error: fetchError } = await query

  if (fetchError) {
    console.error("getMomentsAction error:", fetchError.message)
    return { error: "Momente konnten nicht geladen werden." }
  }

  const hasMore = (rawMoments?.length || 0) > limit
  const trimmed = (rawMoments || []).slice(0, limit)

  if (trimmed.length === 0) return { moments: [], hasMore: false }

  const momentIds = trimmed.map((m) => m.id)

  // Batch: heart counts + user's own reactions
  const [{ data: reactionCounts }, { data: myReactions }] = await Promise.all([
    supabase
      .from("family_moment_reactions")
      .select("moment_id")
      .in("moment_id", momentIds),
    supabase
      .from("family_moment_reactions")
      .select("moment_id")
      .in("moment_id", momentIds)
      .eq("user_id", profile.id),
  ])

  // Count hearts per moment
  const heartMap = new Map<string, number>()
  for (const r of reactionCounts || []) {
    heartMap.set(r.moment_id, (heartMap.get(r.moment_id) || 0) + 1)
  }

  const likedSet = new Set((myReactions || []).map((r) => r.moment_id))

  // Generate signed URLs for photos
  const photoPaths = trimmed
    .filter((m) => m.photo_path)
    .map((m) => m.photo_path as string)

  const signedUrlMap = new Map<string, string>()
  if (photoPaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("moments")
      .createSignedUrls(photoPaths, 3600)

    if (signedUrls) {
      for (const item of signedUrls) {
        if (item.signedUrl && !item.error) {
          signedUrlMap.set(item.path ?? "", item.signedUrl)
        }
      }
    }
  }

  const moments: Moment[] = trimmed.map((m) => {
    const creator = m.creator as unknown
    const creatorName = Array.isArray(creator)
      ? (creator[0] as { display_name: string | null } | undefined)
          ?.display_name || "Unbekannt"
      : (creator as { display_name: string | null } | null)?.display_name ||
        "Unbekannt"

    return {
      id: m.id,
      familyId: m.family_id,
      createdBy: m.created_by,
      creatorName,
      title: m.title,
      description: m.description,
      photoUrl: m.photo_path ? signedUrlMap.get(m.photo_path) || null : null,
      momentDate: m.moment_date,
      createdAt: m.created_at,
      heartCount: heartMap.get(m.id) || 0,
      likedByMe: likedSet.has(m.id),
    }
  })

  return { moments, hasMore }
}

// ============================================================
// getLatestMomentAction — single newest moment for dashboard
// ============================================================

export async function getLatestMomentAction(): Promise<
  { moment: Moment | null } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehörst keiner Familie an." }

  const supabase = await createClient()

  const { data: rawMoment, error: fetchError } = await supabase
    .from("family_moments")
    .select(
      `
      id,
      family_id,
      created_by,
      creator:created_by ( display_name ),
      title,
      description,
      photo_path,
      moment_date,
      created_at
    `
    )
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    console.error("getLatestMomentAction error:", fetchError.message)
    return { error: "Neuester Moment konnte nicht geladen werden." }
  }

  if (!rawMoment) return { moment: null }

  // Heart count + user liked
  const [{ count: heartCount }, { data: myReaction }] = await Promise.all([
    supabase
      .from("family_moment_reactions")
      .select("id", { count: "exact", head: true })
      .eq("moment_id", rawMoment.id),
    supabase
      .from("family_moment_reactions")
      .select("id")
      .eq("moment_id", rawMoment.id)
      .eq("user_id", profile.id)
      .maybeSingle(),
  ])

  // Signed URL
  let photoUrl: string | null = null
  if (rawMoment.photo_path) {
    const { data: signedUrls } = await supabase.storage
      .from("moments")
      .createSignedUrls([rawMoment.photo_path], 3600)

    if (signedUrls?.[0]?.signedUrl) {
      photoUrl = signedUrls[0].signedUrl
    }
  }

  const creator = rawMoment.creator as unknown
  const creatorName = Array.isArray(creator)
    ? (creator[0] as { display_name: string | null } | undefined)
        ?.display_name || "Unbekannt"
    : (creator as { display_name: string | null } | null)?.display_name ||
      "Unbekannt"

  return {
    moment: {
      id: rawMoment.id,
      familyId: rawMoment.family_id,
      createdBy: rawMoment.created_by,
      creatorName,
      title: rawMoment.title,
      description: rawMoment.description,
      photoUrl,
      momentDate: rawMoment.moment_date,
      createdAt: rawMoment.created_at,
      heartCount: heartCount || 0,
      likedByMe: !!myReaction,
    },
  }
}

// ============================================================
// createMomentAction — create with optional photo upload
// ============================================================

export async function createMomentAction(
  formData: FormData
): Promise<{ moment: { id: string } } | { error: string }> {
  const ip = await getIP()
  if (!checkRateLimit(`momentCreate:${ip}`, 10, 60_000)) {
    return { error: "Zu viele Anfragen. Bitte kurz warten." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehörst keiner Familie an." }

  const title = formData.get("title") as string
  const description = (formData.get("description") as string) || undefined
  const momentDate = formData.get("momentDate") as string
  const file = formData.get("photo") as File | null

  const parsed = createMomentSchema.safeParse({ title, description, momentDate })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  let photoPath: string | null = null

  // Upload photo if provided
  if (file && file.size > 0) {
    const fileValidation = momentFileSchema.safeParse({
      type: file.type,
      size: file.size,
    })
    if (!fileValidation.success) {
      return { error: fileValidation.error.issues[0].message }
    }

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    }
    const ext = extMap[file.type] || "jpg"
    const uuid = crypto.randomUUID()
    photoPath = `${profile.family_id}/${uuid}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("moments")
      .upload(photoPath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Moment photo upload failed:", uploadError.message)
      return { error: "Foto konnte nicht hochgeladen werden." }
    }
  }

  // Insert moment
  const { data: moment, error: insertError } = await supabase
    .from("family_moments")
    .insert({
      family_id: profile.family_id,
      created_by: profile.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      photo_path: photoPath,
      moment_date: parsed.data.momentDate,
    })
    .select("id")
    .single()

  if (insertError) {
    // Clean up uploaded photo if insert fails
    if (photoPath) {
      await supabase.storage.from("moments").remove([photoPath])
    }
    console.error("createMomentAction insert error:", insertError.message)
    return { error: "Moment konnte nicht erstellt werden." }
  }

  return { moment: { id: moment.id } }
}

// ============================================================
// deleteMomentAction — creator or admin
// ============================================================

export async function deleteMomentAction(data: {
  momentId: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = deleteMomentSchema.safeParse(data)
  if (!parsed.success) return { error: "Ungültige Eingaben." }

  const ip = await getIP()
  if (!checkRateLimit(`momentDel:${ip}`, 15, 60_000)) {
    return { error: "Zu viele Anfragen. Bitte kurz warten." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehörst keiner Familie an." }

  const supabase = await createClient()

  // Fetch moment — scoped to user's family for cross-family isolation
  const { data: moment, error: fetchError } = await supabase
    .from("family_moments")
    .select("id, created_by, photo_path, family_id")
    .eq("id", parsed.data.momentId)
    .eq("family_id", profile.family_id)
    .single()

  if (fetchError || !moment) {
    return { error: "Moment nicht gefunden." }
  }

  // Authorization: creator or admin
  if (moment.created_by !== profile.id && profile.role !== "admin") {
    return { error: "Keine Berechtigung zum Löschen." }
  }

  // Delete photo from storage
  if (moment.photo_path) {
    await supabase.storage.from("moments").remove([moment.photo_path])
  }

  // Delete moment (cascades to reactions)
  const { error: deleteError } = await supabase
    .from("family_moments")
    .delete()
    .eq("id", parsed.data.momentId)

  if (deleteError) {
    console.error("deleteMomentAction error:", deleteError.message)
    return { error: "Moment konnte nicht gelöscht werden." }
  }

  return { success: true }
}

// ============================================================
// toggleReactionAction — toggle heart on/off
// ============================================================

export async function toggleReactionAction(data: {
  momentId: string
}): Promise<{ liked: boolean; heartCount: number } | { error: string }> {
  const parsed = toggleReactionSchema.safeParse(data)
  if (!parsed.success) return { error: "Ungültige Eingaben." }

  const ip = await getIP()
  if (!checkRateLimit(`momentReact:${ip}`, 30, 60_000)) {
    return { error: "Zu viele Anfragen. Bitte kurz warten." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehörst keiner Familie an." }

  const supabase = await createClient()

  // Verify moment belongs to user's family
  const { data: momentCheck } = await supabase
    .from("family_moments")
    .select("id")
    .eq("id", parsed.data.momentId)
    .eq("family_id", profile.family_id)
    .maybeSingle()

  if (!momentCheck) {
    return { error: "Moment nicht gefunden." }
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("family_moment_reactions")
    .select("id")
    .eq("moment_id", parsed.data.momentId)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (existing) {
    // Remove reaction
    await supabase
      .from("family_moment_reactions")
      .delete()
      .eq("id", existing.id)
  } else {
    // Add reaction
    const { error: insertError } = await supabase
      .from("family_moment_reactions")
      .insert({
        moment_id: parsed.data.momentId,
        user_id: profile.id,
      })

    if (insertError) {
      console.error("toggleReactionAction error:", insertError.message)
      return { error: "Reaktion konnte nicht gespeichert werden." }
    }
  }

  // Get updated count
  const { count } = await supabase
    .from("family_moment_reactions")
    .select("id", { count: "exact", head: true })
    .eq("moment_id", parsed.data.momentId)

  return {
    liked: !existing,
    heartCount: count || 0,
  }
}
