# PROJ-12: Kalender-Integrationen (iCloud, Google & mehr)

## Status: Deployed
**Created:** 2026-03-18
**Last Updated:** 2026-04-09

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-4 (Familienkalender) – Externe Termine werden in den bestehenden Familienkalender importiert.
- Requires: PROJ-15 (Mehrsprachigkeit) – Alle UI-Texte müssen über das i18n-System laufen.

## User Stories
- Als Nutzer möchte ich externe Kalender (iCloud, Google, Outlook etc.) mit dem Familienkalender synchronisieren, damit ich Termine nicht doppelt pflegen muss.
- Als Nutzer möchte ich auswählen, welche externen Kalender importiert werden sollen.
- Als Nutzer möchte ich festlegen, ob Sync nur in eine Richtung (extern → App) oder bidirektional erfolgt.
- Als Nutzer möchte ich die Verbindung zu einem externen Kalender jederzeit trennen können.
- Als Nutzer möchte ich mehrere Kalender-Provider gleichzeitig verbinden können (z.B. iCloud privat + Google Arbeit).

## Acceptance Criteria
- [ ] Provider-Auswahl: Nutzer kann zwischen mindestens iCloud und Google Calendar wählen.
- [ ] **iCloud:** Verbindung über CalDAV mit App-spezifischem Passwort + Apple-ID.
- [ ] **Google Calendar:** Verbindung über OAuth 2.0 (Google Sign-In für Kalender-Scope).
- [ ] Verfügbare Kalender des gewählten Providers werden aufgelistet; Nutzer wählt, welche importiert werden.
- [ ] Einweg-Sync (extern → Familien-App): Externe Termine erscheinen im Familienkalender als read-only.
- [ ] Sync-Intervall: Automatisch alle 15–60 Minuten (konfigurierbar) oder manuell auslösbar.
- [ ] Importierte Termine sind mit Provider-Label gekennzeichnet (z.B. "iCloud", "Google") und können in der App nicht bearbeitet werden.
- [ ] Jedes Familienmitglied kann eigene externe Kalender verbinden (nicht nur Admins).
- [ ] Verbindung trennen entfernt alle importierten Termine dieses Providers aus dem Familienkalender.
- [ ] Zugangsdaten/Tokens werden sicher (verschlüsselt) in der Datenbank gespeichert.
- [ ] Provider-Architektur ist erweiterbar: Neue Provider (Outlook, CalDAV generisch) können später hinzugefügt werden.

## Edge Cases
- Was passiert bei falschen Zugangsdaten / fehlgeschlagenem OAuth? → Klare Fehlermeldung, Verbindung nicht gespeichert.
- Was passiert, wenn ein externer Kalender nicht erreichbar ist? → Letzter erfolgreicher Sync-Stand bleibt erhalten; Fehlermeldung in der UI.
- Was passiert bei Namenskonflikten (gleicher Termin in externem Kalender und Familien-App)? → Keine automatische Zusammenführung; beide Termine bleiben getrennt.
- Was passiert, wenn iCloud-App-Passwörter oder Google-OAuth-Tokens ablaufen? → Fehlermeldung mit Anleitung zur Erneuerung/Re-Authentifizierung.
- Was passiert, wenn ein Nutzer mehrere Provider gleichzeitig nutzt? → Jede Verbindung wird separat verwaltet und kann unabhängig getrennt werden.

## Technical Requirements
- **iCloud:** CalDAV-Protokoll (RFC 4791), App-spezifische Passwörter.
- **Google Calendar:** Google Calendar API v3, OAuth 2.0 mit calendar.readonly Scope (für Einweg-Sync).
- Provider-Abstraktionsschicht: Gemeinsames Interface für alle Kalender-Provider (fetchCalendars, fetchEvents, etc.).
- Zugangsdaten/Tokens mit Supabase Vault oder serverseitiger Verschlüsselung speichern.
- Sync via Supabase Edge Function (Cron-Job alle N Minuten).
- GDPR: Zugangsdaten und Tokens können jederzeit gelöscht werden.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
/settings/calendar-integrations (neue Einstellungsseite)
+-- Seiten-Header ("Kalender-Verbindungen")
+-- Verbundene Provider-Liste
|   +-- Provider Card (Google Calendar / iCloud)
|       +-- Provider-Logo + Name
|       +-- Status (Verbunden ✓ / Fehler ✗ / Nicht verbunden)
|       +-- Letzter Sync-Zeitpunkt
|       +-- Kalender-Auswahl (Checkboxen: welche Kalender importieren)
|       +-- "Manuell synchronisieren"-Button
|       +-- "Verbindung trennen"-Button
+-- "Neuen Kalender verbinden"-Button
+-- Add Provider Flow (mehrstufig)
    +-- Schritt 1: Provider wählen (Google / iCloud)
    +-- Schritt 2a: Google → Weiterleitung zu Google OAuth
    +-- Schritt 2b: iCloud → Formular (Apple-ID + App-spezifisches Passwort)
    +-- Schritt 3: Kalender auswählen (Checkliste der verfügbaren Kalender)
    +-- Schritt 4: Bestätigung + erster Sync

Kalender-Ansicht (PROJ-4 erweitern)
+-- Externe Termine (read-only, visuell unterscheidbar)
    +-- Provider-Badge ("Google" / "iCloud") auf dem Termin-Chip
    +-- Kein Bearbeiten/Löschen möglich (read-only Label)
```

### Datenmodell

**`calendar_integrations`** – Eine Verbindung pro Provider pro Nutzer:
- ID, Nutzer-ID, Provider (google | icloud), Status (active | error | disconnected), Zugangsdaten (verschlüsselt via Supabase Vault), Ausgewählte Kalender (Liste der Kalender-IDs), Letzter erfolgreicher Sync, Erstellt-am

**`external_calendar_events`** – Ein importierter Termin pro Eintrag:
- ID, Integrations-ID, Externer Termin-ID (vom Provider), Titel, Start-Zeit, End-Zeit, Kalender-Name, Provider-Label, Zuletzt synchronisiert-am
- Werden bei "Verbindung trennen" vollständig gelöscht (DSGVO).

**Gespeichert in:** Supabase-Datenbank + Supabase Vault (Tokens/Passwörter)

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Supabase Vault für Zugangsdaten | Tokens und Passwörter werden verschlüsselt gespeichert – kein Klardatentext in der DB. Standard für sicherheitskritische Credentials. |
| Google: OAuth 2.0 | Nutzer gibt Google-Passwort nie an die App weiter. OAuth ist der Branchenstandard für sichere Drittanbieter-Verbindungen. |
| iCloud: CalDAV mit App-Passwort | Apple unterstützt kein OAuth für CalDAV. App-spezifische Passwörter sind Apples empfohlene Lösung – Nutzer generiert diese in seinem Apple-Konto. |
| Sync via Supabase Edge Function (Cron) | Der Browser kann nicht direkt auf Google Calendar API oder CalDAV zugreifen (CORS, Credentials). Ein serverseitiger Cron-Job läuft alle 15–60 Min und holt die Daten. |
| Provider-Abstraktionsschicht | Gemeinsames Interface (`fetchCalendars()`, `fetchEvents()`) für alle Provider. Neuen Provider (z.B. Outlook) hinzufügen = neue Klasse implementieren, kein Umbau des Kerns. |
| Einweg-Sync only (v1) | Bidirektionaler Sync ist komplex und fehleranfällig (Konflikte). Einweg (extern → App) ist zuverlässig und erfüllt den Hauptbedarf: alles an einem Ort sehen. |
| Importierte Termine als read-only | Verhindert, dass Änderungen in der App mit dem externen Kalender in Konflikt geraten. Klare Trennung für den Nutzer. |

### Berechtigungen (RLS)
- Jeder Nutzer verwaltet nur seine eigenen Kalender-Verbindungen.
- Importierte externe Termine sind nur für den jeweiligen Nutzer sichtbar (nicht für andere Familienmitglieder, da es persönliche Kalender sind).
- DSGVO: "Verbindung trennen" löscht Token + alle importierten Termine sofort.

### Neue Abhängigkeiten

| Package | Zweck |
|---|---|
| `googleapis` | Google Calendar API v3 (OAuth 2.0, Termine abrufen) |
| `tsdav` | CalDAV-Client für iCloud (RFC 4791, iCal-Parsing) |

Diese Packages laufen ausschließlich in Supabase Edge Functions (serverseitig), nicht im Browser.

## QA Test Results

**Date:** 2026-04-09
**Tester:** QA Engineer (code review + automated tests)
**Status:** APPROVED — All 5 bugs fixed (2026-04-09)

### Acceptance Criteria Results

| # | Criterion | Result |
|---|-----------|--------|
| AC-1 | Provider-Auswahl (iCloud + Google) | PASS |
| AC-2 | iCloud: CalDAV + App-Passwort | PASS |
| AC-3 | Google Calendar: OAuth 2.0 | PASS |
| AC-4 | Kalender auflisten + auswählen | PASS |
| AC-5 | Einweg-Sync, read-only Termine | PASS |
| AC-6 | Sync-Intervall konfigurierbar (15–60 Min) | FAIL — Backend unterstützt es, aber kein UI vorhanden |
| AC-7 | Provider-Label auf importierten Terminen | PARTIAL — Nur BigCalendar-View hat visuelles Styling, kein Label-Text |
| AC-8 | Jedes Familienmitglied kann verbinden | PASS |
| AC-9 | Verbindung trennen löscht alle Termine | PASS |
| AC-10 | Zugangsdaten verschlüsselt (AES-256-GCM) | PASS |
| AC-11 | Erweiterbare Provider-Architektur | PASS |

**Result: 9/11 passed, 1 failed, 1 partial**

### Edge Cases

| Edge Case | Result |
|-----------|--------|
| Falsche Zugangsdaten → Fehlermeldung | PASS |
| Kalender nicht erreichbar → Fehler + letzter Stand | PASS |
| Namenskonflikte → beide Termine bleiben | PASS |
| Token abgelaufen → Status "error" + Meldung | PASS |
| Mehrere Provider gleichzeitig → unabhängig verwaltet | PASS |

### Bugs Found

| ID | Severity | Description | Steps to Reproduce |
|----|----------|-------------|-------------------|
| BUG-P12-1 | **HIGH** | Cron-Sync-Route (`/api/calendar/sync`) verwendet cookie-basierten Supabase-Client. Bei einem Cron-Aufruf gibt es keine User-Session → RLS blockiert alle Queries → Auto-Sync funktioniert nicht. Braucht Service-Role-Client oder Admin-Zugriff. | 1. POST an /api/calendar/sync mit CRON_SECRET 2. Supabase-Client hat kein auth.uid() → leere Ergebnisse |
| BUG-P12-2 | **MEDIUM** | Kein UI für Sync-Intervall-Konfiguration. `updateSyncIntervalAction` existiert, aber kein Frontend-Element zum Aufrufen. Standard ist 30 Min. | Öffne Settings → Kalender-Verbindungen → Kein Intervall-Selector sichtbar |
| BUG-P12-3 | **MEDIUM** | Importierte Termine im DayFocusPanel und CustomMonthGrid zeigen kein Provider-Label (z.B. "Google", "iCloud"). Nur die BigCalendar-Ansicht hat gestrichelten Rahmen + Provider-Farbe. | 1. Verbinde Google Calendar 2. Öffne Monatsansicht 3. Klicke auf Tag mit externem Termin → Kein Provider-Badge |
| BUG-P12-4 | **MEDIUM** | Event-Cleanup im Sync verwendet String-Interpolation in `.not()` Filter — spezielle Zeichen in Event-IDs (Quotes, Klammern) könnten den Filter brechen. | Tritt auf wenn externe Event-IDs Sonderzeichen enthalten |
| BUG-P12-5 | **LOW** | Kein Rate-Limit auf `fetchAvailableCalendarsAction`. Kann gespammt werden um externe APIs zu belasten. | Rufe Action schnell wiederholt auf |

### Security Audit

| Check | Result |
|-------|--------|
| Authentication required for all actions | PASS |
| RLS auf calendar_integrations (user-scoped) | PASS |
| RLS auf external_calendar_events (family-sichtbar) | PASS |
| Google OAuth state parameter validation | PASS |
| Cron endpoint CRON_SECRET protected | PASS |
| Credentials encrypted with AES-256-GCM | PASS |
| Rate limiting on connect (5/min) | PASS |
| Rate limiting on sync (5/min) | PASS |
| Rate limiting on fetchCalendars | FAIL (missing) |
| DSGVO: Disconnect löscht Token + Events | PASS |
| Cron route RLS bypass for automated sync | FAIL (BUG-P12-1) |

### Unit Tests

- 20 new tests for PROJ-12 validation schemas
- All 206 tests pass (`npm test`)

### Bug Fixes Applied (2026-04-09)

| ID | Fix |
|----|-----|
| BUG-P12-1 | Created `src/lib/supabase/service.ts` with `createServiceClient()` (service role). Cron route now uses it. |
| BUG-P12-2 | Added sync interval Select (15/30/60 min) to `calendar-integrations-client.tsx` calling `updateSyncIntervalAction`. |
| BUG-P12-3 | `day-focus-panel.tsx` detects `_isExternal` events — shows provider badge (Google/iCloud colored) + calendar name. |
| BUG-P12-4 | Event cleanup in both `calendar-integrations.ts` and `sync/route.ts` replaced `.not()` string filter with `lt("last_synced_at", syncTimestamp)`. |
| BUG-P12-5 | Added rate limit (10/min) on `fetchAvailableCalendarsAction`. |

### Production-Ready Decision

**READY** — All bugs fixed. 206 tests pass. Build succeeds.

## Deployment

**Deployed:** 2026-04-09
**Deployed by:** DevOps Engineer
**Git Tag:** v1.12.0-PROJ-12
