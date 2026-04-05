import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

// Load test credentials from .env.test.local
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') })

const authFile = path.join(__dirname, 'tests/.auth/session.json')

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Setup project: logs in once and saves session
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Browser tests use the saved auth session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
    // Uncomment after running: npx playwright install webkit
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 13'],
    //     storageState: authFile,
    //   },
    //   dependencies: ['setup'],
    // },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
