# PROJ-10: Benachrichtigungen

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Requires: PROJ-15 (Mehrsprachigkeit) – Alle UI-Texte müssen über das i18n-System laufen.
- Soft dependency: PROJ-4 (Kalender), PROJ-5 (Aufgaben), PROJ-9 (Chat) – Benachrichtigungen werden von diesen Modulen ausgelöst.

## User Stories
- Als Nutzer möchte ich eine In-App-Benachrichtigung erhalten, wenn mir ein Termin zugewiesen wird.
- Als Nutzer möchte ich eine Benachrichtigung erhalten, wenn eine Aufgabe mir zugewiesen wird oder fällig ist.
- Als Nutzer möchte ich eine Benachrichtigung erhalten, wenn ich eine neue Chat-Nachricht bekomme.
- Als Nutzer möchte ich Benachrichtigungseinstellungen individuell konfigurieren können (z.B. Chat aus, nur Termine).
- Als Nutzer möchte ich alle Benachrichtigungen gesammelt an einem Ort sehen (Benachrichtigungs-Glocke).

## Acceptance Criteria
- [ ] In-App-Benachrichtigungszentrale: Glocken-Icon in der Navigation mit Zähler ungelesener Benachrichtigungen.
- [ ] Benachrichtigungs-Dropdown oder -Seite zeigt alle Benachrichtigungen mit Datum und Link zum Auslöser.
- [ ] Benachrichtigungs-Typen: Neuer Termin (zugewiesen), Aufgabe zugewiesen, Aufgabe fällig, neue Chat-Nachricht.
- [ ] Nutzer können je Typ Benachrichtigungen aktivieren/deaktivieren (Einstellungsseite).
- [ ] Benachrichtigungen werden als "gelesen" markiert, wenn der Nutzer sie anklickt oder die Zentrale öffnet.
- [ ] "Alle als gelesen markieren"-Funktion.
- [ ] Benachrichtigungen werden max. 30 Tage gespeichert.

## Edge Cases
- Was passiert bei sehr vielen Benachrichtigungen? → Pagination in der Benachrichtigungszentrale.
- Was passiert, wenn ein Termin/eine Aufgabe gelöscht wird, zu der eine Benachrichtigung gehört? → Benachrichtigung bleibt, Link führt zu 404-Behandlung mit "Inhalt gelöscht"-Meldung.
- Was passiert bei deaktivierten Benachrichtigungstypen? → Keine In-App-Benachrichtigung erzeugt.

## Technical Requirements
- Reine In-App-Lösung: Keine Web Push API, keine Browser-Berechtigungen nötig.
- Supabase Realtime für Echtzeit-Updates der Benachrichtigungszentrale.
- Benachrichtigungen werden serverseitig per Supabase Trigger oder Edge Function erzeugt.
- Benachrichtigungen werden max. 30 Tage in der DB gespeichert.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
