# PROJ-4: Familienkalender

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung) – Zuweisung von Terminen an Familienmitglieder.

## User Stories
- Als Familienmitglied möchte ich den gemeinsamen Familienkalender sehen, damit ich alle Termine im Überblick habe.
- Als Erwachsener/Admin möchte ich Termine anlegen, bearbeiten und löschen können.
- Als Nutzer möchte ich zwischen Tages-, Wochen-, Monats- und Listenansicht wechseln können.
- Als Nutzer möchte ich Termine nach Person oder Kategorie filtern können, damit ich nur relevante Termine sehe.
- Als Erwachsener möchte ich Termine bestimmten Familienmitgliedern zuweisen können.
- Als Kind möchte ich meine eigenen Termine farblich hervorgehoben sehen.
- Als Nutzer möchte ich wiederkehrende Termine anlegen können (z.B. wöchentlich, täglich).
- Als Nutzer möchte ich Erinnerungen für Termine setzen können.

## Acceptance Criteria
- [ ] Kalender zeigt alle Termine der Familie in einer Übersicht.
- [ ] Vier Ansichten verfügbar: Tag, Woche, Monat, Liste – mit einfachem Wechsel.
- [ ] Termin-Details: Titel (Pflicht), Beschreibung, Ort, Start- und Enddatum/-uhrzeit (Pflicht), Kategorie, Teilnehmende, Wiederholung, Erinnerung.
- [ ] Farbkennzeichnung: Jede Person hat eine eigene Farbe; Termine zeigen Farbe des Erstellers bzw. der Teilnehmenden.
- [ ] Kategorien: Schule, Arbeit, Freizeit, Gesundheit, Sonstiges (mindestens diese 5).
- [ ] Wiederholungen: Täglich, wöchentlich, monatlich, jährlich; Einzel-Termin aus Serie löschen/bearbeiten.
- [ ] Nur Erwachsene und Admins können Termine anlegen, bearbeiten und löschen.
- [ ] Kinder sehen alle Familienttermine, können aber nur lesen.
- [ ] Filter nach Person und Kategorie funktionieren kombinierbar.
- [ ] Realtime-Updates: Neuer Termin erscheint ohne Seiten-Reload bei allen eingeloggten Nutzern.
- [ ] Erinnerungen werden als In-App-Benachrichtigung ausgelöst (Integration mit PROJ-10).

## Edge Cases
- Was passiert bei überlappenden Terminen? → Im Wochen-/Tagesview nebeneinander anzeigen.
- Was passiert, wenn eine Wiederholungsserie bearbeitet wird? → Fragen: Nur dieser Termin, dieser und alle folgenden, alle Termine.
- Was passiert beim Löschen eines Serientermins? → Selbe Optionen wie beim Bearbeiten.
- Was passiert bei ganztägigen Terminen? → Separat am Tages-Kopf anzeigen (wie Google Calendar).
- Was passiert, wenn ein Termin in der Vergangenheit liegt? → Anzeigen, aber ausgegraut.
- Was passiert bei sehr vielen Terminen an einem Tag? → "+X weitere" Link mit Expand-Funktion.

## Technical Requirements
- Performance: Kalender-Daten werden auf Zeitbereich gefiltert abgerufen (nicht alle Termine auf einmal).
- Wiederholungen werden als Regeln gespeichert (iCal RFC 5545 RRULE-Format empfohlen).
- Realtime: Supabase Realtime für Kalender-Updates.
- Browser Support: Chrome, Firefox, Safari (aktuelle Versionen).

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
