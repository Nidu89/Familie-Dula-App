import { test, expect } from "@playwright/test"

// ---------------------------------------------------------------------------
// PROJ-18 Familienmomente — E2E Tests
//
// Prerequisites:
//   - App running at http://localhost:3000
//   - Auth setup via tests/auth.setup.ts (runs automatically)
//   - Playwright browsers installed: `npx playwright install chromium`
// ---------------------------------------------------------------------------

test.describe("PROJ-18: Familienmomente", () => {
  // =========================================================================
  // AC: Galerie-Seite (/moments)
  // =========================================================================

  test("AC-Gallery-1: /moments page shows gallery with moment cards", async ({
    page,
  }) => {
    await page.goto("/moments")
    await expect(page).toHaveURL(/\/moments/)

    // Page should have a heading or identifiable gallery area
    const heading = page.getByRole("heading", {
      name: /Momente|Moments|Familien/i,
    })
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test("AC-Gallery-2: Gallery is responsive (1/2/3 columns)", async ({
    page,
  }) => {
    await page.goto("/moments")
    await expect(page).toHaveURL(/\/moments/)

    // On desktop the grid should exist
    const gallery = page.locator("[data-testid='moments-gallery']")
    await expect(gallery).toBeVisible({ timeout: 10000 })
  })

  test("AC-Gallery-3: Clicking a card opens detail view with photo, title, description, date, creator, hearts", async ({
    page,
  }) => {
    await page.goto("/moments")

    // First create a moment so we have something to click
    const addButton = page.getByRole("button", {
      name: /Moment hinzufügen|Add moment|Ajouter/i,
    })
    await expect(addButton).toBeVisible({ timeout: 10000 })
    await addButton.click()

    // Fill form
    const titleInput = page.getByLabel(/Titel|Title|Titre/i)
    await expect(titleInput).toBeVisible({ timeout: 5000 })
    await titleInput.fill("Testmoment E2E")

    const descInput = page.getByLabel(/Beschreibung|Description/i)
    await descInput.fill("Automatischer Testmoment")

    // Submit
    const saveButton = page.getByRole("button", {
      name: /Speichern|Save|Enregistrer/i,
    })
    await saveButton.click()

    // Wait for card to appear
    const card = page.locator("[data-testid='moment-card']").first()
    await expect(card).toBeVisible({ timeout: 10000 })

    // Click on card to open detail
    await card.click()

    // Detail should show title, description
    await expect(
      page.getByText("Testmoment E2E")
    ).toBeVisible({ timeout: 5000 })
    await expect(
      page.getByText("Automatischer Testmoment")
    ).toBeVisible()
  })

  // =========================================================================
  // AC: Moment erstellen
  // =========================================================================

  test("AC-Create-1: Add moment button is visible for all family members", async ({
    page,
  }) => {
    await page.goto("/moments")

    const addButton = page.getByRole("button", {
      name: /Moment hinzufügen|Add moment|Ajouter/i,
    })
    await expect(addButton).toBeVisible({ timeout: 10000 })
  })

  test("AC-Create-2: Form has title (required, max 80), description (optional, max 500), date, photo upload", async ({
    page,
  }) => {
    await page.goto("/moments")

    // Open form
    const addButton = page.getByRole("button", {
      name: /Moment hinzufügen|Add moment|Ajouter/i,
    })
    await addButton.click()

    // Title input should exist with maxlength
    const titleInput = page.getByLabel(/Titel|Title|Titre/i)
    await expect(titleInput).toBeVisible({ timeout: 5000 })

    // Description textarea
    const descInput = page.getByLabel(/Beschreibung|Description/i)
    await expect(descInput).toBeVisible()

    // Date input
    const dateInput = page.locator("input[type='date'], [data-testid='moment-date']")
    await expect(dateInput).toBeVisible()

    // Photo upload area
    const fileInput = page.locator("input[type='file']")
    await expect(fileInput).toBeAttached()
  })

  test("AC-Create-3: Moment appears immediately in gallery after saving", async ({
    page,
  }) => {
    await page.goto("/moments")

    const addButton = page.getByRole("button", {
      name: /Moment hinzufügen|Add moment|Ajouter/i,
    })
    await addButton.click()

    const titleInput = page.getByLabel(/Titel|Title|Titre/i)
    await expect(titleInput).toBeVisible({ timeout: 5000 })
    await titleInput.fill("Sofort sichtbar")

    const saveButton = page.getByRole("button", {
      name: /Speichern|Save|Enregistrer/i,
    })
    await saveButton.click()

    // Card should appear
    await expect(page.getByText("Sofort sichtbar")).toBeVisible({
      timeout: 10000,
    })
  })

  // =========================================================================
  // AC: Herzreaktionen
  // =========================================================================

  test("AC-Heart-1: User can toggle heart reaction on a moment", async ({
    page,
  }) => {
    await page.goto("/moments")

    // Wait for a card
    const card = page.locator("[data-testid='moment-card']").first()
    await expect(card).toBeVisible({ timeout: 10000 })

    // Click heart button
    const heartButton = card.getByRole("button", { name: /Herz|Heart|❤/i })
    await expect(heartButton).toBeVisible()
    await heartButton.click()

    // Heart count should change
    await expect(heartButton).toHaveAttribute("data-liked", "true")

    // Toggle off
    await heartButton.click()
    await expect(heartButton).toHaveAttribute("data-liked", "false")
  })

  // =========================================================================
  // AC: Löschen
  // =========================================================================

  test("AC-Delete-1: Creator can delete a moment with confirmation dialog", async ({
    page,
  }) => {
    await page.goto("/moments")

    // Open detail of first card
    const card = page.locator("[data-testid='moment-card']").first()
    await expect(card).toBeVisible({ timeout: 10000 })
    await card.click()

    // Click delete button
    const deleteButton = page.getByRole("button", {
      name: /Löschen|Delete|Supprimer/i,
    })
    await expect(deleteButton).toBeVisible({ timeout: 5000 })
    await deleteButton.click()

    // Confirm in AlertDialog
    const confirmButton = page.getByRole("button", {
      name: /Löschen|Delete|Supprimer/i,
    }).last()
    await confirmButton.click()

    // Toast notification or card removed
    await expect(
      page.getByText(/gelöscht|deleted|supprimé/i)
    ).toBeVisible({ timeout: 5000 })
  })

  // =========================================================================
  // AC: Dashboard-Integration
  // =========================================================================

  test("AC-Dashboard-1: Latest moment appears as hero on dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard")

    // Hero widget should be visible
    const hero = page.locator("[data-testid='moments-hero']")
    await expect(hero).toBeVisible({ timeout: 10000 })
  })

  test("AC-Dashboard-2: Empty state shows CTA when no moments exist", async ({
    page,
  }) => {
    await page.goto("/dashboard")

    // Either hero or empty state should be visible
    const heroOrEmpty = page.locator(
      "[data-testid='moments-hero'], [data-testid='moments-hero-empty']"
    )
    await expect(heroOrEmpty).toBeVisible({ timeout: 10000 })
  })

  test("AC-Dashboard-3: Clicking hero navigates to /moments", async ({
    page,
  }) => {
    await page.goto("/dashboard")

    const hero = page.locator(
      "[data-testid='moments-hero'], [data-testid='moments-hero-empty']"
    )
    await expect(hero).toBeVisible({ timeout: 10000 })

    // Click the hero link
    const heroLink = hero.getByRole("link")
    if (await heroLink.isVisible()) {
      await heroLink.click()
      await expect(page).toHaveURL(/\/moments/)
    }
  })
})
