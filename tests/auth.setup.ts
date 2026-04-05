import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/session.json')

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  if (!email || !password || password === 'CHANGE_ME') {
    throw new Error(
      'E2E test credentials not configured.\n' +
      '1. Create a test user in Supabase Dashboard → Authentication → Users\n' +
      '2. Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.test.local'
    )
  }

  // Go to login page
  await page.goto('/login')

  // Fill login form
  await page.getByPlaceholder('name@beispiel.de').fill(email)
  await page.getByPlaceholder('Mindestens 8 Zeichen').fill(password)

  // Submit
  await page.getByRole('button', { name: /Anmelden/i }).click()

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  // Save signed-in state
  await page.context().storageState({ path: authFile })
})
