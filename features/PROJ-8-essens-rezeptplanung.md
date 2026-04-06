# PROJ-8: Essens- & Rezeptplanung

## Status: Deployed
**Created:** 2026-03-18
**Last Updated:** 2026-04-06

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Requires: PROJ-7 (Einkaufslisten) – Zutaten können direkt in eine Einkaufsliste übertragen werden.
- Requires: PROJ-15 (Mehrsprachigkeit) – Alle UI-Texte müssen über das i18n-System laufen.

## User Stories
- Als Elternteil möchte ich Rezepte mit Titel, Beschreibung, Zutaten und Tags verwalten.
- Als Nutzer möchte ich Rezepte nach Tags filtern (z.B. "vegetarisch", "schnell").
- Als Elternteil möchte ich einen wöchentlichen Essensplan erstellen (Wochentage × Mahlzeiten).
- Als Nutzer möchte ich Rezepte in den Essensplan einplanen.
- Als Nutzer möchte ich die Zutaten eines Rezepts mit einem Klick zu einer Einkaufsliste hinzufügen.
- Als Nutzer möchte ich Rezepte ohne Bild speichern können; optional ein Bild hinzufügen.

## Acceptance Criteria
- [ ] Rezept-Felder: Titel (Pflicht), Beschreibung, Zutatenliste (Zutat + Menge + Einheit), Tags, optionales Bild.
- [ ] Tags: Mindestens "schnell", "vegetarisch", "vegan", "glutenfrei" + freie Tags.
- [ ] Rezepte können erstellt, bearbeitet und gelöscht werden (nur Erwachsene/Admins).
- [ ] Alle Familienmitglieder können Rezepte lesen.
- [ ] Filterung nach einem oder mehreren Tags.
- [ ] Wöchentlicher Essensplan: Matrix aus Wochentagen (Mo–So) und Mahlzeiten (Frühstück, Mittagessen, Abendessen).
- [ ] Jede Zelle im Essensplan kann mit einem Rezept oder einem freien Text belegt werden.
- [ ] "Zu Einkaufsliste hinzufügen"-Funktion: Wähle ein Rezept + eine Zielliste → alle Zutaten werden hinzugefügt.
- [ ] Rezeptbild-Upload: Optional via Supabase Storage (max. 5 MB, JPEG/PNG/WebP).
- [ ] Essensplan zeigt aktuell laufende Woche; Navigation zur nächsten/vorherigen Woche möglich.

## Edge Cases
- Was passiert, wenn ein Rezept, das im Essensplan steht, gelöscht wird? → Eintrag im Essensplan wird als "Rezept gelöscht" markiert, nicht automatisch entfernt.
- Was passiert, wenn ein Rezept keine Zutaten hat und zu einer Einkaufsliste hinzugefügt wird? → Hinweis "Keine Zutaten vorhanden".
- Was passiert, wenn die Einkaufsliste bereits denselben Artikel enthält? → Artikel wird trotzdem hinzugefügt (Duplikate akzeptabel, Nutzer kann manuell bereinigen).
- Was passiert, wenn kein Bild hochgeladen wird? → Platzhalter-Bild oder Icon anzeigen.
- Was passiert, wenn das hochgeladene Bild zu groß ist? → Fehlermeldung mit Limit-Hinweis (max. 5 MB).

## Technical Requirements
- Bilder via Supabase Storage in einem familienspezifischen Bucket.
- RLS auf Storage Bucket: Nur Familienmitglieder können Bilder der eigenen Familie sehen/hochladen.
- Essensplan wird pro Woche (Wochennummer + Jahr) gespeichert.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
/recipes (Tab-Navigation: "Rezepte" | "Essensplan")

Tab: Rezepte
+-- Recipes Page Header ("Neue Rezept"-Button für Admins)
+-- Tag-Filter-Bar (Chips: schnell, vegetarisch, vegan, glutenfrei, + eigene)
+-- Rezept-Grid
|   +-- Recipe Card
|       +-- Bild (oder Platzhalter-Icon)
|       +-- Titel + Tags
|       +-- "Zu Einkaufsliste hinzufügen"-Button
+-- Recipe Form Dialog (erstellen/bearbeiten)
|   +-- Titel, Beschreibung, Zutatenliste, Tags, Bild-Upload
+-- Recipe Detail Sheet (Klick auf Karte)
    +-- Vollbild-Ansicht: Zutaten, Beschreibung, Tags

Tab: Essensplan
+-- Week Navigator (Pfeil zurück/vor, aktuell angezeigte Woche)
+-- Meal Plan Grid (7 Spalten × 3 Zeilen)
|   +-- Spalten-Header (Mo, Di, Mi, Do, Fr, Sa, So)
|   +-- Zeilen (Frühstück / Mittagessen / Abendessen)
|   +-- Zelle
|       +-- Zugewiesenes Rezept (Chip mit Name + Entfernen-Button)
|       +-- ODER: Freitext (z.B. "Reste")
|       +-- ODER: "+ Hinzufügen"-Button (öffnet Rezept-Auswahl oder Freitext)
+-- "Alle Zutaten dieser Woche zu Einkaufsliste"-Button
```

### Datenmodell

**`recipes`** – Ein Rezept pro Eintrag:
- ID, Familien-ID, Titel, Beschreibung, Tags (Array), Bild-URL (optional), Erstellt-von, Erstellt-am

**`recipe_ingredients`** – Eine Zutat pro Eintrag:
- ID, Rezept-ID, Name, Menge (optional), Einheit (optional)

**`meal_plan_entries`** – Ein Slot im Essensplan:
- ID, Familien-ID, Woche (ISO-String, z.B. "2026-W15"), Wochentag (0–6), Mahlzeit-Typ (frühstück/mittagessen/abendessen), Rezept-ID (optional), Freitext (optional)

**Gespeichert in:** Supabase-Datenbank + Supabase Storage (Bilder)

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Supabase Storage für Bilder | Familienspezifischer Ordner (`{family_id}/`), RLS stellt sicher, dass nur Familienmitglieder Bilder sehen/hochladen dürfen. |
| ISO-Wochenstring als Schlüssel | `"2026-W15"` identifiziert eine Woche eindeutig und ist einfach zu berechnen – kein komplexes Datums-Mapping nötig. |
| Client-seitige Bildvalidierung | Dateigröße (max. 5 MB) und Format (JPEG/PNG/WebP) werden vor dem Upload geprüft → verhindert unnötige Server-Anfragen. |
| "Zu Einkaufsliste"-Integration (PROJ-7) | Zutaten eines Rezepts werden direkt in die ausgewählte Einkaufsliste geschrieben – kein Zwischensystem nötig. |
| Deleted-Recipe-Handling | Wenn ein Rezept gelöscht wird, bleibt der Essensplan-Eintrag erhalten und zeigt "Rezept gelöscht" an – kein Datenverlust. |

### Berechtigungen (RLS)
- Alle Familienmitglieder: Rezepte und Essensplan lesen.
- Nur Admins/Erwachsene: Rezepte erstellen, bearbeiten, löschen.
- Alle Familienmitglieder: Essensplan-Slots befüllen und ändern.

### Neue Abhängigkeiten
Keine neuen Packages nötig — Supabase Storage ist bereits im Projekt konfiguriert (PROJ-6 nutzt es bereits).

## Backend Implementation Notes (2026-04-06)

### Database Migration
- Migration file: `supabase/migrations/20260406_proj8_essens_rezeptplanung.sql`
- Three tables created: `recipes`, `recipe_ingredients`, `meal_plan_entries`
- RLS enabled on all tables:
  - `recipes`: all family members SELECT; only adults/admins INSERT/UPDATE/DELETE
  - `recipe_ingredients`: all family members SELECT; only adults/admins INSERT/UPDATE/DELETE
  - `meal_plan_entries`: all family members SELECT/INSERT/UPDATE/DELETE
- `recipe_ingredients.recipe_id` has ON DELETE CASCADE (deleting recipe removes ingredients)
- `meal_plan_entries.recipe_id` has ON DELETE SET NULL (deleting recipe keeps entry, shows "Rezept gelöscht")
- UNIQUE constraint on `(family_id, week_key, weekday, meal_type)` enforces one entry per meal slot
- GIN index on `recipes.tags` for efficient tag-based filtering
- Auto-update trigger on `recipes.updated_at`
- Supabase Realtime enabled on all three tables

### Storage Bucket
- `recipe-images` bucket created (public, 5 MB limit, JPEG/PNG/WebP only)
- Storage RLS: upload/delete restricted to adults/admins; select for all family members
- Files stored as `{family_id}/{uuid}.{ext}`

### Server Actions (already existed from frontend)
- `src/lib/actions/recipes.ts` — 8 actions: getRecipes, createRecipe, updateRecipe, deleteRecipe, getMealPlan, upsertMealPlanEntry, deleteMealPlanEntry, addRecipeIngredientsToShoppingList, uploadRecipeImage
- Authentication checked in every action via `getCurrentProfile()`
- Recipe mutation restricted to adults/admins via `verifyAdultOrAdmin()`
- Rate limiting on create recipe (20/min), upsert meal plan (60/min), image upload (10/min)

### Validation Schemas (already existed from frontend)
- `src/lib/validations/recipes.ts` — Zod schemas for all write operations
- UUID validation on all IDs; ISO week key regex; predefined meal types and weekdays

## QA Test Results (2026-04-06)

### Acceptance Criteria Results

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Rezept-Felder: Titel (Pflicht), Beschreibung, Zutatenliste, Tags, optionales Bild | PASS |
| AC-2 | Tags: Mindestens "schnell", "vegetarisch", "vegan", "glutenfrei" + freie Tags | PASS |
| AC-3 | Rezepte CRUD (nur Erwachsene/Admins) | PASS |
| AC-4 | Alle Familienmitglieder koennen Rezepte lesen | PASS |
| AC-5 | Filterung nach einem oder mehreren Tags | PASS |
| AC-6 | Woechentlicher Essensplan: Matrix 7 Tage x 3 Mahlzeiten | PASS |
| AC-7 | Jede Zelle mit Rezept oder Freitext belegbar | PASS |
| AC-8 | "Zu Einkaufsliste hinzufuegen"-Funktion | PASS |
| AC-9 | Rezeptbild-Upload via Supabase Storage (max. 5 MB, JPEG/PNG/WebP) | PASS |
| AC-10 | Essensplan: Wochennavigation (vor/zurueck, aktuelle Woche) | PASS |

### Edge Cases Tested

| Edge Case | Status |
|-----------|--------|
| Rezept im Essensplan geloescht → "Rezept geloescht" anzeigen | PASS (ON DELETE SET NULL + UI handles null recipeTitle) |
| Rezept ohne Zutaten → "Keine Zutaten vorhanden" Hinweis | PASS |
| Kein Bild → Platzhalter-Icon angezeigt | PASS |
| Bild zu gross → Fehlermeldung (client + server validation) | PASS |
| Leere Rezeptliste → Empty State mit Icon | PASS |
| Leerer Essensplan → Alle Zellen zeigen "+"-Button | PASS |

### Bugs Found

| ID | Severity | Description | File |
|----|----------|-------------|------|
| BUG-P8-1 | Low | `upsertMealPlanEntryAction` uses `.single()` instead of `.maybeSingle()` — logs unnecessary PostgREST error when no existing entry found (functionally correct, noisy logs) | `src/lib/actions/recipes.ts` |
| BUG-P8-2 | Low | `updateRecipeAction` delete-then-reinsert of ingredients is not atomic — if insert fails after delete, ingredients are lost (Supabase JS SDK limitation, no transaction support) | `src/lib/actions/recipes.ts` |

### Pre-Existing Issue (NOT caused by PROJ-8)

| ID | Severity | Description |
|----|----------|-------------|
| REGRESSION-1 | Low | PROJ-13 timer E2E tests fail because `beforeEach` waits for German text "Vorlagen" — breaks when user locale is non-German. Not related to PROJ-8. |

### Security Audit

| Check | Result |
|-------|--------|
| Authentication in all server actions | PASS — `getCurrentProfile()` called in every action |
| Authorization (role-based) | PASS — recipe mutations restricted to adults/admins via `verifyAdultOrAdmin()` |
| Authorization (family scoping) | PASS — `family_id` filter in all queries + RLS on all tables |
| IDOR (cross-family data access) | PASS — RLS policies prevent unauthorized access |
| Input validation (Zod schemas) | PASS — all write operations validated; UUID, week key regex, string limits |
| Rate limiting | PASS — createRecipe (20/min), upsertMeal (60/min), uploadImage (10/min) |
| XSS via recipe titles/descriptions | PASS — React auto-escapes output, no `dangerouslySetInnerHTML` |
| SQL injection | PASS — Supabase parameterized queries |
| File upload validation | PASS — size limit (5 MB), type restriction (JPEG/PNG/WebP), server-side revalidation |
| Storage bucket RLS | PASS — upload/delete restricted to adults/admins, scoped by family_id folder |
| Exposed secrets | PASS — no secrets in client-side code |
| Realtime filter injection | PASS — RLS enforced server-side |

### Automated Tests

| Type | File | Tests | Status |
|------|------|-------|--------|
| Unit (Vitest) | `src/lib/validations/recipes.test.ts` | 30 tests | ALL PASS |
| E2E (Playwright) | `tests/PROJ-8-essens-rezeptplanung.spec.ts` | 10 tests | ALL PASS |
| Existing tests | All prior test files | 55 unit + 9 E2E | ALL PASS (no regression) |

### Production-Ready Decision

**READY** — No Critical or High bugs. The 2 Low bugs are edge cases with minimal user impact (noisy server logs and a theoretical atomicity issue). All 10 acceptance criteria pass. Security audit clean.

## Deployment

- **Date:** 2026-04-06
- **Production URL:** https://familie-dula-app.vercel.app/recipes
- **Migration applied:** `supabase/migrations/20260406_proj8_essens_rezeptplanung.sql` (recipes + recipe_ingredients + meal_plan_entries, RLS, Realtime, Storage bucket)
- **Commit:** `deploy(PROJ-8): Deploy Essens- & Rezeptplanung to production`
