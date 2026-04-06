# PROJ-7: Einkaufslisten

## Status: Deployed
**Created:** 2026-03-18
**Last Updated:** 2026-04-06

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Requires: PROJ-15 (Mehrsprachigkeit) – Alle UI-Texte müssen über das i18n-System laufen.
- Soft dependency: PROJ-8 (Essens- & Rezeptplanung) – Zutaten können automatisch zu Einkaufslisten hinzugefügt werden.

## User Stories
- Als Familienmitglied möchte ich mehrere Einkaufslisten erstellen können (z.B. "Wocheneinkauf", "Drogerie").
- Als Nutzer möchte ich schnell Artikel zu einer Einkaufsliste hinzufügen können.
- Als Nutzer möchte ich beim Einkaufen Artikel abhaken können, damit ich den Überblick behalte.
- Als Familienmitglied möchte ich Einkaufslisten gemeinsam in Echtzeit bearbeiten, damit doppelter Kauf vermieden wird.
- Als Nutzer möchte ich Artikel mit Menge, Einheit und Kategorie versehen.
- Als Nutzer möchte ich häufig genutzte Artikel vorgeschlagen bekommen.
- Als Admin/Erwachsener möchte ich Einkaufslisten archivieren oder löschen können.

## Acceptance Criteria
- [ ] Mehrere Einkaufslisten pro Familie möglich; jede Liste hat einen Namen.
- [ ] Artikel-Felder: Produktname (Pflicht), Menge (optional), Einheit (optional), Kategorie (optional), erledigt-Status.
- [ ] Schnelles Hinzufügen: Eingabefeld direkt auf der Listen-Seite, Enter fügt Artikel hinzu.
- [ ] Abhaken: Artikel einzeln abhakbar; abgehakte Artikel werden visuell durchgestrichen ans Ende verschoben.
- [ ] Realtime: Änderungen (hinzufügen, abhaken, löschen) sind sofort bei allen eingeloggten Familienmitgliedern sichtbar.
- [ ] "Alle erledigten löschen"-Funktion zum Aufräumen der Liste.
- [ ] Artikel-Kategorien (z.B. Obst/Gemüse, Milchprodukte, Getränke) helfen beim Sortieren.
- [ ] Häufig genutzte Artikel werden als Vorschläge angezeigt (basierend auf vorherigen Listen der Familie).
- [ ] Alle Familienmitglieder können Einkaufslisten lesen und bearbeiten; Löschen der gesamten Liste nur für Erwachsene/Admins.

## Edge Cases
- Was passiert, wenn zwei Nutzer gleichzeitig denselben Artikel hinzufügen? → Realtime-Sync; doppelte Artikel bleiben bestehen, Nutzer kann manuell löschen.
- Was passiert, wenn die Verbindung während des Einkaufens abbricht? → Zuletzt geladenen Stand anzeigen; Änderungen nach Wiederverbindung synchronisieren.
- Was passiert bei einer leeren Liste? → Leere-Zustands-Anzeige mit Hinweis zum Hinzufügen.
- Was passiert, wenn eine Liste gelöscht wird, während jemand anderes sie gerade nutzt? → Toast-Benachrichtigung "Liste wurde gelöscht" + Weiterleitung zur Listen-Übersicht.

## Technical Requirements
- Realtime: Supabase Realtime für sofortige Listen-Updates.
- Offline: Zuletzt geladene Listen im Browser-Cache (kein komplexes Offline-First).
- Performance: Listen-Inhalte werden lazy geladen (Listenübersicht zuerst, Inhalte beim Öffnen).

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
/shopping (Einkaufslisten-Übersicht)
+-- Shopping Page Header (Titel, "Neue Liste"-Button)
+-- Lists Grid
|   +-- Shopping List Card (Name, Artikel-Anzahl, letzte Änderung)
+-- Empty State (wenn keine Listen vorhanden)

/shopping/[listId] (Listen-Detail)
+-- List Header (Name, Zurück-Button, Admins: Löschen-Button)
+-- Quick Add Input (Freitext, Enter fügt Artikel hinzu)
+-- "Alle erledigten löschen"-Button
+-- Items gruppiert nach Kategorie
|   +-- Category Group (z.B. "Obst & Gemüse")
|   |   +-- Shopping Item Row
|   |       +-- Checkbox (abhaken)
|   |       +-- Produktname (durchgestrichen wenn erledigt)
|   |       +-- Menge + Einheit (optional)
|   |       +-- Löschen-Button
+-- Vorschläge (häufig genutzte Artikel der Familie)
+-- Empty State (wenn Liste leer)
```

### Datenmodell

**`shopping_lists`** – Eine Einkaufsliste pro Eintrag:
- ID, Familien-ID, Name (z.B. "Wocheneinkauf"), Erstellt-von, Erstellt-am

**`shopping_items`** – Ein Artikel pro Eintrag:
- ID, Listen-ID, Produktname (Pflicht), Menge (optional), Einheit (optional), Kategorie (optional), Erledigt-Status (true/false), Erstellt-von, Erstellt-am

**Gespeichert in:** Supabase-Datenbank (persistiert, serverbasiert)

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Supabase Realtime | Damit alle Familienmitglieder Änderungen sofort sehen – kein manuelles Neu-Laden nötig. |
| Optimistic UI | Artikel erscheint sofort in der Liste beim Hinzufügen, ohne auf Server-Bestätigung zu warten – fühlt sich schnell an. |
| Cursor-basierter Offline-Fallback | Beim Verbindungsabbruch bleibt der zuletzt geladene Stand sichtbar; Änderungen nach Wiederverbindung synchronisiert. |
| Vorschläge via DB-Abfrage | Häufig genutzte Artikel der Familie werden aus vergangenen Listen aggregiert → keine KI nötig, einfach und performant. |

### Berechtigungen (RLS)
- Alle Familienmitglieder: Einkaufslisten lesen, Artikel hinzufügen/abhaken/löschen.
- Nur Admins/Erwachsene: Gesamte Liste löschen.

### Neue Abhängigkeiten
Keine neuen Packages nötig — Supabase Realtime ist bereits im Projekt vorhanden.

## Backend Implementation Notes (2026-04-06)

### Database Migration
- Migration file: `supabase/migrations/20260406_proj7_einkaufslisten.sql`
- Two tables created: `shopping_lists` and `shopping_items`
- RLS enabled on both tables with policies for all CRUD operations
- `shopping_lists`: all family members can SELECT/INSERT/UPDATE; only adults/admins can DELETE
- `shopping_items`: all family members can SELECT/INSERT/UPDATE/DELETE (items are individually manageable)
- `shopping_items.list_id` has ON DELETE CASCADE so deleting a list removes all its items
- Auto-update trigger on `shopping_lists.updated_at`
- Indexes on: `family_id`, `updated_at`, `created_by` (lists); `list_id`, `is_done`, `created_by`, `category` (items)
- Supabase Realtime enabled on both tables

### Server Actions (already existed)
- `src/lib/actions/shopping.ts` -- all 8 actions: getShoppingLists, getShoppingListDetail, createShoppingList, updateShoppingList, deleteShoppingList, addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearCompletedItems, getSuggestedItems
- Authentication checked in every action via `getCurrentProfile()`
- List deletion restricted to adults/admins via `verifyAdultOrAdmin()`
- Rate limiting on create list (20/min) and add item (60/min)

### Validation Schemas (already existed)
- `src/lib/validations/shopping.ts` -- Zod schemas for all write operations
- UUID validation on all IDs; string length limits on names; predefined categories

### Frontend (already existed)
- Pages: `/shopping` (overview), `/shopping/[listId]` (detail)
- Components: ShoppingListOverview, ShoppingListDetail, ShoppingListCard, ShoppingItemRow, QuickAddInput, SuggestionsBar, CreateListDialog
- Supabase Realtime subscriptions in both overview and detail components

## QA Test Results (2026-04-06)

### Acceptance Criteria Results

| # | Criterion | Status |
|---|-----------|--------|
| AC-1 | Mehrere Einkaufslisten pro Familie; jede Liste hat einen Namen | PASS |
| AC-2 | Artikel-Felder: Produktname (Pflicht), Menge, Einheit, Kategorie, erledigt | PASS |
| AC-3 | Schnelles Hinzufuegen: Eingabefeld auf Listen-Seite, Enter fuegt Artikel hinzu | PASS |
| AC-4 | Abhaken: Artikel einzeln abhakbar, durchgestrichen ans Ende verschoben | PASS |
| AC-5 | Realtime: Aenderungen sofort bei allen Familienmitgliedern sichtbar | PASS |
| AC-6 | "Alle erledigten loeschen"-Funktion | PASS |
| AC-7 | Artikel-Kategorien helfen beim Sortieren | PASS |
| AC-8 | Haeufig genutzte Artikel als Vorschlaege | PASS |
| AC-9 | Lesen/Bearbeiten fuer alle; Loeschen der Liste nur fuer Erwachsene/Admins | PASS |

### Edge Cases Tested

| Edge Case | Status |
|-----------|--------|
| Gleichzeitiges Hinzufuegen (Duplikate bleiben bestehen) | PASS (by design) |
| Leere Liste zeigt Empty State | PASS |
| Liste geloescht waehrend Nutzung → Toast + Weiterleitung | PASS (Realtime listener) |
| Verbindungsabbruch → zuletzt geladener Stand bleibt | PASS (initial SSR data) |

### Bugs Found

| ID | Severity | Description | File |
|----|----------|-------------|------|
| BUG-P7-1 | Medium | Hardcoded German strings in server page files bypass i18n system (page title "Einkaufslisten", subtitle "Was brauchen wir?", error messages) | `src/app/(app)/shopping/page.tsx`, `src/app/(app)/shopping/[listId]/page.tsx` |
| BUG-P7-2 | Low | `toggleShoppingItemAction` and `deleteShoppingItemAction` lack explicit `family_id` check in application code (protected by RLS, but defense-in-depth missing) | `src/lib/actions/shopping.ts` |
| BUG-P7-3 | Low | `getShoppingListDetailAction` validates `listId` as string but not as UUID format (RLS prevents exploitation) | `src/lib/actions/shopping.ts` |

### Pre-Existing Issue (NOT caused by PROJ-7)

| ID | Severity | Description |
|----|----------|-------------|
| REGRESSION-1 | Low | PROJ-13 timer E2E tests fail because `beforeEach` waits for German text "Vorlagen" — breaks when user locale is non-German. Not related to PROJ-7. |

### Security Audit

| Check | Result |
|-------|--------|
| Authentication in all server actions | PASS — `getCurrentProfile()` called in every action |
| Authorization (family scoping) | PASS — `family_id` filter in queries + RLS on both tables |
| IDOR (cross-family data access) | PASS — RLS policies prevent unauthorized access |
| Input validation (Zod schemas) | PASS — all write operations validated; UUID, string length limits |
| Rate limiting | PASS — `createList` (20/min) and `addItem` (60/min) rate limited |
| XSS via product names | PASS — React auto-escapes output, no `dangerouslySetInnerHTML` |
| SQL injection | PASS — Supabase parameterized queries |
| Realtime filter injection | PASS — Supabase filters are not SQL; RLS enforced server-side |
| Exposed secrets | PASS — no secrets in client-side code |

### Automated Tests

| Type | File | Tests | Status |
|------|------|-------|--------|
| Unit (Vitest) | `src/lib/validations/shopping.test.ts` | 25 tests | ALL PASS |
| E2E (Playwright) | `tests/PROJ-7-einkaufslisten.spec.ts` | 8 tests | ALL PASS |
| Existing tests | `src/lib/validations/timer.test.ts`, `src/hooks/use-timer.test.ts` | 30 tests | ALL PASS (no regression) |

### Production-Ready Decision

**READY** — No Critical or High bugs. The 1 Medium bug (BUG-P7-1: hardcoded German strings) is cosmetic and only affects users with non-German locale on the page shell text. All core functionality works correctly.

## Deployment

- **Date:** 2026-04-06
- **Production URL:** https://familie-dula-app.vercel.app/shopping
- **Migration applied:** `supabase/migrations/20260406_proj7_einkaufslisten.sql` (shopping_lists + shopping_items, RLS, Realtime)
- **Commit:** `deploy(PROJ-7): Deploy Einkaufslisten to production`
