# PROJ-9: Chat & Kommunikation

## Status: In Progress
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

### Komponenten-Struktur

```
/chat
+-- Chat Layout (zweispaltig: Sidebar + Thread-Bereich)
|
+-- Chat Sidebar (links)
|   +-- "Familienchat"-Eintrag (Familien-Kanal, immer sichtbar)
|   +-- "Direktnachrichten"-Abschnitt
|       +-- DM List Item (Avatar, Name, letzte Nachricht Vorschau, Ungelesen-Badge)
|
+-- Chat Thread (rechts)
    +-- Thread Header (Kanalname oder Empfänger-Name + Avatar)
    +-- Message List (scrollbar, neueste Nachrichten unten)
    |   +-- "Ältere Nachrichten laden"-Trigger (beim Scrollen nach oben)
    |   +-- Message Bubble
    |       +-- Eigene Nachrichten: rechts ausgerichtet
    |       +-- Fremde Nachrichten: links ausgerichtet
    |       +-- Avatar + Name (nur im Familienchat)
    |       +-- Nachrichtentext
    |       +-- Zeitstempel
    +-- Message Input Area
        +-- Texteingabe (max. 2000 Zeichen, Enter = Senden)
        +-- Senden-Button
        (Bild-Anhang-Button wird durch PROJ-11 ergänzt)
```

### Datenmodell

**`chat_channels`** – Ein Kanal pro Eintrag:
- ID, Familien-ID, Typ (family | direct), Erstellt-am
- Familien-Kanal wird automatisch beim Erstellen einer Familie angelegt.

**`chat_channel_members`** – Mitgliedschaft in einem Kanal:
- Kanal-ID, User-ID
- Beim Familien-Kanal: alle Familienmitglieder. Bei DM: genau 2 Personen.

**`chat_messages`** – Eine Nachricht pro Eintrag:
- ID, Kanal-ID, Absender-ID, Nachrichtentext (max. 2000 Zeichen), Erstellt-am, Bild-URL (optional, wird durch PROJ-11 befüllt)

**`chat_read_receipts`** – Lesestand pro Nutzer:
- User-ID, Kanal-ID, Zuletzt-gelesen-am
- Ermöglicht den Ungelesen-Badge (Nachrichten nach diesem Zeitpunkt = ungelesen).

**Gespeichert in:** Supabase-Datenbank (persistent)

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Supabase Realtime (Channels) | Neue Nachrichten erscheinen sofort bei allen Teilnehmern ohne Seiten-Reload – wie WhatsApp. |
| Cursor-basierte Pagination | 50 Nachrichten laden, beim Hochscrollen die nächsten 50 nachladen. Effizienter als Offset-Pagination bei langen Verläufen. |
| Read Receipts Tabelle | Ungelesen-Badge wird per DB-Abfrage berechnet: Nachrichten nach `last_read_at` = ungelesen. Einfach und zuverlässig. |
| Familien-Kanal auto-erstellt | Beim Erstellen einer Familie wird der Familien-Kanal automatisch angelegt – kein manueller Schritt für die Nutzer. |
| Kein Edit/Delete in v1 | Hält die Implementierung einfach. Elterliche Aufsicht ersetzt Moderation. Kann in v2 ergänzt werden. |

### Berechtigungen (RLS)
- Familien-Kanal: Alle Familienmitglieder können lesen und schreiben.
- DMs: Nur die beiden Beteiligten können die Nachrichten lesen und schreiben.
- Keine externen Kontakte: Kinder können nur innerhalb ihrer Familie chatten (durch Familien-ID-Bindung).

### Neue Abhängigkeiten
Keine neuen Packages nötig — Supabase Realtime ist bereits im Projekt vorhanden.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
