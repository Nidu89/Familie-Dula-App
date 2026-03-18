# PROJ-2: Familienverwaltung

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding) – Nutzer müssen eingeloggt sein.

## User Stories
- Als neuer Nutzer möchte ich eine Familie erstellen können, damit ich Admin meiner Familie werde.
- Als Admin möchte ich Familienmitglieder per E-Mail einladen, damit sie der Familie beitreten können.
- Als Admin möchte ich einen Einladungscode generieren, damit Mitglieder ohne E-Mail-Einladung beitreten können.
- Als eingeladener Nutzer möchte ich einer Familie per Link oder Code beitreten, damit ich Zugang zu den gemeinsamen Daten erhalte.
- Als Admin möchte ich die Rolle von Familienmitgliedern festlegen (Admin, Erwachsener, Kind), damit Berechtigungen korrekt gesetzt werden.
- Als Admin möchte ich Familienmitglieder entfernen können, falls nötig.
- Als Nutzer möchte ich die Mitgliederliste meiner Familie sehen, damit ich weiß, wer Zugang hat.
- Als Admin möchte ich den Familiennamen und Einstellungen bearbeiten können.

## Acceptance Criteria
- [ ] Beim ersten Login ohne Familie wird der Nutzer zur Seite "Familie erstellen oder beitreten" weitergeleitet.
- [ ] Familie erstellen: Nutzer gibt Familienname ein und wird Admin.
- [ ] Einladung per E-Mail: Admin gibt E-Mail-Adresse ein, Eingeladener erhält E-Mail mit Beitrittslink.
- [ ] Einladungscode: Admin kann Code generieren (z.B. 6-stellig), Code ist zeitlich begrenzt (z.B. 7 Tage).
- [ ] Beitritt per Code: Nutzer gibt Code ein und wird der Familie hinzugefügt.
- [ ] Rollen: Admin kann Mitgliedern die Rollen Admin, Erwachsener oder Kind zuweisen.
- [ ] Ein Nutzer gehört immer zu genau einer Familie.
- [ ] Admin kann Mitglieder entfernen; entfernte Mitglieder verlieren sofort Zugriff.
- [ ] Mitgliederliste zeigt Name, E-Mail und Rolle jedes Mitglieds.
- [ ] Familienname ist editierbar (nur Admin).
- [ ] Mindestens ein Admin muss in der Familie verbleiben (kein Self-Remove des letzten Admins).

## Edge Cases
- Was passiert, wenn ein Einladungslink/Code abläuft? → Klare Fehlermeldung, Admin kann neuen Code generieren.
- Was passiert, wenn die eingeladene E-Mail bereits ein Konto hat? → Direkt beitreten ohne erneute Registrierung.
- Was passiert, wenn jemand ohne Konto über einen Einladungslink kommt? → Weiterleitung zur Registrierung, danach automatisch der Familie beitreten.
- Was passiert, wenn der letzte Admin sich selbst entfernen will? → Aktion blockiert mit Erklärung.
- Was passiert, wenn ein Mitglied bereits einer anderen Familie angehört? → Eindeutige Fehlermeldung (ein Nutzer = eine Familie).

## Technical Requirements
- RLS-Policies: Nutzer sehen und bearbeiten nur Daten ihrer eigenen Familie.
- Einladungslinks/Codes werden sicher in der DB gespeichert (mit Ablaufzeit).
- Rollenwechsel sind sofort wirksam (keine erneute Anmeldung nötig).

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
