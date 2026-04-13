# PROJ-19: Kindergerechte Ritual-Schritte

## Status: In Progress
**Created:** 2026-04-12
**Last Updated:** 2026-04-13

## Dependencies
- Requires: PROJ-14 (Familien-Rituale) — Basis-Ritual-System, ActiveRitualView, RitualStepItem, RitualFormDialog

## User Stories

- Als Kind möchte ich jeden Ritual-Schritt als grosse, bunte Karte mit einem Emoji sehen, damit die Routine Spass macht und ich mich durch die Schritte motiviert fühle.
- Als Kind möchte ich nach dem Abhaken eines Schritts eine Konfetti-Animation und einen Soundeffekt erleben, damit ich mich belohnt fühle und weiter mitmache.
- Als Elternteil möchte ich beim Erstellen eines Rituals automatisch passende Emojis für jeden Schritt vorgeschlagen bekommen (z.B. "Zähne putzen" → 🦷), damit ich schnell kindergerechte Rituale erstelle.
- Als Elternteil möchte ich das vorgeschlagene Emoji pro Schritt manuell ändern können, damit ich die Darstellung individuell anpassen kann.
- Als Kind möchte ich klar sehen, welcher Schritt gerade aktiv ist und wie viele Schritte noch kommen, damit ich weiss, wie weit ich bin.

## Acceptance Criteria

### Schritte als grosse Karten (ActiveRitualView / RitualStepItem)
- [ ] Jeder Ritual-Schritt wird als grosse Karte dargestellt (min. 80px Höhe, `surface-container-lowest` Hintergrund, `lg` Radius)
- [ ] Das Emoji des Schritts wird gross und prominent links/oben in der Karte angezeigt (min. 2rem Schriftgrösse)
- [ ] Der Schritt-Titel wird in `headline-sm`-Grösse (klar lesbar für Kinder) dargestellt
- [ ] Anstelle einer kleinen Checkbox gibt es einen grossen "Erledigt!"-Button (volle Breite, Primary-Style) am unteren Rand der Karte
- [ ] Erledigte Schritte: Karte wechselt zu grünem Hintergrund-Tint (`secondary-container` oder ähnlich), Titel mit Durchstreichung, grosses ✓-Zeichen anstelle des Buttons
- [ ] Aktiver (nächster) Schritt ist visuell hervorgehoben (z.B. leichter `ring`-Effekt oder leicht grösser skaliert)
- [ ] Schrittsnummer wird als Badge (Kreis) oben-rechts auf der Karte angezeigt

### Emoji-Vorschläge (RitualFormDialog)
- [ ] Beim Erstellen/Bearbeiten eines Rituals erhält jeder Schritt automatisch ein vorgeschlagenes Emoji basierend auf dem Schritt-Titel (Keyword-Mapping, mind. 20 Begriffe abgedeckt)
- [ ] Das vorgeschlagene Emoji wird im Formular inline neben dem Schritt-Titel angezeigt
- [ ] Per Klick auf das Emoji öffnet sich der vorhandene Emoji-Picker zur manuellen Auswahl
- [ ] Wenn kein Keyword matched, wird ein Standard-Emoji verwendet (⭐)
- [ ] Emojis werden in der `steps`-JSONB-Spalte als `emoji`-Feld gespeichert (Schema-Erweiterung)

### Keyword-Mapping (mind. folgende Begriffe abgedeckt)
| Stichwort | Emoji |
|-----------|-------|
| zähne / zahn | 🦷 |
| schlafen / schlaf / bett | 😴 |
| essen / frühstück / abendessen / mittagessen / snack | 🍽️ |
| anziehen / pyjama / kleidung | 👕 |
| aufräumen / aufstehen | 🛏️ |
| ranzen / schulranzen / tasche / packen | 🎒 |
| lesen / buch / geschichte | 📚 |
| hausaufgaben / aufgaben | ✏️ |
| waschen / duschen / bad | 🚿 |
| sport / turnen | 🏃 |
| musik / üben | 🎵 |
| spielen | 🎮 |
| aufräumen / zimmer | 🧹 |

### Konfetti-Animation & Sound (beim Schritt-Abhaken)
- [ ] Wenn ein Schritt als erledigt markiert wird, erscheint eine kurze Konfetti-Burst-Animation (CSS oder Canvas, max. 1.5 Sekunden)
- [ ] Gleichzeitig wird ein kurzer Erfolgs-Soundeffekt abgespielt (neue Datei: `/step-complete.mp3`, ca. 0.5–1 Sek.)
- [ ] Konfetti erscheint zentriert auf der abgehakten Karte (nicht fullscreen)
- [ ] Wenn mehrere Schritte schnell hintereinander abgehakt werden, werden Animationen nicht gestapelt (debounce oder Queue)
- [ ] Wenn der Browser Audio blockiert, läuft die Animation still durch (kein Fehler, kein Console-Error)
- [ ] Sound ist unabhängig vom globalen Ritual-Alarm-Sound steuerbar (gleiche Lautstärken-Logik wie PROJ-13)

### Datenbank-Erweiterung (steps JSONB)
- [ ] Das `steps`-JSONB-Schema in der `rituals`-Tabelle wird um das Feld `emoji: string | null` erweitert
- [ ] Migration stellt sicher, dass bestehende Schritte `emoji: null` erhalten
- [ ] Die Zod-Validierung (`ritualStepSchema`) wird um `emoji` ergänzt
- [ ] System-Vorlagen-Schritte erhalten passende Standard-Emojis (via Update-Migration)

## Edge Cases

- **Kein Emoji definiert:** Zeige Standard-Emoji ⭐ anstelle von leerem Feld
- **Sehr langer Schritt-Titel:** Text bricht um, Karte dehnt sich vertikal aus (kein Abschneiden)
- **Audio vom Browser blockiert (Autoplay-Policy):** Animation läuft, kein Sound, kein Fehler
- **Offline-Modus:** Animation und Sound funktionieren lokal; DB-Sync wie bisher über Server Actions
- **Ältere Rituale ohne Emoji im JSONB:** Rendering fällt auf ⭐ zurück, keine Migration der Nutzerdaten erzwungen
- **Alle Schritte schnell abgehakt:** Konfetti-Animationen werden nicht überlagert (max. 1 aktive Animation)
- **Letzter Schritt abgehakt:** Konfetti für den letzten Schritt, dann direkt der bestehende RitualCompleteDialog (kein doppeltes Konfetti)

## Technical Requirements

- Konfetti-Bibliothek oder reine CSS-Animation (kein schweres canvas-Library wenn vermeidbar)
- Sounddatei `/public/step-complete.wav` (kurzer, fröhlicher Ton, < 50KB)
- Keyword-Mapping als pure Funktion in `src/lib/ritual-emoji-suggestions.ts` (unit-testbar)
- Keine Breaking Changes an bestehenden Ritual-Server-Actions (additive Erweiterung)
- Migration: `supabase/migrations/20260412_proj19_ritual_step_emoji.sql`

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
**Designed:** 2026-04-13

### Typ
Frontend-Upgrade + kleine Datenbank-Erweiterung. Bestehende Ritual-Logik (Server Actions, RLS) bleibt unverändert.

### Komponenten-Struktur
```
RitualFormDialog (bestehend — erweitert)
└── StepFormData (internes State-Objekt)
    └── + emoji: string (NEU — auto-vorgeschlagen, manuell änderbar)
        └── [Emoji-Button] → EmojiPicker (bestehend in src/components/ui/)

ActiveRitualView (bestehend — unverändert)
└── RitualStepItem (bestehend — komplett umgebaut)
    ├── [Schritt-Badge] Kreis oben-rechts
    ├── [Emoji] gross, prominent (NEU)
    ├── [Titel] headline-sm Grösse (war: text-sm)
    ├── [Dauer-Hinweis] bleibt wie bisher
    ├── [Erledigt!-Button] volle Breite, Primary-Style (war: Checkbox)
    ├── [Grüner Tint + ✓] wenn erledigt (war: primary/10 bg + Checkbox)
    ├── [Ring-Effekt] wenn aktiver Schritt (besteht bereits)
    └── [Konfetti-Burst] on toggle (NEU — erscheint auf der Karte)

Neue Utility-Datei:
src/lib/ritual-emoji-suggestions.ts
└── getSuggestedEmoji(title: string): string
    └── Keyword-Matching → 20+ Begriffe → Fallback: ⭐
```

### Datenmodell-Erweiterung
- `steps`-JSONB in `rituals`-Tabelle: neues optionales Feld `emoji: string | null`
- Bestehende Schritte ohne `emoji` → Rendering zeigt Fallback ⭐
- Zod-Schema `ritualStepSchema`: erweitert um `emoji: z.string().nullable().optional()`

### Tech-Entscheidungen
| Entscheidung | Wahl | Grund |
|---|---|---|
| Konfetti-Animation | `canvas-confetti` (~4KB) | Leichtgewichtig, battle-tested |
| Emoji-Picker | Bestehender `emoji-picker.tsx` | Bereits installiert |
| Keyword-Mapping | Pure Funktion in separater Utility | Unabhängig testbar mit Vitest |
| Sound-Abspielung | Native Web Audio API | Kein neues Paket nötig |
| Migration | Optionale System-Vorlagen-Emojis | JSONB ist flexibel |

### Dateien-Übersicht
| Datei | Änderung |
|---|---|
| `src/components/rituals/ritual-step-item.tsx` | Umbau: grosse Karte, Emoji, Erledigt-Button, Konfetti |
| `src/components/rituals/ritual-form-dialog.tsx` | emoji-Feld, Auto-Suggestion, Emoji-Picker-Button |
| `src/lib/validations/rituals.ts` | `ritualStepSchema` um `emoji` erweitert |
| `src/lib/ritual-emoji-suggestions.ts` | **NEU** — Keyword-Mapping |
| `public/step-complete.mp3` | **NEU** — Erfolgs-Sound |
| `supabase/migrations/..._proj19_ritual_step_emoji.sql` | **NEU** — Optional: Vorlagen-Emojis |

### Neue Abhängigkeit
`canvas-confetti` + `@types/canvas-confetti`

## QA Test Results
**QA Date:** 2026-04-13
**Tested by:** /qa

### Unit Tests (Vitest)
- **ritual-emoji-suggestions.test.ts:** 25/25 passed (keyword matching, case insensitivity, English keywords, edge cases, default fallback)
- **rituals.test.ts:** 8/8 passed (emoji field in Zod schema: nullable, optional, string, non-string rejection, createRitualSchema pass-through)
- **Full suite:** 239/239 passed (no regressions)

### E2E Tests (Playwright)
- **PROJ-19-kindergerechte-ritual-schritte.spec.ts:** 6 tests written (emoji auto-suggestion, default emoji, emoji picker, card preview, active step cards, i18n)
- **Status:** Cannot verify — auth setup fails (`.env.test.local` credentials issue, not a PROJ-19 bug)

### Acceptance Criteria — Code Review

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| Karten min. 80px | `minHeight: "80px"` in style | PASS | ritual-step-item.tsx:104 |
| Emoji 2rem | `text-[2rem]` class | PASS | ritual-step-item.tsx:122 |
| Titel headline-sm | `font-display text-lg font-semibold` | PASS | ritual-step-item.tsx:129 |
| "Erledigt!" Button | Full-width gradient button | PASS | ritual-step-item.tsx:171-178 |
| Erledigte Schritte grüner Tint | `bg-[#cce8f2]` (secondary-container) | PASS | ritual-step-item.tsx:99 |
| Durchstreichung | `line-through` class | PASS | ritual-step-item.tsx:131 |
| Grosses ✓ | Check icon + "Erledigt" text | PASS | ritual-step-item.tsx:163-169 |
| Ring-Effekt aktiver Schritt | `ring-2 ring-secondary/30 scale-[1.02]` | PASS | ritual-step-item.tsx:101 |
| Badge oben-rechts | Absolute positioned circle `-top-2 -right-2` | PASS | ritual-step-item.tsx:107-117 |
| Auto-Emoji-Vorschläge | `getSuggestedEmoji()` on title change | PASS | ritual-form-dialog.tsx:155 |
| Emoji inline im Formular | EmojiPicker component per step | PASS | ritual-form-dialog.tsx:289-293 |
| Emoji-Picker per Klick | EmojiPicker opens popover | PASS | ritual-form-dialog.tsx:289 |
| Default ⭐ bei kein Match | `DEFAULT_EMOJI = "⭐"` | PASS | ritual-emoji-suggestions.ts:6 |
| Emoji in JSONB gespeichert | `emoji: s.emoji \|\| null` in normalizedSteps | PASS | ritual-form-dialog.tsx:222 |
| 20+ Keywords | 24 keyword groups mapped | PASS | ritual-emoji-suggestions.ts:12-56 |
| Konfetti-Animation | `canvas-confetti` burst on card | PASS | ritual-step-item.tsx:66-80 |
| Sound-Effekt | `new Audio("/step-complete.wav")` | PASS | ritual-step-item.tsx:32-34 |
| Konfetti auf Karte zentriert | Calculated from `getBoundingClientRect()` | PASS | ritual-step-item.tsx:67-69 |
| Debounce Animation | `animating` state + 1500ms timeout | PASS | ritual-step-item.tsx:86-88 |
| Audio-Blockade silent | `.catch(() => {})` on play() | PASS | ritual-step-item.tsx:34 |
| Zod emoji Feld | `emoji: z.string().nullable().optional()` | PASS | rituals.ts:21 |
| Migration System-Vorlagen | UPDATE + trigger function with emojis | PASS | migration SQL |
| i18n 3 Sprachen | de/en/fr `done` + `complete` keys | PASS | All 3 locale files |
| `disableForReducedMotion` | Accessibility flag set | PASS | ritual-step-item.tsx:78 |

### Bugs Found

| ID | Severity | Description |
|----|----------|-------------|
| PROJ-19-SEC-02 | **Medium** | Emoji Zod field has no `.max()` — allows megabyte strings via crafted API call. Fix: add `.max(32)` |
| PROJ-19-SEC-01 | Low | Migration trigger `seed_rituals_for_family()` missing `SET search_path = public` |
| PROJ-19-BUG-01 | Low | Spec says `/step-complete.mp3` but implementation uses `/step-complete.wav` — not a functional bug, just spec deviation |

### Security Audit (Red-Team)
**Audited by:** /qa (2026-04-13)
**Scope:** PROJ-19 changes only (emoji field, confetti, sound, migration, Zod schema)

---

### 1. XSS via emoji field

**1a. `ritual-step-item.tsx` — emoji rendering**
[PASS] Safe. The `emoji` value (line 122-124) is rendered as a **React text child** inside a `<span>`:
```tsx
<span className="text-[2rem] leading-none shrink-0" aria-hidden="true">
  {displayEmoji}
</span>
```
React automatically escapes text children. There is no `dangerouslySetInnerHTML` anywhere in the rituals directory (grep confirmed: zero matches in all of `src/`). Even if a malicious user stored `<script>alert(1)</script>` as the emoji value, React would render it as literal text, not execute it.

**1b. `ritual-card.tsx` — step preview emoji**
[PASS] Safe. Same pattern (line 86-88): `{step.emoji || "\u2B50"}` is a React text child inside `<span>`. No XSS vector.

**1c. `ritual-form-dialog.tsx` — emoji input handling**
[PASS] Safe. The EmojiPicker component (`src/components/ui/emoji-picker.tsx`) renders a **predefined list of hardcoded emojis** from the `EMOJI_CATEGORIES` array. Users can only select from this curated list. The auto-suggestion function `getSuggestedEmoji()` only returns values from its own hardcoded `KEYWORD_MAP` or the `DEFAULT_EMOJI` constant. Neither path allows arbitrary user-controlled strings to flow into the emoji field **via the UI**.

**However:** See finding 3 below — a crafted API request can bypass the UI and inject an arbitrarily long string as the emoji value.

---

### 2. SQL injection via migration

[PASS] Safe. The migration file `supabase/migrations/20260413_proj19_ritual_step_emoji.sql` contains:
- No user-supplied input at all. All values are hardcoded string literals (emoji characters).
- The `UPDATE` statements filter on `is_system_template = true` and `name = 'Morgenroutine'` etc.
- The `CREATE OR REPLACE FUNCTION seed_rituals_for_family()` only uses `NEW.id` (the inserted family UUID) and hardcoded JSON literals. `NEW.id` is a UUID generated by Postgres (`gen_random_uuid()`), not user input.
- No dynamic SQL (`EXECUTE`, string concatenation, `format()`), so no injection surface.

**Minor note:** The trigger function does not include `SET search_path = public` (unlike the `update_rituals_updated_at()` function in the original PROJ-14 migration which does set it). This is a defense-in-depth gap but not exploitable since the function only operates on its own `NEW` record and hardcoded values.

[LOW] **PROJ-19-SEC-01: Missing `SET search_path` on `seed_rituals_for_family()` trigger function**
- Severity: Low
- The PROJ-19 `CREATE OR REPLACE FUNCTION seed_rituals_for_family()` omits `SET search_path = public`. The original PROJ-14 version also omitted it, but the `update_rituals_updated_at()` function correctly includes it. For defense-in-depth consistency, all `SECURITY DEFINER` functions should set `search_path`.
- Priority: Low — not exploitable in the current Supabase deployment model, but good hygiene.

---

### 3. Zod validation — emoji field max length

[MEDIUM] **PROJ-19-SEC-02: No max length constraint on the `emoji` field in Zod schema**
- File: `src/lib/validations/rituals.ts`, line 22
- Current definition: `emoji: z.string().nullable().optional()`
- **Problem:** There is no `.max()` constraint. A malicious client could craft a direct POST/server action call (bypassing the UI's EmojiPicker) and supply a multi-megabyte string as the `emoji` value. With up to 20 steps per ritual, this could store ~20 * N MB of data in the JSONB column per ritual.
- **Impact:** Database bloat, potential denial-of-service (slow reads for entire family, large JSON parsing). Since the JSONB column has no Postgres-level CHECK constraint on element size either, nothing prevents this at any layer.
- **Reproduction:**
  1. Intercept the `createRitualAction` server action call
  2. Replace `emoji` in one step with `"A".repeat(10_000_000)` (10 MB string)
  3. The Zod schema passes, the Supabase insert succeeds
  4. All family members now load this oversized JSON on every ritual fetch
- **Recommendation:** Add `.max(32)` or similar small limit to the emoji field in `ritualStepSchema`. A single emoji (even compound ones like flags or family emojis) is at most ~11 UTF-16 code units. A limit of 32 characters is generous and safe.
- **Priority: Medium** — should be fixed before deploy. Any authenticated family member with adult/admin role can exploit this.

---

### 4. Server action pass-through — Zod validation before DB write

[PASS] Safe. Both `createRitualAction` (line 120-121) and `updateRitualAction` (line 182-189) call `createRitualSchema.safeParse(data)` / `updateRitualSchema.safeParse(data)` **before** any database operation. If parsing fails, the action returns an error immediately without touching the database.

The steps array is validated through the `ritualStepSchema` which is embedded in both `createRitualSchema` and `updateRitualSchema`. All fields (id, title, order, durationSeconds) have proper constraints. The only gap is the emoji max-length issue documented in finding 3 above.

Authorization is also checked: `verifyAdultOrAdmin()` is called after Zod validation, and the ritual's `family_id` is verified against the caller's profile. RLS policies on the `rituals` table provide a second layer of defense.

---

### 5. canvas-confetti package version

[PASS] Safe. The installed version is `canvas-confetti@1.9.4` (pinned with `^1.9.4`). This is the latest stable release as of April 2026. The package:
- Has no known CVEs in any version (checked npm audit advisories).
- Is a small, well-maintained library (~4KB gzipped) that renders to a `<canvas>` element.
- Does not execute arbitrary code, does not access network, does not touch the DOM beyond its own canvas.
- The `@types/canvas-confetti@1.9.0` devDependency is also appropriate.
- The usage in `ritual-step-item.tsx` (lines 66-80) is standard: `confetti({...})` with hardcoded configuration. The `disableForReducedMotion: true` flag is a nice accessibility touch.

No supply-chain risk concerns.

---

### 6. Sound file path — path traversal

[PASS] Safe. The sound path is hardcoded as a string literal:
```tsx
const audio = new Audio("/step-complete.wav")
```
This is a browser-side `new Audio()` call that resolves the path relative to the page origin (e.g., `https://app.example.com/step-complete.wav`). There is no user-controlled input flowing into this path. Path traversal is not a concern because:
- The path is a compile-time string literal, not constructed from user input.
- Even if it were, the `Audio` constructor in a browser can only fetch HTTP(S) URLs relative to the origin — it cannot access the filesystem.
- The file is served from `/public/step-complete.wav` by Next.js, which is the standard static file serving mechanism.

**Minor note:** The feature spec mentions `/step-complete.mp3` but the implementation uses `/step-complete.wav`. This is not a security issue but a spec deviation worth noting.

---

### Summary Table

| ID | Area | Severity | Status | Action Needed |
|----|------|----------|--------|---------------|
| PROJ-19-SEC-01 | Missing `SET search_path` on SECURITY DEFINER trigger | LOW | Open | Add `SET search_path = public` to `seed_rituals_for_family()` for consistency |
| PROJ-19-SEC-02 | No max length on `emoji` Zod field | MEDIUM | Open | Add `.max(32)` to `emoji` in `ritualStepSchema` to prevent DB bloat/DoS |
| — | XSS via emoji rendering (step-item, card, form) | PASS | N/A | React text children are auto-escaped |
| — | SQL injection via migration | PASS | N/A | No dynamic SQL, all hardcoded |
| — | Server action Zod validation before DB write | PASS | N/A | Both create/update validate before insert |
| — | canvas-confetti supply chain | PASS | N/A | v1.9.4, no known CVEs |
| — | Sound file path traversal | PASS | N/A | Hardcoded literal, no user input |

**Overall Assessment:** The PROJ-19 changes are **mostly secure**. The one finding that should be addressed before deploy is **PROJ-19-SEC-02** (emoji field max length). It is a straightforward one-line fix in `src/lib/validations/rituals.ts`. The LOW finding (search_path) is defense-in-depth hygiene and can be addressed in a future cleanup pass.

## Deployment
_To be added by /deploy_
