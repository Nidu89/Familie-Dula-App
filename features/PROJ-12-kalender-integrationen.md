# PROJ-12: Kalender-Integrationen (iCloud, Google & mehr)

## Status: In Progress
**Created:** 2026-03-18
**Last Updated:** 2026-04-06

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
_To be added by /qa_

## Deployment
_To be added by /deploy_
