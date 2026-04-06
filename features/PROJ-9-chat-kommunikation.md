# PROJ-9: Chat & Kommunikation

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Requires: PROJ-15 (Mehrsprachigkeit) – Alle UI-Texte müssen über das i18n-System laufen.
- Required by: PROJ-11 (Bild-Upload im Chat) – Basis-Chat muss existieren.

## User Stories
- Als Familienmitglied möchte ich Textnachrichten an die gesamte Familie senden können.
- Als Familienmitglied möchte ich Direktnachrichten an einzelne Familienmitglieder senden können.
- Als Nutzer möchte ich neue Nachrichten in Echtzeit sehen, ohne die Seite neu zu laden.
- Als Nutzer möchte ich sehen, wer eine Nachricht gesendet hat und wann.
- Als Kind möchte ich nur innerhalb meiner Familie chatten können (keine externen Kontakte).
- Als Nutzer möchte ich ältere Nachrichten durch Scrollen nach oben laden können.

## Acceptance Criteria
- [ ] Familien-Kanal: Ein gemeinsamer Chat für alle Familienmitglieder.
- [ ] Direktnachrichten: 1:1-Chat zwischen je zwei Familienmitgliedern.
- [ ] Nachrichten-Anzeige: Avatar/Name des Senders, Zeitstempel, Nachrichtentext.
- [ ] Realtime: Neue Nachrichten erscheinen sofort ohne Seiten-Reload (Supabase Realtime).
- [ ] Nachrichtenhistorie: Ältere Nachrichten werden beim Scrollen nach oben nachgeladen (Pagination, je 50 Nachrichten).
- [ ] Eigene Nachrichten erscheinen rechts, fremde Nachrichten links (wie iMessage/WhatsApp).
- [ ] Lesezeichen: Ungelesene Nachrichten werden hervorgehoben.
- [ ] Alle Familienmitglieder (inkl. Kinder) können im Familienchat schreiben.
- [ ] Direktnachrichten sind nur zwischen den beiden Beteiligten sichtbar.
- [ ] Nachrichten können nicht bearbeitet oder gelöscht werden (v1 – Einfachheit).

## Edge Cases
- Was passiert bei sehr langen Nachrichten? → Zeilenumbruch, kein Truncating; max. 2000 Zeichen.
- Was passiert, wenn ein Mitglied aus der Familie entfernt wird? → Alte Nachrichten bleiben sichtbar, neue können nicht mehr gesendet werden.
- Was passiert bei schlechter Verbindung beim Senden? → Fehlermeldung + Möglichkeit zum erneuten Senden.
- Was passiert bei sehr vielen Direktnachrichten-Konversationen? → Sortiert nach letzter Aktivität.
- Was passiert, wenn ein Kind eine unangemessene Nachricht sendet? → Keine technische Moderation in v1; elterliche Aufsicht vorausgesetzt.

## Technical Requirements
- Realtime: Supabase Realtime mit Channels für Familien-Chat und Direktnachrichten.
- RLS: Nutzer können nur Nachrichten ihrer Familie und eigene DMs lesen.
- Pagination: Cursor-basiertes Laden älterer Nachrichten (kein Offset).
- Nachrichten werden in der DB gespeichert (nicht nur Realtime-Events).

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
