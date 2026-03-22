# PROJ-6: Belohnungssystem (Gamification)

## Status: In Progress
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung) – Punkte pro Kind der Familie.
- Requires: PROJ-5 (Aufgaben & To-Dos) – Automatische Punktvergabe bei Aufgabenerledigung.

## User Stories
- Als Kind möchte ich nach dem Erledigen einer Aufgabe automatisch Punkte erhalten, damit ich Motivation habe.
- Als Kind möchte ich mein aktuelles Punkteguthaben sehen können.
- Als Elternteil möchte ich Punkte manuell hinzufügen oder abziehen können, um Kinder zu belohnen oder Korrekturen vorzunehmen.
- Als Elternteil möchte ich die Punktehistorie eines Kindes einsehen, damit ich nachvollziehen kann, wie Punkte verdient/abgezogen wurden.
- Als Elternteil möchte ich beim Anlegen einer Aufgabe festlegen, wie viele Punkte sie wert ist.
- Als Nutzer möchte ich eine Übersicht aller Kinder mit ihrem aktuellen Punktestand sehen.

## Acceptance Criteria
- [ ] Jedes Familienmitglied mit Rolle "Kind" hat ein Punktekonto.
- [ ] Punktestand wird auf dem Dashboard und auf der Belohnungs-Übersichtsseite angezeigt.
- [ ] Automatische Buchung: Wenn ein Kind eine punktberechtigte Aufgabe erledigt, werden die definierten Punkte seinem Konto gutgeschrieben.
- [ ] Manuelle Buchung: Erwachsene/Admins können Punkte manuell hinzufügen (positiver Wert) oder abziehen (negativer Wert) mit optionalem Grund/Kommentar.
- [ ] Punktehistorie: Pro Kind einsehbar – zeigt Datum, Aktion (Aufgabe/manuell), Punkte (+/-), aktuellen Stand, Kommentar.
- [ ] Punktestand kann nicht negativ werden (Mindestwert: 0).
- [ ] Übersichtsseite: Alle Kinder der Familie mit aktuellem Punktestand nebeneinander.
- [ ] Nur Erwachsene und Admins können manuelle Buchungen vornehmen.
- [ ] Punkte einer Aufgabe werden nur einmal vergeben, auch wenn der Status mehrfach gewechselt wird.

## Edge Cases
- Was passiert, wenn eine erledigte Aufgabe auf "offen" zurückgesetzt wird? → Punkte bleiben; nur manuelle Korrektur durch Eltern möglich (mit Kommentar).
- Was passiert, wenn eine punktberechtigte Aufgabe keinem Kind zugewiesen ist? → Keine automatische Buchung bei Erledigung.
- Was passiert, wenn man mehr Punkte abziehen will als vorhanden? → Maximaler Abzug ist der aktuelle Stand (Ergebnis = 0), nicht negativ.
- Was passiert, wenn ein Kind aus der Familie entfernt wird? → Punktehistorie bleibt als Archiv erhalten (keine Löschung).

## Technical Requirements
- Punkte-Buchungen sind unveränderlich (append-only log) – keine Bearbeitung/Löschung einzelner Buchungen.
- Transaktionale Sicherheit: Aufgabenerledigung und Punktebuchung in einer DB-Transaktion.
- RLS: Kinder können nur ihren eigenen Punktestand lesen, nicht ändern.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Belohnungs-Seite (Server – lädt alle Kinderdaten)
│
├── RewardsHeader
│   └── Seitentitel "Belohnungen"
│
├── ChildrenOverview (Kacheln aller Kinder)
│   └── ChildPointCard (pro Kind)
│       ├── Avatar + Name
│       ├── Punktestand (groß, prominent)
│       ├── "Punkte vergeben"-Button (nur Erwachsene)
│       └── "Verlauf anzeigen"-Link
│
├── PointsHistorySheet (shadcn Sheet – seitliches Panel)
│   ├── HistoryEntry (pro Buchung)
│   │   ├── Datum + Uhrzeit
│   │   ├── Art (Aufgabe erledigt / Manuell)
│   │   ├── Punkte (+/- farbig)
│   │   ├── Buchungsgrund / Kommentar
│   │   └── Aktueller Stand nach Buchung
│   └── EmptyState ("Noch keine Punkte gesammelt")
│
└── ManualPointsDialog (Client – shadcn Dialog, nur Erwachsene)
    ├── Kind-Anzeige (vorausgewählt vom ChildPointCard)
    ├── Betrag-Input (positiver Wert = hinzufügen, negativer = abziehen)
    ├── Kommentar-Textarea (optional)
    └── Vorschau ("Neuer Stand: X Punkte")
```

### Datenmodell

**Tabelle `points_transactions`** – unveränderliches Buchungsprotokoll (append-only):
| Feld | Beschreibung |
|------|-------------|
| id | Eindeutige ID |
| profile_id | Kind, dessen Konto gebucht wird |
| family_id | Zugehörige Familie |
| amount | Punkte (positiv = gutschreiben, negativ = abziehen) |
| type | task_completion / manual_add / manual_deduct |
| task_id | Verweis auf erledigte Aufgabe (bei task_completion) |
| comment | Optionaler Grund (bei manuellen Buchungen) |
| created_by | Erwachsener, der gebucht hat (oder System) |
| created_at | Buchungszeitpunkt |

**Erweiterung der `profiles`-Tabelle:**
| Feld | Beschreibung |
|------|-------------|
| points_balance | Aktueller Kontostand (integer, Minimum 0) – wird bei jeder Buchung aktualisiert |

> Der `points_balance` in `profiles` ist ein denormalisierter Hilfswert für schnelle Anzeige. Die `points_transactions`-Tabelle ist die einzige Quelle der Wahrheit.

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Append-only Buchungslog | Punkte können nie nachträglich geändert/gelöscht werden – volle Nachvollziehbarkeit (wichtig für Vertrauen der Kinder) |
| `points_balance` in `profiles` denormalisiert | Verhindert langsame `SUM()`-Abfragen bei jeder Seitenanzeige; wird via DB-Trigger aktuell gehalten |
| Minimum-Balance = 0 via DB-Constraint | Negativer Kontostand ist datenbankseitig unmöglich, nicht nur UI-Einschränkung |
| Buchung transaktional mit Aufgabenerledigung | Gleiche DB-Transaktion wie in PROJ-5 – entweder beides oder nichts |
| Kein eigener Einlöse-Mechanismus | Bewusste Entscheidung laut PRD – Punkte sind nur Motivation/Anzeige, keine digitale Währung |

### Neue Pakete
Keine – alle benötigten shadcn-Komponenten (Avatar, Badge, Progress, Sheet, Dialog) sind bereits installiert.

### Neue Datenbank-Tabellen
- `points_transactions`
- Erweiterung: `profiles` erhält Spalte `points_balance`

### Neue Server Actions
- `getRewardsOverviewAction` (alle Kinder + Punktestände)
- `getPointsHistoryAction` (Buchungslog für ein Kind)
- `manualPointsAction` (manuelle Buchung durch Erwachsene)
- *(Automatische Buchung läuft über `completeTaskAction` in PROJ-5)*

### Neue Seiten & Komponenten
| Pfad | Was |
|------|-----|
| `src/app/(app)/rewards/page.tsx` | Belohnungs-Seite |
| `src/components/rewards/` | Alle Belohnungs-Komponenten |
| `src/lib/actions/rewards.ts` | Server Actions für Punkte |

## Backend Implementation Notes (2026-03-22)

**Database:**
- `points_balance` column added to `profiles` (INT NOT NULL DEFAULT 0, CHECK >= 0)
- `points_transactions` table -- append-only log, no UPDATE/DELETE policies
- RLS: children SELECT own transactions, adults/admins SELECT all in family, INSERT for adults/admins
- `manual_points_booking` SECURITY DEFINER function for atomic manual add/deduct with balance clamping
- `award_task_points` SECURITY DEFINER function (shared with PROJ-5) for atomic task completion points
- Indexes on `profile_id`, `family_id`, `created_at`
- Realtime enabled on `points_transactions`

**Server Actions (`src/lib/actions/rewards.ts`):**
- `getRewardsOverviewAction()` -- fetches all children in family with `points_balance`
- `getPointsHistoryAction(profileId)` -- fetches transactions with task title and creator name via joins
- `manualPointsAction(profileId, amount, comment)` -- calls `manual_points_booking` RPC, adults only

**Validation:** Uses `manualPointsSchema` from `src/lib/validations/tasks.ts`

**Design decisions:**
- Balance cannot go negative (DB CHECK constraint + RPC clamping)
- Points are only awarded once per task (`points_awarded` flag checked in RPC)
- Deductions are clamped to current balance (never goes below 0)

**Migration:** `supabase/migrations/20260322_proj4_proj5_proj6_backend.sql`

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
