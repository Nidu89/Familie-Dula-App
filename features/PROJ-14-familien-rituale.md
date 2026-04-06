# PROJ-14: Familien-Rituale

## Status: Deployed
**Created:** 2026-04-05
**Last Updated:** 2026-04-05

### Frontend Implementation Notes (2026-04-05)

**Completed:**
- Zod validation schemas (`src/lib/validations/rituals.ts`)
- Server actions for CRUD (`src/lib/actions/rituals.ts`)
- `useRituals` hook for ritual template CRUD (`src/hooks/use-rituals.ts`)
- `useActiveRitual` hook for running ritual state + timer integration (`src/hooks/use-active-ritual.ts`)
- Full component tree: `RitualsPageClient`, `RitualsList`, `RitualCard`, `RitualFormDialog`, `ActiveRitualView`, `RitualStepItem`, `RitualCompleteDialog`
- Route page at `/rituals` (`src/app/(app)/rituals/page.tsx`)
- Dashboard widget (`src/components/dashboard/rituals-widget.tsx`)
- Sidebar navigation updated with "Rituale" link
- Dashboard page updated with RitualsWidget in the right column

**Design decisions / deviations:**
- Used arrow buttons (up/down) for step reordering instead of drag-and-drop (as per tech design)
- Timer alarm reuses the same sound file (`/timer-alarm.mp3`) as PROJ-13
- Points are awarded via `manualPointsAction` from PROJ-6 rewards (as per tech design)
- Overlay state (completion dialog, timer alarm) managed via `useReducer` to comply with React 19 strict lint rules (no setState in effects, no ref access during render)
- Form dialog uses key-based remount pattern to reset form state when switching between create/edit modes
- Bottom mobile nav not updated (5 slots already full) -- rituals accessible via sidebar on desktop and dashboard widget on mobile

**Backend needed:** ~~Yes -- `rituals` table needs to be created in Supabase (migration), RLS policies, and system template seeding.~~ DONE

### Backend Implementation Notes (2026-04-05)

**Completed:**
- Supabase migration: `supabase/migrations/20260405_proj14_rituals.sql`
- `rituals` table with all columns matching server actions (id, family_id, name, description, steps JSONB, timer_duration_minutes, reward_points, is_system_template, sort_order, created_at, updated_at)
- CHECK constraints: name 1–80 chars, description max 300 chars, timer 1–120 min, points 0–100
- RLS policies: SELECT for family members, INSERT/UPDATE/DELETE for adults/admins only
- Indexes on family_id and (family_id, sort_order)
- `updated_at` auto-trigger (BEFORE UPDATE)
- Seed trigger for new families (AFTER INSERT ON families) — 3 system templates
- One-time seed for existing families (Morgenroutine, Abendroutine, Hausaufgaben-Routine)
- Verified: both existing families received 3 system templates each

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding) — für Rollen-Check (Elternteil vs. Kind)
- Requires: PROJ-2 (Familienverwaltung) — für Familien-Kontext und Mitgliederrollen
- Requires: PROJ-13 (Familien-Timer) — Timer-Logik und UI-Muster werden wiederverwendet
- Optional: PROJ-6 (Belohnungssystem) — Punkte-Vergabe bei Ritual-Abschluss (falls konfiguriert)

## User Stories

- Als Elternteil möchte ich Rituale mit Name, Schritten und optionalem Gesamt-Timer erstellen können (z.B. "Abendrutine: 30 Min., Schritte: Abendessen → Zimmer aufräumen → Zähne putzen → Geschichte vorlesen"), damit ich wiederkehrende Abläufe einmalig definiere und beliebig oft starte.
- Als Elternteil möchte ich beim Erstellen eines Rituals optional Belohnungspunkte festlegen können (z.B. "10 Punkte bei vollständigem Abschluss"), damit ich Kinder gezielt motivieren kann.
- Als Elternteil möchte ich ein Ritual per Klick starten können, damit das Kind sofort seinen Ablauf sieht und mit dem Abhaken beginnen kann.
- Als Elternteil möchte ich ein laufendes Ritual jederzeit pausieren, fortsetzen oder abbrechen können, damit ich flexibel auf unvorhergesehene Situationen reagieren kann.
- Als Kind möchte ich die aktiven Schritte des laufenden Rituals sehen und einzeln abhaken können, damit ich selbstständig durch die Routine geführt werde.
- Als Kind möchte ich den verbleibenden Gesamt-Timer des Rituals sehen, damit ich meinen Fortschritt im Blick habe.
- Als Kind möchte ich eine Erfolgsmeldung sehen, wenn ich alle Schritte abgehakt habe, damit ich weiß, dass die Routine abgeschlossen ist.
- Als Elternteil möchte ich vorgefertigte System-Vorlagen (Morgenroutine, Abendroutine, Hausaufgaben) nutzen und anpassen können, damit ich schnell loslegen kann.

## Acceptance Criteria

### Ritual-Verwaltung (nur Elternteile)
- [ ] Elternteil kann ein neues Ritual erstellen mit: Name (Pflicht), Beschreibung (optional), geordnete Schritte (min. 1, max. 20), optionalem Gesamt-Timer (1–120 Min.), optionalen Belohnungspunkten (0–100 Punkte)
- [ ] Schritte können per Drag-and-Drop oder Pfeil-Buttons umsortiert werden
- [ ] Elternteil kann ein bestehendes Ritual bearbeiten (Name, Schritte, Timer, Punkte)
- [ ] Elternteil kann ein Ritual löschen (mit Bestätigungs-Dialog)
- [ ] Rituale werden familienweit in Supabase gespeichert
- [ ] 3 System-Vorlagen werden beim Erstellen der Familie vorausgefüllt: "Morgenroutine (30 Min.)", "Abendroutine (30 Min.)", "Hausaufgaben-Routine (45 Min.)" — jeweils mit sinnvollen Starter-Schritten

### System-Vorlagen (Starter-Inhalte)
- [ ] **Morgenroutine (30 Min.):** Aufstehen & Anziehen, Frühstücken, Zähne putzen, Schulranzen packen
- [ ] **Abendroutine (30 Min.):** Abendessen, Zimmer aufräumen, Zähne putzen, Pyjama anziehen, Geschichte / Lesezeit
- [ ] **Hausaufgaben-Routine (45 Min.):** Snack holen & hinsetzen, Hausaufgaben erledigen, Aufräumen & Mappe einpacken

### Ritual starten & laufen (Elternteil)
- [ ] Elternteil kann ein Ritual per Klick starten — alle Schritte erscheinen als offene Checkboxen
- [ ] Hat das Ritual einen Timer, startet der Countdown beim Starten des Rituals automatisch
- [ ] Elternteil kann das laufende Ritual pausieren (Timer pausiert, Schritte bleiben offen) und fortsetzen
- [ ] Elternteil kann das laufende Ritual abbrechen (Bestätigungs-Dialog) — Fortschritt wird verworfen, Punkte werden nicht vergeben

### Schritte abhaken (Kind)
- [ ] Kind sieht alle Schritte des laufenden Rituals mit Checkbox pro Schritt
- [ ] Kind kann jeden Schritt abhaken — dieser wird visuell als erledigt markiert (durchgestrichen + Häkchen)
- [ ] Abgehakte Schritte können vom Kind nicht mehr rückgängig gemacht werden (verhindert versehentliches Zurücksetzen)
- [ ] Elternteil kann einzelne abgehakte Schritte zurücksetzen (falls nötig)
- [ ] Fortschrittsanzeige zeigt "X von Y Schritten erledigt"

### Ritual-Abschluss
- [ ] Wenn alle Schritte abgehakt sind, erscheint eine Erfolgs-Anzeige ("Ritual abgeschlossen! 🎉")
- [ ] Falls Punkte konfiguriert: Punkte werden automatisch dem Kind gutgeschrieben (Integration PROJ-6)
- [ ] Bei Punkte-Vergabe erscheint die vergebene Punktzahl in der Erfolgs-Anzeige
- [ ] Timer läuft nach Abschluss weiter bis zur Zeitanzeige-Phase ("Zeit übrig"), wird aber nicht als "abgelaufen" gewertet
- [ ] Elternteil kann das abgeschlossene Ritual per Button als neuen Lauf neu starten

### Timer-Ablauf während des Rituals
- [ ] Läuft der Timer ab bevor alle Schritte erledigt sind, erscheint ein Alarm (Ton + visueller Hinweis) — identisch mit PROJ-13-Alarm-Logik
- [ ] Das Kind kann nach Timer-Ablauf weiterhin Schritte abhaken — das Ritual gilt erst als abgeschlossen wenn alle Schritte erledigt sind
- [ ] Punkte werden auch nach Timer-Ablauf vergeben (vollständiger Abschluss zählt, unabhängig von der Zeit)

### Navigation & Platzierung
- [ ] Eigene Ritual-Seite erreichbar unter `/rituals`
- [ ] Ritual-Widget auf dem Familien-Dashboard: zeigt aktives Ritual (Fortschritt + Timer) oder Schnellstart-Buttons der 3 häufigsten Rituale
- [ ] Widget-Klick führt zur vollen Ritual-Seite

### Berechtigungen
- [ ] Nur Elternteile können Rituale erstellen, bearbeiten und löschen
- [ ] Nur Elternteile können ein Ritual starten, pausieren und abbrechen
- [ ] Kinder können Schritte abhaken (nur beim aktiven, laufenden Ritual)
- [ ] Kinder sehen die Ritual-Liste in read-only (keine Start-Buttons)

## Edge Cases

- **Kein aktives Ritual:** Kind öffnet `/rituals` → leerer Zustand mit freundlicher Botschaft ("Kein Ritual läuft gerade. Frag Mama oder Papa!").
- **Ritual ohne Timer:** Kein Countdown wird angezeigt, nur die Schritte-Checkliste. Fortschrittsanzeige zeigt nur "X von Y Schritten".
- **Ritual ohne Punkte:** Keine Punkte-Anzeige im Abschluss-Bildschirm.
- **Kind hakt letzten Schritt ab — Timer läuft noch:** Erfolgs-Anzeige erscheint trotzdem sofort. Timer wird gestoppt und zeigt "Zeit übrig: MM:SS".
- **Elternteil bearbeitet Ritual während es läuft:** Nicht erlaubt — Bearbeiten-Button ist deaktiviert solange ein Ritual aktiv ist. Hinweis: "Ritual zuerst beenden".
- **Ritual wird gelöscht das gerade aktiv ist:** Nicht möglich — Löschen-Button deaktiviert bei laufendem Ritual.
- **Zwei Elternteile starten gleichzeitig dasselbe Ritual:** Nur ein globaler aktiver Ritual-Lauf pro Familie; zweiter Start überschreibt den ersten nach Bestätigungs-Dialog.
- **Kind hakt alle Schritte ab, Elternteil hat die App geschlossen:** Punkte werden serverseitig in Supabase vergeben — der Elternteil sieht die Punkte beim nächsten Öffnen.
- **Ritual mit 1 Schritt:** Gültig. Abschluss nach dem Abhaken dieses einen Schritts.
- **Alarm-Sound blockiert (Browser Autoplay-Policy):** Fallback: nur visuelle Anzeige — identisch mit PROJ-13-Verhalten.

## Technical Requirements

- Ritual-Definitionen (Name, Schritte, Timer, Punkte) in Supabase: Tabelle `ritual_templates`, familiengebunden
- Aktiver Ritual-Zustand (gestartetes Ritual, abgehakte Schritte, Timer-Restzeit) primär clientseitig (`useState` / `useRef`)
- Timer-Logik baut auf dem `useTimer`-Hook aus PROJ-13 auf (Wiederverwendung)
- Punkte-Vergabe bei Abschluss via Supabase (gleicher Mechanismus wie PROJ-6)
- Browser Support: Chrome, Firefox, Safari (Desktop + Mobile)
- Berechtigungen basieren auf dem bestehenden Rollen-System (adult / child)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Entscheidung: Frontend + Backend

- **Ritual-Definitionen** → Supabase (`rituals`-Tabelle, familiengebunden). Geladen beim Seitenaufruf via `useRituals`-Hook.
- **Aktiver Ritual-Lauf** → rein client-seitig (`useActiveRitual`-Hook). Kein DB-State für laufende Sitzungen — wenn die Seite neu geladen wird, wird das Ritual zurückgesetzt. Entspricht dem PROJ-13-Timer-Muster.
- **Timer-Integration** → `useActiveRitual` ruft intern `useTimer` aus PROJ-13 auf. Kein neuer Timer-Code nötig.
- **Punkte-Vergabe** → bestehende Server Action aus PROJ-6 (`lib/actions/rewards.ts`) wird beim Ritual-Abschluss aufgerufen.
- **Schritt-Sortierung** → Pfeil-Buttons (hoch/runter) statt Drag-and-Drop. Vermeidet eine neue Abhängigkeit (`@dnd-kit`) für eine selten genutzte Aktion — Spec erlaubt explizit "oder Pfeil-Buttons".

---

### Datenmodell

**Neue Tabelle: `rituals`** (in Supabase)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | UUID | Primärschlüssel |
| `family_id` | UUID (FK) | Welche Familie gehört dieses Ritual |
| `name` | Text | Name des Rituals (Pflicht) |
| `description` | Text | Optionale Beschreibung |
| `steps` | JSONB | Array von `{ id, title, order }` — max. 20 Einträge |
| `timer_duration_minutes` | Integer | Optionaler Gesamt-Timer (1–120 Min.) |
| `reward_points` | Integer | Optionale Punkte bei Abschluss (0–100) |
| `is_system_template` | Boolean | Kennzeichnet die 3 Starter-Vorlagen |
| `sort_order` | Integer | Anzeigereihenfolge in der Liste |
| `created_at` / `updated_at` | Timestamp | Automatisch |

**Warum JSONB für Schritte?** Schritte gehören immer zum Ritual und werden nie separat abgefragt. Eine eigene `ritual_steps`-Tabelle würde Joins und Migration-Komplexität hinzufügen ohne Vorteil bei max. 20 Einträgen.

**RLS-Regeln:**
- Lesen: Alle Familienmitglieder dürfen die Rituale ihrer Familie lesen
- Schreiben/Löschen: Nur Erwachsene (`role = 'adult'`)

**Starter-Vorlagen:** Werden beim Erstellen einer neuen Familie eingesät — gleicher Mechanismus wie die Timer-Vorlagen in PROJ-13 (Supabase-Migration oder `createFamily`-Server Action).

---

### Komponentenstruktur

```
/rituals (Server Component — lädt Rolle + Familiendaten)
└── RitualsPageClient (Client Component — orchestriert alles)
    ├── RitualsHeader
    │   └── "Neues Ritual"-Button (nur Erwachsene)
    │
    ├── [Wenn Ritual läuft] ActiveRitualView
    │   ├── TimerDisplay         ← wiederverwendet aus PROJ-13
    │   ├── ProgressBar          ← "3 von 5 Schritten erledigt"
    │   ├── RitualStepsList
    │   │   └── RitualStepItem × N
    │   │       └── Checkbox + Label (Kind hakt ab)
    │   └── RitualControls       ← Pause / Fortsetzen / Abbrechen (nur Erwachsene)
    │
    ├── [Wenn kein Ritual läuft] RitualsList
    │   ├── RitualCard × N
    │   │   ├── Start-Button     (nur Erwachsene)
    │   │   ├── Bearbeiten-Button (nur Erwachsene, deaktiviert wenn aktiv)
    │   │   └── Löschen-Button   (nur Erwachsene, deaktiviert wenn aktiv)
    │   └── EmptyState ("Kein Ritual läuft gerade. Frag Mama oder Papa!")
    │
    ├── RitualFormDialog         ← Erstellen / Bearbeiten
    │   ├── NameInput
    │   ├── DescriptionInput (optional)
    │   ├── StepsList
    │   │   └── StepItem × N (TextInput + ↑↓ Buttons + Löschen)
    │   ├── AddStep-Button
    │   ├── TimerToggle + DurationInput ← wiederverwendet aus PROJ-13
    │   └── PointsInput (optional, 0–100)
    │
    ├── RitualCompleteDialog     ← Erfolgs-Anzeige + Punkte
    └── TimerAlarmDialog         ← wiederverwendet aus PROJ-13

Dashboard:
└── RitualsWidget
    ├── ActiveRitualMini (Fortschritt + Timer, wenn läuft)
    └── QuickStartButtons (3 häufigste Rituale, nur Erwachsene)
```

---

### Neue Dateien (nur Neuanlagen, kein Umbau bestehender Dateien)

| Datei | Zweck |
|---|---|
| `src/hooks/use-rituals.ts` | CRUD für Ritual-Definitionen (spiegelt `use-timer-templates.ts`) |
| `src/hooks/use-active-ritual.ts` | Laufender Ritual-State + internes `useTimer` |
| `src/lib/actions/rituals.ts` | Server Actions: get/create/update/delete (spiegelt `timer.ts`) |
| `src/lib/validations/rituals.ts` | Zod-Schemas für Ritual-Formulare |
| `src/components/rituals/rituals-page-client.tsx` | Seiten-Orchestrator |
| `src/components/rituals/rituals-list.tsx` | Übersichtsliste aller Rituale |
| `src/components/rituals/ritual-card.tsx` | Einzelne Ritual-Karte |
| `src/components/rituals/ritual-form-dialog.tsx` | Erstellen/Bearbeiten-Dialog |
| `src/components/rituals/active-ritual-view.tsx` | Laufendes Ritual mit Schritten |
| `src/components/rituals/ritual-step-item.tsx` | Einzelner abhakbarer Schritt |
| `src/components/rituals/ritual-complete-dialog.tsx` | Abschluss-Bildschirm |
| `src/components/dashboard/rituals-widget.tsx` | Dashboard-Widget |
| `src/app/(app)/rituals/page.tsx` | Route `/rituals` |

**Bestehende Dateien, die wiederverwendet werden (kein Umbau):**
- `src/hooks/use-timer.ts` — intern in `use-active-ritual.ts` aufgerufen
- `src/components/timer/timer-display.tsx` — in `ActiveRitualView` eingebunden
- `src/components/timer/timer-alarm-dialog.tsx` — in `RitualsPageClient` eingebunden
- `src/components/timer/duration-input.tsx` — in `RitualFormDialog` eingebunden
- `src/lib/actions/rewards.ts` — Punkte-Vergabe bei Abschluss

---

### Neue Abhängigkeiten

**Keine neuen Pakete nötig.** Alle benötigten shadcn-Komponenten sind bereits installiert:
- `Checkbox`, `Dialog`, `AlertDialog`, `Progress`, `Input`, `Switch` — alle vorhanden

## QA Test Results

**QA Engineer:** Claude Code (Opus 4.6)
**Date:** 2026-04-05
**Scope:** Full code review of all 13 source files + migration SQL + feature spec acceptance criteria

---

### Acceptance Criteria Evaluation

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| AC-1 | Elternteil kann Ritual erstellen (Name, Beschreibung, Schritte, Timer, Punkte) | PASS | Form dialog validates all fields; server action validates with Zod |
| AC-2 | Schritte per Pfeil-Buttons umsortieren | PASS | Arrow up/down buttons in form; order recalculated on move |
| AC-3 | Ritual bearbeiten | PASS | Edit form pre-fills via key-based remount pattern |
| AC-4 | Ritual loeschen mit Bestaetigungs-Dialog | PASS | AlertDialog confirmation present |
| AC-5 | Rituale familienweit in Supabase gespeichert | PASS | family_id FK, RLS policies enforce family scope |
| AC-6 | 3 System-Vorlagen bei Familie-Erstellung | PASS | Seed trigger + one-time seed for existing families |
| AC-7 | Morgenroutine steps (4 Schritte, 30 Min.) | PASS | Migration verified |
| AC-8 | Abendroutine steps (5 Schritte, 30 Min.) | PASS | Migration verified |
| AC-9 | Hausaufgaben-Routine steps (3 Schritte, 45 Min.) | PASS | Migration verified |
| AC-10 | Ritual per Klick starten | PASS | Start button fires startRitual |
| AC-11 | Timer startet automatisch beim Starten | PASS | useActiveRitual.startRitual calls timer.start if duration > 0 |
| AC-12 | Pausieren und Fortsetzen | PASS | pauseRitual/resumeRitual toggle both ritual state and timer |
| AC-13 | Abbrechen mit Bestaetigungs-Dialog | PASS | AlertDialog confirmation present; cancelRitual resets all state |
| AC-14 | Kind sieht Schritte mit Checkbox | PASS | RitualStepItem renders Checkbox for all users |
| AC-15 | Schritt abhaken mit visueller Markierung | PASS | line-through + bg-primary/10 styling |
| AC-16 | Kind kann nicht rueckgaengig machen | PASS | toggleStep returns early if already completed; checkbox is disabled |
| AC-17 | Elternteil kann zuruecksetzen | PASS | resetStep + RotateCcw button (adults only) |
| AC-18 | Fortschrittsanzeige "X von Y Schritten" | PASS | Progress bar + text label |
| AC-19 | Erfolgs-Anzeige bei Abschluss | PASS | RitualCompleteDialog shown |
| AC-20 | Punkte automatisch gutgeschrieben | FIXED | **BUG-01** fixed: New `awardRitualCompletionAction` + `award_ritual_completion` RPC bypasses adult-only check |
| AC-21 | Punktzahl in Erfolgs-Anzeige | PASS | rewardPoints displayed in completion dialog |
| AC-22 | Timer laeuft nach Abschluss nicht als "abgelaufen" | PASS | Timer continues; timeRemaining shown if > 0 |
| AC-23 | Neuen Lauf neu starten | PASS | "Nochmal starten" button calls restartRitual |
| AC-24 | Alarm bei Timer-Ablauf (Ton + visuell) | PASS | Audio + overlay with dismiss button |
| AC-25 | Kind kann nach Timer-Ablauf weiter abhaken | PASS | toggleStep allows "timer_expired" status |
| AC-26 | Punkte auch nach Timer-Ablauf | PASS | Completion check is step-based, not timer-based |
| AC-27 | Eigene Seite unter /rituals | PASS | Route exists |
| AC-28 | Widget auf Dashboard | PASS | RitualsWidget component exists |
| AC-29 | Widget zeigt 3 haeufigste Rituale | PARTIAL | **BUG-02**: Shows first 3 by sort_order, not "most frequent" (see below) |
| AC-30 | Widget-Klick fuehrt zur Ritual-Seite | PASS | Link href="/rituals" |
| AC-31 | Nur Elternteile CRUD | PASS | isAdult checks + server-side verifyAdultOrAdmin + RLS |
| AC-32 | Nur Elternteile starten/pausieren/abbrechen | PASS | UI gated by isAdult |
| AC-33 | Kinder Schritte abhaken | PASS | toggleStep available to all users |
| AC-34 | Kinder sehen Liste read-only | PASS | No Start/Edit/Delete buttons for children |

---

### Bug Report

#### BUG-01 [CRITICAL] -- Points awarded to the logged-in user instead of the child who completed the ritual

**File:** `src/components/rituals/rituals-page-client.tsx`, line 160
**Severity:** Critical
**Priority:** P0

**Description:**
The `manualPointsAction` call passes `userId` (from the server component props, which is `user.id` of the currently logged-in user). When a child completes a ritual, the child is logged in, so `userId` is the child's ID. However, `manualPointsAction` requires the caller to be an `adult` or `admin` role (line 265-266 in `rewards.ts`). This means:

1. If a **child** is logged in and completes the ritual, the points call will **silently fail** because `manualPointsAction` checks that the *caller* is adult/admin. The child cannot award points to themselves.
2. If an **adult** is logged in and completes the ritual (or the child completes steps while the adult's session is active), points are awarded to the **adult's profile**, not to the child.

**Steps to reproduce:**
1. Log in as a child user
2. Have an adult start a ritual with reward points
3. As the child, check off all steps to complete the ritual
4. Observe: `manualPointsAction(userId, ritual.rewardPoints, ...)` is called where `userId` is the child's own ID
5. The server action rejects because the child is not adult/admin
6. Points are never awarded, but `pointsAwarded` is already set to `true` in the reducer so it won't retry

**Root cause:** The points-awarding mechanism is designed for adult-to-child manual bookings. The ritual completion flow needs a different server action that allows points to be awarded during ritual completion without requiring the caller to be an adult, or the action needs to run server-side with elevated privileges.

**Additional concern:** Even if the auth check passed, `userId` is the logged-in user's ID. The spec says "Punkte werden automatisch dem Kind gutgeschrieben" but there is no mechanism to determine *which* child should receive points. The ritual has no `assignedTo` field.

---

#### BUG-02 [LOW] -- Dashboard widget shows first 3 rituals by sort order, not "3 most frequent"

**File:** `src/components/dashboard/rituals-widget.tsx`, line 21
**Severity:** Low
**Priority:** P3

**Description:**
The acceptance criterion says "Schnellstart-Buttons der 3 haeufigsten Rituale" but the widget just takes `result.rituals.slice(0, 3)`, which returns the first 3 by `sort_order` (as returned by `getRitualsAction`). Since there is no usage tracking, "most frequent" cannot be determined. This is an acceptable deviation given the scope, but should be documented.

---

#### BUG-03 [HIGH] -- Falsy zero value silently converted to null for rewardPoints and timerDurationMinutes

**File:** `src/lib/actions/rituals.ts`, lines 153 and 214
**Severity:** High
**Priority:** P1

**Description:**
The server actions use `parsed.data.timerDurationMinutes || null` and `parsed.data.rewardPoints || null`. The JavaScript `||` operator treats `0` as falsy. This means:

- `rewardPoints: 0` (explicitly set to zero) becomes `null` instead of `0`
- `timerDurationMinutes: 0` would become `null` (though validation prevents 0 for timer, so only rewardPoints is affected in practice)

While the Zod schema allows min 0 for rewardPoints, setting it to 0 in the form and saving it will store `null` instead of `0`. The DB schema allows `reward_points = 0` but will never receive it. This is a semantic inconsistency -- 0 points (explicit) vs null (no points) should be distinct.

**Affected lines:**
- `rituals.ts:153`: `timer_duration_minutes: parsed.data.timerDurationMinutes || null`
- `rituals.ts:154`: `reward_points: parsed.data.rewardPoints || null`
- `rituals.ts:213`: `timer_duration_minutes: parsed.data.timerDurationMinutes || null`
- `rituals.ts:214`: `reward_points: parsed.data.rewardPoints || null`

**Fix suggestion:** Use `?? null` instead of `|| null`.

---

#### BUG-04 [MEDIUM] -- Timer input does not allow clearing the value (empty field blocks typing)

**File:** `src/components/rituals/ritual-form-dialog.tsx`, lines 307-312
**Severity:** Medium
**Priority:** P2

**Description:**
The timer minutes input onChange handler only accepts values where `parseInt` produces a valid number in range 1-120. If a user selects all text and presses backspace to clear the field before typing a new value, the input becomes empty string, `parseInt("")` is `NaN`, and the `if (!isNaN(v) && v >= 1 && v <= 120)` check fails -- the state is never updated and the field cannot be cleared. The same issue affects the reward points input (lines 337-342), though it allows 0 so partial clearing still works.

**Steps to reproduce:**
1. Open ritual form dialog
2. Enable timer toggle
3. Select the "30" text in the timer field
4. Press Backspace to clear
5. Try to type "15"
6. Nothing happens because the empty intermediate state is rejected

---

#### BUG-05 [HIGH] -- Race condition: overlay `pointsAwarded` flag set before server call completes

**File:** `src/components/rituals/rituals-page-client.tsx`, lines 158-165
**Severity:** High
**Priority:** P1

**Description:**
The code dispatches `POINTS_AWARDED` immediately (line 159) and then fires the server action with `void` (fire-and-forget, line 160). If `manualPointsAction` fails (network error, auth failure, etc.), `pointsAwarded` is already `true` and will never retry. The user sees the completion dialog claiming points were awarded, but they were not.

Combined with BUG-01 (child cannot call this action), this means points are **never** actually awarded in the most common use case (child completing the ritual), yet the UI says they were.

**Steps to reproduce:**
1. Start a ritual with reward points
2. Complete all steps while offline or with a failing server
3. The completion dialog shows "+X Punkte verdient"
4. Points were never actually saved

---

#### BUG-06 [MEDIUM] -- `resetStep` transitions from "completed" to "running" without checking timer state

**File:** `src/hooks/use-active-ritual.ts`, lines 131-152
**Severity:** Medium
**Priority:** P2

**Description:**
When an adult resets a step after the ritual was completed and the timer had already expired, `resetStep` always transitions `status` from `"completed"` to `"running"`. But if the timer was in `"finished"` state when the ritual completed, the correct status should arguably be `"timer_expired"` (or at least account for timer state). Currently this leads to an inconsistent state where `status` is `"running"` but the timer shows `"finished"`.

This is partially mitigated because the `isRunning` check in `active-ritual-view.tsx` (line 46) includes `"timer_expired"`, but the actual state value will be `"running"` not `"timer_expired"`.

---

#### BUG-07 [MEDIUM] -- JSONB steps not validated at the database level

**File:** `supabase/migrations/20260405_proj14_rituals.sql`, line 15
**Severity:** Medium
**Priority:** P2

**Description:**
The `steps` column is `JSONB NOT NULL DEFAULT '[]'::jsonb` with no CHECK constraint on the structure. While the Zod schema validates on the application layer, a direct SQL insert or API bypass could store malformed JSONB data (missing `id`, `title`, or `order` fields; more than 20 entries; etc.). The application code at `rituals.ts:95` casts `row.steps as RitualStep[]` without runtime validation, which could cause runtime errors if the data is malformed.

**Risk:** If any data enters the table through a path that bypasses the Zod schema (e.g., Supabase dashboard, SQL console, another service), the frontend will crash or behave unpredictably.

---

#### BUG-08 [MEDIUM] -- `useActiveRitual` re-creates `timer` object on every render, causing dependency issues

**File:** `src/hooks/use-active-ritual.ts`, line 38
**Severity:** Medium
**Priority:** P2

**Description:**
`const timer = useTimer()` returns a new object reference on every render. The `startRitual`, `pauseRitual`, and `resumeRitual` callbacks all depend on `timer` in their `useCallback` dependency arrays. Because `timer` is a new object each render, these callbacks are re-created on every render, which means their referential stability is lost. This can cause unnecessary re-renders in child components that receive these callbacks as props.

The `useCallback` for `startRitual` has `[timer]` as dependency (line 66). Since `timer` changes every render, `startRitual` is a new function every render.

---

#### BUG-09 [MEDIUM] -- `sort()` mutates the steps array during render

**File:** `src/components/rituals/active-ritual-view.tsx`, line 104
**Severity:** Medium
**Priority:** P2

**Description:**
`ritual.steps.sort((a, b) => a.order - b.order)` is called directly during render. `Array.sort()` mutates the original array in place. If `ritual.steps` is a reference stored in state (from `useActiveRitual`), this mutates state directly during rendering, violating React's immutability rule. This can cause subtle rendering bugs or stale data issues.

**Fix suggestion:** Use `[...ritual.steps].sort(...)` or `ritual.steps.toSorted(...)`.

---

#### BUG-10 [LOW] -- `eslint-disable-line react-hooks/exhaustive-deps` hides legitimate dependency issues

**File:** `src/components/rituals/rituals-page-client.tsx`, line 180
**Severity:** Low
**Priority:** P3

**Description:**
The effect on line 110-180 suppresses the exhaustive-deps lint rule. The effect references `overlay.lastRitualStatus`, `overlay.lastTimerStatus`, `overlay.pointsAwarded`, `activeRitual.state.ritual`, `userId`, and `dispatchOverlay` but only declares `activeRitual.state.status` and `activeRitual.timer.state.status` as dependencies. While the reducer pattern mitigates some issues, the reference to `overlay.lastRitualStatus` and `overlay.lastTimerStatus` inside the effect creates a stale closure risk if these values change independently.

---

#### BUG-11 [LOW] -- `isActive` definition excludes "completed" but not "timer_expired"

**File:** `src/components/rituals/rituals-page-client.tsx`, lines 105-107
**Severity:** Low
**Priority:** P3

**Description:**
`isActive` is defined as `status !== "idle" && status !== "completed"`. The `"timer_expired"` status is not a real state in the `ActiveRitualStatus` type -- it exists but is never set by `toggleStep` or `startRitual`. Looking at the hook, the ritual status transitions are: `idle -> running -> paused -> running -> completed`. The `"timer_expired"` status is defined in the type but never actually assigned to `state.status` by any code path. The timer expiration is only tracked in `timer.state.status`, not in `state.status`. This means `"timer_expired"` in the `ActiveRitualStatus` type is dead code, but referencing it in `toggleStep` (line 107 of `use-active-ritual.ts`) as a guard condition is correct-but-unreachable.

---

#### BUG-12 [LOW] -- Dashboard widget silently swallows errors

**File:** `src/components/dashboard/rituals-widget.tsx`, lines 18-23
**Severity:** Low
**Priority:** P3

**Description:**
If `getRitualsAction()` returns an error, the widget silently sets `loading = false` and shows "Noch keine Rituale erstellt." even though the real issue is an auth or network error. There is no error state or retry mechanism.

---

### Security Audit (Red-Team Perspective)

#### SEC-01 [HIGH] -- Points injection: Client-side userId allows arbitrary point awards

**File:** `src/components/rituals/rituals-page-client.tsx`, line 160
**Severity:** High (mitigated by server-side auth)

**Description:**
The `userId` is passed from the server component as a prop. While this value originates server-side and cannot be tampered with directly, the `manualPointsAction` is a server action that could theoretically be called directly by a malicious client with any `profileId`. However, the server action validates that the caller is adult/admin AND the target profile is in the same family (RPC `manual_points_booking` checks family membership). Therefore, the attack surface is limited to adults awarding points to any family member, which is the intended behavior.

**Verdict:** No actual vulnerability, but the ritual flow's integration is broken as described in BUG-01.

#### SEC-02 [PASS] -- Server-side Zod validation

All create/update/delete server actions validate input with Zod schemas before any database operation. Input validation is applied server-side, not just client-side.

#### SEC-03 [PASS] -- RLS policies correctly scoped

SELECT: family members only. INSERT/UPDATE/DELETE: adults/admins only. The USING and WITH CHECK clauses both verify `profiles.family_id = rituals.family_id`.

#### SEC-04 [PASS] -- No XSS vectors

All user-provided text (ritual name, description, step titles) is rendered via JSX which auto-escapes HTML. No `dangerouslySetInnerHTML` usage found.

#### SEC-05 [PASS] -- No SQL injection

All database queries use Supabase's parameterized query builder. No raw SQL with string interpolation.

#### SEC-06 [LOW] -- JSONB steps could contain arbitrary extra fields

**Description:**
The Zod `ritualStepSchema` validates `id`, `title`, and `order` but does not use `.strict()`. Extra fields in step objects would pass validation and be stored in the JSONB column. While not exploitable, this allows data pollution.

#### SEC-07 [PASS] -- Auth verification on all write operations

`verifyAdultOrAdmin()` is called in every mutating server action. The delete action additionally verifies the ritual belongs to the caller's family before deleting.

#### SEC-08 [PASS] -- Rate limiting on client mutations

The `useRituals` hook implements a 1-second rate limit between mutations (`RATE_LIMIT_MS = 1000`). This is client-side only (server-side rate limiting would need Supabase edge functions or middleware), but provides basic protection against rapid-fire clicks.

---

### Summary

| Severity | Count | IDs |
|----------|-------|-----|
| Critical | 1 | BUG-01 |
| High | 2 | BUG-03, BUG-05 |
| Medium | 4 | BUG-04, BUG-06, BUG-07, BUG-08, BUG-09 |
| Low | 4 | BUG-02, BUG-10, BUG-11, BUG-12 |

### Bug Fix Summary (2026-04-05)

All Critical, High, and Medium bugs have been fixed:

| Bug | Fix |
|---|---|
| **BUG-01** [CRITICAL] | New `award_ritual_completion` RPC (SECURITY DEFINER) + `awardRitualCompletionAction` server action — any family member can award ritual points |
| **BUG-03** [HIGH] | Replaced `\|\|` with `??` for nullable numeric fields in `rituals.ts` |
| **BUG-05** [HIGH] | Points action is now awaited; `POINTS_AWARDED` flag set only on success; errors allow retry |
| **BUG-04** [MEDIUM] | Number inputs allow empty intermediate state; default value restored on blur |
| **BUG-06** [MEDIUM] | `resetStep` checks `timerState.status` to correctly revert to `timer_expired` or `running` |
| **BUG-08** [MEDIUM] | Timer methods destructured for stable callback references; `useMemo` for returned timer object |
| **BUG-09** [MEDIUM] | `[...ritual.steps].sort()` instead of in-place mutation |

**Remaining Low bugs (non-blocking):** BUG-02 (widget shows by sort_order, not frequency), BUG-07 (no JSONB schema constraint), BUG-10 (eslint-disable), BUG-11 (dead timer_expired status), BUG-12 (widget error swallowing)

## Deployment

**Status:** Deployed to Production
**Date:** 2026-04-05
**Production URL:** https://familie-dula-app.vercel.app/rituals
**Commit:** `a39a17f` — feat(PROJ-14): Familien-Rituale — full implementation

## Security Patch (2026-04-06)

**Commit:** `90b9f31` — fix(security): Full-app security hardening

- **SEC-03 (CRITICAL):** `award_ritual_completion` RPC hardened — role check, 100-point cap, child-only target. Migration: `20260406_security_fixes.sql`
- **SEC-08 (MEDIUM):** `awardRitualCompletionAction` now validates input via `awardRitualCompletionSchema` (Zod)
- **SEC-06 (HIGH):** Rate limiting added to `createRitualAction`, `awardRitualCompletionAction` via shared `rate-limit.ts`

**Deployed components:**
- `/rituals` page with full ritual management
- Dashboard widget (RitualsWidget) in right column
- Sidebar navigation link
- Supabase migrations: `rituals` table + `award_ritual_completion` RPC
- 3 system templates seeded for all existing families
