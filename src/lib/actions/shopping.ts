"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import { z } from "zod"
import {
  createShoppingListSchema,
  updateShoppingListSchema,
  deleteShoppingListSchema,
  addShoppingItemSchema,
  toggleShoppingItemSchema,
  deleteShoppingItemSchema,
  clearCompletedItemsSchema,
} from "@/lib/validations/shopping"

// ============================================================
// PROJ-7: Einkaufslisten – Server Actions
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

// Helper: verify caller is adult or admin
async function verifyAdultOrAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet.", profile: null }
  if (!profile.family_id)
    return { error: "Du gehoerst keiner Familie an.", profile: null }
  if (!["adult", "admin"].includes(profile.role ?? ""))
    return {
      error: "Nur Erwachsene und Admins duerfen diese Aktion ausfuehren.",
      profile: null,
    }
  return { error: null, profile }
}

// ============================================================
// Types
// ============================================================

export type ShoppingList = {
  id: string
  familyId: string
  name: string
  createdBy: string
  createdByName: string | null
  itemCount: number
  doneCount: number
  createdAt: string
  updatedAt: string
}

export type ShoppingItem = {
  id: string
  listId: string
  productName: string
  quantity: string | null
  unit: string | null
  category: string | null
  isDone: boolean
  createdBy: string
  createdByName: string | null
  createdAt: string
}

// ============================================================
// getShoppingListsAction – all lists for the family
// ============================================================

export async function getShoppingListsAction(): Promise<
  { lists: ShoppingList[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Single query with embedded item data (eliminates second round trip)
  const { data: rawLists, error: listsError } = await supabase
    .from("shopping_lists")
    .select(
      `
      id,
      family_id,
      name,
      created_by,
      creator:created_by ( display_name ),
      created_at,
      updated_at,
      shopping_items ( is_done )
    `
    )
    .eq("family_id", profile.family_id)
    .order("updated_at", { ascending: false })
    .limit(50)

  if (listsError) {
    return { error: "Einkaufslisten konnten nicht geladen werden." }
  }

  const lists: ShoppingList[] = (rawLists || []).map((l) => {
    const items = (l.shopping_items as { is_done: boolean }[]) || []
    return {
      id: l.id,
      familyId: l.family_id,
      name: l.name,
      createdBy: l.created_by,
      createdByName: (() => {
        const c = l.creator as unknown
        if (Array.isArray(c))
          return (
            (c[0] as { display_name: string | null } | undefined)
              ?.display_name || null
          )
        return (c as { display_name: string | null } | null)?.display_name || null
      })(),
      itemCount: items.length,
      doneCount: items.filter((i) => i.is_done).length,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }
  })

  return { lists }
}

// ============================================================
// getShoppingListDetailAction – single list with items
// ============================================================

export async function getShoppingListDetailAction(
  listId: string
): Promise<
  { list: ShoppingList; items: ShoppingItem[] } | { error: string }
> {
  const uuidResult = z.string().uuid().safeParse(listId)
  if (!uuidResult.success) {
    return { error: "Ungueltige Listen-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data: rawList, error: listError } = await supabase
    .from("shopping_lists")
    .select(
      `
      id,
      family_id,
      name,
      created_by,
      creator:created_by ( display_name ),
      created_at,
      updated_at
    `
    )
    .eq("id", listId)
    .eq("family_id", profile.family_id)
    .single()

  if (listError || !rawList) {
    return { error: "Einkaufsliste nicht gefunden." }
  }

  const { data: rawItems, error: itemsError } = await supabase
    .from("shopping_items")
    .select(
      `
      id,
      list_id,
      product_name,
      quantity,
      unit,
      category,
      is_done,
      created_by,
      creator:created_by ( display_name ),
      created_at
    `
    )
    .eq("list_id", listId)
    .order("is_done", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(500)

  if (itemsError) {
    return { error: "Artikel konnten nicht geladen werden." }
  }

  const list: ShoppingList = {
    id: rawList.id,
    familyId: rawList.family_id,
    name: rawList.name,
    createdBy: rawList.created_by,
    createdByName: (() => {
      const c = rawList.creator as unknown
      if (Array.isArray(c))
        return (
          (c[0] as { display_name: string | null } | undefined)
            ?.display_name || null
        )
      return (c as { display_name: string | null } | null)?.display_name || null
    })(),
    itemCount: rawItems?.length ?? 0,
    doneCount: rawItems?.filter((i) => i.is_done).length ?? 0,
    createdAt: rawList.created_at,
    updatedAt: rawList.updated_at,
  }

  const items: ShoppingItem[] = (rawItems || []).map((i) => ({
    id: i.id,
    listId: i.list_id,
    productName: i.product_name,
    quantity: i.quantity,
    unit: i.unit,
    category: i.category,
    isDone: i.is_done,
    createdBy: i.created_by,
    createdByName: (() => {
      const c = i.creator as unknown
      if (Array.isArray(c))
        return (
          (c[0] as { display_name: string | null } | undefined)
            ?.display_name || null
        )
      return (c as { display_name: string | null } | null)?.display_name || null
    })(),
    createdAt: i.created_at,
  }))

  return { list, items }
}

// ============================================================
// createShoppingListAction
// ============================================================

export async function createShoppingListAction(data: {
  name: string
}): Promise<{ list: { id: string } } | { error: string }> {
  const parsed = createShoppingListSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`createList:${ip}`, 20, 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte kurz warten." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data: list, error: insertError } = await supabase
    .from("shopping_lists")
    .insert({
      family_id: profile.family_id,
      name: parsed.data.name,
      created_by: profile.id,
    })
    .select("id")
    .single()

  if (insertError || !list) {
    return { error: "Einkaufsliste konnte nicht erstellt werden." }
  }

  return { list: { id: list.id } }
}

// ============================================================
// updateShoppingListAction
// ============================================================

export async function updateShoppingListAction(
  listId: string,
  data: { name: string }
): Promise<{ success: true } | { error: string }> {
  const parsed = updateShoppingListSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from("shopping_lists")
    .update({ name: parsed.data.name })
    .eq("id", listId)
    .eq("family_id", profile.family_id)

  if (updateError) {
    return { error: "Name konnte nicht aktualisiert werden." }
  }

  return { success: true }
}

// ============================================================
// deleteShoppingListAction – only adults/admins
// ============================================================

export async function deleteShoppingListAction(
  listId: string
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteShoppingListSchema.safeParse({ id: listId })
  if (!parsed.success) {
    return { error: "Ungueltige Listen-ID." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Items are cascaded via ON DELETE CASCADE
  const { error: deleteError } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)

  if (deleteError) {
    return { error: "Einkaufsliste konnte nicht geloescht werden." }
  }

  return { success: true }
}

// ============================================================
// addShoppingItemAction
// ============================================================

export async function addShoppingItemAction(data: {
  listId: string
  productName: string
  quantity?: string
  unit?: string
  category?: string
}): Promise<{ item: { id: string } } | { error: string }> {
  const parsed = addShoppingItemSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`addItem:${ip}`, 60, 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte kurz warten." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Verify list belongs to family
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", parsed.data.listId)
    .eq("family_id", profile.family_id)
    .single()

  if (!list) {
    return { error: "Einkaufsliste nicht gefunden." }
  }

  const { data: item, error: insertError } = await supabase
    .from("shopping_items")
    .insert({
      list_id: parsed.data.listId,
      product_name: parsed.data.productName,
      quantity: parsed.data.quantity || null,
      unit: parsed.data.unit || null,
      category: parsed.data.category || null,
      is_done: false,
      created_by: profile.id,
    })
    .select("id")
    .single()

  if (insertError || !item) {
    return { error: "Artikel konnte nicht hinzugefuegt werden." }
  }

  // Touch the list's updated_at
  await supabase
    .from("shopping_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", parsed.data.listId)

  return { item: { id: item.id } }
}

// ============================================================
// toggleShoppingItemAction
// ============================================================

export async function toggleShoppingItemAction(
  itemId: string,
  isDone: boolean
): Promise<{ success: true } | { error: string }> {
  const parsed = toggleShoppingItemSchema.safeParse({ itemId, isDone })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Verify item belongs to family through list
  const { data: item } = await supabase
    .from("shopping_items")
    .select("id, list_id, shopping_lists!inner(family_id)")
    .eq("id", parsed.data.itemId)
    .eq("shopping_lists.family_id", profile.family_id)
    .single()

  if (!item) {
    return { error: "Artikel nicht gefunden." }
  }

  const { error: updateError } = await supabase
    .from("shopping_items")
    .update({ is_done: parsed.data.isDone })
    .eq("id", parsed.data.itemId)

  if (updateError) {
    return { error: "Artikel konnte nicht aktualisiert werden." }
  }

  return { success: true }
}

// ============================================================
// deleteShoppingItemAction
// ============================================================

export async function deleteShoppingItemAction(
  itemId: string
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteShoppingItemSchema.safeParse({ itemId })
  if (!parsed.success) {
    return { error: "Ungueltige Artikel-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Verify item belongs to family through list
  const { data: item } = await supabase
    .from("shopping_items")
    .select("id, list_id, shopping_lists!inner(family_id)")
    .eq("id", parsed.data.itemId)
    .eq("shopping_lists.family_id", profile.family_id)
    .single()

  if (!item) {
    return { error: "Artikel nicht gefunden." }
  }

  const { error: deleteError } = await supabase
    .from("shopping_items")
    .delete()
    .eq("id", parsed.data.itemId)

  if (deleteError) {
    return { error: "Artikel konnte nicht geloescht werden." }
  }

  return { success: true }
}

// ============================================================
// clearCompletedItemsAction – remove all done items in a list
// ============================================================

export async function clearCompletedItemsAction(
  listId: string
): Promise<{ success: true; deletedCount: number } | { error: string }> {
  const parsed = clearCompletedItemsSchema.safeParse({ listId })
  if (!parsed.success) {
    return { error: "Ungueltige Listen-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Verify list belongs to family
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", parsed.data.listId)
    .eq("family_id", profile.family_id)
    .single()

  if (!list) {
    return { error: "Einkaufsliste nicht gefunden." }
  }

  // Count before deleting
  const { count } = await supabase
    .from("shopping_items")
    .select("id", { count: "exact", head: true })
    .eq("list_id", parsed.data.listId)
    .eq("is_done", true)

  const { error: deleteError } = await supabase
    .from("shopping_items")
    .delete()
    .eq("list_id", parsed.data.listId)
    .eq("is_done", true)

  if (deleteError) {
    return { error: "Erledigte Artikel konnten nicht geloescht werden." }
  }

  return { success: true, deletedCount: count || 0 }
}

// ============================================================
// getSuggestedItemsAction – frequently used items by this family
// ============================================================

export async function getSuggestedItemsAction(
  listId: string
): Promise<{ suggestions: string[] } | { error: string }> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Get distinct product names used by the family, ordered by frequency
  const { data: rawItems, error: itemsError } = await supabase
    .from("shopping_items")
    .select("product_name, shopping_lists!inner(family_id)")
    .eq("shopping_lists.family_id", profile.family_id)
    .limit(500)

  if (itemsError) {
    return { error: "Vorschlaege konnten nicht geladen werden." }
  }

  // Count frequency per product name
  const freq = new Map<string, number>()
  for (const item of rawItems || []) {
    const name = item.product_name.toLowerCase().trim()
    freq.set(name, (freq.get(name) || 0) + 1)
  }

  // Now get items already in this list so we can exclude them
  const { data: currentItems } = await supabase
    .from("shopping_items")
    .select("product_name")
    .eq("list_id", listId)

  const currentNames = new Set(
    (currentItems || []).map((i) => i.product_name.toLowerCase().trim())
  )

  // Sort by frequency descending and exclude items already in this list
  const suggestions = [...freq.entries()]
    .filter(([name]) => !currentNames.has(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => {
      // Find original casing from rawItems
      const original = (rawItems || []).find(
        (i) => i.product_name.toLowerCase().trim() === name
      )
      return original?.product_name || name
    })

  return { suggestions }
}
