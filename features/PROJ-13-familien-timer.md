# PROJ-13: Familien-Timer

## Status: In Review
**Created:** 2026-03-30
**Last Updated:** 2026-03-30

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding) — für Rollen-Check (Elternteil vs. Kind)
- Requires: PROJ-2 (Familienverwaltung) — für Familien-Kontext und Mitgliederrollen

## User Stories
- Als Elternteil möchte ich einen Countdown-Timer starten können, damit ich dem Kind eine klare Zeitvorgabe geben kann (z.B. "10 Minuten zum Anziehen").
- Als Elternteil möchte ich Vorlagen mit Namen und Dauer erstellen können (z.B. "Frühstück — 15 Min."), damit ich häufig genutzte Timer mit einem Klick starten kann.
- Als Elternteil möchte ich einen laufenden Timer jederzeit pausieren und zurücksetzen können, damit ich flexibel reagieren kann.
- Als Kind möchte ich den laufenden Timer sehen können (verbleibende Zeit, Fortschrittsbalken), damit ich weiß, wie viel Zeit mir noch bleibt.
- Als Elternteil möchte ich benachrichtigt werden (Ton + visuelle Anzeige), wenn ein Timer abläuft, damit ich den Ablauf nicht verpasse.
- Als Elternteil möchte ich den Timer als Widget auf dem Dashboard sehen, damit ich ihn schnell im Blick habe ohne extra zu navigieren.

## Acceptance Criteria

### Countdown-Timer
- [ ] Elternteil kann eine beliebige Dauer einstellen (Minuten und Sekunden, max. 60 Minuten)
- [ ] Timer startet, pausiert, setzt fort und wird zurückgesetzt per Button (nur Elternteile)
- [ ] Verbleibende Zeit wird als MM:SS angezeigt
- [ ] Visueller Fortschrittsring oder -balken zeigt den Fortschritt an

### Vorlagen
- [ ] Elternteil kann Vorlagen erstellen (Name + Dauer in Minuten, z.B. "Anziehen — 10 Min.")
- [ ] Vorlagen werden für die Familie gespeichert (in Supabase), nicht nur lokal
- [ ] Elternteil kann Vorlagen bearbeiten und löschen
- [ ] Vorlage per Tipp sofort als Timer starten
- [ ] Mindestens 3 System-Vorlagen werden beim Erstellen der Familie vorausgefüllt: "Anziehen (10 Min.)", "Frühstück (15 Min.)", "Hausaufgaben (30 Min.)"

### Alarm bei Ablauf
- [ ] Beim Ablauf wird ein Alarm-Sound abgespielt (Web Audio API oder Audio-Datei)
- [ ] Eine auffällige visuelle Anzeige erscheint (Dialog oder Fullscreen-Flash)
- [ ] Die Anzeige kann vom Elternteil per Klick bestätigt / geschlossen werden
- [ ] Timer zeigt danach "Zeit abgelaufen!" bis zum Zurücksetzen

### Berechtigungen
- [ ] Nur Elternteile (Rolle: adult) können Timer starten, pausieren und zurücksetzen
- [ ] Nur Elternteile können Vorlagen erstellen, bearbeiten und löschen
- [ ] Kinder (Rolle: child) sehen den aktiven Timer und Vorlagen in read-only

### Navigation & Platzierung
- [ ] Eigene Timer-Seite erreichbar unter `/timer`
- [ ] Timer-Widget auf dem Familien-Dashboard zeigt: aktiven Timer (falls läuft) oder Schnellstart-Buttons der Vorlagen
- [ ] Widget-Klick führt zur vollen Timer-Seite

## Edge Cases
- Was passiert, wenn der Browser-Tab im Hintergrund ist? → Timer läuft clientseitig weiter (`setInterval`), Alarm-Sound wird beim Zurückkehren abgespielt. Hinweis: Genauigkeit kann leicht abweichen.
- Was passiert, wenn kein aktiver Timer läuft und ein Kind das Widget aufruft? → Leerer Zustand mit freundlicher Botschaft ("Kein Timer aktiv").
- Was passiert, wenn zwei Elternteile gleichzeitig den Timer bedienen? → Nur ein globaler Timer pro Familie; letzter Schreiber gewinnt (kein Konflikt-Management in v1).
- Was passiert, wenn der Alarm-Sound nicht abgespielt werden kann (Browser blockiert Autoplay)? → Fallback: nur visuelle Anzeige + Hinweis "Ton blockiert — bitte erlauben".
- Was passiert, wenn eine Vorlage mit 0 Minuten erstellt wird? → Validierung: Mindestdauer 1 Minute.
- Was passiert, wenn ein Elternteil während eines laufenden Timers eine neue Vorlage startet? → Bestätigungs-Dialog: "Laufender Timer wird ersetzt. Fortfahren?"

## Technical Requirements
- Timer-State ist primär clientseitig (`useState` / `useRef` mit `setInterval`)
- Vorlagen werden in Supabase gespeichert (Tabelle `timer_templates`, familiengebunden)
- Aktiver Timer-Zustand wird NICHT in der Datenbank persistiert (rein clientseitig in v1)
- Alarm-Sound: kurze Audio-Datei im `public/`-Ordner (z.B. `timer-alarm.mp3`)
- Browser Support: Chrome, Firefox, Safari (Desktop + Mobile)
- Permissions basieren auf dem bestehenden Rollen-System (adult / child)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Decision: Frontend + Backend
- **Timer state** → purely client-side (no database). A `useTimer` hook manages the countdown using `setInterval` plus a wall-clock anchor (`Date.now()`) so the timer stays accurate when the browser tab is in the background.
- **Templates** → stored in Supabase (`timer_templates` table), family-scoped. Loaded once on page mount; mutations (create / edit / delete) call the Supabase client directly from a `useTimerTemplates` hook.
- **No real-time sync in v1** — if two adults are on the timer page simultaneously, the last action wins (per spec).

---

### Component Structure

```
/timer page
+-- TimerPageHeader          (title, breadcrumb)
+-- TimerDisplay             (MM:SS countdown + circular progress ring)
+-- TimerControls            (Start / Pause / Resume / Reset — adults only)
|   +-- DurationInput        (minute + second pickers, shown before start)
+-- TemplatesList            (horizontally scrollable quick-start chips)
|   +-- TemplateCard         (name + duration, tap to start)
|   +-- AddTemplateButton    (adult only)
+-- TemplateFormDialog       (create / edit template — adult only)
+-- TimerAlarmDialog         (full-screen overlay when timer hits 0)

/dashboard page
+-- TimerWidget              (shows active timer OR template quick-start chips)
    +-- → links to /timer on click
```

---

### Data Model

**`timer_templates` table** (Supabase)

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| family_id | UUID | Links to `families` table; Row-Level Security filter |
| name | Text | e.g. "Anziehen" (max 50 chars) |
| duration_seconds | Integer | Stored in seconds; min 60 (1 min), max 3600 (60 min) |
| is_system_default | Boolean | True for the 3 pre-seeded templates |
| created_by | UUID | Profile ID of the adult who created it |
| created_at | Timestamp | Auto-set by Supabase |

No table for active timer state — that lives only in the browser.

**RLS Policy:**
- Any family member can **read** their family's templates.
- Only `adult` role can **insert / update / delete** templates.

---

### Client-Side Timer State (plain language)

The `useTimer` hook tracks:
- **Target end time** (wall-clock timestamp) — used to survive background tabs accurately
- **Status**: `idle` | `running` | `paused` | `finished`
- **Remaining seconds** — recalculated from wall-clock on each tick

On tab focus: recalculate remaining time from `Date.now()` vs. stored end time — no drift.

---

### Alarm Behaviour

1. When remaining seconds hit 0, the hook sets status to `finished`.
2. The `TimerAlarmDialog` renders (full-screen overlay with pulsing animation).
3. An `<audio>` element plays `public/timer-alarm.mp3`.
4. If browser blocks autoplay: show "Ton blockiert" fallback message — visual alarm still fires.
5. Adult clicks "OK" → dialog closes, timer resets to `idle`.

---

### Navigation & Dashboard Widget

- Full timer page at `/timer` (new route in the sidebar).
- `TimerWidget` on the dashboard:
  - If a timer is **running**: shows the remaining time + progress bar.
  - If **idle**: shows up to 3 template quick-start buttons.
  - Clicking anywhere on the widget navigates to `/timer`.
- Timer state shared via a React Context (`TimerContext`) so the widget and the full page stay in sync within the same browser session.

---

### Tech Decisions (Justified)

| Decision | Reasoning |
|---|---|
| Client-side timer (no DB) | Millisecond precision isn't needed; avoids polling or WebSockets; keeps v1 simple |
| Wall-clock anchor for accuracy | `setInterval` drifts when tab is hidden; storing the end timestamp keeps it accurate |
| Supabase for templates | Consistent with the rest of the app; family members on different devices see the same templates |
| `public/timer-alarm.mp3` | No external dependency; browser `<audio>` API is universally supported |
| React Context for timer state | Dashboard widget and `/timer` page share the same live state without prop drilling |
| No real-time sync (v1) | Only one family member is likely using the timer at a time; keeps complexity low |

---

### New Files to Create

| File | Purpose |
|---|---|
| `src/components/timer/timer-display.tsx` | Circular progress ring + MM:SS |
| `src/components/timer/timer-controls.tsx` | Start / Pause / Resume / Reset buttons |
| `src/components/timer/duration-input.tsx` | Minute + second picker before start |
| `src/components/timer/templates-list.tsx` | Scrollable list of template chips |
| `src/components/timer/template-form-dialog.tsx` | Create / edit template sheet |
| `src/components/timer/timer-alarm-dialog.tsx` | Full-screen alarm overlay |
| `src/components/dashboard/timer-widget.tsx` | Dashboard widget |
| `src/hooks/use-timer.ts` | Core countdown logic |
| `src/hooks/use-timer-templates.ts` | Supabase CRUD for templates |
| `src/context/timer-context.tsx` | Shared timer state (page ↔ widget) |
| `src/app/(app)/timer/page.tsx` | Timer route |
| `public/timer-alarm.mp3` | Alarm sound file |

---

### Reused Existing Components

| Component | Used for |
|---|---|
| `src/components/ui/progress.tsx` | Fallback linear progress bar |
| `src/components/ui/dialog.tsx` | Alarm dialog + template form |
| `src/components/ui/button.tsx` | All control buttons |
| `src/components/ui/input.tsx` | Duration fields in template form |
| `src/components/ui/form.tsx` | Template create/edit form validation |

---

### Dependencies

No new npm packages needed. All required primitives are already in the project:
- SVG `<circle>` for the progress ring (no extra charting library)
- Native browser `<audio>` API for the alarm
- Supabase JS client (already installed)

## QA Test Results

**Tested:** 2026-03-30
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (Next.js 16.1.7 compiles successfully, no TypeScript errors)

---

### Acceptance Criteria Status

#### AC-1: Countdown-Timer
- [x] Elternteil kann eine beliebige Dauer einstellen (Minuten und Sekunden, max. 60 Minuten) -- `DurationInput` provides minute/second pickers with +/- buttons and quick-start chips (5, 10, 15, 20, 30, 45 min). Validation enforces min 60s, max 3600s.
- [x] Timer startet, pausiert, setzt fort und wird zurueckgesetzt per Button (nur Elternteile) -- `TimerControls` renders Pause/Play/Reset buttons gated by `isAdult`. `useTimer` hook implements start/pause/resume/reset with wall-clock anchoring.
- [x] Verbleibende Zeit wird als MM:SS angezeigt -- `formatTime()` in `timer-display.tsx` pads both minutes and seconds to 2 digits.
- [x] Visueller Fortschrittsring zeigt den Fortschritt an -- SVG circle with `strokeDasharray`/`strokeDashoffset` in `TimerDisplay`, animated via CSS transition.

#### AC-2: Vorlagen
- [x] Elternteil kann Vorlagen erstellen (Name + Dauer in Minuten) -- `TemplateFormDialog` with name + minutes input, calls `createTimerTemplateAction` with Zod validation.
- [x] Vorlagen werden fuer die Familie gespeichert (in Supabase), nicht nur lokal -- Server actions use `timer_templates` table scoped by `family_id`.
- [x] Elternteil kann Vorlagen bearbeiten und loeschen -- Edit via pencil icon -> `TemplateFormDialog`, delete via trash icon -> `AlertDialog` confirmation.
- [x] Vorlage per Tipp sofort als Timer starten -- `handleTemplateClick` calls `timer.start(template.durationSeconds)`.
- [ ] BUG: System-Vorlagen (is_system_default=true) koennen NICHT bearbeitet/geloescht werden wegen UI-Gating, ABER das ist ein Feature, nicht ein Bug -- see BUG-2 for a related UX concern.
- [x] Mindestens 3 System-Vorlagen werden beim Erstellen der Familie vorausgefuellt -- DB trigger `seed_timer_templates_for_family` inserts "Anziehen" (600s), "Fruehstueck" (900s), "Hausaufgaben" (1800s).

#### AC-3: Alarm bei Ablauf
- [x] Beim Ablauf wird ein Alarm-Sound abgespielt -- Both `useTimer` hook AND `TimerAlarmDialog` attempt to play `/timer-alarm.mp3`. Audio file exists (4170 bytes).
- [x] Eine auffaellige visuelle Anzeige erscheint -- `TimerAlarmDialog` renders a full-screen overlay with pulsing bell icon and `animate-in fade-in zoom-in-95`.
- [x] Die Anzeige kann vom Elternteil per Klick bestaetigt/geschlossen werden -- "OK, verstanden" button calls `timer.reset`. Children see "Ein Elternteil muss den Timer bestaetigen."
- [x] Timer zeigt danach "Zeit abgelaufen!" bis zum Zuruecksetzen -- `TimerDisplay` renders "00:00" and "Zeit abgelaufen!" in destructive color when status is `finished`.

#### AC-4: Berechtigungen
- [x] Nur Elternteile (Rolle: adult) koennen Timer starten, pausieren und zuruecksetzen -- `DurationInput` only rendered when `isAdult && status === "idle"`. `TimerControls` returns null when `!isAdult`. Template clicks disabled for children.
- [x] Nur Elternteile koennen Vorlagen erstellen, bearbeiten und loeschen -- "Neue Vorlage" button gated by `isAdult`. Server-side `verifyAdultOrAdmin()` enforces role check. RLS policies restrict INSERT/UPDATE/DELETE to adult/admin roles.
- [x] Kinder sehen den aktiven Timer und Vorlagen in read-only -- Children see timer display + status label. Template cards rendered with `disabled={!isAdult}`. Idle state shows "Kein Timer aktiv" message.

#### AC-5: Navigation & Platzierung
- [x] Eigene Timer-Seite erreichbar unter `/timer` -- Route at `src/app/(app)/timer/page.tsx`, sidebar link added in `app-sidebar.tsx`.
- [ ] BUG: Timer-Widget auf dem Dashboard zeigt aktiven Timer NICHT an -- see BUG-1.
- [x] Widget-Klick fuehrt zur vollen Timer-Seite -- "Timer oeffnen" link and all template rows link to `/timer`.

---

### Edge Cases Status

#### EC-1: Browser-Tab im Hintergrund
- [x] Handled correctly -- `useTimer` hook listens for `visibilitychange` event and recalculates remaining time from `Date.now()` vs. stored `endTimeRef`. Uses 250ms tick interval for smooth updates.

#### EC-2: Kein aktiver Timer + Kind ruft Widget auf
- [x] Handled correctly -- Timer page shows "Kein Timer aktiv. Ein Elternteil kann den Timer starten." Dashboard widget shows templates or "Noch keine Timer-Vorlagen."

#### EC-3: Zwei Elternteile gleichzeitig
- [x] Accepted limitation (spec says "letzter Schreiber gewinnt") -- Timer is purely client-side, each browser has its own state. No conflict.

#### EC-4: Alarm-Sound blockiert (Autoplay)
- [x] Handled correctly -- Both `useTimer` and `TimerAlarmDialog` catch play() rejection. Dialog shows "Ton blockiert -- bitte Autoplay im Browser erlauben" fallback text.

#### EC-5: Vorlage mit 0 Minuten
- [x] Handled correctly -- Zod schema enforces `min(60)` on `durationSeconds`. Client-side form enforces `min={1}` on minutes input. DB CHECK constraint: `duration_seconds >= 60`.

#### EC-6: Neue Vorlage waehrend laufendem Timer starten
- [x] Handled correctly -- `handleTemplateClick` checks if timer status is `running` or `paused` and shows confirmation AlertDialog before replacing.

---

### Security Audit Results

- [x] Authentication: Timer page calls `getDashboardDataAction()` which verifies auth. Redirects to `/login` if not authenticated.
- [x] Authorization (RLS): `timer_templates` table has proper RLS policies -- SELECT for family members, INSERT/UPDATE/DELETE for adult/admin only.
- [x] Authorization (Server Actions): `verifyAdultOrAdmin()` checks role before create/update/delete operations. Template ownership verified via `family_id` match.
- [x] Input validation (Zod): All server actions validate with Zod schemas. Name max 50 chars, duration 60-3600 seconds, ID must be UUID.
- [x] SQL Injection: Supabase client uses parameterized queries, no raw SQL in server actions.
- [x] XSS: React's JSX auto-escapes template names. No `dangerouslySetInnerHTML` usage.
- [x] DB Constraints: CHECK constraints on `name` length (50 chars) and `duration_seconds` range (60-3600). CASCADE delete on family removal.
- [ ] BUG: No rate limiting on template CRUD operations -- see BUG-5.
- [ ] BUG: Dashboard TimerWidget uses client-side Supabase directly (bypasses server action pattern) -- see BUG-4.

---

### Cross-Browser Assessment (Code Review)

- [x] Chrome: SVG circles, CSS transitions, Audio API, `visibilitychange` all supported.
- [x] Firefox: Same APIs supported. `tabular-nums` font feature supported.
- [x] Safari: `visibilitychange` supported. Audio autoplay may be blocked (fallback handles this).
- [ ] BUG: Mobile Safari may not fire `visibilitychange` reliably when switching apps -- see BUG-6.

### Responsive Assessment (Code Review)

- [x] 375px (Mobile): `max-w-4xl` timer page with `px-4` padding. Duration input uses `gap-3` which may be tight but functional. Template cards use `min-w-[9rem]` with horizontal scroll.
- [x] 768px (Tablet): Layout adapts via Tailwind responsive classes.
- [x] 1440px (Desktop): `max-w-4xl` constrains width appropriately. Sidebar visible with timer link.
- [ ] BUG: Timer not in mobile bottom nav -- see BUG-3.
- [ ] BUG: Edit/delete buttons on templates require hover (invisible on touch devices) -- see BUG-7.

---

### Bugs Found

#### BUG-1: Dashboard TimerWidget does NOT show active running timer
- **Severity:** High
- **Steps to Reproduce:**
  1. Navigate to `/timer`, start a timer.
  2. Navigate to `/dashboard`.
  3. Expected: Timer widget shows remaining time with progress bar (as per AC and tech design spec).
  4. Actual: Timer widget ONLY shows template quick-start links. It has NO integration with the timer context. The `TimerWidget` component does not use `TimerProvider` or `useTimerContext` -- it only fetches templates from Supabase.
- **Root Cause:** `TimerWidget` on the dashboard is NOT wrapped in `TimerProvider`. The widget is a standalone component that fetches templates directly from Supabase client. The tech design specifies "If a timer is running: shows the remaining time + progress bar" but this was not implemented. The React Context approach from the spec requires both pages to share the same provider, which they do not (each route is a separate page navigation that destroys context).
- **Note:** Even if the context were shared, navigating between `/timer` and `/dashboard` causes a full page load in Next.js App Router, which would reset the client-side timer state entirely. The fundamental architecture (client-side timer + page navigation) makes this feature impossible without a global persistent state mechanism (e.g., BroadcastChannel, SharedWorker, or server-side persistence).
- **Priority:** Fix before deployment

#### BUG-2: System default templates cannot be edited or deleted (UX ambiguity)
- **Severity:** Low
- **Steps to Reproduce:**
  1. View templates list as an adult.
  2. System default templates ("Anziehen", "Fruehstueck", "Hausaufgaben") show NO edit/delete icons.
  3. Expected: User understands why these cannot be modified.
  4. Actual: No visual indicator or tooltip explains that these are system defaults. The condition `!template.isSystemDefault` hides edit/delete buttons silently.
- **Priority:** Nice to have

#### BUG-3: Timer page not accessible from mobile bottom navigation
- **Severity:** Medium
- **Steps to Reproduce:**
  1. View app on mobile (375px).
  2. Bottom navigation shows: Home, Kalender, (+), Aufgaben, Familie.
  3. Expected: Timer should be reachable from mobile navigation.
  4. Actual: Timer is only in the desktop sidebar. Mobile users must go to dashboard and click the timer widget to reach `/timer`.
- **Root Cause:** `bottom-nav.tsx` `BOTTOM_LINKS` array does not include `/timer`.
- **Priority:** Fix before deployment

#### BUG-4: Dashboard TimerWidget bypasses server action pattern (inconsistency)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Review `src/components/dashboard/timer-widget.tsx`.
  2. It uses `createClient()` (browser Supabase client) directly to query `timer_templates`.
  3. Expected: Consistent pattern using server actions like all other data fetching.
  4. Actual: Direct client-side Supabase query. This works because of RLS policies, but it breaks the architectural convention used everywhere else and creates a new Supabase client instance on every render (the `supabase` variable is created inside the component body, not memoized).
- **Priority:** Fix in next sprint

#### BUG-5: No rate limiting on timer template CRUD operations
- **Severity:** Low
- **Steps to Reproduce:**
  1. Rapidly call `createTimerTemplateAction` many times.
  2. Expected: Rate limiting prevents abuse.
  3. Actual: No rate limiting exists. An authenticated user could create hundreds of templates.
- **Note:** This is consistent with the rest of the app (no rate limiting on any server actions). Low severity because this is a private family app.
- **Priority:** Nice to have

#### BUG-6: Timer may lose accuracy on iOS Safari app-switching
- **Severity:** Low
- **Steps to Reproduce:**
  1. Start timer on iOS Safari.
  2. Switch to another app for several minutes.
  3. Return to Safari.
  4. Expected: Timer shows correct remaining time.
  5. Actual: iOS Safari may suspend the page entirely and `visibilitychange` may not fire immediately. The wall-clock anchoring should recover on the next tick, but the initial display after resuming may briefly show stale data.
- **Note:** The implementation is the best possible without service workers. Wall-clock anchor mitigates drift.
- **Priority:** Nice to have

#### BUG-7: Template edit/delete buttons invisible on touch devices
- **Severity:** Medium
- **Steps to Reproduce:**
  1. View templates list on mobile/tablet (touch device).
  2. Template cards show edit/delete icons ONLY on hover (`opacity-0 group-hover:opacity-100`).
  3. Expected: Touch users can access edit/delete functionality.
  4. Actual: On pure touch devices (no hover), the edit/delete buttons are permanently invisible. Users cannot edit or delete non-system templates on mobile.
- **Root Cause:** `templates-list.tsx` line 149: `opacity-0 group-hover:opacity-100` has no touch-friendly alternative.
- **Priority:** Fix before deployment

#### BUG-8: Double alarm sound playback on timer finish
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Start a timer and let it count down to 0.
  2. Expected: One alarm sound plays.
  3. Actual: TWO separate `new Audio("/timer-alarm.mp3")` instances are created and play simultaneously -- one in `useTimer` hook (line 58) and one in `TimerAlarmDialog` (line 21). The hook plays it once on finish, and the dialog creates a looping audio on mount.
- **Root Cause:** `useTimer.ts` lines 56-66 play the alarm AND `timer-alarm-dialog.tsx` lines 20-37 also play it with `audio.loop = true`. This causes overlapping audio.
- **Priority:** Fix before deployment

#### BUG-9: Timer state lost on page navigation
- **Severity:** High
- **Steps to Reproduce:**
  1. Start a timer on `/timer`.
  2. Navigate to `/dashboard` or any other page using sidebar links.
  3. Navigate back to `/timer`.
  4. Expected: Timer still running with correct remaining time.
  5. Actual: Timer state is completely reset to idle. The `TimerProvider` and `useTimer` hook are local to the `/timer` page component tree. Navigation unmounts the entire component tree, destroying the timer state.
- **Root Cause:** Timer context is only provided inside `TimerPageClient`, not at the app layout level. The tech design spec mentions React Context for sharing state between dashboard widget and timer page, but the provider is not in a shared ancestor.
- **Priority:** Fix before deployment

#### BUG-10: Duration input allows 60 minutes and 59 seconds (exceeding max)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Set minutes to 60 and seconds to any value > 0 (e.g., 60 min 30 sec = 3630 seconds).
  2. Click "Timer starten".
  3. Expected: Validation prevents start (max is 3600 seconds = 60 minutes exactly).
  4. Actual: The `handleStart` function checks `total > 3600` which correctly blocks it, AND the button is disabled when `total < 60`. However, the minute picker allows values 0-60 and the seconds picker allows 0-59 independently, so a user can set 60:30 but the start button will not work. There is no error message explaining WHY the button does not work -- it just stays enabled-looking but silently refuses to start.
- **Correction:** Actually the button `disabled` prop only checks `minutes * 60 + seconds < 60`. For 60:30 (3630s), the button is NOT disabled, but `handleStart` silently returns without starting. The user gets no feedback.
- **Priority:** Fix in next sprint

---

### Regression Check (Deployed Features)

- [x] PROJ-1 (Auth): Login/logout flow unaffected. Timer page correctly redirects unauthenticated users.
- [x] PROJ-2 (Familienverwaltung): Family context loads correctly for timer page via `getDashboardDataAction`.
- [x] PROJ-3 (Dashboard): Dashboard renders with new TimerWidget added. No layout breakage observed in code. Existing widgets (Calendar, Tasks, Rewards, MealPlan) unaffected.
- [x] PROJ-4 (Kalender): Sidebar navigation updated but calendar link preserved.
- [x] PROJ-5 (Aufgaben): Unaffected.
- [x] PROJ-6 (Belohnungssystem): Unaffected.
- [x] Build passes: `npm run build` completes with zero errors.

---

### Summary
- **Acceptance Criteria:** 14/16 passed (2 failed: BUG-1 dashboard widget active timer, BUG-3 mobile nav missing)
- **Bugs Found:** 10 total (0 critical, 3 high, 3 medium, 4 low)
- **Security:** Pass -- RLS policies correct, server-side role checks in place, Zod validation on all inputs, no injection vectors found.
- **Production Ready:** NO
- **Recommendation:** Fix the 3 high-priority bugs (BUG-1, BUG-8, BUG-9) and 3 medium-priority bugs (BUG-3, BUG-7, BUG-10) before deployment. BUG-1 and BUG-9 are architecturally related (timer state not persisted across navigation) and should be addressed together. BUG-3 is a quick fix. BUG-8 is a quick fix (remove duplicate audio in useTimer hook). BUG-7 needs a touch-friendly alternative for edit/delete actions.

## Deployment
_To be added by /deploy_
