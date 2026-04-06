import { test, expect } from "@playwright/test"

// ---------------------------------------------------------------------------
// PROJ-7 Einkaufslisten — E2E Tests
//
// Prerequisites:
//   - App running at http://localhost:3000
//   - Auth setup via tests/auth.setup.ts (runs automatically)
//   - Playwright browsers installed: `npx playwright install chromium`
//   - PROJ-7 migration applied to Supabase
// ---------------------------------------------------------------------------

// Helper: wait for shopping page to be fully loaded
async function waitForShoppingPage(page: import("@playwright/test").Page) {
  await page.goto("/shopping")
  await page.waitForSelector("h1", { timeout: 15000 })
}

// Helper: create a shopping list and return its name
async function createList(page: import("@playwright/test").Page, name: string) {
  const newListBtn = page.getByRole("button", {
    name: /Neue Liste|New List|Nouvelle liste/i,
  })
  await newListBtn.click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible({ timeout: 5000 })
  await dialog.locator("input").fill(name)
  await dialog.getByRole("button", { name: /Erstellen|Create|Créer/i }).click()
  await expect(dialog).not.toBeVisible({ timeout: 5000 })
  await expect(page.getByText(name)).toBeVisible({ timeout: 10000 })
}

// Helper: navigate to a list detail by clicking the overlay link
async function openList(page: import("@playwright/test").Page, name: string) {
  // The card uses an overlay <a> with aria-label matching the list name
  await page.getByRole("link", { name }).click()
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)
}

// Helper: add an item via quick add
async function addItem(page: import("@playwright/test").Page, itemName: string) {
  // The quick-add input has aria-label "Artikel schnell hinzufuegen" (DE) or "Quickly add an item" (EN)
  const quickInput = page.locator(
    'input[aria-label*="rtikel"], input[aria-label*="uickly"], input[aria-label*="jouter"]'
  )
  await expect(quickInput).toBeVisible({ timeout: 15000 })
  await quickInput.fill(itemName)
  await quickInput.press("Enter")
  // Wait for the item to appear as a checkbox row (not in suggestions)
  await expect(
    page.locator(`[role="checkbox"] + div >> text="${itemName}"`)
      .or(page.locator(`p:text-is("${itemName}")`))
  ).toBeVisible({ timeout: 10000 })
}

test.describe.serial("PROJ-7: Einkaufslisten", () => {
  test.setTimeout(60000)

  // =========================================================================
  // AC-1: Mehrere Einkaufslisten pro Familie
  // =========================================================================

  test("AC-1: Navigate to shopping page and see heading", async ({ page }) => {
    await waitForShoppingPage(page)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("AC-1: Create a new shopping list", async ({ page }) => {
    await waitForShoppingPage(page)
    const uniqueName = `Testliste-${Date.now()}`
    await createList(page, uniqueName)
    await expect(page.getByText(uniqueName)).toBeVisible()
  })

  // =========================================================================
  // AC-2 & AC-3: Artikel hinzufuegen (Quick Add + Enter)
  // =========================================================================

  test("AC-2/AC-3: Add items to a shopping list via quick add", async ({
    page,
  }) => {
    await waitForShoppingPage(page)
    const listName = `QuickAdd-${Date.now()}`
    await createList(page, listName)
    await openList(page, listName)



    await addItem(page, "Milch")
    await addItem(page, "Brot")

    // Verify items are in the list (use checkbox rows to distinguish from suggestions)
    const itemRows = page.locator('[role="checkbox"]')
    await expect(itemRows).toHaveCount(2, { timeout: 10000 })
  })

  // =========================================================================
  // AC-4: Artikel abhaken (durchgestrichen, ans Ende verschoben)
  // =========================================================================

  test("AC-4: Toggle item as done shows strikethrough", async ({ page }) => {
    await waitForShoppingPage(page)
    const listName = `Toggle-${Date.now()}`
    await createList(page, listName)
    await openList(page, listName)

    await addItem(page, "Butter")

    // Toggle done
    const checkbox = page.locator('[role="checkbox"]').first()
    await checkbox.click()

    // Should now have line-through styling
    await expect(page.locator(".line-through")).toBeVisible({ timeout: 5000 })
  })

  // =========================================================================
  // AC-6: "Alle erledigten loeschen"
  // =========================================================================

  test("AC-6: Clear completed items removes done items", async ({ page }) => {
    await waitForShoppingPage(page)
    const listName = `Clear-${Date.now()}`
    await createList(page, listName)
    await openList(page, listName)

    await addItem(page, "Testprodukt")

    // Toggle done
    const checkbox = page.locator('[role="checkbox"]').first()
    await checkbox.click()
    await page.waitForTimeout(2000)

    // Clear completed button
    const clearButton = page.locator(
      'button[aria-label*="rledigte"], button[aria-label*="lear done"]'
    )
    await expect(clearButton).toBeVisible({ timeout: 5000 })
    await clearButton.click()

    // Item should be gone
    await expect(page.getByText("Testprodukt")).not.toBeVisible({
      timeout: 10000,
    })
  })

  // =========================================================================
  // AC-9: List deletion only for adults/admins
  // =========================================================================

  test("AC-9: Delete list from detail page", async ({ page }) => {
    await waitForShoppingPage(page)
    const listName = `Delete-${Date.now()}`
    await createList(page, listName)
    await openList(page, listName)

    // Delete button (trash icon in header)
    const deleteButton = page.locator(
      'button[aria-label*="oeschen"], button[aria-label*="elete"]'
    ).first()
    await expect(deleteButton).toBeVisible({ timeout: 5000 })
    await deleteButton.click()

    // Confirm in alert dialog
    const alertDialog = page.locator('[role="alertdialog"]')
    await expect(alertDialog).toBeVisible({ timeout: 5000 })
    await alertDialog
      .getByRole("button", { name: /Loeschen|Delete|Supprimer/i })
      .click()

    // Should redirect to shopping overview
    await expect(page).toHaveURL(/\/shopping$/, { timeout: 10000 })
  })

  // =========================================================================
  // EC: Empty list state
  // =========================================================================

  test("EC: Empty list shows empty state", async ({ page }) => {
    await waitForShoppingPage(page)
    const listName = `Empty-${Date.now()}`
    await createList(page, listName)
    await openList(page, listName)

    // Empty list shows an SVG icon and a heading
    const emptyHeading = page.locator("h3")
    await expect(emptyHeading).toBeVisible({ timeout: 5000 })
  })

  // =========================================================================
  // Navigation
  // =========================================================================

  test("Navigation: Shopping page accessible at /shopping", async ({
    page,
  }) => {
    await page.goto("/shopping")
    await expect(page).toHaveURL(/\/shopping/)
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 })
  })
})
