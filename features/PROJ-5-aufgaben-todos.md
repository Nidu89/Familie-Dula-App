# PROJ-5: Aufgaben & To-Dos

## Status: In Progress
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung) – Zuweisung an Familienmitglieder.
- Soft dependency: PROJ-6 (Belohnungssystem) – Aufgaben können Punkte vergeben.

## User Stories
- Als Erwachsener/Admin möchte ich Aufgaben erstellen und Familienmitgliedern zuweisen, damit jeder weiß, was er tun soll.
- Als Kind möchte ich meine zugewiesenen Aufgaben sehen und als erledigt markieren können.
- Als Nutzer möchte ich Aufgaben nach Person, Status und Fälligkeit filtern können, damit ich schnell finde, was relevant ist.
- Als Erwachsener möchte ich Aufgaben mit Priorität und Fälligkeitsdatum versehen, damit wichtige Aufgaben zuerst erledigt werden.
- Als Erwachsener möchte ich optionale Unteraufgaben (Checklisten) zu einer Aufgabe hinzufügen.
- Als Erwachsener/Admin möchte ich den Status einer Aufgabe ändern (offen → in Bearbeitung → erledigt).
- Als Erwachsener möchte ich wiederkehrende Aufgaben anlegen können (z.B. täglich, wöchentlich), damit ich sie nicht jedes Mal manuell erstellen muss.

## Acceptance Criteria
- [ ] Aufgaben-Felder: Titel (Pflicht), Beschreibung, Fälligkeitsdatum, Status, Priorität (niedrig/mittel/hoch), Kategorie, Zuweisung an ein Familienmitglied.
- [ ] Status-Optionen: Offen, In Bearbeitung, Erledigt.
- [ ] Listenansicht zeigt alle Familienaufgaben mit Filtern nach: Zugewiesene Person, Status, Fälligkeit (heute, diese Woche, überfällig).
- [ ] Kinder können nur ihre eigenen Aufgaben als erledigt markieren; sie können keine Aufgaben erstellen, bearbeiten oder löschen.
- [ ] Erwachsene und Admins können alle Aufgaben der Familie erstellen, bearbeiten, zuweisen und löschen.
- [ ] Unteraufgaben: Optional einer Aufgabe Checklistenpunkte hinzufügen (Titel + erledigt-Status).
- [ ] Überfällige Aufgaben werden visuell hervorgehoben (z.B. rotes Datum).
- [ ] Punkte-Feld: Optional kann einer Aufgabe eine Punktzahl zugewiesen werden (Integration PROJ-6).
- [ ] Beim Erledigen einer punktberechtigten Aufgabe durch ein Kind werden die Punkte automatisch dem Kind gutgeschrieben.
- [ ] Wiederkehrende Aufgaben: Täglich, wöchentlich, monatlich; Optionen beim Bearbeiten/Löschen: "Nur diese", "Diese und alle folgenden", "Alle".
- [ ] Realtime: Status-Änderungen sind sofort für alle Familienmitglieder sichtbar.

## Edge Cases
- Was passiert, wenn eine Aufgabe keinem Mitglied zugewiesen ist? → "Unzugewiesen" – nur Erwachsene/Admins können sie abhaken.
- Was passiert, wenn ein zugewiesenes Mitglied aus der Familie entfernt wird? → Aufgabe bleibt bestehen, Zuweisung wird auf "Unzugewiesen" gesetzt.
- Was passiert, wenn eine Aufgabe mit Unteraufgaben gelöscht wird? → Alle Unteraufgaben werden mitgelöscht (Kaskade).
- Was passiert, wenn eine erledigte Aufgabe wieder auf "offen" gesetzt wird? → Bereits vergebene Punkte bleiben (keine automatische Rückbuchung); Eltern können manuell korrigieren.
- Was passiert bei sehr vielen Aufgaben (>100)? → Pagination oder virtuelles Scrollen.
- Was passiert, wenn eine Aufgabe aus einer Wiederholungsserie bearbeitet wird? → Fragen: "Nur diese", "Diese und alle folgenden", "Alle".
- Was passiert, wenn eine wiederkehrende Aufgabe Punkte hat und als erledigt markiert wird? → Punkte nur für diese Instanz vergeben, nicht für die gesamte Serie.

## Technical Requirements
- RLS: Kinder können nur eigene zugewiesene Aufgaben auf "erledigt" setzen, nichts anderes.
- Punkte-Buchung wird transaktional mit Aufgaben-Erledigung durchgeführt (kein doppeltes Vergeben).
- Realtime: Supabase Realtime für Statusänderungen.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Aufgaben-Seite (Server – lädt initiale Aufgaben)
│
├── TasksHeader
│   ├── FilterBar (Person, Status, Fälligkeit: heute/diese Woche/überfällig)
│   └── "Neue Aufgabe"-Button (nur Erwachsene/Admins)
│
├── TasksList (Client – Realtime)
│   ├── SectionHeader ("Überfällig" / "Heute" / "Diese Woche" / "Später")
│   ├── TaskCard
│   │   ├── Checkbox (Kind: nur eigene; Erwachsene: alle)
│   │   ├── Titel + optionale Beschreibung
│   │   ├── PriorityBadge (niedrig/mittel/hoch, farbig)
│   │   ├── DueDateLabel (rot wenn überfällig)
│   │   ├── AssigneeAvatar
│   │   ├── PointsBadge (optional, falls Punkte vergeben)
│   │   └── SubtaskProgress ("2/5 Unteraufgaben" Mini-Bar)
│   └── EmptyState ("Alle Aufgaben erledigt!")
│
├── TaskFormDialog (Client – shadcn Dialog, nur Erwachsene)
│   ├── Felder: Titel, Beschreibung, Fälligkeitsdatum
│   ├── Status-Select (Offen / In Bearbeitung / Erledigt)
│   ├── Priorität-Select (Niedrig / Mittel / Hoch)
│   ├── Zuweisung-Select (Familienmitglied oder Unzugewiesen)
│   ├── Punkte-Input (optional, integer ≥ 0)
│   ├── Wiederholung-Select (tägl./wöch./monatl.)
│   └── Unteraufgaben-Liste (Einträge hinzufügen/entfernen/abhaken)
│
└── SeriesEditDialog (Auswahl bei Serien-Bearbeitung)
    └── "Nur diese" / "Diese + folgende" / "Alle"
```

### Datenmodell

**Tabelle `tasks`** – eine Aufgabe pro Eintrag:
| Feld | Beschreibung |
|------|-------------|
| id | Eindeutige ID |
| family_id | Zugehörige Familie |
| created_by | Ersteller (Profil-ID) |
| assigned_to | Zugewiesenes Mitglied (null = unzugewiesen) |
| title | Titel (Pflicht) |
| description | Optionale Beschreibung |
| due_date | Fälligkeitsdatum (optional) |
| status | open / in_progress / done |
| priority | low / medium / high |
| points | Punktwert (null = keine Punkte) |
| points_awarded | Verhindert doppeltes Vergeben (ja/nein) |
| recurrence_rule | RRULE-Regel (null = Einzelaufgabe) |
| recurrence_parent_id | Verweist auf Ursprungsaufgabe einer Serie |
| is_exception | Diese Aufgabe überschreibt eine Serien-Instanz |
| created_at / updated_at | Zeitstempel |

**Tabelle `subtasks`** – Unteraufgaben einer Aufgabe:
| Feld | Beschreibung |
|------|-------------|
| id | Eindeutige ID |
| task_id | Zugehörige Aufgabe |
| title | Bezeichnung |
| is_done | Erledigt ja/nein |
| position | Reihenfolge (integer) |

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Gleiche RRULE-Logik wie PROJ-4 | Konsistenz – dasselbe `rrule`-Paket kann wiederverwendet werden |
| Punkte-Vergabe transaktional mit Status-Änderung | Datenbank-Funktion stellt sicher: entweder beides klappt oder nichts – kein "Punkte ohne erledigte Aufgabe" oder umgekehrt |
| `points_awarded`-Flag statt Duplikat-Check | Einfachste Lösung um doppeltes Vergeben zu verhindern; wird mit der Transaktion gesetzt |
| Realtime für Statusänderungen | Kind erledigt Aufgabe → Elternteil sieht es sofort auf Dashboard |
| RLS: Kinder nur eigene Aufgaben auf "done" setzen | Datenbankregel, nicht nur UI-Einschränkung |

### Neue Pakete
Keines – `rrule` und `date-fns` sind bereits durch PROJ-4 vorhanden.

### Neue Datenbank-Tabellen
- `tasks`
- `subtasks`

### Neue Server Actions
- `createTaskAction` / `updateTaskAction` / `deleteTaskAction`
- `completeTaskAction` (setzt Status + bucht Punkte transaktional)
- `getTasksAction` (gefiltert nach Familie, Person, Status, Fälligkeit)

### Neue Seiten & Komponenten
| Pfad | Was |
|------|-----|
| `src/app/(app)/tasks/page.tsx` | Aufgaben-Seite |
| `src/components/tasks/` | Alle Aufgaben-Komponenten |
| `src/lib/actions/tasks.ts` | Server Actions für Aufgaben |
| `src/lib/validations/tasks.ts` | Zod-Schema für Aufgaben-Formular |

## Backend Implementation Notes (2026-03-22)

**Database:**
- `tasks` table with RLS: family members SELECT, adults/admins INSERT/UPDATE/DELETE
- `subtasks` table with ON DELETE CASCADE, RLS: family read, adults write, children can toggle `is_done` on assigned tasks
- `award_task_points` SECURITY DEFINER function for atomic task completion + points awarding
- Auto-update `updated_at` trigger on tasks
- Indexes on `family_id`, `assigned_to`, `status`, `due_date`, `recurrence_parent_id`
- Realtime enabled

**Server Actions (`src/lib/actions/tasks.ts`):**
- `getTasksAction(filters?)` -- fetches tasks with subtasks, supports assignedTo/status/dueGroup filters
- `createTaskAction(data)` -- creates task + subtasks
- `updateTaskAction(id, data)` -- handles single/following/all series modes
- `deleteTaskAction(id, seriesMode)` -- handles series modes, subtasks cascade
- `completeTaskAction(taskId)` -- CRITICAL: calls `award_task_points` RPC for atomic status + points

**Validation (`src/lib/validations/tasks.ts`):**
- Zod schemas for task CRUD, subtasks, filters, manual points

**Design decision:** Children complete tasks exclusively via the `award_task_points` RPC (SECURITY DEFINER), which verifies `assigned_to` matches the caller. RLS on `tasks` table does not allow children to UPDATE directly -- this avoids the column-level restriction limitation of Postgres RLS.

**Migration:** `supabase/migrations/20260322_proj4_proj5_proj6_backend.sql`

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
