# Product Requirements Document

## Vision
Die Familie-Dula-App ist eine zentrale Familienorganisations-Plattform, die Kalender, Aufgaben, Einkäufe, Essensplanung, Chat und ein Belohnungssystem für Kinder in einer einzigen Anwendung bündelt. Familien mit Kindern sollen ihren Alltag einfacher koordinieren können – von der Terminplanung bis zur Motivation der Kinder durch Gamification.

## Target Users
**Primär: Familien mit Kindern (5–16 Jahre)**
- Eltern (Admins/Erwachsene): Koordinieren Termine, verteilen Aufgaben, planen Mahlzeiten, führen Einkaufslisten und motivieren Kinder über das Punktesystem.
- Kinder: Sehen eigene Aufgaben und Termine, haken erledigte Aufgaben ab, sammeln Punkte, nutzen den Familienchat.

**Kernbedürfnisse:**
- Alle Familien-Infos an einem Ort statt verteilt über WhatsApp, Papierkalender und Notizzettel.
- Kinder aktiv in den Familienalltag einbinden (Aufgaben + Belohnung).
- Mehrgeräte-Nutzung: Desktop, Tablet, Smartphone.

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | PROJ-1: Authentifizierung & Onboarding | Deployed |
| P0 (MVP) | PROJ-2: Familienverwaltung | Deployed |
| P0 (MVP) | PROJ-3: Familien-Dashboard | Deployed |
| P0 (MVP) | PROJ-4: Familienkalender | Deployed |
| P0 (MVP) | PROJ-5: Aufgaben & To-Dos | Deployed |
| P0 (MVP) | PROJ-6: Belohnungssystem | Deployed |
| P1 | PROJ-7: Einkaufslisten | Deployed |
| P1 | PROJ-8: Essens- & Rezeptplanung | Deployed |
| P1 | PROJ-9: Chat & Kommunikation | Deployed |
| P1 | PROJ-10: Benachrichtigungen | Deployed |
| P2 | PROJ-11: Bild-Upload im Chat | Deployed |
| P2 | PROJ-12: Kalender-Integrationen (iCloud, Google & mehr) | Deployed |
| P1 | PROJ-13: Familien-Timer | Deployed |
| P1 | PROJ-14: Familien-Rituale | Deployed |
| P1 | PROJ-15: Mehrsprachigkeit (i18n) | Deployed |
| P1 | PROJ-16: Wochen-Challenge als pinnable Aufgabe | Deployed |
| P1 | PROJ-17: KI-Assistent (Family AI Agent) | Deployed |
| P1 | PROJ-18: Familienmomente | Deployed |
| P2 | PROJ-19: Kindergerechte Ritual-Schritte | Deployed |
| P2 | PROJ-20: Fokus-Modus für Aufgaben | Planned |
| P2 | PROJ-21: Visueller Animations-Timer | Planned |
| P2 | PROJ-22: Transitions-Vorwarnungen | Planned |
| P2 | PROJ-23: Bewegungspausen in Ritualen | Planned |
| P1 | PROJ-24: Virtuelle Taschengeld-Töpfe | Deployed |
| P2 | PROJ-25: Foto-Verifikation bei Aufgaben | Planned |
| P2 | PROJ-26: Familien-Standort & Geofencing | Planned |
| P1 | PROJ-27: Eltern-Genehmigung für Aufgaben | Planned |
| P1 | PROJ-28: Belohnungs-Anfrage durch Kind | Planned |
| P2 | PROJ-29: Automatische Aufgaben-Rotation | Planned |
| P2 | PROJ-30: Haushalt-Equity-Tracker (FairShare) | Planned |
| P2 | PROJ-31: Familien-Quest / Gruppen-Boss | Planned |
| P2 | PROJ-32: Verspätungs-Penalty auf Aufgaben | Planned |
| P2 | PROJ-33: Monatlicher Familien-Rückblick | Planned |
| P2 | PROJ-34: Effort-Gewichtung bei Aufgaben | Planned |
| P2 | PROJ-35: Aufgaben-Dringlichkeits-Farben | Planned |

## Success Metrics
- Alle Familienmitglieder nutzen die App täglich (Dashboard, Kalender, Aufgaben).
- Kinder erledigen zugewiesene Aufgaben und sammeln Punkte selbstständig.
- Einkaufslisten und Essensplan werden wöchentlich gepflegt.
- Keine externen Tools mehr nötig für interne Familienkoordination.

## Constraints
- Privates Familienprojekt ohne festes Budget oder Deadline.
- Solo-Entwickler: Fokus auf Einfachheit, schnelle Iterationen.
- Tech-Stack festgelegt: Next.js (App Router) + Supabase + Tailwind CSS + shadcn/ui.

## Non-Goals
- Keine offene öffentliche API für Drittanbieter (v1).
- Kein Social Login (Google etc.) in v1.
- Keine nativen Mobile Apps (iOS/Android) – nur responsive Web.
- Keine finanziellen Features (Budget, Ausgaben) in v1.
- Kein technisches Belohnungssystem (Gutscheine, digitale Preise) – nur Punkteübersicht.
