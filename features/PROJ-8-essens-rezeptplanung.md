# PROJ-8: Essens- & Rezeptplanung

## Status: In Progress
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

### Komponenten-Struktur

```
/recipes (Tab-Navigation: "Rezepte" | "Essensplan")

Tab: Rezepte
+-- Recipes Page Header ("Neue Rezept"-Button für Admins)
+-- Tag-Filter-Bar (Chips: schnell, vegetarisch, vegan, glutenfrei, + eigene)
+-- Rezept-Grid
|   +-- Recipe Card
|       +-- Bild (oder Platzhalter-Icon)
|       +-- Titel + Tags
|       +-- "Zu Einkaufsliste hinzufügen"-Button
+-- Recipe Form Dialog (erstellen/bearbeiten)
|   +-- Titel, Beschreibung, Zutatenliste, Tags, Bild-Upload
+-- Recipe Detail Sheet (Klick auf Karte)
    +-- Vollbild-Ansicht: Zutaten, Beschreibung, Tags

Tab: Essensplan
+-- Week Navigator (Pfeil zurück/vor, aktuell angezeigte Woche)
+-- Meal Plan Grid (7 Spalten × 3 Zeilen)
|   +-- Spalten-Header (Mo, Di, Mi, Do, Fr, Sa, So)
|   +-- Zeilen (Frühstück / Mittagessen / Abendessen)
|   +-- Zelle
|       +-- Zugewiesenes Rezept (Chip mit Name + Entfernen-Button)
|       +-- ODER: Freitext (z.B. "Reste")
|       +-- ODER: "+ Hinzufügen"-Button (öffnet Rezept-Auswahl oder Freitext)
+-- "Alle Zutaten dieser Woche zu Einkaufsliste"-Button
```

### Datenmodell

**`recipes`** – Ein Rezept pro Eintrag:
- ID, Familien-ID, Titel, Beschreibung, Tags (Array), Bild-URL (optional), Erstellt-von, Erstellt-am

**`recipe_ingredients`** – Eine Zutat pro Eintrag:
- ID, Rezept-ID, Name, Menge (optional), Einheit (optional)

**`meal_plan_entries`** – Ein Slot im Essensplan:
- ID, Familien-ID, Woche (ISO-String, z.B. "2026-W15"), Wochentag (0–6), Mahlzeit-Typ (frühstück/mittagessen/abendessen), Rezept-ID (optional), Freitext (optional)

**Gespeichert in:** Supabase-Datenbank + Supabase Storage (Bilder)

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Supabase Storage für Bilder | Familienspezifischer Ordner (`{family_id}/`), RLS stellt sicher, dass nur Familienmitglieder Bilder sehen/hochladen dürfen. |
| ISO-Wochenstring als Schlüssel | `"2026-W15"` identifiziert eine Woche eindeutig und ist einfach zu berechnen – kein komplexes Datums-Mapping nötig. |
| Client-seitige Bildvalidierung | Dateigröße (max. 5 MB) und Format (JPEG/PNG/WebP) werden vor dem Upload geprüft → verhindert unnötige Server-Anfragen. |
| "Zu Einkaufsliste"-Integration (PROJ-7) | Zutaten eines Rezepts werden direkt in die ausgewählte Einkaufsliste geschrieben – kein Zwischensystem nötig. |
| Deleted-Recipe-Handling | Wenn ein Rezept gelöscht wird, bleibt der Essensplan-Eintrag erhalten und zeigt "Rezept gelöscht" an – kein Datenverlust. |

### Berechtigungen (RLS)
- Alle Familienmitglieder: Rezepte und Essensplan lesen.
- Nur Admins/Erwachsene: Rezepte erstellen, bearbeiten, löschen.
- Alle Familienmitglieder: Essensplan-Slots befüllen und ändern.

### Neue Abhängigkeiten
Keine neuen Packages nötig — Supabase Storage ist bereits im Projekt konfiguriert (PROJ-6 nutzt es bereits).

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
