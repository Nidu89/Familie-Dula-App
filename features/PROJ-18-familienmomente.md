# PROJ-18: Familienmomente

## Status: Planned
**Created:** 2026-04-12
**Last Updated:** 2026-04-12

## Overview
Eine Memory-Wall für die Familie: Fotos hochladen, besondere Erlebnisse mit Titel, Beschreibung und Datum festhalten. Der neueste Moment erscheint als Hero-Bild auf dem Dashboard. Alle Familienmitglieder (inkl. Kinder) können Momente hinzufügen und mit Herz-Reaktionen auf Momente reagieren.

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding) — für Login-Prüfung
- Requires: PROJ-2 (Familienverwaltung) — für Familien-Zugehörigkeit
- Requires: PROJ-11 (Bild-Upload im Chat) — Supabase Storage Pattern kann wiederverwendet werden

## User Stories

- Als **Familienmitglied** möchte ich einen neuen Moment mit Foto, Titel, Beschreibung und Datum erstellen, damit besondere Erlebnisse festgehalten werden.
- Als **Familienmitglied** möchte ich alle Familienmomente in einer Galerie durchblättern, damit ich Erinnerungen jederzeit ansehen kann.
- Als **Familienmitglied** möchte ich auf einen Moment mit einem Herz reagieren, damit ich zeigen kann, was mir besonders gefällt.
- Als **Admin oder Ersteller** möchte ich einen Moment löschen können, damit unerwünschte Einträge entfernt werden können.
- Als **Familienmitglied** möchte ich auf dem Dashboard den neuesten Moment als Hero-Bild sehen, damit die Erinnerungen im Alltag präsent bleiben.
- Als **Kind** möchte ich ohne Einschränkungen eigene Momente hinzufügen können, damit ich aktiv zur Familienerinnerung beitragen kann.

## Acceptance Criteria

### Galerie-Seite (/moments)
- [ ] Eigene Seite `/moments` zeigt alle Familienmomente in einer Raster-Galerie (neueste zuerst)
- [ ] Jede Kachel zeigt: Foto (oder Emoji/Icon falls kein Foto), Titel und Datum
- [ ] Klick auf eine Kachel öffnet eine Detailansicht (Modal oder Vollseite) mit Foto, Titel, Beschreibung, Datum, Ersteller und Herzreaktionen
- [ ] Galerie ist auf Mobile, Tablet und Desktop responsiv (1 / 2 / 3 Spalten)

### Moment erstellen
- [ ] Schaltfläche „Moment hinzufügen" ist für alle Familienmitglieder sichtbar
- [ ] Formular enthält: Foto-Upload (optional), Titel (Pflicht, max. 80 Zeichen), Beschreibung (optional, max. 500 Zeichen), Datum (Standard: heute, frei wählbar)
- [ ] Foto wird in Supabase Storage (Bucket `moments`) gespeichert
- [ ] Moment wird nach dem Speichern sofort in der Galerie angezeigt

### Herzreaktionen
- [ ] Jedes Familienmitglied kann einem Moment ein Herz geben (toggle: einmal setzen / entfernen)
- [ ] Anzahl Herzen wird auf der Kachel und in der Detailansicht angezeigt
- [ ] Eigenes Herz ist visuell hervorgehoben (ausgefüllt vs. outline)

### Löschen
- [ ] Ersteller und Admins können einen Moment löschen (andere nicht)
- [ ] Löschen zeigt eine Bestätigungsabfrage (AlertDialog)
- [ ] Beim Löschen wird das Foto aus Supabase Storage entfernt

### Dashboard-Integration
- [ ] Der neueste Moment füllt den Hero-Bereich auf dem Dashboard aus (Foto als Hintergrund, Titel und Datum als Overlay)
- [ ] Falls noch kein Moment vorhanden: Platzhalter mit Einladungs-Text und „Ersten Moment hinzufügen"-Button
- [ ] Klick auf den Dashboard-Hero navigiert zur Galerie `/moments`

## Edge Cases

- **Kein Foto hochgeladen:** Moment wird mit einem Farb-Platzhalter (Gradient basierend auf Titel) oder einem Standard-Emoji angezeigt
- **Sehr langer Titel:** Wird in der Kachel abgeschnitten (truncate), vollständig in der Detailansicht
- **Erste Familie ohne Momente:** Dashboard zeigt einladenden CTA statt leerem Hero
- **Foto-Upload schlägt fehl:** Fehlermeldung, Moment wird NICHT gespeichert (kein Moment ohne konsistenten Zustand)
- **Moment wird gelöscht, während andere ihn ansehen:** Detailansicht schließt sich, Benutzer kehrt zur Galerie zurück, Toast-Meldung
- **Gleichzeitiges Herz-Setzen durch mehrere Nutzer:** Optimistic UI + serverseitige Synchronisation
- **Großes Foto (> 5 MB):** Client-seitige Validierung mit Fehlermeldung vor Upload
- **Benutzer verlässt Formular ungespeichert:** Keine Rückfrage nötig (kein Auto-Draft)

## Technical Requirements

- **Storage:** Supabase Storage Bucket `moments` (public read für Familienmitglieder, authenticated write)
- **RLS:** Momente nur für Familienmitglieder lesbar; Erstellen für alle authentifizierten Familienmitglieder; Löschen nur für Ersteller (`created_by`) oder Admin
- **Performance:** Galerie lädt initial 12 Momente, weiteres Nachladen per „Mehr anzeigen"-Button
- **Bildoptimierung:** Next.js `<Image>` mit `fill` und `object-cover` für einheitliche Kachelgröße
- **Security:** Kein direkter Bucket-Zugriff ohne Auth; Storage-Pfad enthält `family_id` zur Isolation

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
