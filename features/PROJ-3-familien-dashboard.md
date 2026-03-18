# PROJ-3: Familien-Dashboard

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Soft dependency: PROJ-4 (Kalender), PROJ-5 (Aufgaben), PROJ-6 (Belohnungssystem) – Dashboard zeigt Zusammenfassungen dieser Module; falls nicht vorhanden, werden Platzhalter angezeigt.

## User Stories
- Als Familienmitglied möchte ich nach dem Login sofort eine Übersicht des heutigen Tages sehen, damit ich nichts Wichtiges verpasse.
- Als Elternteil möchte ich überfällige und heute fällige Aufgaben auf einen Blick sehen, damit ich den Überblick behalte.
- Als Nutzer möchte ich den Essensplan für heute und morgen sehen, damit ich weiß, was geplant ist.
- Als Nutzer möchte ich die letzten Chat-Nachrichten sehen, damit ich informiert bin ohne extra in den Chat zu gehen.
- Als Nutzer möchte ich per Schnellzugriff direkt einen Termin, eine Aufgabe, eine Einkaufsliste oder ein Rezept anlegen können.
- Als Kind möchte ich meine eigenen offenen Aufgaben und mein Punkteguthaben auf dem Dashboard sehen.

## Acceptance Criteria
- [ ] Dashboard ist die Landing-Page nach dem Login für eingeloggte Nutzer mit Familie.
- [ ] Kalender-Widget: Zeigt heutige und nächste 2–3 anstehende Termine der gesamten Familie.
- [ ] Aufgaben-Widget: Zeigt überfällige und heute fällige Aufgaben, gegliedert nach Fälligkeit.
- [ ] Essensplan-Widget: Zeigt das heutige und morgige Abendessen (bzw. alle Mahlzeiten des Tages).
- [ ] Chat-Widget: Zeigt die letzten 3–5 Nachrichten aus dem Familienchat.
- [ ] Schnellzugriffs-Buttons: "Neuer Termin", "Neue Aufgabe", "Neue Einkaufsliste", "Neues Rezept".
- [ ] Für Kinder: Eigene Aufgaben und aktuelles Punkteguthaben prominent angezeigt.
- [ ] Dashboard lädt in unter 2 Sekunden (Server-seitige Aggregation der Daten).
- [ ] Realtime-Updates: Chat-Nachrichten und Aufgabenstatus aktualisieren sich automatisch.
- [ ] Responsive: Auf Mobile werden Widgets gestapelt, auf Desktop nebeneinander.

## Edge Cases
- Was passiert, wenn ein Widget-Modul noch nicht gebaut ist? → Platzhalter/leerer Zustand mit Hinweis.
- Was passiert bei leeren Zuständen (keine Termine, keine Aufgaben)? → Leere-Zustands-Anzeige mit Aufruf zum Handeln.
- Was passiert, wenn der Nutzer keiner Familie angehört? → Weiterleitung zum Onboarding (PROJ-2).
- Was passiert bei schlechter Verbindung? → Zuletzt geladene Daten anzeigen, kein Leer-Bildschirm.

## Technical Requirements
- Performance: Dashboard-Daten werden server-seitig in Next.js aggregiert (Server Components).
- Realtime: Supabase Realtime für Chat-Widget und Aufgaben-Status.
- Responsive Design: Mobile-first, funktioniert auf Smartphones ab 375px Breite.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
