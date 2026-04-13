# PROJ-18: Familienmomente

## Status: Deployed
**Created:** 2026-04-12
**Last Updated:** 2026-04-13

## Overview
Eine Memory-Wall für die Familie: Fotos hochladen, besondere Erlebnisse mit Titel, Beschreibung und Datum festhalten. Der neueste Moment erscheint als Hero-Bild auf dem Dashboard. Alle Familienmitglieder (inkl. Kinder) können Momente hinzufügen und mit Herz-Reaktionen auf Momente reagieren.

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding) — für Login-Prüfung
- Requires: PROJ-2 (Familienverwaltung) — für Familien-Zugehörigkeit
- Requires: PROJ-11 (Bild-Upload im Chat) — Supabase Storage Pattern kann wiederverwendet werden

## User Stories

- Als **Familienmitglied** möchte ich einen neuen Moment mit Foto, Titel, Beschreibung und Datum erstellen, damit besondere Erlebnisse festgehalten werden.
- Als **Familienmitglied** möchte ich alle Familienmomente in einer Galerie durchblättern, damit ich Erinnerungen jederzeit ansehen kann.
- Als **Familienmitglied** möchte ich auf einen Moment mit einem Herz reagieren, damit ich zeigen kann, was mir besonders gefällt.
- Als **Admin oder Ersteller** möchte ich einen Moment löschen können, damit unerwünschte Einträge entfernt werden können.
- Als **Familienmitglied** möchte ich auf dem Dashboard den neuesten Moment als Hero-Bild sehen, damit die Erinnerungen im Alltag präsent bleiben.
- Als **Kind** möchte ich ohne Einschränkungen eigene Momente hinzufügen können, damit ich aktiv zur Familienerinnerung beitragen kann.

## Acceptance Criteria

### Galerie-Seite (/moments)
- [ ] Eigene Seite `/moments` zeigt alle Familienmomente in einer Raster-Galerie (neueste zuerst)
- [ ] Jede Kachel zeigt: Foto (oder Emoji/Icon falls kein Foto), Titel und Datum
- [ ] Klick auf eine Kachel öffnet eine Detailansicht (Modal oder Vollseite) mit Foto, Titel, Beschreibung, Datum, Ersteller und Herzreaktionen
- [ ] Galerie ist auf Mobile, Tablet und Desktop responsiv (1 / 2 / 3 Spalten)

### Moment erstellen
- [ ] Schaltfläche „Moment hinzufügen" ist für alle Familienmitglieder sichtbar
- [ ] Formular enthält: Foto-Upload (optional), Titel (Pflicht, max. 80 Zeichen), Beschreibung (optional, max. 500 Zeichen), Datum (Standard: heute, frei wählbar)
- [ ] Foto wird in Supabase Storage (Bucket `moments`) gespeichert
- [ ] Moment wird nach dem Speichern sofort in der Galerie angezeigt

### Herzreaktionen
- [ ] Jedes Familienmitglied kann einem Moment ein Herz geben (toggle: einmal setzen / entfernen)
- [ ] Anzahl Herzen wird auf der Kachel und in der Detailansicht angezeigt
- [ ] Eigenes Herz ist visuell hervorgehoben (ausgefüllt vs. outline)

### Löschen
- [ ] Ersteller und Admins können einen Moment löschen (andere nicht)
- [ ] Löschen zeigt eine Bestätigungsabfrage (AlertDialog)
- [ ] Beim Löschen wird das Foto aus Supabase Storage entfernt

### Dashboard-Integration
- [ ] Der neueste Moment füllt den Hero-Bereich auf dem Dashboard aus (Foto als Hintergrund, Titel und Datum als Overlay)
- [ ] Falls noch kein Moment vorhanden: Platzhalter mit Einladungs-Text und „Ersten Moment hinzufügen"-Button
- [ ] Klick auf den Dashboard-Hero navigiert zur Galerie `/moments`

## Edge Cases

- **Kein Foto hochgeladen:** Moment wird mit einem Farb-Platzhalter (Gradient basierend auf Titel) oder einem Standard-Emoji angezeigt
- **Sehr langer Titel:** Wird in der Kachel abgeschnitten (truncate), vollständig in der Detailansicht
- **Erste Familie ohne Momente:** Dashboard zeigt einladenden CTA statt leerem Hero
- **Foto-Upload schlägt fehl:** Fehlermeldung, Moment wird NICHT gespeichert (kein Moment ohne konsistenten Zustand)
- **Moment wird gelöscht, während andere ihn ansehen:** Detailansicht schließt sich, Benutzer kehrt zur Galerie zurück, Toast-Meldung
- **Gleichzeitiges Herz-Setzen durch mehrere Nutzer:** Optimistic UI + serverseitige Synchronisation
- **Großes Foto (> 5 MB):** Client-seitige Validierung mit Fehlermeldung vor Upload
- **Benutzer verlässt Formular ungespeichert:** Keine Rückfrage nötig (kein Auto-Draft)

## Technical Requirements

- **Storage:** Supabase Storage Bucket `moments` (public read für Familienmitglieder, authenticated write)
- **RLS:** Momente nur für Familienmitglieder lesbar; Erstellen für alle authentifizierten Familienmitglieder; Löschen nur für Ersteller (`created_by`) oder Admin
- **Performance:** Galerie lädt initial 12 Momente, weiteres Nachladen per „Mehr anzeigen"-Button
- **Bildoptimierung:** Next.js `<Image>` mit `fill` und `object-cover` für einheitliche Kachelgröße
- **Security:** Kein direkter Bucket-Zugriff ohne Auth; Storage-Pfad enthält `family_id` zur Isolation

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Database Schema

**Table: `family_moments`**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| family_id | uuid | FK → families(id), NOT NULL |
| created_by | uuid | FK → profiles(id), NOT NULL |
| title | text | NOT NULL, max 80 chars |
| description | text | nullable, max 500 chars |
| photo_path | text | nullable (storage path in `moments` bucket) |
| moment_date | date | NOT NULL, default CURRENT_DATE |
| created_at | timestamptz | NOT NULL, default now() |

**Table: `family_moment_reactions`**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| moment_id | uuid | FK → family_moments(id) ON DELETE CASCADE, NOT NULL |
| user_id | uuid | FK → profiles(id), NOT NULL |
| created_at | timestamptz | NOT NULL, default now() |
| | | UNIQUE(moment_id, user_id) |

### RLS Policies
- **SELECT**: `family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())`
- **INSERT**: Same family check + `created_by = auth.uid()`
- **DELETE**: `created_by = auth.uid()` OR user role = 'admin'
- **Reactions SELECT/INSERT/DELETE**: Via moment family membership

### Storage
- Bucket: `moments` (private, signed URLs)
- Path pattern: `{family_id}/{uuid}.{ext}`
- Max file size: 5 MB
- Allowed types: image/jpeg, image/png, image/webp, image/gif

### Server Actions (`src/lib/actions/moments.ts`)
- `getMomentsAction(cursor?, limit=12)` — paginated, newest first
- `getLatestMomentAction()` — single newest moment for dashboard hero
- `createMomentAction(FormData)` — with optional photo upload
- `deleteMomentAction(momentId)` — creator + admin
- `toggleReactionAction(momentId)` — upsert/delete heart

### Validations (`src/lib/validations/moments.ts`)
- `createMomentSchema` — title (1-80), description (0-500), momentDate
- `momentFileSchema` — type + size validation

### Components
- `src/components/moments/moments-page-client.tsx` — gallery page
- `src/components/moments/moment-card.tsx` — gallery tile
- `src/components/moments/moment-detail-dialog.tsx` — fullscreen detail
- `src/components/moments/moment-form-dialog.tsx` — create/edit form
- `src/components/moments/heart-button.tsx` — animated reaction toggle
- `src/components/dashboard/moments-hero.tsx` — dashboard hero widget

### Page
- `src/app/(app)/moments/page.tsx`

### Navigation
- Sidebar + Bottom Nav: Add "Momente" link with Camera icon

## QA Test Results

**QA Date:** 2026-04-13
**Build Status:** PASS (npm run build succeeds, no type errors)

### 1. Acceptance Criteria Verification

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Eigene Seite /moments zeigt alle Familienmomente in einer Raster-Galerie (neueste zuerst) | PASS | Page exists, renders grid, orders by created_at DESC |
| 2 | Jede Kachel zeigt: Foto (oder Emoji/Icon falls kein Foto), Titel und Datum | PASS | MomentCard shows photo or gradient+emoji placeholder, title, formatted date |
| 3 | Klick auf eine Kachel oeffnet eine Detailansicht (Modal) mit Foto, Titel, Beschreibung, Datum, Ersteller und Herzreaktionen | PASS | MomentDetailDialog shows all fields |
| 4 | Galerie ist auf Mobile, Tablet und Desktop responsiv (1 / 2 / 3 Spalten) | PASS | grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 |
| 5 | Schaltflaeche "Moment hinzufuegen" ist fuer alle Familienmitglieder sichtbar | PASS | Button in header, no role check |
| 6 | Formular enthaelt: Foto-Upload (optional), Titel (Pflicht, max. 80), Beschreibung (optional, max. 500), Datum (Standard: heute) | PASS | All fields present with correct validation |
| 7 | Foto wird in Supabase Storage (Bucket moments) gespeichert | PASS | Upload uses family_id/uuid.ext path |
| 8 | Moment wird nach dem Speichern sofort in der Galerie angezeigt | PASS | reloadMoments() called after creation |
| 9 | Jedes Familienmitglied kann einem Moment ein Herz geben (toggle) | PASS | toggleReactionAction with optimistic UI |
| 10 | Anzahl Herzen wird auf der Kachel und in der Detailansicht angezeigt | PASS | HeartButton renders count |
| 11 | Eigenes Herz ist visuell hervorgehoben (ausgefuellt vs. outline) | PASS | fill-red-500 vs fill-none |
| 12 | Ersteller und Admins koennen einen Moment loeschen (andere nicht) | PASS | canDelete check in UI + server |
| 13 | Loeschen zeigt eine Bestaetigungsabfrage (AlertDialog) | PASS | AlertDialog wraps delete button |
| 14 | Beim Loeschen wird das Foto aus Supabase Storage entfernt | PASS | Storage remove before DB delete |
| 15 | Dashboard-Hero mit neuestem Moment (Foto als Hintergrund, Titel/Datum Overlay) | PASS | MomentsHero with gradient overlay |
| 16 | Falls kein Moment vorhanden: Platzhalter mit Einladungs-Text und CTA-Button | PASS | Empty state with link to /moments |
| 17 | Klick auf Dashboard-Hero navigiert zur Galerie /moments | PASS | Wrapped in Link href="/moments" |

### 2. Bugs Found

#### BUG-1: BLOCKER -- No database migration exists for family_moments / family_moment_reactions tables
**Severity:** BLOCKER
**File:** supabase/migrations/ (missing)
**Description:** No SQL migration file exists to create the `family_moments` table, `family_moment_reactions` table, or their RLS policies. The feature cannot function without the database schema. The tech design specifies RLS policies but they are never created.
**Steps to reproduce:** Check supabase/migrations/ -- no file contains "family_moments" or "family_moment_reactions".
**Impact:** Feature is completely non-functional in any new or clean environment. No RLS policies means if tables are created manually without policies, all data is exposed or inaccessible.
**Fix:** Create a migration file implementing the schema from the Tech Design section, including RLS policies for SELECT, INSERT, DELETE on both tables, and the Storage bucket configuration.

#### BUG-2: HIGH -- deleteMomentAction missing cross-family authorization check
**Severity:** HIGH (security)
**File:** src/lib/actions/moments.ts:373-386
**Description:** `deleteMomentAction` fetches the moment by ID without filtering by `family_id`. The authorization check (line 384) only verifies `created_by === profile.id || role === 'admin'`. An admin from Family A could delete moments from Family B by supplying that moment's UUID, because the query at line 373-377 does `eq("id", parsed.data.momentId)` without `.eq("family_id", profile.family_id)`.
**Steps to reproduce:** Family A admin calls deleteMomentAction with a momentId belonging to Family B.
**Fix:** Add `.eq("family_id", profile.family_id)` to the fetch query at line 377, or add a check `if (moment.family_id !== profile.family_id)` after fetching.

#### BUG-3: HIGH -- toggleReactionAction missing family membership verification
**Severity:** HIGH (security)
**File:** src/lib/actions/moments.ts:411-466
**Description:** `toggleReactionAction` does not verify that the moment belongs to the user's family. A user from Family A could react to (and thus discover the existence of) moments from Family B. The action only checks authentication but never validates `profile.family_id` against the moment's family. Line 423 does not even check `profile.family_id` exists.
**Steps to reproduce:** Authenticated user from Family A calls toggleReactionAction with a momentId from Family B.
**Fix:** Add a query to verify the moment belongs to the user's family before allowing the reaction, and add `if (!profile.family_id)` check.

#### BUG-4: HIGH -- momentDate validation accepts any non-empty string
**Severity:** HIGH
**File:** src/lib/validations/moments.ts:12
**Description:** The `momentDate` field is validated as `z.string().min(1)` which accepts any non-empty string like "not-a-date" or "'; DROP TABLE family_moments;--". While Supabase's DATE column type provides some protection, the server action should validate the date format properly.
**Steps to reproduce:** Submit createMomentAction with momentDate set to "invalid-date".
**Fix:** Use `z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungueltiges Datumsformat.")` or `z.string().date()` (Zod v3.23+).

#### BUG-5: HIGH -- Drag-and-drop text misleading (not implemented)
**Severity:** LOW (UX)
**File:** src/i18n/messages/de.json:1328, src/components/moments/moment-form-dialog.tsx:115
**Description:** The i18n key `photoDrop` says "Foto hierher ziehen oder klicken" (drop photo here or click) but no drag-and-drop handlers (onDrop, onDragOver) are implemented. The upload area only responds to clicks. German, English ("Drop photo here or click"), and French translations all promise drag-and-drop.
**Steps to reproduce:** Try dragging a photo onto the upload area -- nothing happens.
**Fix:** Either implement drag-and-drop handlers or change the text to "Klicke hier, um ein Foto hochzuladen".

#### BUG-6: LOW -- Duplicate hashCode utility function
**Severity:** LOW (code quality)
**File:** src/components/moments/moment-card.tsx:72-79, src/components/dashboard/moments-hero.tsx:117-124
**Description:** Identical `hashCode` function is duplicated in two files. Should be extracted to a shared utility.
**Fix:** Extract to src/lib/utils.ts and import in both files.

#### BUG-7: LOW -- cursor parameter in getMomentsSchema lacks format validation
**Severity:** LOW (defense-in-depth)
**File:** src/lib/validations/moments.ts:20
**Description:** The `cursor` field is `z.string().optional()` with no format validation. It is used in `.lt("created_at", cursor)` which expects an ISO timestamp. A malformed cursor would cause a Supabase query error but not a security issue since RLS (once implemented) protects the data.
**Fix:** Add `.datetime()` or `.regex()` validation for ISO timestamp format.

#### BUG-8: LOW -- Signed URLs expire after 1 hour with no refresh mechanism
**Severity:** LOW (UX)
**File:** src/lib/actions/moments.ts:136, 231
**Description:** Photo signed URLs are generated with a 3600-second (1 hour) TTL. If a user keeps the gallery open or dashboard open for more than an hour, images will stop loading with no automatic refresh.
**Steps to reproduce:** Open /moments, wait 1+ hours, images break.
**Fix:** Consider longer TTL (e.g., 7200s) or implement a periodic refresh mechanism for visible images.

#### BUG-9: LOW -- AlertDialog inside Dialog may have z-index rendering issues
**Severity:** LOW (UX)
**File:** src/components/moments/moment-detail-dialog.tsx:125-158
**Description:** AlertDialog is rendered inside a Dialog. Per project memory (feedback_radix_popover_in_dialog.md), Radix composable modals can have z-index conflicts. The AlertDialog trigger and content are nested inside DialogContent. Testing should verify the AlertDialog overlay appears above the Dialog overlay in all browsers.
**Steps to reproduce:** Open a moment detail, click delete, verify AlertDialog appears correctly and is interactive.
**Fix:** If issues arise, set `modal={false}` on the outer Dialog or portal the AlertDialog.

### 3. Security Audit

| Check | Status | Notes |
|-------|--------|-------|
| Auth before DB operations | PASS | All mutation actions call getCurrentProfile() |
| Input validation (Zod) | PARTIAL | momentDate lacks date format validation (BUG-4) |
| Rate limiting | PASS | createMoment (10/min), deleteMoment (15/min), toggleReaction (30/min) |
| XSS (dangerouslySetInnerHTML) | PASS | No usage found |
| Cross-family data isolation | FAIL | deleteMomentAction and toggleReactionAction lack family_id checks (BUG-2, BUG-3) |
| File upload validation | PASS | Server-side Zod schema validates type + size (5MB) |
| Storage path isolation | PASS | Uses family_id/uuid.ext pattern |
| Photo cleanup on delete | PASS | Storage remove called before DB delete |
| Photo cleanup on failed insert | PASS | Rollback at line 341-343 |
| No secrets in client code | PASS | No API keys or secrets exposed |
| RLS policies | FAIL | No migration file exists (BUG-1) -- RLS is specified but not implemented |
| Rate limit bypass via IP spoofing | INFO | getIP() uses x-forwarded-for last entry; on Vercel this is generally safe but the in-memory store resets on cold starts |

### 4. Design Review (DESIGN.md Compliance)

| Rule | Status | Notes |
|------|--------|-------|
| No borders for sectioning | PASS | No border classes used for layout |
| Border radius min 0.5rem | PASS | Cards 2rem, buttons pill, inputs 1rem |
| No pure black text | PASS | Uses text-foreground, text-muted-foreground |
| Surface hierarchy | PASS | bg-card, bg-surface-container-low used correctly |
| Generous spacing | PASS | Cards p-5, dialog px-7 pb-7 |
| Signature gradient on CTAs | PASS | from-[#6c5a00] to-[#ffd709] |
| Responsive (375px, 768px, 1440px) | PASS | grid-cols-1/2/3 breakpoints |
| Accessibility: ARIA labels | PASS | HeartButton has aria-label, nav has aria-label |
| Keyboard navigation | PASS | MomentCard is a button with focus-visible ring |
| Tailwind-only (no CSS modules) | PASS | Only inline styles for dynamic gradient (acceptable) |
| Font display for headlines | PASS | font-display class used on h1, h3, dialog titles |

### 5. i18n Review

| Language | Status | Notes |
|----------|--------|-------|
| German (de) | PASS | All keys present, Umlaute correct |
| English (en) | PASS | All keys present |
| French (fr) | PASS | All keys present |

**One issue:** Hardcoded German error message in moment-form-dialog.tsx:43: `toast.error("Datei darf maximal 5 MB gro\u00df sein.")` should use a translation key instead. This is client-side file size validation that bypasses i18n.

### 6. Summary

| Priority | Count | Items |
|----------|-------|-------|
| BLOCKER | 1 | BUG-1 (missing DB migration) |
| HIGH | 3 | BUG-2 (cross-family delete), BUG-3 (cross-family react), BUG-4 (date validation) |
| LOW | 5 | BUG-5 (drag-drop text), BUG-6 (duplicate util), BUG-7 (cursor validation), BUG-8 (signed URL expiry), BUG-9 (AlertDialog in Dialog z-index) |

**Verdict: NOT READY FOR DEPLOY** -- 1 blocker (missing migration) and 3 high-severity issues must be resolved first.

## Deployment
**Deployed:** 2026-04-13
**Tag:** v1.18.0-PROJ-18

### DB Migration
- `family_moments` table with RLS (SELECT, INSERT, DELETE)
- `family_moment_reactions` table with RLS (SELECT, INSERT, DELETE)
- Storage bucket `moments` (private, 5 MB limit, image types only)
- Applied via Supabase MCP to project `fmmorvmshvgqatnefkpf`

### QA Bugs Fixed
- 2 HIGH security bugs (cross-family auth in delete + toggle reaction)
- 1 HIGH validation bug (date format)
- 2 LOW UX/code quality bugs (i18n text, shared utility)
