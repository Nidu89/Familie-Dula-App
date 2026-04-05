import { test, expect } from "@playwright/test"

// ---------------------------------------------------------------------------
// PROJ-13 Familien-Timer — E2E Tests
//
// Prerequisites:
//   - App running at http://localhost:3000
//   - Auth setup via tests/auth.setup.ts (runs automatically)
//   - Playwright browsers installed: `npx playwright install chromium`
// ---------------------------------------------------------------------------

test.describe("PROJ-13: Familien-Timer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timer")
    // Wait for the page to fully load (templates + timer context)
    await page.waitForSelector("text=Vorlagen", { timeout: 10000 })
  })

  // =========================================================================
  // AC-1: Countdown-Timer
  // =========================================================================

  test("AC-1a: Adult can set a custom duration (minutes and seconds)", async ({
    page,
  }) => {
    const minutesInput = page.locator("#timer-minutes")
    const secondsInput = page.locator("#timer-seconds")

    await expect(minutesInput).toBeVisible()
    await expect(secondsInput).toBeVisible()

    // Set 5 minutes and 30 seconds
    await minutesInput.fill("5")
    await secondsInput.fill("30")

    // Start button should be enabled
    const startButton = page.getByRole("button", { name: /Timer starten/i })
    await expect(startButton).toBeEnabled()
  })

  test("AC-1b: Timer starts, pauses, resumes, and resets", async ({
    page,
  }) => {
    // Start via quick-start chip (use exact match)
    await page
      .getByRole("button", { name: "5 Min", exact: true })
      .click()

    // Timer should be running — pause button visible
    const pauseButton = page.getByLabel(/pausieren/i)
    await expect(pauseButton).toBeVisible()

    // Pause
    await pauseButton.click()
    const resumeButton = page.getByLabel(/fortsetzen/i)
    await expect(resumeButton).toBeVisible()

    // Resume
    await resumeButton.click()
    await expect(page.getByLabel(/pausieren/i)).toBeVisible()

    // Reset
    await page.getByLabel(/zuruecksetzen/i).click()

    // Should be back to idle — duration input visible again
    await expect(page.locator("#timer-minutes")).toBeVisible()
  })

  test("AC-1c: Remaining time is displayed as MM:SS", async ({ page }) => {
    // Start a timer via quick-start
    await page
      .getByRole("button", { name: "10 Min", exact: true })
      .click()

    // Check that MM:SS format is shown
    const timeDisplay = page.locator("[aria-live='polite']")
    await expect(timeDisplay).toBeVisible()
    await expect(timeDisplay).toHaveText(/\d{2}:\d{2}/)

    // Clean up
    await page.getByLabel(/zuruecksetzen/i).click()
  })

  test("AC-1d: Visual progress ring shows progress", async ({ page }) => {
    await page
      .getByRole("button", { name: "5 Min", exact: true })
      .click()

    // SVG progress circle with stroke-dasharray should exist
    const progressCircle = page.locator("circle[stroke-dasharray]")
    await expect(progressCircle.first()).toBeVisible()

    // Clean up
    await page.getByLabel(/zuruecksetzen/i).click()
  })

  // =========================================================================
  // AC-2: Vorlagen (Templates)
  // =========================================================================

  test("AC-2a: System templates are pre-loaded", async ({ page }) => {
    await expect(page.getByText("Vorlagen")).toBeVisible()
    await expect(page.getByText("Anziehen")).toBeVisible()
    await expect(page.getByText("Fruehstueck")).toBeVisible()
    await expect(page.getByText("Hausaufgaben")).toBeVisible()
  })

  test("AC-2b: Adult can create a new template", async ({ page }) => {
    await page.getByLabel(/Neue Vorlage erstellen/i).click()

    await page.getByLabel("Name").fill("Testvorlage")
    await page.getByLabel("Dauer (Minuten)").fill("7")
    await page.getByRole("button", { name: /Erstellen/i }).click()

    // Wait for dialog to close and template to appear
    await expect(page.getByText("Testvorlage")).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("7 Min.")).toBeVisible()
  })

  test("AC-2c: Adult can edit a custom template", async ({ page }) => {
    const uniqueName = `Edit${Date.now()}`
    const updatedName = `${uniqueName}Upd`

    // Create a template to edit
    await page.getByLabel(/Neue Vorlage erstellen/i).click()
    await page.getByLabel("Name").fill(uniqueName)
    await page.getByLabel("Dauer (Minuten)").fill("3")
    await page.getByRole("button", { name: /Erstellen/i }).click()

    // Wait for create dialog to fully close and template to render
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 })

    // Wait for rate limiter (1s between mutations)
    await page.waitForTimeout(1500)

    // Edit it
    await page.getByLabel(new RegExp(`${uniqueName} bearbeiten`, "i")).click()

    // Wait for edit dialog to open with pre-filled name
    const nameInput = page.getByLabel("Name")
    await expect(nameInput).toHaveValue(uniqueName, { timeout: 3000 })
    await nameInput.clear()
    await nameInput.fill(updatedName)
    await page.getByRole("button", { name: /Speichern/i }).click()

    // Wait for dialog close and verify updated name appears
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10000 })
  })

  test("AC-2d: Adult can delete a custom template", async ({ page }) => {
    const uniqueName = `Del-${Date.now()}`

    // Create a template to delete
    await page.getByLabel(/Neue Vorlage erstellen/i).click()
    await page.getByLabel("Name").fill(uniqueName)
    await page.getByLabel("Dauer (Minuten)").fill("2")
    await page.getByRole("button", { name: /Erstellen/i }).click()

    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 })

    // Delete it
    await page.getByLabel(new RegExp(`${uniqueName} loeschen`, "i")).click()
    await page.getByRole("button", { name: /Loeschen/i }).click()

    await expect(page.getByText(uniqueName)).not.toBeVisible({ timeout: 5000 })
  })

  test("AC-2e: Template click starts timer immediately", async ({ page }) => {
    await page.getByLabel(/Anziehen starten/i).click()

    const pauseButton = page.getByLabel(/pausieren/i)
    await expect(pauseButton).toBeVisible()

    // Clean up
    await page.getByLabel(/zuruecksetzen/i).click()
  })

  // =========================================================================
  // AC-3: Alarm bei Ablauf
  // =========================================================================

  test("AC-3: Alarm dialog appears when timer finishes", async ({ page }) => {
    test.setTimeout(90000) // 1-minute timer + buffer

    // Start a 1-minute timer (minimum allowed)
    await page.locator("#timer-minutes").fill("1")
    await page.locator("#timer-seconds").fill("0")
    await page.getByRole("button", { name: /Timer starten/i }).click()

    // Wait for timer to finish (60 seconds + buffer)
    await page.waitForSelector('[role="alertdialog"]', { timeout: 75000 })

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /Zeit abgelaufen/i })
    ).toBeVisible()

    // Dismiss
    await page.getByRole("button", { name: /OK, verstanden/i }).click()
    await expect(dialog).not.toBeVisible()
  })

  // =========================================================================
  // AC-4: Berechtigungen
  // =========================================================================

  test("AC-4: Timer controls are visible for adults", async ({ page }) => {
    await expect(page.locator("#timer-minutes")).toBeVisible()
    await expect(page.getByLabel(/Neue Vorlage erstellen/i)).toBeVisible()
  })

  // =========================================================================
  // AC-5: Navigation & Platzierung
  // =========================================================================

  test("AC-5a: Timer page is accessible at /timer", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Familien-Timer/i })
    ).toBeVisible()
  })

  test("AC-5b: Dashboard widget links to timer page", async ({ page }) => {
    await page.goto("/dashboard")

    const timerLink = page.getByRole("link", { name: /Timer oeffnen/i })
    await expect(timerLink).toBeVisible()

    await timerLink.click()
    await expect(page).toHaveURL(/\/timer/)
  })

  // =========================================================================
  // EC-6: Replacing a running timer shows confirmation
  // =========================================================================

  test("EC-6: Confirmation dialog when replacing a running timer", async ({
    page,
  }) => {
    // Start a timer via quick-start
    await page
      .getByRole("button", { name: "5 Min", exact: true })
      .click()
    await expect(page.getByLabel(/pausieren/i)).toBeVisible()

    // Try to start a template — should show confirmation
    await page.getByLabel(/Anziehen starten/i).click()

    await expect(
      page.getByText(/Laufender Timer ersetzen/i)
    ).toBeVisible()

    // Cancel
    await page.getByRole("button", { name: /Abbrechen/i }).click()

    // Timer should still be running
    await expect(page.getByLabel(/pausieren/i)).toBeVisible()

    // Clean up
    await page.getByLabel(/zuruecksetzen/i).click()
  })
})
