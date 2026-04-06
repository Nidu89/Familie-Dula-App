"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import { z } from "zod"
import {
  createRecipeSchema,
  updateRecipeSchema,
  deleteRecipeSchema,
  upsertMealPlanEntrySchema,
  deleteMealPlanEntrySchema,
} from "@/lib/validations/recipes"

// ============================================================
// PROJ-8: Essens- & Rezeptplanung – Server Actions
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

export type RecipeIngredient = {
  id: string
  recipeId: string
  name: string
  quantity: string | null
  unit: string | null
}

export type Recipe = {
  id: string
  familyId: string
  title: string
  description: string | null
  tags: string[]
  imageUrl: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string
  ingredients: RecipeIngredient[]
}

export type MealPlanEntry = {
  id: string
  familyId: string
  weekKey: string
  weekday: number
  mealType: "breakfast" | "lunch" | "dinner"
  recipeId: string | null
  recipeTitle: string | null
  freeText: string | null
}

// ============================================================
// getRecipesAction – all recipes for the family
// ============================================================

export async function getRecipesAction(): Promise<
  { recipes: Recipe[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data: rawRecipes, error: recipesError } = await supabase
    .from("recipes")
    .select(
      `
      id,
      family_id,
      title,
      description,
      tags,
      image_url,
      created_by,
      creator:created_by ( display_name ),
      created_at
    `
    )
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false })
    .limit(200)

  if (recipesError) {
    return { error: "Rezepte konnten nicht geladen werden." }
  }

  // Fetch all ingredients for these recipes
  const recipeIds = (rawRecipes || []).map((r) => r.id)
  let ingredientsMap: Record<string, RecipeIngredient[]> = {}

  if (recipeIds.length > 0) {
    const { data: rawIngredients } = await supabase
      .from("recipe_ingredients")
      .select("id, recipe_id, name, quantity, unit")
      .in("recipe_id", recipeIds)
      .order("created_at", { ascending: true })
      .limit(2000)

    if (rawIngredients) {
      for (const ing of rawIngredients) {
        if (!ingredientsMap[ing.recipe_id]) {
          ingredientsMap[ing.recipe_id] = []
        }
        ingredientsMap[ing.recipe_id].push({
          id: ing.id,
          recipeId: ing.recipe_id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        })
      }
    }
  }

  const recipes: Recipe[] = (rawRecipes || []).map((r) => ({
    id: r.id,
    familyId: r.family_id,
    title: r.title,
    description: r.description,
    tags: r.tags || [],
    imageUrl: r.image_url,
    createdBy: r.created_by,
    createdByName: (() => {
      const c = r.creator as unknown
      if (Array.isArray(c))
        return (
          (c[0] as { display_name: string | null } | undefined)
            ?.display_name || null
        )
      return (c as { display_name: string | null } | null)?.display_name || null
    })(),
    createdAt: r.created_at,
    ingredients: ingredientsMap[r.id] || [],
  }))

  return { recipes }
}

// ============================================================
// createRecipeAction – only adults/admins
// ============================================================

export async function createRecipeAction(data: {
  title: string
  description?: string
  tags?: string[]
  imageUrl?: string | null
  ingredients?: { name: string; quantity?: string; unit?: string }[]
}): Promise<{ recipe: { id: string } } | { error: string }> {
  const parsed = createRecipeSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const ip = await getIP()
  if (!checkRateLimit(`createRecipe:${ip}`, 20, 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte kurz warten." }
  }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Insert recipe
  const { data: recipe, error: insertError } = await supabase
    .from("recipes")
    .insert({
      family_id: profile.family_id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      tags: parsed.data.tags || [],
      image_url: parsed.data.imageUrl || null,
      created_by: profile.id,
    })
    .select("id")
    .single()

  if (insertError || !recipe) {
    return { error: "Rezept konnte nicht erstellt werden." }
  }

  // Insert ingredients
  if (parsed.data.ingredients && parsed.data.ingredients.length > 0) {
    const ingredientRows = parsed.data.ingredients.map((ing) => ({
      recipe_id: recipe.id,
      name: ing.name,
      quantity: ing.quantity || null,
      unit: ing.unit || null,
    }))

    const { error: ingError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientRows)

    if (ingError) {
      // Recipe created but ingredients failed — not critical
      console.error("Ingredients insert error:", ingError)
    }
  }

  return { recipe: { id: recipe.id } }
}

// ============================================================
// updateRecipeAction – only adults/admins
// ============================================================

export async function updateRecipeAction(
  recipeId: string,
  data: {
    title: string
    description?: string
    tags?: string[]
    imageUrl?: string | null
    ingredients?: { name: string; quantity?: string; unit?: string }[]
  }
): Promise<{ success: true } | { error: string }> {
  const uuidResult = z.string().uuid().safeParse(recipeId)
  if (!uuidResult.success) return { error: "Ungueltige Rezept-ID." }

  const parsed = updateRecipeSchema.safeParse(data)
  if (!parsed.success) return { error: "Ungueltige Eingaben." }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Verify recipe belongs to family
  const { data: existing } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("family_id", profile.family_id)
    .single()

  if (!existing) return { error: "Rezept nicht gefunden." }

  // Update recipe
  const { error: updateError } = await supabase
    .from("recipes")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      tags: parsed.data.tags || [],
      image_url: parsed.data.imageUrl || null,
    })
    .eq("id", recipeId)

  if (updateError) return { error: "Rezept konnte nicht aktualisiert werden." }

  // Replace ingredients: delete all, then re-insert
  const { error: deleteIngError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", recipeId)

  if (deleteIngError)
    return { error: "Zutaten konnten nicht aktualisiert werden." }

  if (parsed.data.ingredients && parsed.data.ingredients.length > 0) {
    const ingredientRows = parsed.data.ingredients.map((ing) => ({
      recipe_id: recipeId,
      name: ing.name,
      quantity: ing.quantity || null,
      unit: ing.unit || null,
    }))

    const { error: insertIngError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientRows)

    if (insertIngError)
      return { error: "Zutaten konnten nicht gespeichert werden." }
  }

  return { success: true }
}

// ============================================================
// deleteRecipeAction – only adults/admins
// ============================================================

export async function deleteRecipeAction(
  recipeId: string
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteRecipeSchema.safeParse({ id: recipeId })
  if (!parsed.success) return { error: "Ungueltige Rezept-ID." }

  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const supabase = await createClient()

  // Ingredients are cascade-deleted
  const { error: deleteError } = await supabase
    .from("recipes")
    .delete()
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)

  if (deleteError) return { error: "Rezept konnte nicht geloescht werden." }

  return { success: true }
}

// ============================================================
// getMealPlanAction – entries for a specific week
// ============================================================

export async function getMealPlanAction(
  weekKey: string
): Promise<{ entries: MealPlanEntry[] } | { error: string }> {
  const weekResult = z
    .string()
    .regex(/^\d{4}-W\d{2}$/)
    .safeParse(weekKey)
  if (!weekResult.success) return { error: "Ungueltige Wochenkennung." }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data: rawEntries, error: entriesError } = await supabase
    .from("meal_plan_entries")
    .select(
      `
      id,
      family_id,
      week_key,
      weekday,
      meal_type,
      recipe_id,
      free_text,
      recipes ( title )
    `
    )
    .eq("family_id", profile.family_id)
    .eq("week_key", weekKey)
    .limit(21) // Max 7 days x 3 meals

  if (entriesError) {
    return { error: "Essensplan konnte nicht geladen werden." }
  }

  const entries: MealPlanEntry[] = (rawEntries || []).map((e) => ({
    id: e.id,
    familyId: e.family_id,
    weekKey: e.week_key,
    weekday: e.weekday,
    mealType: e.meal_type as "breakfast" | "lunch" | "dinner",
    recipeId: e.recipe_id,
    recipeTitle: (() => {
      const r = e.recipes as unknown
      if (r && typeof r === "object" && "title" in (r as Record<string, unknown>))
        return (r as { title: string }).title
      return null
    })(),
    freeText: e.free_text,
  }))

  return { entries }
}

// ============================================================
// upsertMealPlanEntryAction – create or update a meal slot
// ============================================================

export async function upsertMealPlanEntryAction(data: {
  weekKey: string
  weekday: number
  mealType: "breakfast" | "lunch" | "dinner"
  recipeId?: string | null
  freeText?: string | null
}): Promise<{ entry: { id: string } } | { error: string }> {
  const parsed = upsertMealPlanEntrySchema.safeParse(data)
  if (!parsed.success) return { error: "Ungueltige Eingaben." }

  const ip = await getIP()
  if (!checkRateLimit(`upsertMeal:${ip}`, 60, 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte kurz warten." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Check if an entry already exists for this slot
  const { data: existing } = await supabase
    .from("meal_plan_entries")
    .select("id")
    .eq("family_id", profile.family_id)
    .eq("week_key", parsed.data.weekKey)
    .eq("weekday", parsed.data.weekday)
    .eq("meal_type", parsed.data.mealType)
    .maybeSingle()

  if (existing) {
    // Update
    const { error: updateError } = await supabase
      .from("meal_plan_entries")
      .update({
        recipe_id: parsed.data.recipeId || null,
        free_text: parsed.data.freeText || null,
      })
      .eq("id", existing.id)

    if (updateError)
      return { error: "Eintrag konnte nicht aktualisiert werden." }

    return { entry: { id: existing.id } }
  }

  // Insert
  const { data: entry, error: insertError } = await supabase
    .from("meal_plan_entries")
    .insert({
      family_id: profile.family_id,
      week_key: parsed.data.weekKey,
      weekday: parsed.data.weekday,
      meal_type: parsed.data.mealType,
      recipe_id: parsed.data.recipeId || null,
      free_text: parsed.data.freeText || null,
    })
    .select("id")
    .single()

  if (insertError || !entry)
    return { error: "Eintrag konnte nicht erstellt werden." }

  return { entry: { id: entry.id } }
}

// ============================================================
// deleteMealPlanEntryAction
// ============================================================

export async function deleteMealPlanEntryAction(
  entryId: string
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteMealPlanEntrySchema.safeParse({ id: entryId })
  if (!parsed.success) return { error: "Ungueltige Eintrag-ID." }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from("meal_plan_entries")
    .delete()
    .eq("id", parsed.data.id)
    .eq("family_id", profile.family_id)

  if (deleteError) return { error: "Eintrag konnte nicht geloescht werden." }

  return { success: true }
}

// ============================================================
// addRecipeIngredientsToShoppingListAction
// ============================================================

export async function addRecipeIngredientsToShoppingListAction(data: {
  recipeId: string
  listId: string
}): Promise<{ addedCount: number } | { error: string }> {
  const recipeResult = z.string().uuid().safeParse(data.recipeId)
  const listResult = z.string().uuid().safeParse(data.listId)
  if (!recipeResult.success || !listResult.success)
    return { error: "Ungueltige IDs." }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Verify recipe belongs to family
  const { data: recipe } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", data.recipeId)
    .eq("family_id", profile.family_id)
    .single()

  if (!recipe) return { error: "Rezept nicht gefunden." }

  // Verify list belongs to family
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", data.listId)
    .eq("family_id", profile.family_id)
    .single()

  if (!list) return { error: "Einkaufsliste nicht gefunden." }

  // Get ingredients
  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("name, quantity, unit")
    .eq("recipe_id", data.recipeId)

  if (!ingredients || ingredients.length === 0)
    return { error: "Keine Zutaten vorhanden." }

  // Add each ingredient as a shopping item
  const items = ingredients.map((ing) => ({
    list_id: data.listId,
    product_name: ing.name,
    quantity: ing.quantity || null,
    unit: ing.unit || null,
    category: null,
    is_done: false,
    created_by: profile.id,
  }))

  const { error: insertError } = await supabase
    .from("shopping_items")
    .insert(items)

  if (insertError)
    return { error: "Zutaten konnten nicht zur Liste hinzugefuegt werden." }

  // Touch list's updated_at
  await supabase
    .from("shopping_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", data.listId)

  return { addedCount: items.length }
}

// ============================================================
// uploadRecipeImageAction – upload to Supabase Storage
// ============================================================

export async function uploadRecipeImageAction(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const { error: authError, profile } = await verifyAdultOrAdmin()
  if (authError || !profile)
    return { error: authError || "Unbekannter Fehler." }

  const ip = await getIP()
  if (!checkRateLimit(`uploadImage:${ip}`, 10, 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte kurz warten." }
  }

  const file = formData.get("file") as File | null
  if (!file) return { error: "Keine Datei hochgeladen." }

  // Validate file
  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_SIZE)
    return { error: "Datei ist zu gross (max. 5 MB)." }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type))
    return { error: "Nur JPEG, PNG und WebP sind erlaubt." }

  const supabase = await createClient()
  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${profile.family_id}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("recipe-images")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError)
    return { error: "Bild konnte nicht hochgeladen werden." }

  const {
    data: { publicUrl },
  } = supabase.storage.from("recipe-images").getPublicUrl(fileName)

  return { url: publicUrl }
}
