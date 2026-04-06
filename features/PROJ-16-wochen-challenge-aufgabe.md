# PROJ-16: Wochen-Challenge als pinnable Aufgabe

## Status: Deployed
**Created:** 2026-04-06
**Last Updated:** 2026-04-06

### Backend Implementation Notes (2026-04-06)
- Migration `20260406_proj16_week_challenge.sql`: adds `week_challenge_task_id` column to `families` table with FK to `tasks(id) ON DELETE SET NULL`, plus `pin_week_challenge` SECURITY DEFINER RPC function
- Zod schema `pinWeekChallengeSchema` added to `src/lib/validations/tasks.ts`
- Server action `pinWeekChallengeAction(taskId: string | null)` added to `src/lib/actions/tasks.ts`
- `getFamilyDataAction` in `src/lib/actions/family.ts` now returns `weekChallengeTaskId`
- `tasks/page.tsx` no longer imports/calls `getFamilyGoalAction`; passes `weekChallengeTaskId` to `TasksList`
- `TasksList` interface extended with optional `weekChallengeTaskId` prop (old props kept for backward compat)
- i18n keys added in de/en/fr: pinAsChallenge, unpinChallenge, weekProgress, noChallengeTitle, noChallengeDescription, challengeCompleted, challengeOpen
- NOTE: Migration must be applied to Supabase (not yet pushed -- CLI was not authenticated)

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung) – `families`-Tabelle, wo der Pin gespeichert wird
- Requires: PROJ-5 (Aufgaben & To-Dos) – Aufgaben, die gepinnt werden können

## Overview
Im Aufgaben-Bereich (`/tasks`) gibt es rechts die **Wochen-Challenge**-Box (blauer Bereich) und unten eine **Fortschrittsleiste**. Bisher wurden dort Daten aus dem Familienziel (PROJ-6) angezeigt. Diese Verknüpfung wird aufgelöst:

- **Wochen-Challenge (rechte Box):** Jede beliebige Aufgabe kann von Erwachsenen/Admins über das Kontext-Menü der Aufgabenkarte als Wochen-Challenge angepinnt werden. Die gepinnte Aufgabe wird dann in der blauen Box angezeigt. Die Auswahl wird pro Familie in der DB gespeichert.
- **Fortschrittsleiste (unten):** Zeigt weiterhin den Gesamtfortschritt über alle Aufgaben, jedoch mit dem festen Titel „Wochen-Fortschritt" – kein Bezug mehr zum Familienziel.

---

## User Stories

- Als Erwachsener/Admin möchte ich eine beliebige Aufgabe als Wochen-Challenge anpinnen, damit die Familie einen gemeinsamen Fokus für die Woche hat.
- Als Familienmitglied möchte ich die aktuelle Wochen-Challenge prominent im Aufgaben-Bereich sehen, ohne die Belohnungs-Seite öffnen zu müssen.
- Als Erwachsener/Admin möchte ich eine gepinnte Aufgabe wieder entfernen (entpinnen) können.
- Als Nutzer möchte ich den Gesamtfortschritt aller Aufgaben in der unteren Leiste sehen, ohne dass dort das Familienziel angezeigt wird.

---

## Acceptance Criteria

- [ ] Jede Aufgabenkarte im Haushalt- und Eigene-To-dos-Bereich hat im Kontext-Menü (für Erwachsene/Admins) die Option „Als Wochen-Challenge anpinnen".
- [ ] Ist bereits eine Aufgabe angepinnt, lautet die Option im Menü der gepinnten Aufgabe „Wochen-Challenge entfernen".
- [ ] Nur Erwachsene/Admins können eine Aufgabe anpinnen oder entpinnen. Kinder sehen diese Option nicht.
- [ ] Der gepinnte `week_challenge_task_id` wird in der `families`-Tabelle gespeichert und ist damit für alle Familienmitglieder identisch.
- [ ] Die blaue Wochen-Challenge-Box zeigt die gepinnte Aufgabe mit: Titel, optionale Beschreibung, optionaler Punktezahl, Status (erledigt/offen) und wer sie erledigt hat.
- [ ] Ist keine Aufgabe angepinnt, zeigt die blaue Box einen leeren Zustand: „Keine Wochen-Challenge – Pinne eine Aufgabe über das Menü."
- [ ] Wird die gepinnte Aufgabe gelöscht, wird `week_challenge_task_id` automatisch auf `null` gesetzt (kaskadierend via DB oder beim Laden festgestellt).
- [ ] Die untere Fortschrittsleiste zeigt immer den Titel **„Wochen-Fortschritt"** – unabhängig davon, ob eine Aufgabe gepinnt ist oder ein Familienziel existiert.
- [ ] Die untere Fortschrittsleiste berechnet den Fortschritt weiterhin als `erledigte Aufgaben / Gesamtaufgaben` (bestehende Logik bleibt erhalten).
- [ ] Das Icon links in der Fortschrittsleiste zeigt ein neutrales Icon (z.B. `ListChecks`), nicht mehr das Emoji des Familienziels.
- [ ] Die Änderung (anpinnen/entpinnen) ist für alle Familienmitglieder sofort sichtbar (Realtime oder Re-fetch nach Aktion).

---

## Edge Cases

- **Gepinnte Aufgabe wird erledigt:** Die Box zeigt sie weiterhin an, markiert sie als erledigt (visuelles Feedback z.B. grüner Haken). Kein automatisches Entpinnen.
- **Gepinnte Aufgabe wird gelöscht:** `week_challenge_task_id` in `families` wird durch `ON DELETE SET NULL` automatisch geleert. Die Box fällt in den leeren Zustand.
- **Familienziel existiert parallel:** Das Familienziel (PROJ-6) bleibt auf der Belohnungs-Seite unverändert. Im Aufgaben-Bereich wird es nicht mehr referenziert.
- **Mehrere Admins pinnen gleichzeitig:** Der letzte Schreibvorgang gewinnt (last-write-wins via Supabase). Kein Lock nötig.
- **Aufgabe ohne Beschreibung/Punkte:** Box zeigt nur Titel und Status; fehlende Felder werden nicht gerendert.
- **Keine Aufgaben vorhanden:** Fortschrittsleiste wird wie bisher nur gezeigt, wenn `totalTasks > 0`.

---

## Technical Requirements

- **DB:** `families`-Tabelle erhält Feld `week_challenge_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL`.
- **RLS:** Nur Erwachsene/Admins der Familie dürfen `week_challenge_task_id` aktualisieren.
- **Server Action:** `pinWeekChallengeAction(taskId | null)` – setzt oder löscht den Pin.
- **Performance:** Kein extra Netzwerkaufruf nötig – `week_challenge_task_id` wird beim initialen Laden der Tasks-Seite mitgeladen.
- **i18n:** Neue Strings in `de`, `en`, `fr` für: „Als Wochen-Challenge anpinnen", „Wochen-Challenge entfernen", „Wochen-Fortschritt", leerer Zustand-Text.

---

## Tech Design (Solution Architect)

### Komponentenstruktur

```
tasks/page.tsx  (Server Component – lädt alles vorab)
│   Lädt: tasks, members, weekChallengeTaskId (aus families-Tabelle)
│   Entfernt: familyGoal / goalContributions (kein Bezug mehr nötig)
│
└── TasksList  (Client Component – bestehend, erweitert)
    │
    ├── "Neue Aufgabe"-Button  (unverändert)
    │
    ├── Bento-Grid (3 Spalten)
    │   ├── Haushalt-Spalte
    │   │   └── TaskCard  (erweitert: neuer "Anpinnen"-Eintrag im Kontext-Menü)
    │   ├── Eigene-To-dos-Spalte
    │   │   └── TaskCard  (erweitert: neuer "Anpinnen"-Eintrag im Kontext-Menü)
    │   └── WeekChallengeBox  (refaktoriert, war: familyGoal-Anzeige)
    │       ├── Angepinnte Aufgabe vorhanden → zeigt Titel, Beschreibung,
    │       │   Punktezahl, Status-Badge ("Erledigt" / "Offen")
    │       └── Keine Aufgabe angepinnt → leerer Zustand mit Hinweistext
    │
    └── WeekProgressBar  (refaktoriert, war: familyGoal-Titel)
        ├── Icon: ListChecks (fest, kein Familienziel-Emoji mehr)
        ├── Titel: "Wochen-Fortschritt" (fest, kein familyGoal.title mehr)
        └── Fortschritt: erledigte / Gesamt-Aufgaben (Logik unverändert)
```

### Datenmodell

**Änderung an bestehender Tabelle `families`:**
- Neues Feld: `week_challenge_task_id` (optional, Fremdschlüssel auf `tasks.id`)
- Wenn die referenzierte Aufgabe gelöscht wird → Feld wird automatisch auf leer gesetzt (ON DELETE SET NULL)
- Kein neues Konzept „Gruppenaufgabe" nötig – jede bestehende Aufgabe kann angepinnt werden

**Kein neues Tabellenmodell erforderlich.**

### Neue Server Actions

| Action | Wer darf sie aufrufen | Was sie tut |
|---|---|---|
| `pinWeekChallengeAction(taskId)` | Nur Erwachsene/Admins | Setzt `week_challenge_task_id` in `families` auf die übergebene Aufgaben-ID |
| `unpinWeekChallengeAction()` | Nur Erwachsene/Admins | Setzt `week_challenge_task_id` in `families` auf leer |

### Geänderte Datenladelogik (tasks/page.tsx)

| Vorher | Nachher |
|---|---|
| Lädt `familyGoal` und `goalContributions` via `getFamilyGoalAction()` | Entfällt vollständig |
| `getFamilyDataAction()` gibt nur Members zurück | Gibt zusätzlich `weekChallengeTaskId` zurück (aus families-Tabelle) |
| Übergibt `familyGoal` und `goalContributions` an `TasksList` | Übergibt nur `weekChallengeTaskId` an `TasksList` |

### Änderungen an bestehenden Komponenten

**TaskCard:**
- Für Erwachsene/Admins: Neuer Eintrag im bestehenden Kontext-Menü (DropdownMenu – bereits installiert)
  - Ist die Aufgabe aktuell angepinnt → „Wochen-Challenge entfernen"
  - Ist sie nicht angepinnt → „Als Wochen-Challenge anpinnen"
- Kinder sehen den Menüeintrag nicht

**TasksList:**
- Props `familyGoal` und `goalContributions` werden entfernt
- Neues Prop `weekChallengeTaskId` (string | null) wird hinzugefügt
- `WeekChallengeBox` und `WeekProgressBar` nutzen nur noch Aufgaben-Daten

### Sicherheit & Zugriffsregeln (RLS)

- Neue Datenbankregel: Nur Erwachsene/Admins der Familie dürfen `week_challenge_task_id` in `families` aktualisieren
- Kinder dürfen das Feld lesen, aber nicht schreiben

### Echtzeit-Verhalten

- Nach dem Anpinnen/Entpinnen ruft die Client-Komponente die Aufgaben neu ab (bestehender `fetchTasks`-Mechanismus)
- Alle Familienmitglieder sehen die Änderung sofort über den vorhandenen Supabase-Realtime-Kanal für `tasks`

### i18n-Erweiterung

Neue Übersetzungsschlüssel in Deutsch, Englisch und Französisch:
- „Als Wochen-Challenge anpinnen"
- „Wochen-Challenge entfernen"
- „Wochen-Fortschritt"
- Leerer-Zustand-Text der Challenge-Box

### Datenbankmigrierung

Eine einzige neue Migration:
- `families`-Tabelle: Feld `week_challenge_task_id` hinzufügen mit FK auf `tasks(id)` ON DELETE SET NULL
- RLS-Policy für `families`: UPDATE-Berechtigung für `week_challenge_task_id` auf Erwachsene/Admins beschränken

### Neue Pakete
Keine – alle benötigten Komponenten (DropdownMenu, etc.) sind bereits installiert.

## QA Test Results

**Tested:** 2026-04-06
**Tester:** QA Engineer (AI)
**Build:** Passes (`npm run build` clean, keine TS-Fehler)

### Acceptance Criteria Status

#### AC-1: Kontext-Menü mit "Als Wochen-Challenge anpinnen" (nur Erwachsene/Admins)
- [x] TaskCard zeigt DropdownMenu mit Pin/PinOff-Icons und lokalisierten Labels
- [x] Menü nur sichtbar wenn `isAdultOrAdmin === true`

#### AC-2: Gepinnte Aufgabe zeigt "Wochen-Challenge entfernen"
- [x] `isPinned`-Flag vergleicht `weekChallengeTaskId === task.id`
- [x] Toggle zwischen `pinAsChallenge` und `unpinChallenge` korrekt

#### AC-3: Kinder sehen Pin-Option nicht
- [x] Gesamtes `DropdownMenu` in `{isAdultOrAdmin && ...}` gewrappt

#### AC-4: `week_challenge_task_id` in families-Tabelle gespeichert
- [x] Migration fügt `week_challenge_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL` hinzu
- [x] RPC-Funktion `pin_week_challenge` als SECURITY DEFINER
- [x] `getFamilyDataAction` gibt `weekChallengeTaskId` zurück

#### AC-5: Blaue Box zeigt gepinnte Aufgabe (Titel, Beschreibung, Punkte, Status, Zugewiesener)
- [x] Titel: `challengeTask.title`
- [x] Beschreibung: optional, `line-clamp-3`
- [x] Status-Badge: `CheckCircle2` (Erledigt) / `CircleDashed` (Offen)
- [x] Punkte-Badge: nur wenn `points > 0`
- [x] Zugewiesener Name mit Initialen-Avatar

#### AC-6: Leerer Zustand wenn nichts angepinnt
- [x] Trophy-Icon + `noChallengeTitle` + `noChallengeDescription`

#### AC-7: Gelöschte Aufgabe → auto NULL
- [x] `ON DELETE SET NULL` in DB-Migration

#### AC-8: Fortschrittsleiste immer "Wochen-Fortschritt"
- [x] Fester Text via `t("list.weekProgress")`

#### AC-9: Fortschrittsberechnung unverändert
- [x] `doneTasks / totalTasks * 100` — identische Logik wie vorher

#### AC-10: ListChecks-Icon statt Familienziel-Emoji
- [x] `<ListChecks>` fest im Fortschrittsbalken

#### AC-11: Re-fetch nach Pin/Unpin
- [x] `refreshWeekChallenge` ruft `getFamilyDataAction()` + `fetchTasks()` auf
- [ ] BUG-P16-4: Kein Realtime für families-Tabelle (siehe Bugs)

### Sicherheits-Audit

- [x] RPC prüft Auth (`auth.uid()`), Rolle (`adult`/`admin`), und Familien-Zugehörigkeit
- [x] Server Action validiert Input via Zod (UUID oder null)
- [x] Server Action prüft `verifyAdultOrAdmin()` vor RPC-Aufruf
- [x] Fehlermeldungen aus RPC werden auf benutzerfreundliche Texte gemappt (kein Leak)
- [x] ON DELETE SET NULL verhindert verwaiste Referenzen
- [x] Keine Secrets im Client-Code exponiert

### Bugs

#### BUG-P16-1: Doppeltes Prozentzeichen in Fortschrittsleiste
- **Severity:** Medium
- **Schritte:**
  1. Tasks-Seite öffnen mit erledigten Aufgaben
  2. Fortschrittsleiste unten anschauen
  3. Erwartet: "75% der Aufgaben erledigt!"
  4. Tatsächlich: "75% % der Aufgaben erledigt!" (doppeltes %)
- **Ursache:** Code rendert `{completionPercent}%` + Leerzeichen + `t("list.percentDone")`, aber der i18n-Wert beginnt selbst mit `%` (`"% der Aufgaben erledigt!"`)
- **Fix:** i18n-Wert ändern zu `"der Aufgaben erledigt!"` oder parametrisieren

#### BUG-P16-2: Kein Realtime für Familien-Tabellen-Änderungen
- **Severity:** Low
- **Schritte:**
  1. /tasks in zwei Browser-Tabs öffnen
  2. In Tab 1 eine Aufgabe als Wochen-Challenge anpinnen
  3. Erwartet: Tab 2 zeigt sofort die gepinnte Aufgabe
  4. Tatsächlich: Tab 2 zeigt die Änderung erst nach Seitenreload
- **Ursache:** Realtime-Subscription lauscht nur auf `tasks`-Tabelle, nicht auf `families`
- **Priorität:** Nice-to-have (Pin-Aktion ist selten, Reload ist zumutbar)

#### BUG-P16-3: Verwaister i18n-Key `weeklyProgress`
- **Severity:** Low
- **Schritte:** `weeklyProgress` existiert in allen 3 Locale-Dateien, wird aber nie im Code verwendet (Code nutzt `weekProgress`)
- **Fix:** `weeklyProgress` aus allen Locale-Dateien entfernen

#### BUG-P16-4: Deprecated Props `familyGoal` und `goalContributions` werden weiterhin übergeben
- **Severity:** Low
- **Ursache:** `tasks/page.tsx` übergibt `familyGoal={null}` und `goalContributions={[]}` obwohl diese Props als `@deprecated` markiert sind
- **Fix:** Props aus page.tsx und TasksListProps-Interface entfernen

### Zusammenfassung
- **Acceptance Criteria:** 10/11 bestanden (1 mit Einschränkung: Realtime nur lokal)
- **Bugs gefunden:** 4 total (1 Medium, 3 Low)
- **Sicherheit:** Keine kritischen Probleme
- **Production Ready:** JA — kein Critical oder High Bug vorhanden

## Deployment

**Deployed:** 2026-04-06
**Commit:** fa7d440
**Production URL:** https://familie-dula-app.vercel.app/tasks
**DB Migration:** `20260406_proj16_week_challenge` — applied to `fmmorvmshvgqatnefkpf`
**Status:** PROJ-16 → Deployed in INDEX.md
