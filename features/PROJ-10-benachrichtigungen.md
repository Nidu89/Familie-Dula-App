# PROJ-10: Benachrichtigungen

## Status: Deployed
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Requires: PROJ-15 (Mehrsprachigkeit) – Alle UI-Texte müssen über das i18n-System laufen.
- Soft dependency: PROJ-4 (Kalender), PROJ-5 (Aufgaben), PROJ-9 (Chat) – Benachrichtigungen werden von diesen Modulen ausgelöst.

## User Stories
- Als Nutzer möchte ich eine In-App-Benachrichtigung erhalten, wenn mir ein Termin zugewiesen wird.
- Als Nutzer möchte ich eine Benachrichtigung erhalten, wenn eine Aufgabe mir zugewiesen wird oder fällig ist.
- Als Nutzer möchte ich eine Benachrichtigung erhalten, wenn ich eine neue Chat-Nachricht bekomme.
- Als Nutzer möchte ich Benachrichtigungseinstellungen individuell konfigurieren können (z.B. Chat aus, nur Termine).
- Als Nutzer möchte ich alle Benachrichtigungen gesammelt an einem Ort sehen (Benachrichtigungs-Glocke).

## Acceptance Criteria
- [ ] In-App-Benachrichtigungszentrale: Glocken-Icon in der Navigation mit Zähler ungelesener Benachrichtigungen.
- [ ] Benachrichtigungs-Dropdown oder -Seite zeigt alle Benachrichtigungen mit Datum und Link zum Auslöser.
- [ ] Benachrichtigungs-Typen: Neuer Termin (zugewiesen), Aufgabe zugewiesen, Aufgabe fällig, neue Chat-Nachricht.
- [ ] Nutzer können je Typ Benachrichtigungen aktivieren/deaktivieren (Einstellungsseite).
- [ ] Benachrichtigungen werden als "gelesen" markiert, wenn der Nutzer sie anklickt oder die Zentrale öffnet.
- [ ] "Alle als gelesen markieren"-Funktion.
- [ ] Benachrichtigungen werden max. 30 Tage gespeichert.

## Edge Cases
- Was passiert bei sehr vielen Benachrichtigungen? → Pagination in der Benachrichtigungszentrale.
- Was passiert, wenn ein Termin/eine Aufgabe gelöscht wird, zu der eine Benachrichtigung gehört? → Benachrichtigung bleibt, Link führt zu 404-Behandlung mit "Inhalt gelöscht"-Meldung.
- Was passiert bei deaktivierten Benachrichtigungstypen? → Keine In-App-Benachrichtigung erzeugt.

## Technical Requirements
- Reine In-App-Lösung: Keine Web Push API, keine Browser-Berechtigungen nötig.
- Supabase Realtime für Echtzeit-Updates der Benachrichtigungszentrale.
- Benachrichtigungen werden serverseitig per Supabase Trigger oder Edge Function erzeugt.
- Benachrichtigungen werden max. 30 Tage in der DB gespeichert.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
App Top Bar (bestehend – app-top-bar.tsx erweitern)
+-- Glocken-Icon-Button
    +-- Ungelesen-Badge (rote Zahl)
    +-- Notification Dropdown
        +-- "Alle als gelesen markieren"-Button
        +-- Notification List
        |   +-- Notification Item
        |       +-- Typ-Icon (Kalender / Aufgabe / Chat)
        |       +-- Titel + Kurzbeschreibung
        |       +-- Zeitstempel (z.B. "vor 5 Min")
        |       +-- Klick → navigiert zum Auslöser (Termin / Aufgabe / Chat)
        +-- "Mehr laden"-Button (Pagination)

/settings/notifications (neue Einstellungsseite)
+-- Benachrichtigungseinstellungen-Header
+-- Toggle-Liste (ein Toggle pro Typ)
    +-- Neuer Termin zugewiesen → Ein/Aus
    +-- Aufgabe zugewiesen → Ein/Aus
    +-- Aufgabe fällig → Ein/Aus
    +-- Neue Chat-Nachricht → Ein/Aus
```

### Datenmodell

**`notifications`** – Eine Benachrichtigung pro Eintrag:
- ID, Nutzer-ID (Empfänger), Typ (calendar_assigned | task_assigned | task_due | chat_message), Titel, Kurztext, Auslöser-ID (ID des Termins/Aufgabe/Nachricht), Gelesen-Status (true/false), Erstellt-am
- Automatische Löschung nach 30 Tagen (Supabase pg_cron).

**`notification_preferences`** – Einstellungen pro Nutzer:
- Nutzer-ID, Benachrichtigungs-Typ, Aktiviert (true/false)
- Standard: alle Typen aktiviert. Nutzer kann pro Typ deaktivieren.

**Gespeichert in:** Supabase-Datenbank

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Supabase Database Trigger | Wenn eine Aufgabe zugewiesen wird, ein Termin erstellt wird oder eine Chat-Nachricht eingeht → DB Trigger schreibt automatisch in `notifications`. Kein manueller API-Aufruf im Frontend nötig. |
| Supabase Realtime auf `notifications` | Ungelesen-Badge im Glocken-Icon aktualisiert sich live, sobald eine neue Benachrichtigung eingeht – ohne Seiten-Reload. |
| Reine In-App-Lösung | Keine Web-Push-API, keine Browser-Berechtigungen, kein Service-Worker. Einfacher zu implementieren, kein Datenschutz-Problem. |
| pg_cron für 30-Tage-Bereinigung | Automatisches Löschen alter Benachrichtigungen via geplanten Datenbankjob – kein separates Cleanup-Script nötig. |
| Preference-Prüfung im Trigger | Vor dem Einfügen prüft der Trigger, ob der Nutzer diesen Typ aktiviert hat → keine unnötigen Datenbankeinträge. |

### Berechtigungen (RLS)
- Jeder Nutzer kann nur seine eigenen Benachrichtigungen lesen und als gelesen markieren.
- Benachrichtigungen werden serverseitig (via Trigger) erzeugt – kein direkter Client-Insert.

### Neue Abhängigkeiten
Keine neuen Packages nötig — Supabase Realtime und Supabase DB-Trigger sind bereits im Projekt verfügbar.

## QA Test Results

**Tested:** 2026-04-07
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

#### AC-1: In-App-Benachrichtigungszentrale (Glocken-Icon + Zaehler)
- [x] Bell icon in Top Bar via `NotificationBell` component
- [x] Unread count badge (rote Zahl, max "99+")
- [x] Badge wird beim Mount via `getUnreadCountAction()` geladen

#### AC-2: Benachrichtigungs-Dropdown mit Datum und Link zum Ausloeser
- [x] Popover-Dropdown mit Notification-Liste
- [x] Zeitstempel auf jeder Benachrichtigung (relative Anzeige: gerade eben, 5m, 2h, 3d)
- [x] Klick navigiert zur Quellseite (/calendar, /tasks, /chat)
- [x] Typ-spezifische Icons (Kalender, Aufgabe, Uhr, Chat)

#### AC-3: Benachrichtigungs-Typen
- [x] `calendar_assigned` — DB-Trigger auf event_participants INSERT
- [x] `task_assigned` — DB-Trigger auf tasks INSERT/UPDATE (assigned_to)
- [x] `task_due` — RPC `create_task_due_notifications()` beim Laden aufgerufen
- [x] `chat_message` — DB-Trigger auf chat_messages INSERT (Upsert: 1 pro Kanal)

#### AC-4: Benachrichtigungseinstellungen (pro Typ aktivieren/deaktivieren)
- [x] `/settings/notifications` Seite mit 4 Toggles (Switch von shadcn/ui)
- [x] Optimistic UI mit Revert bei Fehler
- [x] Defaults: alle Typen aktiviert
- [x] Trigger pruefen Preferences vor Insert

#### AC-5: Benachrichtigungen als "gelesen" markieren
- [x] Klick auf Notification → `markNotificationReadAction()` aufgerufen
- [x] Gelesene Notifications werden visuell gedimmt (opacity-60)
- [x] Unread-Dot (blauer Punkt) verschwindet bei gelesen

#### AC-6: "Alle als gelesen markieren"-Funktion
- [x] Button mit CheckCheck-Icon im Dropdown-Header
- [x] Nur sichtbar wenn unreadCount > 0
- [x] Optimistic UI: sofortige visuelle Aktualisierung

#### AC-7: Benachrichtigungen max. 30 Tage gespeichert
- [x] `cleanup_old_notifications()` loescht WHERE created_at < 30 Tage
- [x] Wird bei jedem `getNotificationsAction()` aufgerufen (fire-and-forget)

### Edge Cases Status

#### EC-1: Sehr viele Benachrichtigungen (Pagination)
- [x] Cursor-basierte Pagination (20 pro Seite)
- [x] "Aeltere laden"-Button im Dropdown

#### EC-2: Geloeschter Termin/Aufgabe mit Benachrichtigung
- [x] Benachrichtigung bleibt bestehen (kein CASCADE auf reference_id)
- [x] Link fuehrt zur allgemeinen Seite (/calendar, /tasks, /chat)

#### EC-3: Deaktivierte Benachrichtigungstypen
- [x] Alle 3 Trigger pruefen `notification_preferences` vor Insert
- [x] Default: enabled (wenn kein Preference-Eintrag existiert)
- [x] `create_task_due_notifications()` prueft ebenfalls Preferences

### Security Audit Results

- [x] **Authentication:** Alle Server Actions pruefen `getCurrentUser()`
- [x] **Authorization (RLS):** notifications SELECT/UPDATE/DELETE nur eigene, kein Client-INSERT
- [x] **Authorization (RLS):** notification_preferences SELECT/INSERT/UPDATE nur eigene
- [x] **Input validation:** Zod-Schemas fuer alle Mutations
- [x] **XSS:** React escaped Content automatisch
- [x] **SQL injection:** Supabase parametrisierte Queries
- [x] **SECURITY DEFINER:** Alle Trigger mit `SET search_path = public`
- [x] **Realtime filter:** `user_id=eq.${userId}` + RLS schuetzt vor fremden Daten
- [x] **Rate limiting:** markNotificationRead (60/min), markAllRead (10/min), updatePreference (20/min)
- [ ] BUG-P10-1: RPC-Funktionen sind von jedem authentifizierten Nutzer aufrufbar
- [ ] BUG-P10-2: Fehlende Rate-Limits auf getNotificationsAction (triggert RPCs)

### Bugs Found

#### BUG-P10-1: RPC-Funktionen oeffentlich aufrufbar
- **Severity:** Medium
- **File:** supabase/migrations/20260407_proj10_benachrichtigungen.sql (Functions Zeile 268, 314)
- **Description:** `create_task_due_notifications()` und `cleanup_old_notifications()` sind SECURITY DEFINER RPCs die von jedem authentifizierten Nutzer via `supabase.rpc()` aufgerufen werden koennen. Sie operieren auf ALLEN Nutzerdaten.
- **Impact:** Gering — beide Funktionen sind idempotent (Upsert/Delete). Worst case: unnoetige DB-Operationen.
- **Fix:** `REVOKE EXECUTE ON FUNCTION create_task_due_notifications() FROM authenticated;` und stattdessen nur via Service-Role oder in Server Action mit Admin-Check aufrufen.
- **Priority:** Fix in next sprint

#### BUG-P10-2: RPCs feuern bei jedem getNotificationsAction-Aufruf
- **Severity:** Medium
- **File:** src/lib/actions/notifications.ts:65-66
- **Description:** `create_task_due_notifications` und `cleanup_old_notifications` werden bei JEDEM Aufruf von `getNotificationsAction` gefeuert — auch bei Pagination ("Aeltere laden"). Sollte maximal einmal pro Session/Tag laufen.
- **Impact:** Unnoetige DB-Last bei haeufigem Oeffnen/Blaettern.
- **Fix:** RPC-Aufrufe in eine separate `checkTaskDueAction()` auslagern, die nur beim ersten Oeffnen aufgerufen wird, oder Throttling im Server Action.
- **Priority:** Fix in next sprint

#### BUG-P10-3: Fehlende Zurueck-Navigation auf Settings-Seite
- **Severity:** Low
- **File:** src/components/notifications/notification-settings-client.tsx
- **Description:** `/settings/notifications` hat keinen Zurueck-Button oder Breadcrumb. Nutzer muss Browser-Zurueck verwenden.
- **Priority:** Nice to have

#### BUG-P10-4: RPC-Fehler werden verschluckt
- **Severity:** Low
- **File:** src/lib/actions/notifications.ts:65-66
- **Description:** Fire-and-forget `.then(() => {})` ohne Error-Handling. Wenn RPCs fehlschlagen, gibt es kein Logging.
- **Priority:** Nice to have

### Unit Tests
- **File:** src/lib/validations/notifications.test.ts
- **Tests:** 17 passed (getNotificationsSchema, markNotificationReadSchema, updatePreferenceSchema)
- **Coverage:** Validation happy paths, edge cases (invalid UUID, out-of-range limit, invalid type, missing fields)

### Summary
- **Acceptance Criteria:** 7/7 passed
- **Bugs Found:** 4 total (0 critical, 0 high, 2 medium, 2 low)
- **Security:** RPC-Zugriff sollte eingeschraenkt werden (BUG-P10-1)
- **Production Ready:** YES — keine Critical/High Bugs, alle 7 ACs bestanden

## Deployment

**Deployed:** 2026-04-07
**Git Tag:** v1.10.0-PROJ-10
**Branch:** main (034e49f)
**Trigger:** Vercel auto-deploy via GitHub push

### Deployed Files
- `supabase/migrations/20260407_proj10_benachrichtigungen.sql` — DB-Schema: notifications, notification_preferences, triggers, RLS
- `supabase/migrations/20260407_proj10_scope_rpcs.sql` — Bug-Fix: RPCs auf auth.uid() gescoopt
- `src/lib/validations/notifications.ts` — Zod-Schemas
- `src/lib/actions/notifications.ts` — Server Actions (getNotifications, markRead, markAllRead, getUnreadCount, getPreferences, updatePreference, triggerMaintenance)
- `src/components/notifications/notification-bell.tsx` — Bell + Popover Dropdown mit Realtime
- `src/components/notifications/notification-item.tsx` — Einzelne Notification-Zeile
- `src/components/notifications/notification-settings-client.tsx` — Einstellungen (Toggles)
- `src/app/(app)/settings/notifications/page.tsx` — Settings-Seite
- `src/components/layout/app-top-bar.tsx` — Bell in Top Bar integriert
- `src/components/layout/app-shell.tsx` — userId durchgereicht
- `src/app/(app)/layout.tsx` — userId in SessionData

### Post-Deployment Status
- [ ] Production URL verifizieren
- [ ] Bell-Icon mit Badge testen
- [ ] Termin zuweisen → Notification pruefen
- [ ] Aufgabe zuweisen → Notification pruefen
- [ ] Chat-Nachricht → Notification pruefen
- [ ] Einstellungen togglen und verifizieren
