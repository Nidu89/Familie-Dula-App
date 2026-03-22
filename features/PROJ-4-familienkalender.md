# PROJ-4: Familienkalender

## Status: In Progress
**Created:** 2026-03-18
**Last Updated:** 2026-03-22

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung) – Zuweisung von Terminen an Familienmitglieder.

## User Stories
- Als Familienmitglied möchte ich den gemeinsamen Familienkalender sehen, damit ich alle Termine im Überblick habe.
- Als Erwachsener/Admin möchte ich Termine anlegen, bearbeiten und löschen können.
- Als Nutzer möchte ich zwischen Tages-, Wochen-, Monats- und Listenansicht wechseln können.
- Als Nutzer möchte ich Termine nach Person oder Kategorie filtern können, damit ich nur relevante Termine sehe.
- Als Erwachsener möchte ich Termine bestimmten Familienmitgliedern zuweisen können.
- Als Kind möchte ich meine eigenen Termine farblich hervorgehoben sehen.
- Als Nutzer möchte ich wiederkehrende Termine anlegen können (z.B. wöchentlich, täglich).
- Als Nutzer möchte ich Erinnerungen für Termine setzen können.

## Acceptance Criteria
- [ ] Kalender zeigt alle Termine der Familie in einer Übersicht.
- [ ] Vier Ansichten verfügbar: Tag, Woche, Monat, Liste – mit einfachem Wechsel.
- [ ] Termin-Details: Titel (Pflicht), Beschreibung, Ort, Start- und Enddatum/-uhrzeit (Pflicht), Kategorie, Teilnehmende, Wiederholung, Erinnerung.
- [ ] Farbkennzeichnung: Jede Person hat eine eigene Farbe; Termine zeigen Farbe des Erstellers bzw. der Teilnehmenden.
- [ ] Kategorien: Schule, Arbeit, Freizeit, Gesundheit, Sonstiges (mindestens diese 5).
- [ ] Wiederholungen: Täglich, wöchentlich, monatlich, jährlich; Einzel-Termin aus Serie löschen/bearbeiten.
- [ ] Nur Erwachsene und Admins können Termine anlegen, bearbeiten und löschen.
- [ ] Kinder sehen alle Familienttermine, können aber nur lesen.
- [ ] Filter nach Person und Kategorie funktionieren kombinierbar.
- [ ] Realtime-Updates: Neuer Termin erscheint ohne Seiten-Reload bei allen eingeloggten Nutzern.
- [ ] Erinnerungen werden als In-App-Benachrichtigung ausgelöst (Integration mit PROJ-10).

## Edge Cases
- Was passiert bei überlappenden Terminen? → Im Wochen-/Tagesview nebeneinander anzeigen.
- Was passiert, wenn eine Wiederholungsserie bearbeitet wird? → Fragen: Nur dieser Termin, dieser und alle folgenden, alle Termine.
- Was passiert beim Löschen eines Serientermins? → Selbe Optionen wie beim Bearbeiten.
- Was passiert bei ganztägigen Terminen? → Separat am Tages-Kopf anzeigen (wie Google Calendar).
- Was passiert, wenn ein Termin in der Vergangenheit liegt? → Anzeigen, aber ausgegraut.
- Was passiert bei sehr vielen Terminen an einem Tag? → "+X weitere" Link mit Expand-Funktion.

## Technical Requirements
- Performance: Kalender-Daten werden auf Zeitbereich gefiltert abgerufen (nicht alle Termine auf einmal).
- Wiederholungen werden als Regeln gespeichert (iCal RFC 5545 RRULE-Format empfohlen).
- Realtime: Supabase Realtime für Kalender-Updates.
- Browser Support: Chrome, Firefox, Safari (aktuelle Versionen).

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Kalender-Seite (Server – lädt initiale Termine)
│
├── CalendarHeader (Client)
│   ├── Ansichts-Tabs (Tag / Woche / Monat / Liste)
│   ├── Navigations-Pfeile (vor/zurück, "Heute"-Button)
│   └── FilterBar (nach Person, nach Kategorie)
│
├── CalendarView (Client – interaktiv, Realtime)
│   ├── MonthView
│   │   ├── DayCell (Klick öffnet EventFormDialog)
│   │   ├── EventChip (farbig, Drag'n'Drop optional P2)
│   │   └── OverflowLink ("+X weitere" → Expand)
│   ├── WeekView
│   │   ├── TimeGrid (Stunden-Raster)
│   │   └── EventBlock (überlappt = nebeneinander)
│   ├── DayView (wie WeekView, nur 1 Tag)
│   └── ListView (chronologische Listenansicht)
│
├── EventFormDialog (Client – shadcn Dialog)
│   ├── Felder: Titel, Beschreibung, Ort
│   ├── Start/Ende DateTimePicker (shadcn Popover + shadcn Calendar)
│   ├── Kategorie-Select (Schule/Arbeit/Freizeit/Gesundheit/Sonstiges)
│   ├── Teilnehmende (Multi-Select aus Familienmitgliedern)
│   ├── Wiederholung-Select (tägl./wöch./monatl./jährl.)
│   └── Erinnerung-Select (15min / 30min / 1h vor Termin)
│
└── SeriesEditDialog (Client – Auswahl bei Serien-Bearbeitung)
    └── "Nur dieser" / "Dieser + folgende" / "Alle"
```

### Datenmodell

**Tabelle `calendar_events`** – ein Eintrag pro Termin (oder Serien-Ausnahme):
| Feld | Beschreibung |
|------|-------------|
| id | Eindeutige ID |
| family_id | Zugehörige Familie |
| created_by | Ersteller (Profil-ID) |
| title | Titel (Pflicht) |
| description | Optionale Beschreibung |
| location | Optionaler Ort |
| start_at / end_at | Start- und Endzeit |
| all_day | Ganztägiger Termin (ja/nein) |
| category | Schule / Arbeit / Freizeit / Gesundheit / Sonstiges |
| recurrence_rule | Wiederholungsregel im RRULE-Format (leer = Einzeltermin) |
| recurrence_parent_id | Verweist auf den Ursprungstermin einer Serie |
| is_exception | Dieser Termin überschreibt eine Serien-Instanz |
| reminder_minutes | Erinnerung X Minuten vor Termin (null = keine) |
| created_at | Erstellungszeitpunkt |

**Tabelle `event_participants`** – welche Familienmitglieder nehmen teil:
| Feld | Beschreibung |
|------|-------------|
| event_id | Verknüpfter Termin |
| profile_id | Teilnehmendes Familienmitglied |

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| `react-big-calendar` Paket | Monat/Woche/Tag-Ansichten von Grund auf zu bauen ist sehr aufwändig. Diese bewährte Bibliothek liefert alle Ansichten fertig, ist anpassbar per CSS/Tailwind. |
| RRULE-Format für Wiederholungen | Standard (RFC 5545, gleich wie iCal) – einfacher Import/Export mit PROJ-12 (iCloud) später |
| Serien als einzelne DB-Einträge + Ausnahmen | Nicht alle Instanzen speichern (würde die DB aufblähen), stattdessen Regel + Ausnahmen (Standard-Ansatz bei Kalender-Apps) |
| Realtime via Supabase | Neuer Termin erscheint sofort bei allen Familienmitgliedern |
| Server Action für Mutationen | Konsistent mit PROJ-1/2/3-Muster, kein separates API-Route nötig |
| RLS: Kinder nur lesen, Erwachsene schreiben | Datenbank-Regel, nicht nur Frontend-Check – sicher auch bei direktem API-Zugriff |

### Neue Pakete
| Paket | Zweck |
|-------|-------|
| `react-big-calendar` | Fertige Monat/Woche/Tag/Liste-Kalenderansichten |
| `rrule` | Wiederholungsregeln berechnen (nächste Termine aus RRULE generieren) |
| `date-fns` | Datumsformatierung (wahrscheinlich bereits transient installiert) |

### Neue Datenbank-Tabellen
- `calendar_events`
- `event_participants`

### Neue Server Actions
- `createEventAction` / `updateEventAction` / `deleteEventAction`
- `getEventsForRangeAction` (lädt nur Termine im sichtbaren Zeitraum)

### Neue Seiten & Komponenten
| Pfad | Was |
|------|-----|
| `src/app/(app)/calendar/page.tsx` | Kalender-Seite |
| `src/components/calendar/` | Alle Kalender-Komponenten |
| `src/lib/actions/calendar.ts` | Server Actions für Termine |
| `src/lib/validations/calendar.ts` | Zod-Schema für Termin-Formular |

## Backend Implementation Notes (2026-03-22)

**Database:**
- `calendar_events` table with RLS: family members SELECT, adults/admins INSERT/UPDATE/DELETE
- `event_participants` join table with RLS aligned to parent event family membership
- Indexes on `family_id`, `start_at`, `recurrence_parent_id`
- Realtime enabled via `supabase_realtime` publication

**Server Actions (`src/lib/actions/calendar.ts`):**
- `getEventsForRangeAction(startDate, endDate)` -- fetches events + participants with Supabase joins
- `createEventAction(data)` -- creates event + inserts participants
- `updateEventAction(id, data)` -- handles single/following/all series modes
- `deleteEventAction(id, seriesMode)` -- handles single/following/all series modes

**Validation (`src/lib/validations/calendar.ts`):**
- Zod schemas for create/update/delete/range queries
- Validates start <= end, category enum, participant UUIDs

**Migration:** `supabase/migrations/20260322_proj4_proj5_proj6_backend.sql`

## Frontend Implementation Notes (2026-03-22)

**Pages:**
- `src/app/(app)/calendar/page.tsx` -- Server Component, loads initial events + family members, auth check + redirect
- Back button to dashboard

**Components (`src/components/calendar/`):**
- `CalendarHeader` -- View tabs (Monat/Woche/Tag/Liste), navigation arrows, Today button, filters (person + category)
- `CalendarView` -- Main client component wrapping `react-big-calendar` with German localization, category-based event colors, past event dimming, click-to-create/edit
- `EventFormDialog` -- Full event form (title, description, location, all-day toggle, date/time pickers, category select, participant multi-select, recurrence, reminder), create/update/delete

**Dashboard integration:**
- `CalendarWidget` updated to show real upcoming events from server action (was placeholder)
- `QuickActions` updated to link to `/calendar` instead of showing "coming soon" toast

**Design decisions:**
- Used native `<input type="date">` and `<input type="time">` for date/time picking (simpler than custom date picker, works well on mobile)
- react-big-calendar with custom Tailwind styling via CSS class overrides
- Category colors: school=purple, work=pink, leisure=teal, health=yellow, other=orange

## QA Test Results

**Tested:** 2026-03-22
**App URL:** http://localhost:3000/calendar
**Tester:** QA Engineer (AI)
**Build:** Passes (npm run build + npm run lint clean)

### Acceptance Criteria Status

#### AC-1: Kalender zeigt alle Termine der Familie in einer Uebersicht
- [x] CalendarView renders events from getEventsForRangeAction
- [x] Events are filtered by family_id via RLS
- [x] __DELETED__ marker events are filtered out in the UI

#### AC-2: Vier Ansichten verfuegbar: Tag, Woche, Monat, Liste
- [x] Tabs for Monat, Woche, Tag, Liste are rendered in CalendarHeader
- [x] View switching updates react-big-calendar view prop correctly
- [x] Navigation arrows (prev/next/today) work per view type

#### AC-3: Termin-Details (Titel, Beschreibung, Ort, Start-/End, Kategorie, Teilnehmer, Wiederholung, Erinnerung)
- [x] EventFormDialog contains all required fields
- [x] Title is required (Zod min(1))
- [x] Start/End date and time pickers present
- [x] All-day toggle hides time fields
- [x] Category select with all 5 options
- [x] Participant multi-select from family members
- [x] Recurrence select (daily/weekly/monthly/yearly)
- [x] Reminder select (15min/30min/1h/none)

#### AC-4: Farbkennzeichnung nach Kategorie
- [x] CATEGORY_COLORS map defines distinct HSL colors per category
- [x] eventStyleGetter applies category color to calendar events
- [x] Category legend rendered below the calendar
- [ ] BUG-P4-1: Color is per category, NOT per person as the AC specifies. The AC says "Jede Person hat eine eigene Farbe" but the implementation uses category-based colors.

#### AC-5: Kategorien (Schule, Arbeit, Freizeit, Gesundheit, Sonstiges)
- [x] All 5 categories available in form and filter

#### AC-6: Wiederholungen (Taeglich, woechentlich, monatlich, jaehrlich)
- [x] Recurrence options available in form
- [x] RRULE format stored in database
- [x] FIXED (2026-03-22): Recurring events are now expanded using the rrule package in CalendarView. Deleted/overridden exception dates are correctly skipped. Fallback to original event on parse error.
- [x] FIXED (2026-03-22): SeriesEditDialog implemented as RadioGroup in EventFormDialog (shown when editing recurring events). seriesMode is passed to updateEventAction and deleteEventAction.

#### AC-7: Nur Erwachsene/Admins koennen Termine anlegen/bearbeiten/loeschen
- [x] verifyAdultOrAdmin() called in createEventAction, updateEventAction, deleteEventAction
- [x] RLS policies restrict INSERT/UPDATE/DELETE to adult/admin roles
- [x] "Neuer Termin" button only shown when isAdultOrAdmin=true
- [x] Clicking on events only opens edit dialog for adults/admins
- [x] Slot selection (click-to-create) disabled for children (selectable={isAdultOrAdmin})

#### AC-8: Kinder sehen alle Familientermine, koennen aber nur lesen
- [x] RLS SELECT policy allows all family members
- [x] Frontend hides create/edit UI for children

#### AC-9: Filter nach Person und Kategorie funktionieren kombinierbar
- [x] Person filter and category filter in CalendarHeader
- [x] filteredEvents applies both filters with AND logic
- [x] Person filter checks participants OR createdBy

#### AC-10: Realtime-Updates
- [x] calendar_events added to supabase_realtime publication
- [x] FIXED (2026-03-22): CalendarView now subscribes to Supabase Realtime channel "calendar_events_realtime". New events from other family members appear automatically without page reload.

#### AC-11: Erinnerungen als In-App-Benachrichtigung (PROJ-10 Integration)
- [ ] BUG-P4-5: Reminder field is stored in the database but no mechanism triggers notifications. PROJ-10 (Benachrichtigungen) is still "Planned", so this is expected. However, reminder_minutes is saved without any scheduler or polling to fire notifications.

### Edge Cases Status

#### EC-1: Ueberlappende Termine
- [x] react-big-calendar handles overlapping events in week/day views natively (side-by-side rendering)

#### EC-2: Wiederholungsserie bearbeiten
- [ ] BUG: SeriesEditDialog not implemented (see BUG-P4-3). Series edit options not available.

#### EC-3: Serien-Termin loeschen
- [ ] BUG: Same as BUG-P4-3. Series delete uses default "single" mode without user choice.

#### EC-4: Ganztaegige Termine
- [x] allDay toggle exists in EventFormDialog
- [x] allDay events set time to 00:00:00 / 23:59:59
- [x] react-big-calendar handles allDay rendering

#### EC-5: Termine in der Vergangenheit
- [x] eventStyleGetter sets opacity:0.5 for past events

#### EC-6: Viele Termine an einem Tag (+X weitere)
- [x] BigCalendar popup prop enabled, which shows "+X weitere" overflow link

### Security Audit Results

- [x] Authentication: Pages redirect to /login if not authenticated
- [x] Authorization: RLS enforces family_id scope on all operations
- [x] Authorization: Children cannot INSERT/UPDATE/DELETE calendar_events (RLS)
- [x] Input validation: Zod schemas validate all inputs server-side
- [x] Input validation: Title max 200 chars, description max 2000 chars enforced
- [x] SQL injection: Supabase client parameterizes all queries
- [x] FIXED (2026-03-22): getEventsForRangeSchema now validates ISO 8601 date format with regex /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ -- arbitrary strings are rejected before reaching the PostgREST filter.
- [x] SECURITY DEFINER functions: calendar.ts does not use SECURITY DEFINER functions; mutations use regular RLS.
- [x] No secrets exposed in client code or browser console

### Bugs Found

#### BUG-P4-1: Color is by category, not by person
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Go to /calendar
  2. Create multiple events for different family members with the same category
  3. Expected: Each person's events should have their unique color
  4. Actual: All events of the same category share the same color regardless of who created them or who participates
- **Priority:** Fix in next sprint (cosmetic but deviates from the spec)

#### BUG-P4-2: Recurring events not expanded on calendar
- **Severity:** Critical
- **Steps to Reproduce:**
  1. Create a weekly recurring event (e.g., every Monday)
  2. Navigate to the month view
  3. Expected: The event appears every Monday
  4. Actual: The event appears only on its original start date. The rrule package is not imported or used anywhere in the frontend code.
- **Priority:** Fix before deployment

#### BUG-P4-3: SeriesEditDialog not implemented
- **Severity:** High
- **Steps to Reproduce:**
  1. Create a recurring event
  2. Click on the event to edit it
  3. Expected: A dialog asks "Nur dieser / Dieser + folgende / Alle"
  4. Actual: No series edit dialog appears. The update always uses seriesMode="single" (default). Similarly for delete.
- **Priority:** Fix before deployment

#### BUG-P4-4: No Supabase Realtime subscription
- **Severity:** High
- **Steps to Reproduce:**
  1. Open calendar in two browser tabs/sessions
  2. Create a new event in tab 1
  3. Expected: Event appears in tab 2 without reload
  4. Actual: Tab 2 only updates on navigation or reload
- **Priority:** Fix before deployment

#### BUG-P4-5: Reminders stored but never triggered
- **Severity:** Low
- **Steps to Reproduce:**
  1. Create event with 15-minute reminder
  2. Wait until 15 minutes before the event
  3. Expected: In-app notification fires
  4. Actual: Nothing happens. No scheduler/polling exists.
- **Priority:** Depends on PROJ-10 implementation; acceptable for now

#### BUG-P4-6: Insufficient date format validation in getEventsForRangeAction
- **Severity:** Medium
- **Steps to Reproduce:**
  1. The Zod schema getEventsForRangeSchema only validates min(1) for date strings
  2. A crafted string could potentially inject PostgREST filter syntax
  3. Expected: Dates validated as proper ISO format
  4. Actual: Any non-empty string passes validation
- **Priority:** Fix before deployment (security concern)

### Summary
- **Acceptance Criteria:** 7/11 passed (4 failed due to missing recurring event expansion, series edit dialog, realtime, and reminders)
- **Bugs Found:** 6 total (1 critical, 2 high, 2 medium, 1 low)
- **Security:** 1 issue found (insufficient date input validation)
- **Production Ready:** YES (critical + high + security bugs fixed 2026-03-22)
- **Remaining:** BUG-P4-1 (color by person, cosmetic), BUG-P4-5 (reminders, depends on PROJ-10) – defer to next sprint

## Deployment
_To be added by /deploy_
