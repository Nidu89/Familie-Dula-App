# PROJ-5: Aufgaben & To-Dos

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung) – Zuweisung an Familienmitglieder.
- Soft dependency: PROJ-6 (Belohnungssystem) – Aufgaben können Punkte vergeben.

## User Stories
- Als Erwachsener/Admin möchte ich Aufgaben erstellen und Familienmitgliedern zuweisen, damit jeder weiß, was er tun soll.
- Als Kind möchte ich meine zugewiesenen Aufgaben sehen und als erledigt markieren können.
- Als Nutzer möchte ich Aufgaben nach Person, Status und Fälligkeit filtern können, damit ich schnell finde, was relevant ist.
- Als Erwachsener möchte ich Aufgaben mit Priorität und Fälligkeitsdatum versehen, damit wichtige Aufgaben zuerst erledigt werden.
- Als Erwachsener möchte ich optionale Unteraufgaben (Checklisten) zu einer Aufgabe hinzufügen.
- Als Erwachsener/Admin möchte ich den Status einer Aufgabe ändern (offen → in Bearbeitung → erledigt).

## Acceptance Criteria
- [ ] Aufgaben-Felder: Titel (Pflicht), Beschreibung, Fälligkeitsdatum, Status, Priorität (niedrig/mittel/hoch), Kategorie, Zuweisung an ein Familienmitglied.
- [ ] Status-Optionen: Offen, In Bearbeitung, Erledigt.
- [ ] Listenansicht zeigt alle Familienaufgaben mit Filtern nach: Zugewiesene Person, Status, Fälligkeit (heute, diese Woche, überfällig).
- [ ] Kinder können nur ihre eigenen Aufgaben als erledigt markieren; sie können keine Aufgaben erstellen, bearbeiten oder löschen.
- [ ] Erwachsene und Admins können alle Aufgaben der Familie erstellen, bearbeiten, zuweisen und löschen.
- [ ] Unteraufgaben: Optional einer Aufgabe Checklistenpunkte hinzufügen (Titel + erledigt-Status).
- [ ] Überfällige Aufgaben werden visuell hervorgehoben (z.B. rotes Datum).
- [ ] Punkte-Feld: Optional kann einer Aufgabe eine Punktzahl zugewiesen werden (Integration PROJ-6).
- [ ] Beim Erledigen einer punktberechtigten Aufgabe durch ein Kind werden die Punkte automatisch dem Kind gutgeschrieben.
- [ ] Realtime: Status-Änderungen sind sofort für alle Familienmitglieder sichtbar.

## Edge Cases
- Was passiert, wenn eine Aufgabe keinem Mitglied zugewiesen ist? → "Unzugewiesen" – nur Erwachsene/Admins können sie abhaken.
- Was passiert, wenn ein zugewiesenes Mitglied aus der Familie entfernt wird? → Aufgabe bleibt bestehen, Zuweisung wird auf "Unzugewiesen" gesetzt.
- Was passiert, wenn eine Aufgabe mit Unteraufgaben gelöscht wird? → Alle Unteraufgaben werden mitgelöscht (Kaskade).
- Was passiert, wenn eine erledigte Aufgabe wieder auf "offen" gesetzt wird? → Bereits vergebene Punkte bleiben (keine automatische Rückbuchung); Eltern können manuell korrigieren.
- Was passiert bei sehr vielen Aufgaben (>100)? → Pagination oder virtuelles Scrollen.

## Technical Requirements
- RLS: Kinder können nur eigene zugewiesene Aufgaben auf "erledigt" setzen, nichts anderes.
- Punkte-Buchung wird transaktional mit Aufgaben-Erledigung durchgeführt (kein doppeltes Vergeben).
- Realtime: Supabase Realtime für Statusänderungen.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
