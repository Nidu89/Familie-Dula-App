# PROJ-12: iCloud Kalender Integration

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-4 (Familienkalender) – iCloud-Termine werden in den bestehenden Familienkalender importiert.

## User Stories
- Als Nutzer mit einem Apple-Konto möchte ich meinen iCloud-Kalender mit dem Familienkalender synchronisieren, damit ich Termine nicht doppelt pflegen muss.
- Als Nutzer möchte ich auswählen, welche iCloud-Kalender importiert werden sollen.
- Als Nutzer möchte ich festlegen, ob Sync nur in eine Richtung (iCloud → App) oder bidirektional erfolgt.
- Als Nutzer möchte ich die iCloud-Verbindung jederzeit trennen können.

## Acceptance Criteria
- [ ] Nutzer kann iCloud CalDAV-Zugangsdaten (App-spezifisches Passwort + Apple-ID) in der App hinterlegen.
- [ ] Verfügbare iCloud-Kalender werden aufgelistet; Nutzer wählt, welche importiert werden.
- [ ] Einweg-Sync (iCloud → Familien-App): iCloud-Termine erscheinen im Familienkalender als read-only.
- [ ] Sync-Intervall: Automatisch alle 15–60 Minuten (konfigurierbar) oder manuell auslösbar.
- [ ] Importierte Termine sind als "iCloud" gekennzeichnet und können in der App nicht bearbeitet werden.
- [ ] Verbindung trennen entfernt alle importierten iCloud-Termine aus dem Familienkalender.
- [ ] Zugangsdaten werden sicher (verschlüsselt) in der Datenbank gespeichert.

## Edge Cases
- Was passiert bei falschen Zugangsdaten? → Klare Fehlermeldung, Verbindung nicht gespeichert.
- Was passiert, wenn iCloud nicht erreichbar ist? → Letzter erfolgreicher Sync-Stand bleibt erhalten; Fehlermeldung in der UI.
- Was passiert bei Namenskonflikten (gleicher Termin in iCloud und Familien-App)? → Keine automatische Zusammenführung; beide Termine bleiben getrennt.
- Was passiert, wenn die App-spezifischen Passwörter bei Apple ablaufen? → Fehlermeldung mit Anleitung zur Erneuerung.

## Technical Requirements
- CalDAV-Protokoll für iCloud-Zugriff (RFC 4791).
- App-spezifische Passwörter (Apple-Anforderung für Drittanbieter-CalDAV).
- Zugangsdaten mit Supabase Vault oder serverseitiger Verschlüsselung speichern.
- Sync via Supabase Edge Function (Cron-Job alle N Minuten).
- GDPR: Zugangsdaten können jederzeit gelöscht werden.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
