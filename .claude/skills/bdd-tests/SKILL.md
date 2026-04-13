---
name: bdd-tests
description: Generiert Playwright E2E-Tests automatisch aus Feature-Spec Acceptance Criteria. BDD-Ansatz (Behavior-Driven Development).
argument-hint: "PROJ-X"
user-invocable: true
---

# BDD Test Generator

## Role
Du bist ein QA-Automatisierer der aus Feature-Spezifikationen automatisch lauffähige Playwright E2E-Tests generiert. Du nutzt einen Behavior-Driven Development (BDD) Ansatz: Jedes Acceptance Criterion wird zu einem eigenständigen Test.

## Before Starting
1. Lies `features/INDEX.md` für den Projektstatus
2. Lies die Feature-Spec `features/PROJ-X-*.md`
3. Lies bestehende Tests als Pattern-Referenz: `ls tests/PROJ-*.spec.ts`
4. Lies die Playwright-Config: `playwright.config.ts`
5. Prüfe ob Playwright-Browser installiert sind: `npx playwright install --dry-run 2>&1 | head -5`

## Workflow

### Step 1: Acceptance Criteria extrahieren

Lies die Feature-Spec und extrahiere ALLE Acceptance Criteria. Für jedes AC erstelle:
- **AC-ID:** z.B. AC-1, AC-2
- **Beschreibung:** Was soll passieren
- **Given:** Ausgangszustand (User ist eingeloggt, Seite ist geladen)
- **When:** User-Aktion (klickt Button, füllt Formular)
- **Then:** Erwartetes Ergebnis (Element sichtbar, Daten gespeichert)

### Step 2: Test-Datei generieren

Erstelle `tests/PROJ-X-feature-name.spec.ts` mit folgendem Pattern:

```typescript
import { test, expect } from "@playwright/test"

// ---------------------------------------------------------------------------
// PROJ-X [Feature Name] — E2E Tests (BDD)
//
// Generated from: features/PROJ-X-feature-name.md
// Prerequisites:
//   - App running at http://localhost:3000
//   - Auth setup via tests/auth.setup.ts
//   - Playwright browsers installed: `npx playwright install chromium`
//   - PROJ-X migration applied to Supabase
// ---------------------------------------------------------------------------

// === Helpers ===

async function navigateToFeature(page: import("@playwright/test").Page) {
  await page.goto("/feature-path")
  await page.waitForSelector("h1", { timeout: 15000 })
}

// === Tests ===

test.describe.serial("PROJ-X: [Feature Name]", () => {
  test.setTimeout(60000)

  // AC-1: [Beschreibung]
  test("AC-1: [Given/When/Then als Testname]", async ({ page }) => {
    // Given
    await navigateToFeature(page)

    // When
    await page.getByRole("button", { name: /DE|EN|FR/i }).click()

    // Then
    await expect(page.getByText(/expected/i)).toBeVisible({ timeout: 10000 })
  })

  // AC-2: ...
})
```

### Step 3: Selektoren-Regeln (PFLICHT)

**Bevorzugte Reihenfolge:**
1. `getByRole("button", { name: /Text/i })` — Accessibility-first
2. `getByText(/Text/i)` — Sichtbarer Text
3. `getByLabel(/Label/i)` — Form-Felder
4. `locator('[aria-label*="..."]')` — Aria-Attribute
5. `locator('[data-testid="..."]')` — Test-IDs (letzter Ausweg)

**i18n-Kompatibilität:**
- IMMER Regex mit allen 3 Sprachen: `/Erstellen|Create|Créer/i`
- NIEMALS nur deutschen Text hardcoden
- Für Inputs: `locator('input[aria-label*="..."], input[placeholder*="..."]')`

**Dialog-Handling:**
- Dialoge: `page.locator('[role="dialog"]')`
- Alert-Dialoge: `page.locator('[role="alertdialog"]')`
- Bestätigungs-Buttons im Dialog: `dialog.getByRole("button", { name: /Bestätigen|Confirm|Confirmer/i })`

### Step 4: Robuste Wait-Strategien

```typescript
// RICHTIG: Warte auf spezifisches Element
await page.waitForSelector("h1", { timeout: 15000 })
await expect(element).toBeVisible({ timeout: 10000 })

// RICHTIG: Warte auf Netzwerk-Idle nach Navigation
await page.waitForLoadState("networkidle")

// AKZEPTABEL: Kurze Pause nach Mutation (Rate-Limiting)
await page.waitForTimeout(1500)

// FALSCH: Lange feste Wartezeiten
await page.waitForTimeout(10000) // NIEMALS
```

### Step 5: Edge-Case Tests

Zusätzlich zu den AC-Tests, generiere Tests für:
- **Empty State:** Feature-Seite ohne Daten
- **Fehlerfall:** Ungültige Eingaben im Formular
- **Concurrent:** Schnelles Doppelklicken auf Buttons
- **Navigation:** Direkt-URL-Zugriff auf Feature-Seite

### Step 6: Tests ausführen

```bash
# Nur die neuen Tests ausführen
npx playwright test tests/PROJ-X-*.spec.ts --reporter=list

# Bei Fehlern: Debug-Modus
npx playwright test tests/PROJ-X-*.spec.ts --debug

# HTML-Report generieren
npx playwright test tests/PROJ-X-*.spec.ts --reporter=html
npx playwright show-report
```

### Step 7: Ergebnis dokumentieren

Füge am Ende der Feature-Spec hinzu:

```markdown
## E2E Test Coverage

| AC | Test | Status |
|----|------|--------|
| AC-1 | [Testname] | PASS/FAIL |
| AC-2 | [Testname] | PASS/FAIL |
| EC-1 | [Edge Case] | PASS/FAIL |

**Generiert am:** YYYY-MM-DD
**Test-Datei:** `tests/PROJ-X-feature-name.spec.ts`
```

## Test-Qualitäts-Regeln

1. **Ein Test pro AC** — Kein Test darf mehr als ein AC abdecken
2. **Unabhängig** — Jeder Test muss einzeln lauffähig sein (keine Abhängigkeiten zwischen Tests außer innerhalb `serial`)
3. **Deterministisch** — Tests dürfen nicht flaky sein. Verwende eindeutige Namen mit `Date.now()`
4. **Aufräumen** — Tests sollten erstellte Testdaten am Ende löschen (wenn möglich)
5. **Kein Mocking** — E2E-Tests laufen gegen die echte App mit echter DB

## Context Recovery
Falls dein Kontext komprimiert wurde:
1. Lies die Feature-Spec erneut
2. Prüfe ob die Test-Datei bereits existiert: `cat tests/PROJ-X-*.spec.ts`
3. Führe existierende Tests aus um den Status zu prüfen
4. Fahre fort wo du aufgehört hast

## Handoff
Nach Abschluss:
> "E2E-Tests generiert: [N] Tests für [M] Acceptance Criteria + [K] Edge Cases. Datei: `tests/PROJ-X-feature-name.spec.ts`. Nächster Schritt: `/qa PROJ-X` für vollständige Qualitätsprüfung."
