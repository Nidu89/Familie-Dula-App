# PROJ-12: Kalender-Integrationen (iCloud, Google & mehr)

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
