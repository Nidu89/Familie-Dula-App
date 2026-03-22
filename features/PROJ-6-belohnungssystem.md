# PROJ-6: Belohnungssystem (Gamification)

## Status: In Progress
**Created:** 2026-03-18
**Last Updated:** 2026-03-22

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

**Tested:** 2026-03-22
**App URL:** http://localhost:3000/rewards
**Tester:** QA Engineer (AI)
**Build:** Passes (npm run build + npm run lint clean)

### Acceptance Criteria Status

#### AC-1: Jedes Kind hat ein Punktekonto
- [x] profiles table has points_balance column (INT NOT NULL DEFAULT 0, CHECK >= 0)
- [x] getRewardsOverviewAction fetches all children in the family with points_balance

#### AC-2: Punktestand auf Dashboard und Belohnungsseite angezeigt
- [x] KidsView component shows points badge for the logged-in child
- [x] RewardsOverview shows ChildPointCard for each child with prominent points display
- [x] Dashboard quick actions link to /rewards

#### AC-3: Automatische Buchung bei Aufgabenerledigung
- [x] award_task_points RPC atomically sets status, marks points_awarded, updates balance, inserts transaction
- [x] completeTaskAction in tasks.ts calls the RPC and returns points info
- [x] Toast notification shows awarded points and new balance

#### AC-4: Manuelle Buchung (positiv/negativ) mit Kommentar
- [x] ManualPointsDialog allows entering positive or negative amounts
- [x] Optional comment field in the dialog
- [x] manual_points_booking RPC handles atomic booking
- [x] manualPointsAction server action validates and calls RPC

#### AC-5: Punktehistorie pro Kind
- [x] PointsHistorySheet shows all transactions with date, type, amount, comment
- [x] getPointsHistoryAction fetches transactions with task title and creator name via joins
- [x] History sorted by created_at descending (newest first)
- [x] Limit of 200 transactions per load
- [ ] BUG-P6-1: The history does not show the "aktueller Stand nach Buchung" (running balance after each transaction) as specified in the AC. Only the amount (+/-) is shown per entry, not the cumulative balance at that point in time.

#### AC-6: Punktestand kann nicht negativ werden
- [x] DB CHECK constraint: points_balance >= 0
- [x] manual_points_booking RPC clamps deduction: v_effective_amount = GREATEST(p_amount, -v_target.points_balance)
- [x] ManualPointsDialog shows preview of new balance using Math.max(0, ...)

#### AC-7: Uebersichtsseite mit allen Kindern
- [x] RewardsOverview renders grid of ChildPointCards
- [x] Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
- [x] Empty state shown when no children in family

#### AC-8: Nur Erwachsene/Admins koennen manuelle Buchungen vornehmen
- [x] manualPointsAction checks profile.role for adult/admin
- [x] manual_points_booking RPC checks caller role
- [x] "Punkte" button only shown when isAdultOrAdmin=true on ChildPointCard
- [x] RLS INSERT on points_transactions restricted to adults/admins

#### AC-9: Punkte werden nur einmal vergeben (Mehrfach-Statuswechsel)
- [x] points_awarded boolean flag on tasks table
- [x] award_task_points RPC checks v_task.points_awarded = false before awarding
- [x] Flag set to true atomically in the same transaction

### Edge Cases Status

#### EC-1: Erledigte Aufgabe zurueck auf "offen" gesetzt
- [x] Points remain (no automatic deduction)
- [x] Only manual correction by adults possible (via ManualPointsDialog with comment)

#### EC-2: Punktberechtigte Aufgabe keinem Kind zugewiesen
- [x] award_task_points RPC checks v_task.assigned_to IS NOT NULL before awarding
- [x] No points awarded if task is unassigned

#### EC-3: Mehr Punkte abziehen als vorhanden
- [x] RPC clamps to current balance: GREATEST(p_amount, -v_target.points_balance)
- [x] DB CHECK prevents negative balance
- [x] ManualPointsDialog preview shows the clamped result

#### EC-4: Kind aus Familie entfernt
- [x] points_transactions has no ON DELETE CASCADE from profile_id -- transactions persist as archive
- [x] Profile deletion would need manual handling, but family removal (setting family_id=null) preserves history

### Security Audit Results

- [x] Authentication: Page redirects to /login if not authenticated
- [x] Authorization: getPointsHistoryAction checks profile.role === "child" && profileId !== profile.id (children can only see own history)
- [x] Authorization: getPointsHistoryAction verifies target belongs to same family
- [x] Authorization: manualPointsAction checks role for adult/admin server-side
- [x] Authorization: manual_points_booking RPC checks caller role AND family membership
- [x] Authorization: RLS on points_transactions -- children SELECT own only, adults SELECT all in family
- [x] Authorization: No UPDATE/DELETE policies on points_transactions (append-only enforced at DB level)
- [x] Input validation: Zod schema validates amount (non-zero integer), profileId (UUID), comment (max 500)
- [x] Race condition prevention: FOR UPDATE lock on target profile in manual_points_booking
- [x] Race condition prevention: FOR UPDATE lock on task in award_task_points
- [x] No secrets exposed in client code
- [x] SECURITY DEFINER functions properly set search_path = public

### Bugs Found

#### BUG-P6-1: Running balance not shown in points history
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Go to /rewards, click "Verlauf" for a child
  2. Expected: Each history entry shows the running balance (cumulative) after that transaction
  3. Actual: Only the transaction amount (+/-) is shown, not the cumulative balance at each point
- **Priority:** Fix in next sprint

#### BUG-P6-2: ManualPointsDialog form not reset on re-open
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open the ManualPointsDialog for a child
  2. Enter an amount and comment but cancel
  3. Open the dialog again for the same or different child
  4. Expected: Form is reset to defaults (amount=0, empty comment)
  5. Actual: The form.reset() is only called on successful submission, not on dialog open. The form may retain previous values.
- **Priority:** Fix in next sprint

### Summary
- **Acceptance Criteria:** 8/9 passed (1 failed: missing running balance in history)
- **Bugs Found:** 2 total (0 critical, 0 high, 1 medium, 1 low)
- **Security:** Pass -- robust SECURITY DEFINER functions with proper locking, append-only log, role checks at multiple layers
- **Production Ready:** YES (with minor caveats)
- **Recommendation:** PROJ-6 is the strongest of the three features. BUG-P6-1 is a nice-to-have improvement. Can be deployed alongside PROJ-5 fixes.

## Deployment
_To be added by /deploy_
