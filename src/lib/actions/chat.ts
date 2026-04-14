"use server"

import { createClient } from "@/lib/supabase/server"
import { E } from "@/lib/error-codes"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import { z } from "zod"
import {
  sendMessageSchema,
  getMessagesSchema,
  createDirectChannelSchema,
  markReadSchema,
  chatImageFileSchema,
  deleteChatImageSchema,
  getSignedImageUrlSchema,
  deleteMessageSchema,
  editMessageSchema,
  deleteChannelSchema,
} from "@/lib/validations/chat"

// ============================================================
// PROJ-9: Chat & Kommunikation – Server Actions
// ============================================================

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

// ============================================================
// Types
// ============================================================

export type ChatChannel = {
  id: string
  familyId: string
  type: "family" | "direct"
  name: string
  lastMessage: string | null
  lastMessageAt: string | null
  lastMessageSender: string | null
  unreadCount: number
  members: { id: string; displayName: string }[]
}

export type ChatMessage = {
  id: string
  channelId: string
  senderId: string
  senderName: string
  content: string
  imageUrl: string | null
  createdAt: string
}

// ============================================================
// getChannelsAction – all channels for the current user
// ============================================================

export async function getChannelsAction(): Promise<
  { channels: ChatChannel[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  // Get all channels this user is a member of
  const { data: memberships, error: memberError } = await supabase
    .from("chat_channel_members")
    .select("channel_id")
    .eq("user_id", profile.id)
    .limit(50)

  if (memberError) {
    return { error: E.CHAT_CHANNELS_LOAD_FAILED }
  }

  if (!memberships || memberships.length === 0) {
    return { channels: [] }
  }

  const channelIds = memberships.map((m) => m.channel_id)

  // Parallel: get channel details, members, recent messages, and read receipts
  const [channelResult, membersResult, messagesResult, receiptsResult] = await Promise.all([
    supabase
      .from("chat_channels")
      .select("id, family_id, type, created_at")
      .in("id", channelIds)
      .limit(50),
    supabase
      .from("chat_channel_members")
      .select("channel_id, user_id, profiles:user_id ( display_name )")
      .in("channel_id", channelIds)
      .limit(500),
    supabase
      .from("chat_messages")
      .select("channel_id, content, created_at, sender:sender_id ( display_name )")
      .in("channel_id", channelIds)
      .order("created_at", { ascending: false })
      .limit(Math.max(channelIds.length * 2, 10)),
    supabase
      .from("chat_read_receipts")
      .select("channel_id, last_read_at")
      .eq("user_id", profile.id)
      .in("channel_id", channelIds)
      .limit(50),
  ])

  if (channelResult.error || !channelResult.data) {
    return { error: E.CHAT_CHANNELS_LOAD_FAILED }
  }

  const rawChannels = channelResult.data
  const allMembers = membersResult.data
  const recentMessages = messagesResult.data

  const lastMessageMap = new Map<string, { content: string; createdAt: string; senderName: string | null }>()
  for (const msg of recentMessages || []) {
    if (!lastMessageMap.has(msg.channel_id)) {
      const sender = msg.sender as unknown
      const senderName = Array.isArray(sender)
        ? (sender[0] as { display_name: string | null } | undefined)?.display_name || null
        : (sender as { display_name: string | null } | null)?.display_name || null
      lastMessageMap.set(msg.channel_id, {
        content: msg.content,
        createdAt: msg.created_at,
        senderName,
      })
    }
  }

  const receiptMap = new Map<string, string>()
  for (const r of receiptsResult.data || []) {
    receiptMap.set(r.channel_id, r.last_read_at)
  }

  // Count unread per channel — parallel queries instead of sequential
  const unreadCounts = new Map<string, number>()
  const unreadQueries = channelIds.map((channelId) => {
    const lastReadAt = receiptMap.get(channelId)
    let query = supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("channel_id", channelId)

    if (lastReadAt) {
      query = query.gt("created_at", lastReadAt)
    }

    return query.then(({ count }) => {
      unreadCounts.set(channelId, count || 0)
    })
  })
  await Promise.all(unreadQueries)

  // Build channel list
  const membersByChannel = new Map<string, { id: string; displayName: string }[]>()
  for (const m of allMembers || []) {
    if (!membersByChannel.has(m.channel_id)) {
      membersByChannel.set(m.channel_id, [])
    }
    const p = m.profiles as unknown
    const displayName = Array.isArray(p)
      ? (p[0] as { display_name: string | null } | undefined)?.display_name || "Unbekannt"
      : (p as { display_name: string | null } | null)?.display_name || "Unbekannt"
    membersByChannel.get(m.channel_id)!.push({
      id: m.user_id,
      displayName,
    })
  }

  const channels: ChatChannel[] = rawChannels.map((ch) => {
    const members = membersByChannel.get(ch.id) || []
    const lastMsg = lastMessageMap.get(ch.id)

    // For DMs, name = the other person's name
    let name = "Familienchat"
    if (ch.type === "direct") {
      const other = members.find((m) => m.id !== profile.id)
      name = other?.displayName || "Direktnachricht"
    }

    return {
      id: ch.id,
      familyId: ch.family_id,
      type: ch.type as "family" | "direct",
      name,
      lastMessage: lastMsg?.content || null,
      lastMessageAt: lastMsg?.createdAt || null,
      lastMessageSender: lastMsg?.senderName || null,
      unreadCount: unreadCounts.get(ch.id) || 0,
      members,
    }
  })

  // Sort: family channel first, then by last message (most recent first)
  channels.sort((a, b) => {
    if (a.type === "family" && b.type !== "family") return -1
    if (b.type === "family" && a.type !== "family") return 1
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  return { channels }
}

// ============================================================
// getMessagesAction – paginated messages for a channel
// ============================================================

export async function getMessagesAction(data: {
  channelId: string
  cursor?: string
  limit?: number
}): Promise<
  { messages: ChatMessage[]; hasMore: boolean } | { error: string }
> {
  const parsed = getMessagesSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: E.AUTH_NOT_LOGGED_IN }

  // RLS ensures only channel members can read
  let query = supabase
    .from("chat_messages")
    .select(
      `
      id,
      channel_id,
      sender_id,
      sender:sender_id ( display_name ),
      content,
      image_url,
      created_at
    `
    )
    .eq("channel_id", parsed.data.channelId)
    .order("created_at", { ascending: false })
    .limit(parsed.data.limit + 1) // +1 to check hasMore

  if (parsed.data.cursor) {
    query = query.lt("created_at", parsed.data.cursor)
  }

  const { data: rawMessages, error: msgError } = await query

  if (msgError) {
    return { error: E.CHAT_MESSAGES_LOAD_FAILED }
  }

  const hasMore = (rawMessages?.length || 0) > parsed.data.limit
  const trimmed = (rawMessages || []).slice(0, parsed.data.limit)

  // Batch generate signed URLs for messages with images
  const imagePaths = trimmed
    .filter((m) => m.image_url)
    .map((m) => m.image_url as string)

  const signedUrlMap = new Map<string, string>()
  if (imagePaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("chat-images")
      .createSignedUrls(imagePaths, 3600) // 1 hour expiry

    if (signedUrls) {
      for (const item of signedUrls) {
        if (item.signedUrl && !item.error) {
          signedUrlMap.set(item.path ?? "", item.signedUrl)
        }
      }
    }
  }

  const messages: ChatMessage[] = trimmed.map((m) => {
    const sender = m.sender as unknown
    const senderName = Array.isArray(sender)
      ? (sender[0] as { display_name: string | null } | undefined)?.display_name || "Unbekannt"
      : (sender as { display_name: string | null } | null)?.display_name || "Unbekannt"

    return {
      id: m.id,
      channelId: m.channel_id,
      senderId: m.sender_id,
      senderName,
      content: m.content,
      imageUrl: m.image_url ? (signedUrlMap.get(m.image_url) ?? null) : null,
      createdAt: m.created_at,
    }
  })

  // Reverse to chronological order (oldest first)
  messages.reverse()

  return { messages, hasMore }
}

// ============================================================
// sendMessageAction – send a message in a channel
// ============================================================

export async function sendMessageAction(data: {
  channelId: string
  content: string
  imageUrl?: string | null
}): Promise<{ message: { id: string; createdAt: string } } | { error: string }> {
  const parsed = sendMessageSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const ip = await getIP()
  if (!checkRateLimit(`sendMsg:${ip}`, 30, 60 * 1000)) {
    return { error: E.CHAT_RATE_LIMITED }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: E.AUTH_NOT_LOGGED_IN }

  // RLS on insert ensures sender is a channel member
  const { data: msg, error: insertError } = await supabase
    .from("chat_messages")
    .insert({
      channel_id: parsed.data.channelId,
      sender_id: user.id,
      content: parsed.data.content || "",
      image_url: parsed.data.imageUrl || null,
    })
    .select("id, created_at")
    .single()

  if (insertError || !msg) {
    return { error: E.CHAT_SEND_FAILED }
  }

  return { message: { id: msg.id, createdAt: msg.created_at } }
}

// ============================================================
// createDirectChannelAction – create or find a DM channel
// ============================================================

export async function createDirectChannelAction(data: {
  targetUserId: string
}): Promise<{ channelId: string } | { error: string }> {
  const parsed = createDirectChannelSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const ip = await getIP()
  if (!checkRateLimit(`createDm:${ip}`, 10, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  // Cannot DM yourself
  if (parsed.data.targetUserId === profile.id) {
    return { error: E.CHAT_SELF_MESSAGE }
  }

  const supabase = await createClient()

  // Verify target is in the same family
  const { data: target } = await supabase
    .from("profiles")
    .select("id, family_id")
    .eq("id", parsed.data.targetUserId)
    .eq("family_id", profile.family_id)
    .single()

  if (!target) {
    return { error: E.CHAT_USER_NOT_FOUND }
  }

  // Check if a DM channel already exists between these two users
  const { data: existingChannels } = await supabase
    .from("chat_channel_members")
    .select("channel_id")
    .eq("user_id", profile.id)

  if (existingChannels && existingChannels.length > 0) {
    const myChannelIds = existingChannels.map((c) => c.channel_id)

    // Find channels where the target is also a member and type is 'direct'
    const { data: sharedChannels } = await supabase
      .from("chat_channel_members")
      .select("channel_id, chat_channels!inner ( type )")
      .eq("user_id", parsed.data.targetUserId)
      .in("channel_id", myChannelIds)

    const directChannel = sharedChannels?.find((sc) => {
      const ch = sc.chat_channels as unknown as { type: string }
      return ch?.type === "direct"
    })

    if (directChannel) {
      return { channelId: directChannel.channel_id }
    }
  }

  // Create new DM channel
  const { data: newChannel, error: channelError } = await supabase
    .from("chat_channels")
    .insert({
      family_id: profile.family_id,
      type: "direct",
    })
    .select("id")
    .single()

  if (channelError || !newChannel) {
    return { error: E.CHAT_CHANNEL_CREATE_FAILED }
  }

  // Add both users as members
  const { error: memberError } = await supabase
    .from("chat_channel_members")
    .insert([
      { channel_id: newChannel.id, user_id: profile.id },
      { channel_id: newChannel.id, user_id: parsed.data.targetUserId },
    ])

  if (memberError) {
    return { error: E.CHAT_MEMBERS_ADD_FAILED }
  }

  return { channelId: newChannel.id }
}

// ============================================================
// markChannelReadAction – update read receipt
// ============================================================

export async function markChannelReadAction(data: {
  channelId: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = markReadSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const ip = await getIP()
  if (!checkRateLimit(`markRead:${ip}`, 60, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: E.AUTH_NOT_LOGGED_IN }

  // Upsert read receipt
  const { error: upsertError } = await supabase
    .from("chat_read_receipts")
    .upsert(
      {
        channel_id: parsed.data.channelId,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "channel_id,user_id" }
    )

  if (upsertError) {
    return { error: E.CHAT_READ_STATUS_FAILED }
  }

  return { success: true }
}

// ============================================================
// getUnreadCountsAction – total unread across all channels
// ============================================================

export async function getUnreadCountsAction(): Promise<
  { counts: Record<string, number>; total: number } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }

  const supabase = await createClient()

  // Get channels this user is a member of + read receipts in parallel
  const [membershipsResult, receiptsResult] = await Promise.all([
    supabase
      .from("chat_channel_members")
      .select("channel_id")
      .eq("user_id", profile.id)
      .limit(50),
    supabase
      .from("chat_read_receipts")
      .select("channel_id, last_read_at")
      .eq("user_id", profile.id)
      .limit(50),
  ])

  const memberships = membershipsResult.data
  if (!memberships || memberships.length === 0) {
    return { counts: {}, total: 0 }
  }

  const channelIds = memberships.map((m) => m.channel_id)

  const receiptMap = new Map<string, string>()
  for (const r of receiptsResult.data || []) {
    if (channelIds.includes(r.channel_id)) {
      receiptMap.set(r.channel_id, r.last_read_at)
    }
  }

  const counts: Record<string, number> = {}
  let total = 0

  // Count unread per channel — parallel
  const unreadQueries = channelIds.map((channelId) => {
    const lastReadAt = receiptMap.get(channelId)
    let query = supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("channel_id", channelId)

    if (lastReadAt) {
      query = query.gt("created_at", lastReadAt)
    }

    return query.then(({ count }) => {
      const unread = count || 0
      if (unread > 0) {
        counts[channelId] = unread
        total += unread
      }
    })
  })
  await Promise.all(unreadQueries)

  return { counts, total }
}

// ============================================================
// getFamilyChannelIdAction – get the family channel ID
// ============================================================

export async function getFamilyChannelIdAction(): Promise<
  { channelId: string } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  const { data: channel } = await supabase
    .from("chat_channels")
    .select("id")
    .eq("family_id", profile.family_id)
    .eq("type", "family")
    .single()

  if (!channel) {
    return { error: E.CHAT_FAMILY_NOT_FOUND }
  }

  return { channelId: channel.id }
}

// ============================================================
// deleteMessageAction – delete a chat message (own or admin/adult)
// ============================================================

export async function deleteMessageAction(data: {
  messageId: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = deleteMessageSchema.safeParse(data)
  if (!parsed.success) return { error: E.VAL_INVALID }

  const ip = await getIP()
  if (!checkRateLimit(`delMsg:${ip}`, 30, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }

  const supabase = await createClient()

  const { data: msg } = await supabase
    .from("chat_messages")
    .select("id, sender_id, image_url")
    .eq("id", parsed.data.messageId)
    .single()

  if (!msg) return { error: E.CHAT_MESSAGE_NOT_FOUND }

  const isOwn = msg.sender_id === profile.id
  const isAdminOrAdult = profile.role === "admin" || profile.role === "adult"
  if (!isOwn && !isAdminOrAdult) {
    return { error: E.PERM_DENIED }
  }

  // Delete associated image from storage if present
  if (msg.image_url) {
    await supabase.storage.from("chat-images").remove([msg.image_url])
  }

  const { error: deleteError } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", parsed.data.messageId)

  if (deleteError) return { error: E.CHAT_MESSAGE_DELETE_FAILED }

  return { success: true }
}

// ============================================================
// editMessageAction – edit a chat message (own only)
// ============================================================

export async function editMessageAction(data: {
  messageId: string
  content: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = editMessageSchema.safeParse(data)
  if (!parsed.success) return { error: E.VAL_INVALID }

  const ip = await getIP()
  if (!checkRateLimit(`editMsg:${ip}`, 30, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }

  const supabase = await createClient()

  const { data: msg } = await supabase
    .from("chat_messages")
    .select("id, sender_id")
    .eq("id", parsed.data.messageId)
    .single()

  if (!msg) return { error: E.CHAT_MESSAGE_NOT_FOUND }
  if (msg.sender_id !== profile.id) {
    return { error: E.CHAT_OWN_MESSAGES_ONLY }
  }

  const { error: updateError } = await supabase
    .from("chat_messages")
    .update({ content: parsed.data.content })
    .eq("id", parsed.data.messageId)

  if (updateError) return { error: E.CHAT_MESSAGE_EDIT_FAILED }

  return { success: true }
}

// ============================================================
// deleteChannelAction – delete a DM channel (admin/adult only)
// ============================================================

export async function deleteChannelAction(data: {
  channelId: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = deleteChannelSchema.safeParse(data)
  if (!parsed.success) return { error: E.VAL_INVALID }

  const ip = await getIP()
  if (!checkRateLimit(`delChan:${ip}`, 10, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }

  const isAdminOrAdult = profile.role === "admin" || profile.role === "adult"
  if (!isAdminOrAdult) {
    return { error: E.CHAT_DELETE_ADMIN_ONLY }
  }

  const supabase = await createClient()

  // Verify it's a DM channel (family channels cannot be deleted)
  const { data: channel } = await supabase
    .from("chat_channels")
    .select("id, type, family_id")
    .eq("id", parsed.data.channelId)
    .single()

  if (!channel) return { error: E.CHAT_CHANNEL_NOT_FOUND }
  if (channel.type === "family") {
    return { error: E.CHAT_FAMILY_CHAT_UNDELETABLE }
  }

  // Delete all messages' images from storage
  const { data: imgMessages } = await supabase
    .from("chat_messages")
    .select("image_url")
    .eq("channel_id", parsed.data.channelId)
    .not("image_url", "is", null)

  if (imgMessages && imgMessages.length > 0) {
    const paths = imgMessages.map((m) => m.image_url).filter(Boolean) as string[]
    if (paths.length > 0) {
      await supabase.storage.from("chat-images").remove(paths)
    }
  }

  // Delete read receipts, members, messages, then channel (cascade should handle this but let's be explicit)
  await supabase.from("chat_read_receipts").delete().eq("channel_id", parsed.data.channelId)
  await supabase.from("chat_messages").delete().eq("channel_id", parsed.data.channelId)
  await supabase.from("chat_channel_members").delete().eq("channel_id", parsed.data.channelId)

  const { error: deleteError } = await supabase
    .from("chat_channels")
    .delete()
    .eq("id", parsed.data.channelId)

  if (deleteError) return { error: E.CHAT_DELETE_FAILED }

  return { success: true }
}

// ============================================================
// PROJ-11: Bild-Upload im Chat – Server Actions
// ============================================================

/**
 * Upload an image to the chat-images bucket.
 * Returns the storage path (not a URL) to be stored in image_url.
 */
export async function uploadChatImageAction(
  formData: FormData
): Promise<{ path: string } | { error: string }> {
  const ip = await getIP()
  if (!checkRateLimit(`chatImgUp:${ip}`, 15, 60 * 1000)) {
    return { error: E.RATE_UPLOAD_LIMITED }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const file = formData.get("file")
  if (!file || !(file instanceof File)) {
    return { error: E.VAL_NO_FILE }
  }

  // Validate file type and size
  const fileValidation = chatImageFileSchema.safeParse({
    type: file.type,
    size: file.size,
  })
  if (!fileValidation.success) {
    return { error: fileValidation.error.issues[0].message }
  }

  // Determine extension from MIME type
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  }
  const ext = extMap[file.type] || "jpg"
  const uuid = crypto.randomUUID()
  const storagePath = `${profile.family_id}/${uuid}.${ext}`

  const supabase = await createClient()
  const { error: uploadError } = await supabase.storage
    .from("chat-images")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("Chat image upload failed:", uploadError.message)
    return { error: E.CHAT_UPLOAD_FAILED }
  }

  return { path: storagePath }
}

/**
 * Delete a chat image — own images or admin/adult can delete any.
 * Removes from storage and clears image_url on the message.
 */
export async function deleteChatImageAction(data: {
  messageId: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = deleteChatImageSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const ip = await getIP()
  if (!checkRateLimit(`chatImgDel:${ip}`, 15, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: E.AUTH_NOT_LOGGED_IN }
  if (!profile.family_id) return { error: E.AUTH_NO_FAMILY }

  const supabase = await createClient()

  // Fetch the message to get image_url and verify ownership
  const { data: msg } = await supabase
    .from("chat_messages")
    .select("id, sender_id, image_url, channel_id")
    .eq("id", parsed.data.messageId)
    .single()

  if (!msg || !msg.image_url) {
    return { error: E.CHAT_IMAGE_NOT_FOUND }
  }

  // Authorization: own message OR admin/adult
  const isOwn = msg.sender_id === profile.id
  const isAdminOrAdult = profile.role === "admin" || profile.role === "adult"
  if (!isOwn && !isAdminOrAdult) {
    return { error: E.PERM_DELETE_DENIED }
  }

  // Delete from storage (RLS also enforces this)
  const { error: storageError } = await supabase.storage
    .from("chat-images")
    .remove([msg.image_url])

  if (storageError) {
    return { error: E.CHAT_IMAGE_DELETE_FAILED }
  }

  // Clear image_url on the message
  const { error: updateError } = await supabase
    .from("chat_messages")
    .update({ image_url: null })
    .eq("id", parsed.data.messageId)

  if (updateError) {
    return { error: E.CHAT_MESSAGE_UPDATE_FAILED }
  }

  return { success: true }
}

/**
 * Get a signed URL for a chat image (1 hour expiry).
 * Used for realtime messages where signed URL is not pre-generated.
 */
export async function getSignedImageUrlAction(data: {
  path: string
}): Promise<{ url: string } | { error: string }> {
  const parsed = getSignedImageUrlSchema.safeParse(data)
  if (!parsed.success) {
    return { error: E.VAL_INVALID }
  }

  const ip = await getIP()
  if (!checkRateLimit(`chatImgUrl:${ip}`, 60, 60 * 1000)) {
    return { error: E.RATE_LIMITED_SHORT }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: E.AUTH_NOT_LOGGED_IN }

  // Verify user belongs to a family and the path belongs to their family
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single()
  if (!profile?.family_id) return { error: E.AUTH_NO_FAMILY }

  // Path must start with the user's family_id to prevent cross-family image access
  if (!parsed.data.path.startsWith(`${profile.family_id}/`)) {
    return { error: E.PERM_ACCESS_DENIED }
  }

  const { data: signedUrlData, error: signError } = await supabase.storage
    .from("chat-images")
    .createSignedUrl(parsed.data.path, 3600) // 1 hour

  if (signError || !signedUrlData?.signedUrl) {
    return { error: E.CHAT_URL_FAILED }
  }

  return { url: signedUrlData.signedUrl }
}
