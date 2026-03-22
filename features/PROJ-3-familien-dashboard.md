# PROJ-3: Familien-Dashboard

## Status: In Progress
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

### Komponentenstruktur

```
Dashboard Page (Server – lädt alle Daten gebündelt)
│
├── DashboardHeader
│   └── Begrüßung mit Namen + heutiges Datum
│
├── QuickActions Bar
│   ├── "Neuer Termin" Button
│   ├── "Neue Aufgabe" Button
│   ├── "Neue Einkaufsliste" Button
│   └── "Neues Rezept" Button
│
└── Widget Grid (responsive: gestapelt Mobile / 2-spaltig Desktop)
    │
    ├── CalendarWidget (Server)
    │   ├── EventCard (heute + nächste 2–3 Termine)
    │   ├── EmptyState ("Keine Termine heute")
    │   └── PlaceholderCard (falls PROJ-4 nicht gebaut)
    │
    ├── TasksWidget (Server + Client Realtime)
    │   ├── OverdueSection ("Überfällig")
    │   ├── TodaySection ("Heute fällig")
    │   ├── EmptyState ("Alle Aufgaben erledigt!")
    │   └── PlaceholderCard (falls PROJ-5 nicht gebaut)
    │
    ├── MealPlanWidget (Server)
    │   ├── TodayMeal ("Heute: ...")
    │   ├── TomorrowMeal ("Morgen: ...")
    │   ├── EmptyState ("Kein Essensplan vorhanden")
    │   └── PlaceholderCard (falls PROJ-8 nicht gebaut)
    │
    ├── ChatWidget (Client – Realtime)
    │   ├── MessageList (letzte 3–5 Nachrichten)
    │   ├── EmptyState ("Noch keine Nachrichten")
    │   └── PlaceholderCard (falls PROJ-9 nicht gebaut)
    │
    └── KidsView (nur für Nutzer mit Rolle "Kind")
        ├── MyTasksHighlight (eigene offene Aufgaben)
        └── PointsBalance (aktuelles Punkteguthaben)
```

### Datenmodell

Das Dashboard erstellt keine neuen Datenbanktabellen. Es liest aus bereits geplanten Tabellen:

| Widget | Datenquelle | Abhängigkeit |
|--------|-------------|--------------|
| Kalender | `calendar_events` | PROJ-4 |
| Aufgaben | `tasks` | PROJ-5 |
| Essensplan | `meal_plans` | PROJ-8 |
| Chat | `messages` | PROJ-9 |
| Punkte | `reward_points` | PROJ-6 |
| Nutzerrolle | `family_members` | PROJ-2 ✓ |

Solange ein Modul noch nicht gebaut ist, zeigt das jeweilige Widget eine Platzhalter-Karte mit dem Text "Kommt bald".

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Next.js Server Components für Datenladen | Seite lädt fertig vom Server → schnell, kein Flackern |
| React Suspense + Skeleton pro Widget | Widgets laden parallel und unabhängig |
| Supabase Realtime nur für Chat & Aufgaben | Nur diese zwei Widgets brauchen Live-Updates |
| Rollenbasiertes Rendering (Kind vs. Elternteil) | Kinder sehen vereinfachte Ansicht mit Aufgaben + Punkten prominent |
| Graceful Degradation mit Platzhaltern | Dashboard ist sofort nutzbar, auch wenn Module fehlen |
| Keine neuen Pakete | shadcn/ui-Komponenten (Card, Badge, Avatar, Skeleton, ScrollArea) bereits vorhanden |

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
