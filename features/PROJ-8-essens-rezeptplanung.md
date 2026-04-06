# PROJ-8: Essens- & Rezeptplanung

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Requires: PROJ-7 (Einkaufslisten) – Zutaten können direkt in eine Einkaufsliste übertragen werden.
- Requires: PROJ-15 (Mehrsprachigkeit) – Alle UI-Texte müssen über das i18n-System laufen.

## User Stories
- Als Elternteil möchte ich Rezepte mit Titel, Beschreibung, Zutaten und Tags verwalten.
- Als Nutzer möchte ich Rezepte nach Tags filtern (z.B. "vegetarisch", "schnell").
- Als Elternteil möchte ich einen wöchentlichen Essensplan erstellen (Wochentage × Mahlzeiten).
- Als Nutzer möchte ich Rezepte in den Essensplan einplanen.
- Als Nutzer möchte ich die Zutaten eines Rezepts mit einem Klick zu einer Einkaufsliste hinzufügen.
- Als Nutzer möchte ich Rezepte ohne Bild speichern können; optional ein Bild hinzufügen.

## Acceptance Criteria
- [ ] Rezept-Felder: Titel (Pflicht), Beschreibung, Zutatenliste (Zutat + Menge + Einheit), Tags, optionales Bild.
- [ ] Tags: Mindestens "schnell", "vegetarisch", "vegan", "glutenfrei" + freie Tags.
- [ ] Rezepte können erstellt, bearbeitet und gelöscht werden (nur Erwachsene/Admins).
- [ ] Alle Familienmitglieder können Rezepte lesen.
- [ ] Filterung nach einem oder mehreren Tags.
- [ ] Wöchentlicher Essensplan: Matrix aus Wochentagen (Mo–So) und Mahlzeiten (Frühstück, Mittagessen, Abendessen).
- [ ] Jede Zelle im Essensplan kann mit einem Rezept oder einem freien Text belegt werden.
- [ ] "Zu Einkaufsliste hinzufügen"-Funktion: Wähle ein Rezept + eine Zielliste → alle Zutaten werden hinzugefügt.
- [ ] Rezeptbild-Upload: Optional via Supabase Storage (max. 5 MB, JPEG/PNG/WebP).
- [ ] Essensplan zeigt aktuell laufende Woche; Navigation zur nächsten/vorherigen Woche möglich.

## Edge Cases
- Was passiert, wenn ein Rezept, das im Essensplan steht, gelöscht wird? → Eintrag im Essensplan wird als "Rezept gelöscht" markiert, nicht automatisch entfernt.
- Was passiert, wenn ein Rezept keine Zutaten hat und zu einer Einkaufsliste hinzugefügt wird? → Hinweis "Keine Zutaten vorhanden".
- Was passiert, wenn die Einkaufsliste bereits denselben Artikel enthält? → Artikel wird trotzdem hinzugefügt (Duplikate akzeptabel, Nutzer kann manuell bereinigen).
- Was passiert, wenn kein Bild hochgeladen wird? → Platzhalter-Bild oder Icon anzeigen.
- Was passiert, wenn das hochgeladene Bild zu groß ist? → Fehlermeldung mit Limit-Hinweis (max. 5 MB).

## Technical Requirements
- Bilder via Supabase Storage in einem familienspezifischen Bucket.
- RLS auf Storage Bucket: Nur Familienmitglieder können Bilder der eigenen Familie sehen/hochladen.
- Essensplan wird pro Woche (Wochennummer + Jahr) gespeichert.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
