# PROJ-10: Benachrichtigungen

## Status: In Progress
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

### Komponenten-Struktur

```
App Top Bar (bestehend – app-top-bar.tsx erweitern)
+-- Glocken-Icon-Button
    +-- Ungelesen-Badge (rote Zahl)
    +-- Notification Dropdown
        +-- "Alle als gelesen markieren"-Button
        +-- Notification List
        |   +-- Notification Item
        |       +-- Typ-Icon (Kalender / Aufgabe / Chat)
        |       +-- Titel + Kurzbeschreibung
        |       +-- Zeitstempel (z.B. "vor 5 Min")
        |       +-- Klick → navigiert zum Auslöser (Termin / Aufgabe / Chat)
        +-- "Mehr laden"-Button (Pagination)

/settings/notifications (neue Einstellungsseite)
+-- Benachrichtigungseinstellungen-Header
+-- Toggle-Liste (ein Toggle pro Typ)
    +-- Neuer Termin zugewiesen → Ein/Aus
    +-- Aufgabe zugewiesen → Ein/Aus
    +-- Aufgabe fällig → Ein/Aus
    +-- Neue Chat-Nachricht → Ein/Aus
```

### Datenmodell

**`notifications`** – Eine Benachrichtigung pro Eintrag:
- ID, Nutzer-ID (Empfänger), Typ (calendar_assigned | task_assigned | task_due | chat_message), Titel, Kurztext, Auslöser-ID (ID des Termins/Aufgabe/Nachricht), Gelesen-Status (true/false), Erstellt-am
- Automatische Löschung nach 30 Tagen (Supabase pg_cron).

**`notification_preferences`** – Einstellungen pro Nutzer:
- Nutzer-ID, Benachrichtigungs-Typ, Aktiviert (true/false)
- Standard: alle Typen aktiviert. Nutzer kann pro Typ deaktivieren.

**Gespeichert in:** Supabase-Datenbank

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Supabase Database Trigger | Wenn eine Aufgabe zugewiesen wird, ein Termin erstellt wird oder eine Chat-Nachricht eingeht → DB Trigger schreibt automatisch in `notifications`. Kein manueller API-Aufruf im Frontend nötig. |
| Supabase Realtime auf `notifications` | Ungelesen-Badge im Glocken-Icon aktualisiert sich live, sobald eine neue Benachrichtigung eingeht – ohne Seiten-Reload. |
| Reine In-App-Lösung | Keine Web-Push-API, keine Browser-Berechtigungen, kein Service-Worker. Einfacher zu implementieren, kein Datenschutz-Problem. |
| pg_cron für 30-Tage-Bereinigung | Automatisches Löschen alter Benachrichtigungen via geplanten Datenbankjob – kein separates Cleanup-Script nötig. |
| Preference-Prüfung im Trigger | Vor dem Einfügen prüft der Trigger, ob der Nutzer diesen Typ aktiviert hat → keine unnötigen Datenbankeinträge. |

### Berechtigungen (RLS)
- Jeder Nutzer kann nur seine eigenen Benachrichtigungen lesen und als gelesen markieren.
- Benachrichtigungen werden serverseitig (via Trigger) erzeugt – kein direkter Client-Insert.

### Neue Abhängigkeiten
Keine neuen Packages nötig — Supabase Realtime und Supabase DB-Trigger sind bereits im Projekt verfügbar.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
