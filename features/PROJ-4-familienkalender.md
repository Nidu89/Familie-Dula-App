# PROJ-4: Familienkalender

## Status: In Progress
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
