# PROJ-6: Belohnungssystem (Gamification)

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung) – Punkte pro Kind der Familie.
- Requires: PROJ-5 (Aufgaben & To-Dos) – Automatische Punktvergabe bei Aufgabenerledigung.

## User Stories
- Als Kind möchte ich nach dem Erledigen einer Aufgabe automatisch Punkte erhalten, damit ich Motivation habe.
- Als Kind möchte ich mein aktuelles Punkteguthaben sehen können.
- Als Elternteil möchte ich Punkte manuell hinzufügen oder abziehen können, um Kinder zu belohnen oder Korrekturen vorzunehmen.
- Als Elternteil möchte ich die Punktehistorie eines Kindes einsehen, damit ich nachvollziehen kann, wie Punkte verdient/abgezogen wurden.
- Als Elternteil möchte ich beim Anlegen einer Aufgabe festlegen, wie viele Punkte sie wert ist.
- Als Nutzer möchte ich eine Übersicht aller Kinder mit ihrem aktuellen Punktestand sehen.

## Acceptance Criteria
- [ ] Jedes Familienmitglied mit Rolle "Kind" hat ein Punktekonto.
- [ ] Punktestand wird auf dem Dashboard und auf der Belohnungs-Übersichtsseite angezeigt.
- [ ] Automatische Buchung: Wenn ein Kind eine punktberechtigte Aufgabe erledigt, werden die definierten Punkte seinem Konto gutgeschrieben.
- [ ] Manuelle Buchung: Erwachsene/Admins können Punkte manuell hinzufügen (positiver Wert) oder abziehen (negativer Wert) mit optionalem Grund/Kommentar.
- [ ] Punktehistorie: Pro Kind einsehbar – zeigt Datum, Aktion (Aufgabe/manuell), Punkte (+/-), aktuellen Stand, Kommentar.
- [ ] Punktestand kann nicht negativ werden (Mindestwert: 0).
- [ ] Übersichtsseite: Alle Kinder der Familie mit aktuellem Punktestand nebeneinander.
- [ ] Nur Erwachsene und Admins können manuelle Buchungen vornehmen.
- [ ] Punkte einer Aufgabe werden nur einmal vergeben, auch wenn der Status mehrfach gewechselt wird.

## Edge Cases
- Was passiert, wenn eine erledigte Aufgabe auf "offen" zurückgesetzt wird? → Punkte bleiben; nur manuelle Korrektur durch Eltern möglich (mit Kommentar).
- Was passiert, wenn eine punktberechtigte Aufgabe keinem Kind zugewiesen ist? → Keine automatische Buchung bei Erledigung.
- Was passiert, wenn man mehr Punkte abziehen will als vorhanden? → Maximaler Abzug ist der aktuelle Stand (Ergebnis = 0), nicht negativ.
- Was passiert, wenn ein Kind aus der Familie entfernt wird? → Punktehistorie bleibt als Archiv erhalten (keine Löschung).

## Technical Requirements
- Punkte-Buchungen sind unveränderlich (append-only log) – keine Bearbeitung/Löschung einzelner Buchungen.
- Transaktionale Sicherheit: Aufgabenerledigung und Punktebuchung in einer DB-Transaktion.
- RLS: Kinder können nur ihren eigenen Punktestand lesen, nicht ändern.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
