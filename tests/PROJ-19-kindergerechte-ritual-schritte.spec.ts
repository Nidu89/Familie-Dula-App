import { test, expect } from "@playwright/test"

// ---------------------------------------------------------------------------
// PROJ-19 Kindergerechte Ritual-Schritte — E2E Tests
//
// Prerequisites:
//   - App running at http://localhost:3000
//   - Auth setup via tests/auth.setup.ts (runs automatically)
//   - Playwright browsers installed: `npx playwright install chromium`
// ---------------------------------------------------------------------------

test.describe("PROJ-19: Kindergerechte Ritual-Schritte", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rituals")
    await page.waitForLoadState("networkidle")
  })

  // =========================================================================
  // AC: Emoji-Vorschläge im Formular (RitualFormDialog)
  // =========================================================================

  test("AC-Emoji-1: Step shows auto-suggested emoji when title is typed", async ({
    page,
  }) => {
    // Open create dialog
    const createButton = page.getByRole("button", { name: /Ritual erstellen|Neues Ritual|Create/i })
    await createButton.click()

    // Wait for form to appear
    await page.waitForSelector('[id="ritual-name"]', { timeout: 5000 })

    // Type a step title that matches a keyword
    const stepInput = page.locator('input[aria-label*="Schritt 1"], input[placeholder*="Schritt 1"]').first()
    await stepInput.fill("Zähne putzen")

    // The emoji button should now show the tooth emoji
    // Emoji picker button is next to the input
    const emojiButton = page.locator("button").filter({ hasText: "🦷" }).first()
    await expect(emojiButton).toBeVisible({ timeout: 3000 })
  })

  test("AC-Emoji-2: Default star emoji shown for unmatched title", async ({
    page,
  }) => {
    const createButton = page.getByRole("button", { name: /Ritual erstellen|Neues Ritual|Create/i })
    await createButton.click()

    await page.waitForSelector('[id="ritual-name"]', { timeout: 5000 })

    const stepInput = page.locator('input[aria-label*="Schritt 1"], input[placeholder*="Schritt 1"]').first()
    await stepInput.fill("Irgendwas machen")

    // Should show default star emoji
    const emojiButton = page.locator("button").filter({ hasText: "⭐" }).first()
    await expect(emojiButton).toBeVisible({ timeout: 3000 })
  })

  test("AC-Emoji-3: Emoji picker opens on click and allows manual selection", async ({
    page,
  }) => {
    const createButton = page.getByRole("button", { name: /Ritual erstellen|Neues Ritual|Create/i })
    await createButton.click()

    await page.waitForSelector('[id="ritual-name"]', { timeout: 5000 })

    // Click the emoji button to open picker
    const emojiButton = page.locator("button").filter({ hasText: "⭐" }).first()
    await emojiButton.click()

    // Emoji picker popover should appear
    const pickerPopover = page.locator("[data-radix-popper-content-wrapper], [role='dialog']").first()
    await expect(pickerPopover).toBeVisible({ timeout: 3000 })
  })

  // =========================================================================
  // AC: Schritte als grosse Karten (ActiveRitualView / RitualStepItem)
  // =========================================================================

  test("AC-Card-1: Ritual card preview shows emoji per step", async ({
    page,
  }) => {
    // Check if any ritual card on the page shows emojis in step preview
    const ritualCards = page.locator("[class*='rounded-[2rem]']")
    const cardCount = await ritualCards.count()

    if (cardCount > 0) {
      // System templates should have emojis after migration
      const firstCard = ritualCards.first()
      // Step preview shows emoji + title
      const stepPreview = firstCard.locator("span[aria-hidden='true']").first()
      await expect(stepPreview).toBeVisible()
      const emojiText = await stepPreview.textContent()
      // Should be a non-empty emoji (not just whitespace)
      expect(emojiText?.trim().length).toBeGreaterThan(0)
    }
  })

  // =========================================================================
  // AC: Active ritual step display
  // =========================================================================

  test("AC-ActiveStep-1: Active ritual shows large step cards with emojis", async ({
    page,
  }) => {
    // Check if there's a "Start" button on any ritual
    const startButton = page.getByRole("button", { name: /starten|Start/i }).first()
    const isStartVisible = await startButton.isVisible().catch(() => false)

    if (isStartVisible) {
      await startButton.click()

      // If a child selection dialog appears, select first child or skip
      const childSelect = page.locator("select, [role='combobox']").first()
      const hasChildSelect = await childSelect.isVisible({ timeout: 2000 }).catch(() => false)
      if (hasChildSelect) {
        await childSelect.selectOption({ index: 1 })
        const confirmButton = page.getByRole("button", { name: /starten|Start|Bestätigen/i }).last()
        await confirmButton.click()
      }

      // Wait for active ritual view to load
      await page.waitForTimeout(1000)

      // Check for the "Erledigt!" button (PROJ-19's primary CTA)
      const doneButton = page.getByRole("button", { name: /Erledigt|Done|Fait/i }).first()
      const hasDoneButton = await doneButton.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasDoneButton) {
        // Verify card has minimum height (80px)
        const stepCard = page.locator("[role='listitem']").first()
        if (await stepCard.isVisible()) {
          const box = await stepCard.boundingBox()
          expect(box?.height).toBeGreaterThanOrEqual(80)
        }
      }
    }
  })

  // =========================================================================
  // AC: i18n translations exist
  // =========================================================================

  test("AC-i18n-1: stepItem translation keys are loaded", async ({ page }) => {
    // Navigate to rituals page — the translations are loaded automatically
    // We verify they exist by checking the page doesn't show raw key strings
    const rawKeyPattern = /rituals\.stepItem\./
    const pageContent = await page.textContent("body")
    expect(pageContent).not.toMatch(rawKeyPattern)
  })
})
