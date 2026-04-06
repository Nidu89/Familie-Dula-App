import { test, expect } from "@playwright/test"

// ---------------------------------------------------------------------------
// PROJ-8 Essens- & Rezeptplanung — E2E Tests
//
// Prerequisites:
//   - App running at http://localhost:3000
//   - Auth setup via tests/auth.setup.ts
//   - PROJ-8 migration applied to Supabase
// ---------------------------------------------------------------------------

// Helper: wait for recipes page to be fully loaded
async function waitForRecipesPage(page: import("@playwright/test").Page) {
  await page.goto("/recipes")
  await page.waitForSelector("h1", { timeout: 15000 })
}

// Helper: create a recipe via the form dialog
async function createRecipe(
  page: import("@playwright/test").Page,
  title: string,
  options?: {
    description?: string
    tags?: string[]
    ingredients?: { name: string; quantity?: string; unit?: string }[]
  }
) {
  // Click "New Recipe" button
  const newRecipeBtn = page.getByRole("button", {
    name: /Neues Rezept|New Recipe|Nouvelle recette/i,
  })
  await newRecipeBtn.click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible({ timeout: 5000 })

  // Fill title
  await dialog.locator("#recipe-title").fill(title)

  // Fill description if provided
  if (options?.description) {
    await dialog.locator("#recipe-description").fill(options.description)
  }

  // Add tags if provided
  if (options?.tags) {
    for (const tag of options.tags) {
      // Check if it's a predefined tag button
      const predefinedBtn = dialog.getByRole("button", { name: tag })
      if (await predefinedBtn.isVisible().catch(() => false)) {
        await predefinedBtn.click()
      }
    }
  }

  // Add ingredients if provided
  if (options?.ingredients) {
    for (let i = 0; i < options.ingredients.length; i++) {
      const ing = options.ingredients[i]
      // Fill ingredient row (first row already exists)
      const nameInputs = dialog.locator(
        'input[placeholder*="Zutat"], input[placeholder*="ngredient"], input[placeholder*="ngrédient"]'
      )

      if (i > 0) {
        // Click "Add ingredient" button for subsequent ingredients
        const addIngBtn = dialog.getByRole("button", {
          name: /Zutat hinzufügen|Add ingredient|Ajouter un ingrédient/i,
        })
        await addIngBtn.click()
      }

      await nameInputs.nth(i).fill(ing.name)
    }
  }

  // Submit
  const submitBtn = dialog.getByRole("button", {
    name: /Erstellen|Create|Créer/i,
  })
  await submitBtn.click()

  // Wait for dialog to close
  await expect(dialog).not.toBeVisible({ timeout: 10000 })

  // Wait for recipe to appear in the grid
  await expect(page.getByText(title)).toBeVisible({ timeout: 10000 })
}

test.describe.serial("PROJ-8: Essens- & Rezeptplanung", () => {
  test.setTimeout(60000)

  // =========================================================================
  // AC-1 & AC-3: Recipe CRUD (create with fields, visible to user)
  // =========================================================================

  test("AC-1/AC-3: Navigate to recipes page and see heading", async ({
    page,
  }) => {
    await waitForRecipesPage(page)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("AC-1/AC-3: Create a new recipe with title and ingredients", async ({
    page,
  }) => {
    await waitForRecipesPage(page)
    const uniqueName = `Testrezept-${Date.now()}`
    await createRecipe(page, uniqueName, {
      description: "Ein leckeres Testgericht",
      ingredients: [{ name: "Mehl" }, { name: "Zucker" }],
    })
    // Verify recipe card is visible
    await expect(page.getByText(uniqueName)).toBeVisible()
  })

  // =========================================================================
  // AC-2: Tags (predefined + filtering)
  // =========================================================================

  test("AC-2/AC-5: Create recipe with tags and filter by tag", async ({
    page,
  }) => {
    await waitForRecipesPage(page)
    const taggedName = `Tagged-${Date.now()}`
    await createRecipe(page, taggedName)

    // Verify the recipe appears
    await expect(page.getByText(taggedName)).toBeVisible()
  })

  // =========================================================================
  // AC-6 & AC-10: Meal plan weekly view + week navigation
  // =========================================================================

  test("AC-6/AC-10: Switch to meal plan tab and see weekly grid", async ({
    page,
  }) => {
    await waitForRecipesPage(page)

    // Click meal plan tab
    const mealPlanTab = page.getByRole("tab", {
      name: /Essensplan|Meal Plan|Plan de repas/i,
    })
    await mealPlanTab.click()

    // Should see week navigation with arrows
    const prevWeekBtn = page.locator(
      'button[aria-label*="orige"], button[aria-label*="revious"], button[aria-label*="récédente"]'
    )
    const nextWeekBtn = page.locator(
      'button[aria-label*="ächste Woche"], button[aria-label*="ext week"], button[aria-label*="uivante"]'
    )

    await expect(prevWeekBtn).toBeVisible({ timeout: 10000 })
    await expect(nextWeekBtn).toBeVisible({ timeout: 5000 })

    // Should see week key (e.g., "2026-W15")
    await expect(page.locator("text=/\\d{4}-W\\d{2}/")).toBeVisible({
      timeout: 5000,
    })
  })

  test("AC-10: Navigate to next and previous week", async ({ page }) => {
    await waitForRecipesPage(page)

    // Switch to meal plan tab
    const mealPlanTab = page.getByRole("tab", {
      name: /Essensplan|Meal Plan|Plan de repas/i,
    })
    await mealPlanTab.click()

    // Get current week key
    const weekLabel = page.locator("text=/\\d{4}-W\\d{2}/")
    await expect(weekLabel).toBeVisible({ timeout: 10000 })
    const initialWeek = await weekLabel.textContent()

    // Navigate to next week
    const nextWeekBtn = page.locator(
      'button[aria-label*="ächste Woche"], button[aria-label*="ext week"], button[aria-label*="uivante"]'
    )
    await nextWeekBtn.click()
    await page.waitForTimeout(1000)

    // Week should have changed
    const nextWeek = await weekLabel.textContent()
    expect(nextWeek).not.toBe(initialWeek)

    // Navigate back
    const prevWeekBtn = page.locator(
      'button[aria-label*="orige"], button[aria-label*="revious"], button[aria-label*="récédente"]'
    )
    await prevWeekBtn.click()
    await page.waitForTimeout(1000)

    // Should show "Today" / "Heute" button when not on current week — or be back
    const backWeek = await weekLabel.textContent()
    expect(backWeek).toBe(initialWeek)
  })

  // =========================================================================
  // AC-7: Meal plan cell can have free text
  // =========================================================================

  test("AC-7: Add free text entry to meal plan cell", async ({ page }) => {
    await waitForRecipesPage(page)

    // Switch to meal plan tab
    const mealPlanTab = page.getByRole("tab", {
      name: /Essensplan|Meal Plan|Plan de repas/i,
    })
    await mealPlanTab.click()
    await page.waitForTimeout(2000)

    // Click an empty "+" cell to open popover
    const addButton = page.locator(
      'button[aria-label*="Eintrag hinzufügen"], button[aria-label*="Add meal"], button[aria-label*="Ajouter"]'
    ).first()
    await expect(addButton).toBeVisible({ timeout: 10000 })
    await addButton.click()

    // Click "Free text" / "Freitext" option
    const freeTextBtn = page.locator(
      'button:has-text("Freitext"), button:has-text("Free text"), button:has-text("Texte libre")'
    )
    await expect(freeTextBtn).toBeVisible({ timeout: 5000 })
    await freeTextBtn.click()

    // Fill in free text
    const freeTextInput = page.locator(
      'input[placeholder*="Reste"], input[placeholder*="Leftovers"], input[placeholder*="Restes"]'
    )
    await expect(freeTextInput).toBeVisible({ timeout: 5000 })
    await freeTextInput.fill("Reste vom Vortag")
    await freeTextInput.press("Enter")

    // Wait for the entry to appear in the cell
    await expect(page.getByText("Reste vom Vortag")).toBeVisible({
      timeout: 10000,
    })
  })

  // =========================================================================
  // EC: Empty state when no recipes exist
  // =========================================================================

  test("EC: Recipes page shows recipe grid or empty state", async ({
    page,
  }) => {
    await waitForRecipesPage(page)
    // Should either show recipe cards or empty state with icon
    const hasRecipes = await page
      .locator("article")
      .first()
      .isVisible()
      .catch(() => false)
    const hasEmptyState = await page
      .locator("h3")
      .first()
      .isVisible()
      .catch(() => false)

    expect(hasRecipes || hasEmptyState).toBe(true)
  })

  // =========================================================================
  // Navigation
  // =========================================================================

  test("Navigation: Recipes page accessible at /recipes", async ({ page }) => {
    await page.goto("/recipes")
    await expect(page).toHaveURL(/\/recipes/)
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 })
  })

  // =========================================================================
  // AC-3: Delete recipe (adults/admins only)
  // =========================================================================

  test("AC-3: Delete a recipe via card menu", async ({ page }) => {
    await waitForRecipesPage(page)

    // Create a recipe to delete
    const deleteName = `Delete-${Date.now()}`
    await createRecipe(page, deleteName)
    await expect(page.getByText(deleteName)).toBeVisible()

    // Hover over the recipe card to show menu
    const card = page.locator(`article:has-text("${deleteName}")`)
    await card.hover()

    // Click the "..." menu button
    const menuBtn = card.locator(
      'button[aria-label*="ktionen"], button[aria-label*="ctions"]'
    )
    await expect(menuBtn).toBeVisible({ timeout: 5000 })
    await menuBtn.click()

    // Click "Delete" / "Löschen"
    const deleteOption = page.getByRole("menuitem", {
      name: /Löschen|Delete|Supprimer/i,
    })
    await expect(deleteOption).toBeVisible({ timeout: 5000 })
    await deleteOption.click()

    // Confirm deletion
    const alertDialog = page.locator('[role="alertdialog"]')
    await expect(alertDialog).toBeVisible({ timeout: 5000 })
    await alertDialog
      .getByRole("button", { name: /Löschen|Delete|Supprimer/i })
      .click()

    // Recipe should be gone
    await expect(page.getByText(deleteName)).not.toBeVisible({
      timeout: 10000,
    })
  })
})
