# PROJ-7: Einkaufslisten

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Requires: PROJ-15 (Mehrsprachigkeit) – Alle UI-Texte müssen über das i18n-System laufen.
- Soft dependency: PROJ-8 (Essens- & Rezeptplanung) – Zutaten können automatisch zu Einkaufslisten hinzugefügt werden.

## User Stories
- Als Familienmitglied möchte ich mehrere Einkaufslisten erstellen können (z.B. "Wocheneinkauf", "Drogerie").
- Als Nutzer möchte ich schnell Artikel zu einer Einkaufsliste hinzufügen können.
- Als Nutzer möchte ich beim Einkaufen Artikel abhaken können, damit ich den Überblick behalte.
- Als Familienmitglied möchte ich Einkaufslisten gemeinsam in Echtzeit bearbeiten, damit doppelter Kauf vermieden wird.
- Als Nutzer möchte ich Artikel mit Menge, Einheit und Kategorie versehen.
- Als Nutzer möchte ich häufig genutzte Artikel vorgeschlagen bekommen.
- Als Admin/Erwachsener möchte ich Einkaufslisten archivieren oder löschen können.

## Acceptance Criteria
- [ ] Mehrere Einkaufslisten pro Familie möglich; jede Liste hat einen Namen.
- [ ] Artikel-Felder: Produktname (Pflicht), Menge (optional), Einheit (optional), Kategorie (optional), erledigt-Status.
- [ ] Schnelles Hinzufügen: Eingabefeld direkt auf der Listen-Seite, Enter fügt Artikel hinzu.
- [ ] Abhaken: Artikel einzeln abhakbar; abgehakte Artikel werden visuell durchgestrichen ans Ende verschoben.
- [ ] Realtime: Änderungen (hinzufügen, abhaken, löschen) sind sofort bei allen eingeloggten Familienmitgliedern sichtbar.
- [ ] "Alle erledigten löschen"-Funktion zum Aufräumen der Liste.
- [ ] Artikel-Kategorien (z.B. Obst/Gemüse, Milchprodukte, Getränke) helfen beim Sortieren.
- [ ] Häufig genutzte Artikel werden als Vorschläge angezeigt (basierend auf vorherigen Listen der Familie).
- [ ] Alle Familienmitglieder können Einkaufslisten lesen und bearbeiten; Löschen der gesamten Liste nur für Erwachsene/Admins.

## Edge Cases
- Was passiert, wenn zwei Nutzer gleichzeitig denselben Artikel hinzufügen? → Realtime-Sync; doppelte Artikel bleiben bestehen, Nutzer kann manuell löschen.
- Was passiert, wenn die Verbindung während des Einkaufens abbricht? → Zuletzt geladenen Stand anzeigen; Änderungen nach Wiederverbindung synchronisieren.
- Was passiert bei einer leeren Liste? → Leere-Zustands-Anzeige mit Hinweis zum Hinzufügen.
- Was passiert, wenn eine Liste gelöscht wird, während jemand anderes sie gerade nutzt? → Toast-Benachrichtigung "Liste wurde gelöscht" + Weiterleitung zur Listen-Übersicht.

## Technical Requirements
- Realtime: Supabase Realtime für sofortige Listen-Updates.
- Offline: Zuletzt geladene Listen im Browser-Cache (kein komplexes Offline-First).
- Performance: Listen-Inhalte werden lazy geladen (Listenübersicht zuerst, Inhalte beim Öffnen).

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
