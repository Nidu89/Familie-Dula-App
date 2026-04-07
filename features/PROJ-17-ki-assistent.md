# PROJ-17: KI-Assistent (Family AI Agent)

## Status: In Progress
**Created:** 2026-04-07
**Last Updated:** 2026-04-07 (Architecture added)

## Dependencies
- Requires: PROJ-1 (Authentifizierung) — eingeloggter Nutzer für alle Tool-Calls
- Requires: PROJ-2 (Familienverwaltung) — Admin-Rolle für API-Key-Verwaltung
- Requires: PROJ-4 (Familienkalender) — Kalender-Daten lesen/schreiben
- Requires: PROJ-5 (Aufgaben & To-Dos) — Aufgaben lesen/erstellen
- Requires: PROJ-7 (Einkaufslisten) — Einkaufslistenpunkte lesen/hinzufügen
- Requires: PROJ-8 (Essens- & Rezeptplanung) — Mahlzeiten lesen/hinzufügen
- Requires: PROJ-14 (Familien-Rituale) — Rituale/Routinen lesen/erstellen

## Summary
Ein KI-Assistent auf Basis der Claude API (Anthropic), der über einen Floating Button überall in der App erreichbar ist. Der Admin hinterlegt einmalig den Anthropic API-Key in den Familieneinstellungen — alle Familienmitglieder teilen diesen Key. Der Assistent versteht natürliche Sprache und kann alle wichtigen App-Funktionen ausführen (Aufgaben, Kalender, Rituale, Einkaufslist, Essensplan).

## User Stories
- Als Admin möchte ich meinen Anthropic API-Key in den Familieneinstellungen hinterlegen, damit alle Familienmitglieder den KI-Assistenten nutzen können.
- Als Familienmitglied möchte ich den Assistenten per Floating Button öffnen, ohne die aktuelle Seite zu verlassen.
- Als Familienmitglied möchte ich dem Assistenten in natürlicher Sprache sagen „Erstelle eine Aufgabe: Zimmer aufräumen für Maria bis Freitag", damit die Aufgabe direkt angelegt wird.
- Als Familienmitglied möchte ich fragen „Was steht diese Woche an?", um Kalender und Aufgaben auf einen Blick zu sehen.
- Als Familienmitglied möchte ich sagen „Füge Milch zur Einkaufsliste hinzu", damit das ohne manuelles Navigieren klappt.
- Als Familienmitglied möchte ich Rituale über den Assistenten anlegen können (z.B. „Erstelle ein neues Ritual: Spieleabend jeden Freitag").
- Als Kind möchte ich den Assistenten genauso nutzen wie Erwachsene — der Assistent handelt immer im Namen meines eigenen Accounts.
- Als Admin möchte ich den API-Key jederzeit ändern oder löschen können.

## Acceptance Criteria

### API-Key-Verwaltung
- [ ] In den Familieneinstellungen (`/family/settings`) gibt es einen neuen Abschnitt „KI-Assistent".
- [ ] Nur Admins können den API-Key eingeben, ändern oder löschen (UI-Guard + RLS).
- [ ] Der API-Key wird verschlüsselt in der Datenbank gespeichert und nie im Klartext an den Client übertragen (nur masked: `sk-ant-...****`).
- [ ] Wenn kein API-Key gesetzt ist, zeigt der Floating Button beim Öffnen eine Meldung: „Noch kein API-Key konfiguriert. Bitte den Admin der Familie fragen."

### Floating Button & Chat-Dialog
- [ ] Ein Floating Button (unten rechts, über der BottomNav) ist auf allen authentifizierten Seiten sichtbar.
- [ ] Klick öffnet einen Chat-Dialog (Sheet oder Modal), ohne die aktuelle Seite zu verlassen.
- [ ] Der Chat zeigt beim ersten Öffnen eine Begrüßung mit einer kurzen Liste der möglichen Aktionen.
- [ ] Der Chat behält den Gesprächsverlauf während der Session (Browser-Tab). Beim Schließen und Wiedereröffnen beginnt ein neues Gespräch.
- [ ] Der Assistent antwortet in der Sprache des eingeloggten Nutzers (de/en/fr gemäß Locale-Einstellung).

### Agent-Tools (Aktionen)
- [ ] **Aufgaben lesen:** Der Assistent kann die offenen Aufgaben des Nutzers und der Familie auflisten.
- [ ] **Aufgabe erstellen:** Der Assistent kann eine neue Aufgabe anlegen (Titel, Beschreibung, Zugewiesene Person, Fälligkeitsdatum).
- [ ] **Kalender lesen:** Der Assistent kann bevorstehende Termine auflisten (nächste 7/30 Tage).
- [ ] **Kalender-Event erstellen:** Der Assistent kann einen neuen Termin anlegen (Titel, Datum, Uhrzeit, optional Beschreibung).
- [ ] **Rituale lesen:** Der Assistent kann bestehende Familien-Rituale auflisten.
- [ ] **Ritual erstellen:** Der Assistent kann ein neues Ritual anlegen (Titel, Beschreibung, Frequenz).
- [ ] **Einkaufsliste lesen:** Der Assistent kann aktuelle Einkaufslisten-Einträge ausgeben.
- [ ] **Einkaufslistenpunkt hinzufügen:** Der Assistent kann einen neuen Punkt zur aktiven Einkaufsliste hinzufügen.
- [ ] **Essensplan lesen:** Der Assistent kann den aktuellen Essensplan (diese Woche) ausgeben.
- [ ] **Mahlzeit hinzufügen:** Der Assistent kann eine Mahlzeit für einen bestimmten Tag zum Essensplan hinzufügen.

### Sicherheit
- [ ] Jeder Tool-Call wird serverseitig unter der Identität des eingeloggten Nutzers ausgeführt (RLS greift wie gewohnt).
- [ ] Der API-Key verlässt den Server nie — alle Claude-API-Calls laufen über eine Server Action.
- [ ] Chat-Nachrichten werden NICHT in der Datenbank gespeichert (nur in-memory / Client-State).

## Edge Cases
- **Kein API-Key:** Dialog öffnet, zeigt Info-Meldung, kein Eingabefeld aktiv.
- **Ungültiger API-Key:** Claude antwortet mit Fehler → Assistent zeigt freundliche Fehlermeldung „API-Key ist ungültig. Bitte den Admin informieren."
- **Netzwerkfehler:** Spinner, dann Fehlermeldung mit „Erneut versuchen"-Button.
- **Tool-Call schlägt fehl** (z.B. Aufgabe konnte nicht erstellt werden): Assistent informiert den Nutzer über den Fehler und schlägt vor, es manuell zu versuchen.
- **Kind nutzt den Assistenten:** Assistent erstellt Aufgaben/Kalendereinträge immer im Namen des eingeloggten Kindes (kein Bypass von RLS möglich).
- **Admin löscht API-Key während einer Session:** Nächster Tool-Call schlägt fehl → Fehlermeldung wie bei ungültigem Key.
- **Langer Chat-Verlauf:** Token-Limit wird durch serverseitiges Trimmen des Verlaufs (nur letzte N Nachrichten) verhindert.
- **Gleichzeitige Anfragen:** Loading-State im Chat-Input während Antwort lädt; Input deaktiviert.
- **Claude-Modell:** Verwendet `claude-sonnet-4-6` (schnell, kosteneffizient, Tool Use nativ).

## Technical Requirements
- **KI-Modell:** `claude-sonnet-4-6` via Anthropic SDK (`@anthropic-ai/sdk`)
- **Tool Use:** Claude native Tool Use API (kein Function-Calling-Wrapper nötig)
- **API-Route:** `POST /api/assistant/chat` — Server Action oder Route Handler (streaming optional)
- **API-Key-Speicherung:** In `family_settings`-Tabelle (oder neuer Spalte), AES-256 verschlüsselt
- **Session-State:** React State im Floating-Button-Komponenten (kein DB-Persist)
- **Streaming (optional):** Vercel AI SDK oder direkte Anthropic Streaming für flüssige UX
- **Sicherheit:** Rate Limiting auf `/api/assistant/chat` (z.B. 20 Requests/min/User)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
AppShell (vorhanden — wird erweitert)
+-- AssistantButton (NEU — schwebend, unten rechts, über BottomNav)
    +-- AssistantSheet (NEU — shadcn Sheet, schiebt sich von rechts rein)
        +-- AssistantHeader
        |   +-- Titel "KI-Assistent" + Schließen-Button
        +-- AssistantMessages (scrollbare Liste)
        |   +-- WelcomeMessage (beim ersten Öffnen)
        |   +-- AssistantMessage (je Nachricht)
        |       +-- Avatar (Nutzer-Initialen oder Bot-Icon)
        |       +-- Nachrichtenblase (user/assistant styled)
        |       +-- ToolResultCard (Erfolgs-Feedback wenn Aktion ausgeführt)
        +-- AssistantInput
            +-- Textarea (mehrzeilig)
            +-- Senden-Button (deaktiviert während KI antwortet)

Family Settings Seite (vorhanden — wird erweitert)
+-- AI-Assistent Abschnitt (NEU — nur für Admins sichtbar)
    +-- ApiKeySection
        +-- Status-Anzeige ("Key konfiguriert: sk-ant-...****")
        +-- [Ändern]-Button → zeigt Input-Feld
        +-- [Löschen]-Button → bestätigt mit Alert-Dialog
        +-- Input-Feld + [Speichern]-Button (Edit-Modus)
```

### Datenmodell

**Neue Tabelle: `family_ai_settings`**
- `family_id` — Welche Familie (eindeutig, 1:1 mit families)
- `api_key_encrypted` — API-Key AES-256-GCM verschlüsselt (verlässt DB nie im Klartext)
- `updated_at` — Wann zuletzt geändert
- `updated_by` — Welches Familienmitglied hat den Key gesetzt

**Chat-Verlauf:** Kein DB-Eintrag. Liegt ausschließlich im React State (Browser). Wird beim Tab-Reload gelöscht.

### Request-Ablauf (Agentic Loop)

```
Nutzer → AssistantInput → POST /api/assistant/chat
  1. Auth-Check
  2. API-Key aus DB holen + entschlüsseln
  3. Nachricht + Verlauf + Tool-Definitionen → Claude API
  4. Claude gibt tool_use zurück → Server führt Tool aus (Supabase, RLS aktiv)
  5. Tool-Ergebnis → Claude → finale Textantwort
  6. Antwort + ToolResultCard → Client
```

### Die 10 Agent-Tools

| Tool | Aktion |
|------|--------|
| `list_tasks` | Offene Aufgaben der Familie lesen |
| `create_task` | Neue Aufgabe erstellen (Titel, Person, Datum) |
| `list_calendar_events` | Termine der nächsten 7/30 Tage lesen |
| `create_calendar_event` | Neuen Termin anlegen |
| `list_rituals` | Familien-Rituale auflisten |
| `create_ritual` | Neues Ritual anlegen (Titel, Frequenz) |
| `list_shopping_items` | Aktuelle Einkaufsliste lesen |
| `add_shopping_item` | Punkt zur Einkaufsliste hinzufügen |
| `get_meal_plan` | Essensplan der aktuellen Woche lesen |
| `add_meal` | Mahlzeit für einen Tag eintragen |

### Tech-Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| KI-SDK | `@anthropic-ai/sdk` | Einziges nötige Paket, Tool Use nativ, kein Wrapper |
| Request-Typ | Route Handler (`/api/assistant/chat`) | Server Actions eignen sich nicht für mehrstufige Tool-Loops |
| Streaming | Kein Streaming (v1) | Einfacher, 2–5s akzeptabel, später nachrüstbar |
| Verschlüsselung | AES-256-GCM via Node.js crypto | Kein Extra-Paket, Server-Secret als Umgebungsvariable |
| UI-Komponente | shadcn `Sheet` (vorhanden) | Lässt aktuelle Seite sichtbar, passt zum Floating-Button |
| Chat-Speicher | React State only | Privatsphäre, einfach, kein DB nötig |
| Token-Limit | Server trimmt auf letzte 10 Nachrichten | Kostenkontrolle, verhindert Timeouts |

### Neue Pakete

| Paket | Zweck |
|---|---|
| `@anthropic-ai/sdk` | Offizielle Claude API (Tool Use, Nachrichten) |

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
