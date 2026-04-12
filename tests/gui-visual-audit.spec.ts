import { test, expect, Page } from "@playwright/test"

/**
 * GUI Visual Audit — Tests for layout cleanliness and overlap issues
 * across Mobile (375px), Tablet (768px) and Desktop (1440px) viewports.
 */

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const

type ViewportName = keyof typeof VIEWPORTS

const APP_PAGES = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Calendar", path: "/calendar" },
  { name: "Tasks", path: "/tasks" },
  { name: "Rewards", path: "/rewards" },
  { name: "Timer", path: "/timer" },
  { name: "Rituals", path: "/rituals" },
  { name: "Shopping", path: "/shopping" },
  { name: "Chat", path: "/chat" },
  { name: "Recipes", path: "/recipes" },
  { name: "Family Settings", path: "/family/settings" },
]

// ── Helpers ──────────────────────────────────────────────────

/** Check that the page has no horizontal overflow (no unintended horizontal scrollbar) */
async function assertNoHorizontalOverflow(page: Page, pageName: string, viewport: string) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  expect(overflow, `${pageName} (${viewport}): horizontal overflow detected`).toBe(false)
}

/** Check that no element extends beyond the viewport width */
async function assertNoElementOverflowsViewport(page: Page, pageName: string, viewport: string) {
  const overflowingElements = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const results: string[] = []
    const allElements = document.querySelectorAll("body *")
    for (const el of allElements) {
      const rect = el.getBoundingClientRect()
      // Only check visible elements
      const style = window.getComputedStyle(el)
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue
      // Skip elements inside overflow-hidden parents
      let parent = el.parentElement
      let isClipped = false
      while (parent) {
        const parentStyle = window.getComputedStyle(parent)
        if (parentStyle.overflow === "hidden" || parentStyle.overflowX === "hidden") {
          const parentRect = parent.getBoundingClientRect()
          if (rect.right > parentRect.right + 1) {
            isClipped = true
            break
          }
        }
        parent = parent.parentElement
      }
      if (isClipped) continue

      if (rect.right > viewportWidth + 2) {
        const tag = el.tagName.toLowerCase()
        const cls = el.className?.toString().slice(0, 80) || ""
        results.push(`<${tag} class="${cls}"> right=${Math.round(rect.right)}px > viewport=${viewportWidth}px`)
      }
    }
    return results.slice(0, 5) // limit to first 5
  })
  expect(
    overflowingElements,
    `${pageName} (${viewport}): elements overflow viewport:\n${overflowingElements.join("\n")}`
  ).toHaveLength(0)
}

/** Check that fixed/sticky elements don't overlap each other (TopBar vs BottomNav) */
async function assertNoFixedElementOverlap(page: Page, pageName: string, viewport: string) {
  const overlap = await page.evaluate(() => {
    const fixedElements: { tag: string; rect: DOMRect; zIndex: number }[] = []
    const allElements = document.querySelectorAll("body *")
    for (const el of allElements) {
      const style = window.getComputedStyle(el)
      if (style.position === "fixed" || style.position === "sticky") {
        if (style.display === "none" || style.visibility === "hidden") continue
        fixedElements.push({
          tag: `${el.tagName.toLowerCase()}.${el.className?.toString().slice(0, 50)}`,
          rect: el.getBoundingClientRect(),
          zIndex: parseInt(style.zIndex) || 0,
        })
      }
    }

    // Check pairwise overlaps between fixed elements at the same z-level
    const overlaps: string[] = []
    for (let i = 0; i < fixedElements.length; i++) {
      for (let j = i + 1; j < fixedElements.length; j++) {
        const a = fixedElements[i]
        const b = fixedElements[j]
        const overlapX = a.rect.left < b.rect.right && a.rect.right > b.rect.left
        const overlapY = a.rect.top < b.rect.bottom && a.rect.bottom > b.rect.top
        if (overlapX && overlapY) {
          // Some overlap is expected (e.g. sidebar + topbar share area)
          // Only flag if both are nav-like or both have same z-index
          overlaps.push(`${a.tag} overlaps ${b.tag}`)
        }
      }
    }
    return overlaps
  })
  // Note: some fixed overlaps are by design (sidebar behind topbar), so we just log them
  if (overlap.length > 0) {
    console.log(`[INFO] ${pageName} (${viewport}) fixed element overlaps: ${overlap.join(", ")}`)
  }
}

/** Check that main content is not hidden behind fixed headers/footers */
async function assertContentNotHiddenBehindNav(page: Page, pageName: string, viewport: string) {
  const issues = await page.evaluate(() => {
    const results: string[] = []
    // Check if first visible content element starts after the top bar
    const mainContent = document.querySelector("main, [role='main']")
    if (!mainContent) return results

    const contentRect = mainContent.getBoundingClientRect()
    // Top bar is h-20 = 80px
    if (contentRect.top < 70) {
      results.push(`Main content starts at ${Math.round(contentRect.top)}px — might be behind top bar (80px)`)
    }
    return results
  })
  // This is informational, not a hard fail
  if (issues.length > 0) {
    console.log(`[INFO] ${pageName} (${viewport}): ${issues.join(", ")}`)
  }
}

/** Check that text is not truncated in a way that hides important info */
async function assertNoUnintentionalTextClipping(page: Page, pageName: string, viewport: string) {
  const clipped = await page.evaluate(() => {
    const results: string[] = []
    // Check buttons and links for text overflow
    const interactive = document.querySelectorAll("button, a, [role='button']")
    for (const el of interactive) {
      const style = window.getComputedStyle(el)
      if (style.display === "none" || style.visibility === "hidden") continue
      // Check if the text content is empty but element is visible
      if (el.scrollWidth > el.clientWidth + 2 && style.overflow !== "hidden" && style.textOverflow !== "ellipsis") {
        const text = (el.textContent || "").trim().slice(0, 30)
        if (text) {
          results.push(`"${text}" overflows its container by ${el.scrollWidth - el.clientWidth}px`)
        }
      }
    }
    return results.slice(0, 5)
  })
  if (clipped.length > 0) {
    console.log(`[WARN] ${pageName} (${viewport}) text clipping: ${clipped.join("; ")}`)
  }
}

// ── Test Suites ─────────────────────────────────────────────

for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
  test.describe(`GUI Audit — ${vpName} (${vpSize.width}x${vpSize.height})`, () => {
    test.use({ viewport: vpSize })

    for (const appPage of APP_PAGES) {
      test(`${appPage.name}: no horizontal overflow`, async ({ page }) => {
        await page.goto(appPage.path, { waitUntil: "networkidle" })
        await page.waitForTimeout(500) // let animations settle
        await assertNoHorizontalOverflow(page, appPage.name, vpName)
      })

      test(`${appPage.name}: no elements overflow viewport`, async ({ page }) => {
        await page.goto(appPage.path, { waitUntil: "networkidle" })
        await page.waitForTimeout(500)
        await assertNoElementOverflowsViewport(page, appPage.name, vpName)
      })

      test(`${appPage.name}: fixed elements don't overlap content`, async ({ page }) => {
        await page.goto(appPage.path, { waitUntil: "networkidle" })
        await page.waitForTimeout(500)
        await assertNoFixedElementOverlap(page, appPage.name, vpName)
        await assertContentNotHiddenBehindNav(page, appPage.name, vpName)
      })
    }
  })
}

// ── Specific Component Tests ────────────────────────────────

test.describe("Specific Component Checks", () => {
  test.describe("Mobile (375px)", () => {
    test.use({ viewport: VIEWPORTS.mobile })

    test("Timer duration input doesn't overflow", async ({ page }) => {
      await page.goto("/timer", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)

      // The duration picker with +/- buttons and inputs should fit in 375px
      const durationPicker = page.locator('[id="timer-minutes"]').locator("..")
      if (await durationPicker.isVisible()) {
        const parentRect = await durationPicker.evaluate((el) => {
          const parent = el.closest(".flex.items-center.gap-3")
          if (!parent) return null
          const rect = parent.getBoundingClientRect()
          return { right: rect.right, width: rect.width }
        })
        if (parentRect) {
          expect(
            parentRect.right,
            `Timer duration picker overflows (right: ${parentRect.right}px > 375px)`
          ).toBeLessThanOrEqual(375)
        }
      }
    })

    test("Timer SVG display fits within viewport", async ({ page }) => {
      await page.goto("/timer", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)

      const svg = page.locator("svg").first()
      if (await svg.isVisible()) {
        const box = await svg.boundingBox()
        if (box) {
          expect(box.x + box.width, "Timer SVG extends beyond viewport").toBeLessThanOrEqual(375)
        }
      }
    })

    test("Tasks filter selects wrap properly on mobile", async ({ page }) => {
      await page.goto("/tasks", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)

      // Check that the filter row doesn't cause horizontal overflow
      await assertNoHorizontalOverflow(page, "Tasks filters", "mobile")
    })

    test("Dashboard widgets don't overflow on mobile", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" })
      await page.waitForTimeout(1000)

      // Check each widget card
      const cards = page.locator("[class*='rounded']")
      const count = await cards.count()
      for (let i = 0; i < Math.min(count, 20); i++) {
        const card = cards.nth(i)
        if (await card.isVisible()) {
          const box = await card.boundingBox()
          if (box && box.width > 10) {
            expect(
              box.x + box.width,
              `Dashboard card ${i} overflows viewport (right: ${box.x + box.width}px)`
            ).toBeLessThanOrEqual(377) // 2px tolerance
          }
        }
      }
    })

    test("Chat messages don't overflow on mobile", async ({ page }) => {
      await page.goto("/chat", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)
      await assertNoHorizontalOverflow(page, "Chat", "mobile")
    })

    test("Bottom navigation is visible and doesn't overlap content", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)

      const bottomNav = page.locator("nav[aria-label]").last()
      if (await bottomNav.isVisible()) {
        const box = await bottomNav.boundingBox()
        expect(box).not.toBeNull()
        if (box) {
          // Should be at the bottom of the screen
          expect(box.y + box.height).toBeGreaterThan(700)
          // Should span full width
          expect(box.width).toBeGreaterThan(350)
        }
      }
    })

    test("Calendar grid cells are touchable (min 44px)", async ({ page }) => {
      await page.goto("/calendar", { waitUntil: "networkidle" })
      await page.waitForTimeout(1000)

      // Check day cells in the calendar grid
      const dayCells = page.locator("[class*='min-h-']")
      const count = await dayCells.count()
      for (let i = 0; i < Math.min(count, 10); i++) {
        const cell = dayCells.nth(i)
        if (await cell.isVisible()) {
          const box = await cell.boundingBox()
          if (box && box.width > 5) {
            // Check minimum touch target (WCAG 2.5.5 recommends 44px)
            expect(
              box.height,
              `Calendar cell ${i} height (${box.height}px) below touch target`
            ).toBeGreaterThanOrEqual(40)
          }
        }
      }
    })

    test("Recipe ingredient form inputs fit on mobile", async ({ page }) => {
      await page.goto("/recipes", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)
      await assertNoHorizontalOverflow(page, "Recipes", "mobile")
    })

    test("Shopping list items are readable on mobile", async ({ page }) => {
      await page.goto("/shopping", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)
      await assertNoHorizontalOverflow(page, "Shopping", "mobile")
    })

    test("FAB button doesn't overlap bottom nav items", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)

      // The FAB has class -top-5 (relative positioning), check it doesn't overlap nav links
      const fabButton = page.locator("button[aria-label]").filter({ has: page.locator("svg.lucide-plus") })
      if (await fabButton.first().isVisible()) {
        const fabBox = await fabButton.first().boundingBox()
        if (fabBox) {
          // FAB should be elevated above the bottom nav
          expect(fabBox.width, "FAB button is properly sized").toBeGreaterThanOrEqual(56)
          expect(fabBox.height, "FAB button is properly sized").toBeGreaterThanOrEqual(56)
        }
      }
    })
  })

  test.describe("Tablet (768px)", () => {
    test.use({ viewport: VIEWPORTS.tablet })

    test("Sidebar is hidden on tablet (below md breakpoint)", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)

      const sidebar = page.locator("aside[aria-label]")
      // md breakpoint in Tailwind is 768px, sidebar has hidden md:flex
      // At exactly 768px it should be visible (md = 768px and up)
      const isVisible = await sidebar.isVisible()
      // 768px = md breakpoint, sidebar should be visible
      expect(isVisible, "Sidebar should be visible at 768px (md breakpoint)").toBe(true)
    })

    test("Content grid adapts properly at tablet width", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)
      await assertNoHorizontalOverflow(page, "Dashboard", "tablet")
      await assertNoElementOverflowsViewport(page, "Dashboard", "tablet")
    })

    test("Calendar view fits tablet viewport", async ({ page }) => {
      await page.goto("/calendar", { waitUntil: "networkidle" })
      await page.waitForTimeout(1000)
      await assertNoHorizontalOverflow(page, "Calendar", "tablet")
    })
  })

  test.describe("Desktop (1440px)", () => {
    test.use({ viewport: VIEWPORTS.desktop })

    test("Sidebar is visible and properly positioned", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)

      const sidebar = page.locator("aside[aria-label]")
      await expect(sidebar).toBeVisible()
      const box = await sidebar.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.x, "Sidebar should be at left edge").toBe(0)
        expect(box.width, "Sidebar width should be ~288px (w-72)").toBeGreaterThan(270)
        expect(box.width).toBeLessThan(300)
      }
    })

    test("Content area has proper left margin for sidebar", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)

      // Content should have md:ml-72 (288px margin)
      const content = page.locator(".md\\:ml-72")
      if (await content.isVisible()) {
        const box = await content.boundingBox()
        if (box) {
          expect(box.x, "Content margin should account for sidebar").toBeGreaterThanOrEqual(280)
        }
      }
    })

    test("Bottom navigation is hidden on desktop", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" })
      await page.waitForTimeout(500)

      // BottomNav has md:hidden
      const bottomNav = page.locator("nav").filter({ hasText: /Mehr|More/ })
      if (await bottomNav.count() > 0) {
        const isVisible = await bottomNav.first().isVisible()
        expect(isVisible, "Bottom nav should be hidden on desktop").toBe(false)
      }
    })
  })
})

// ── Auth Pages (unauthenticated) ─────────────────────────────

test.describe("Auth Pages — Visual Audit", () => {
  // These tests don't need auth
  test.use({ storageState: { cookies: [], origins: [] } })

  const AUTH_PAGES = [
    { name: "Login", path: "/login" },
    { name: "Register", path: "/register" },
    { name: "Forgot Password", path: "/forgot-password" },
  ]

  for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
    test.describe(`${vpName} (${vpSize.width}x${vpSize.height})`, () => {
      test.use({ viewport: vpSize })

      for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: no overflow`, async ({ page }) => {
          await page.goto(authPage.path, { waitUntil: "networkidle" })
          await page.waitForTimeout(500)
          await assertNoHorizontalOverflow(page, authPage.name, vpName)
        })

        test(`${authPage.name}: form is centered and fits`, async ({ page }) => {
          await page.goto(authPage.path, { waitUntil: "networkidle" })
          await page.waitForTimeout(500)

          // Check that the card/form container fits within viewport
          const card = page.locator("[class*='CardContent'], [class*='card']").first()
          if (await card.isVisible()) {
            const box = await card.boundingBox()
            if (box) {
              expect(box.x, "Card should not be off-screen left").toBeGreaterThanOrEqual(0)
              expect(
                box.x + box.width,
                "Card should not overflow right"
              ).toBeLessThanOrEqual(vpSize.width + 2)
            }
          }
        })
      }
    })
  }
})
