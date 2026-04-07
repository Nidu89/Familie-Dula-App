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

## Backend Implementation Notes

**Completed by /backend on 2026-04-07:**

### Files Created
1. **Database Migration:** `supabase/migrations/20260407_proj17_family_ai_settings.sql`
   - `family_ai_settings` table (family_id PK, api_key_encrypted, updated_at, updated_by)
   - RLS: admin-only for SELECT/INSERT/UPDATE/DELETE
   - `get_family_ai_key()` SECURITY DEFINER function for non-admin family members to read encrypted key
   - Auto-update trigger for `updated_at`
   - Index on `updated_by`

2. **Encryption Utility:** `src/lib/crypto.ts`
   - AES-256-GCM via Node.js crypto
   - Key from `AI_KEY_ENCRYPTION_SECRET` env var (64-char hex = 32 bytes)
   - Format: base64(iv + authTag + ciphertext)
   - `encrypt()`, `decrypt()`, `maskApiKey()` exports

3. **Validation Schemas:** `src/lib/validations/assistant.ts`
   - `saveApiKeySchema` — validates API key format (sk-ant-* prefix)
   - `chatRequestSchema` — messages array + locale
   - Tool input schemas: `listTasksInputSchema`, `createTaskInputSchema`, `listCalendarEventsInputSchema`, `createCalendarEventInputSchema`, `listShoppingItemsInputSchema`, `addShoppingItemInputSchema`, `getMealPlanInputSchema`, `addMealInputSchema`

4. **Server Actions:** `src/lib/actions/assistant.ts`
   - `saveApiKeyAction()` — encrypt + upsert, admin-only
   - `deleteApiKeyAction()` — delete key, admin-only
   - `getApiKeyStatusAction()` — returns configured boolean + masked key for admins

5. **Agent Tools:** `src/lib/assistant/tools.ts`
   - 11 tool definitions (original 10 + `list_shopping_lists` for list discovery)
   - `executeTool()` dispatcher
   - `getFamilyMembers()` helper for system prompt context
   - All tools use RLS-scoped Supabase client (user identity preserved)
   - Create tools (task, event, ritual) bypass `verifyAdultOrAdmin()` — children can create via assistant

6. **Route Handler:** `src/app/api/assistant/chat/route.ts`
   - `POST /api/assistant/chat`
   - Auth check, rate limiting (20 req/min/user), input validation
   - Cross-origin blocking
   - Decrypts API key via SECURITY DEFINER RPC
   - Agentic loop: max 5 tool iterations
   - Locale-aware system prompt (de/en/fr)
   - Claude claude-sonnet-4-6 model
   - Token management: trims to last 10 messages
   - Returns `{ message, toolResults }` JSON

7. **Env Example:** `.env.local.example` updated with `AI_KEY_ENCRYPTION_SECRET`

### Design Decisions
- Added `list_shopping_lists` as an 11th tool (user asked: always ask which list). The assistant must call this first to show available lists before adding items.
- Children can create tasks, events, and rituals via the assistant — the tool functions insert directly into Supabase with RLS (which allows family members to insert). The `verifyAdultOrAdmin()` check from normal server actions is intentionally bypassed.
- Rate limit key includes both user ID and IP for defense in depth.

## QA Test Results

**QA Date:** 2026-04-07
**Tested by:** QA Engineer (code review + automated tests)

### Build & Existing Tests
- [x] `npm run build` — passes, no errors
- [x] `npm test` — 162/162 tests pass (including 42 new PROJ-17 tests)
- [x] No regressions in existing test suites

### Acceptance Criteria — Code Review

#### API-Key-Verwaltung
- [x] AC-1: Family Settings hat "KI-Assistent" Abschnitt (`api-key-section.tsx` + `family/settings/page.tsx`)
- [x] AC-2: Nur Admins — `verifyAdmin()` in Server Actions, `{isAdmin && <ApiKeySection />}` im UI, RLS admin-only
- [x] AC-3: Verschlüsselung — AES-256-GCM in `crypto.ts`, masked output via `maskApiKey()`, Key nie im Klartext an Client
- [x] AC-4: Kein Key → "Noch kein API-Key konfiguriert" Meldung im Chat-Sheet

#### Floating Button & Chat-Dialog
- [x] AC-5: Floating Button vorhanden in `app-shell.tsx`, `AssistantButton` Komponente
- [x] AC-6: Sheet öffnet sich von rechts (shadcn Sheet side="right")
- [x] AC-7: Welcome-Message mit Aktionsliste beim ersten Öffnen
- [x] AC-8: Session-only State (React useState, kein DB-Persist)
- [x] AC-9: Locale-aware System Prompt (de/en/fr in `getSystemPrompt()`)

#### Agent-Tools
- [x] AC-10–19: 11 Tools definiert und implementiert (10 geplant + `list_shopping_lists`)
- [x] Tool-Implementierungen nutzen Supabase-Client mit User-Identität (RLS aktiv)
- [x] Kinder können erstellen (kein `verifyAdultOrAdmin` Bypass nötig, RLS erlaubt INSERT)

#### Sicherheit
- [x] AC-20: Jeder Tool-Call läuft unter User-Identität (Supabase `createClient()` in jedem Tool)
- [x] AC-21: API-Key bleibt auf dem Server (entschlüsselt nur im Route Handler, nie an Client)
- [x] AC-22: Chat-Nachrichten nicht in DB (nur React State)

### Security Audit

| Check | Status | Anmerkung |
|---|---|---|
| API-Key Verschlüsselung | PASS | AES-256-GCM, random IV, Auth Tag, korrekte Implementierung |
| API-Key nie im Client | PASS | Nur masked Version via `getApiKeyStatusAction`, Entschlüsselung nur in Route Handler |
| RLS auf `family_ai_settings` | PASS | Admin-only SELECT/INSERT/UPDATE/DELETE, SECURITY DEFINER RPC für andere Members |
| Auth-Check im Route Handler | PASS | `supabase.auth.getUser()` + Profil-Check + Family-Zugehörigkeit |
| Rate Limiting | PASS | 20 req/min auf Chat, 10 req/min auf Key-Aktionen |
| Cross-Origin Schutz | PASS | Origin-Header Prüfung in Route Handler |
| Input-Validierung | PASS | Zod auf allen Eingaben (Chat-Request, API-Key, Tool-Inputs) |
| XSS-Schutz | PASS | Kein `dangerouslySetInnerHTML`, Chat-Inhalte via `whitespace-pre-wrap` (Text only) |
| NEXT_PUBLIC Secrets | PASS | `AI_KEY_ENCRYPTION_SECRET` ist nur serverseitig |
| Tool-Calls via User-RLS | PASS | Alle DB-Operationen über authentifizierten Supabase-Client |
| Token Management | PASS | Server trimmt auf 10 Nachrichten, max 5 Tool-Iterationen |

### Bugs Found

#### BUG-P17-1: HIGH — API-Key Input doppelt sichtbar im Initialzustand
**Datei:** `src/components/assistant/api-key-section.tsx`
**Problem:** Wenn kein Key konfiguriert ist (`!configured && !editing`), werden gleichzeitig der Input-Bereich UND der "Anthropic API-Key" Setup-Button gerendert. Die Bedingung `(!configured || editing)` ist auch bei `!configured && !editing` wahr, sodass das Input-Feld sofort erscheint — zusammen mit dem redundanten Button unten.
**Erwartetes Verhalten:** Initial nur "Kein API-Key hinterlegt" + Setup-Button. Input erst nach Klick auf den Button.
**Severity:** HIGH (UX-Blocker, verwirrendes Doppel-UI für Admins)

#### BUG-P17-2: HIGH — handleRetry sendet veraltete Nachrichten an die API
**Datei:** `src/components/assistant/assistant-sheet.tsx`
**Problem:** `handleRetry` entfernt Fehlernachrichten via `setMessages()` und ruft sofort `handleSend()` auf. Aber `handleSend` liest `messages` aus dem React-Closure (nicht den neuesten State nach dem `setMessages`-Update). Das führt dazu, dass die API-Anfrage noch die Fehler-/alten Nachrichten enthält, die eigentlich entfernt werden sollten.
**Erwartetes Verhalten:** `handleSend` sollte mit den bereinigten Nachrichten arbeiten.
**Severity:** HIGH (Feature-Fehlfunktion: Retry schickt falsche Daten)

#### BUG-P17-3: MEDIUM — Deutsche Übersetzungen verwenden ASCII statt Umlaute
**Dateien:** `src/i18n/messages/de.json`, `src/i18n/messages/fr.json`
**Problem:** 15+ deutsche Einträge verwenden "oe/ue/ae" statt "ö/ü/ä" (z.B. "oeffnen" statt "öffnen", "Loeschen" statt "Löschen", "fuer" statt "für"). Französische Einträge haben fehlende Akzente ("cle" statt "clé", "desactive" statt "désactivé").
**Severity:** MEDIUM (sichtbar für alle Nutzer, unprofessionell)

#### BUG-P17-4: MEDIUM — Tool-Result Labels hardcoded auf Deutsch
**Datei:** `src/components/assistant/assistant-messages.tsx`
**Problem:** `TOOL_LABELS` ist ein statisches Objekt mit deutschen Strings ("Aufgabe erstellt", "Termin erstellt" etc.). Bei Locale en/fr sehen Nutzer trotzdem deutsche Labels.
**Severity:** MEDIUM (i18n-Verletzung, betrifft en/fr Nutzer)

#### BUG-P17-5: LOW — `isLoading` Prop wird an AssistantMessages übergeben aber nicht genutzt
**Datei:** `src/components/assistant/assistant-messages.tsx:54`
**Problem:** Der `isLoading` Prop wird in der Props-Destructuring akzeptiert aber nie verwendet (Loading-Indikator wird separat im Sheet gerendert).
**Severity:** LOW (toter Code, kein Runtime-Problem)

### Unit Tests geschrieben

| Testdatei | Tests | Status |
|---|---|---|
| `src/lib/crypto.test.ts` | 8 Tests (encrypt/decrypt roundtrip, tamper detection, env var validation, maskApiKey) | PASS |
| `src/lib/validations/assistant.test.ts` | 34 Tests (alle 9 Schemas: saveApiKey, chatMessage, chatRequest, 8 Tool-Schemas) | PASS |

### Zusammenfassung

| Kategorie | Ergebnis |
|---|---|
| Acceptance Criteria | 22/22 bestanden (Code-Review) |
| Security Audit | 11/11 Checks bestanden |
| Bugs gefunden | 2 High, 2 Medium, 1 Low |
| Unit Tests | 42 neue Tests, alle bestanden |
| Build | Passes |
| Regressions | Keine (120 bestehende Tests unverändert) |

### Production-Ready Entscheidung

**NOT READY** — 2 High-Severity Bugs müssen zuerst gefixt werden:
1. BUG-P17-1: API-Key Doppel-UI
2. BUG-P17-2: handleRetry sendet falsche Nachrichten

## Deployment
_To be added by /deploy_
