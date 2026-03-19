# PROJ-2: Familienverwaltung

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-19

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding) – Nutzer müssen eingeloggt sein.

## User Stories
- Als neuer Nutzer möchte ich eine Familie erstellen können, damit ich Admin meiner Familie werde.
- Als Admin möchte ich Familienmitglieder per E-Mail einladen, damit sie der Familie beitreten können.
- Als Admin möchte ich einen Einladungscode generieren, damit Mitglieder ohne E-Mail-Einladung beitreten können.
- Als eingeladener Nutzer möchte ich einer Familie per Link oder Code beitreten, damit ich Zugang zu den gemeinsamen Daten erhalte.
- Als Admin möchte ich die Rolle von Familienmitgliedern festlegen (Admin, Erwachsener, Kind), damit Berechtigungen korrekt gesetzt werden.
- Als Admin möchte ich Familienmitglieder entfernen können, falls nötig.
- Als Nutzer möchte ich die Mitgliederliste meiner Familie sehen, damit ich weiß, wer Zugang hat.
- Als Admin möchte ich den Familiennamen und Einstellungen bearbeiten können.

## Acceptance Criteria
- [ ] Beim ersten Login ohne Familie wird der Nutzer zur Seite "Familie erstellen oder beitreten" weitergeleitet. *(Middleware-Fix aus BUG-4/PROJ-1: Middleware muss `family_id` des Nutzers prüfen und zu `/onboarding` weiterleiten, statt direkt zu `/dashboard`.)*
- [ ] Familie erstellen: Nutzer gibt Familienname ein und wird Admin. *(UI unter `/onboarding` bereits vorhanden – nur Backend-Logik fehlt.)*
- [ ] Einladung per E-Mail: Admin gibt E-Mail-Adresse ein, Eingeladener erhält E-Mail mit Beitrittslink.
- [ ] Einladungscode: Admin kann Code generieren (z.B. 6-stellig), Code ist zeitlich begrenzt (z.B. 7 Tage).
- [ ] Beitritt per Code: Nutzer gibt Code ein und wird der Familie hinzugefügt. *(UI unter `/onboarding` bereits vorhanden – nur Backend-Logik fehlt.)*
- [ ] Rollen: Admin kann Mitgliedern die Rollen Admin, Erwachsener oder Kind zuweisen.
- [ ] Ein Nutzer gehört immer zu genau einer Familie.
- [ ] Admin kann Mitglieder entfernen; entfernte Mitglieder verlieren sofort Zugriff.
- [ ] Mitgliederliste zeigt Name, E-Mail und Rolle jedes Mitglieds.
- [ ] Familienname ist editierbar (nur Admin).
- [ ] Mindestens ein Admin muss in der Familie verbleiben (kein Self-Remove des letzten Admins).

## Edge Cases
- Was passiert, wenn ein Einladungslink/Code abläuft? → Klare Fehlermeldung, Admin kann neuen Code generieren.
- Was passiert, wenn die eingeladene E-Mail bereits ein Konto hat? → Direkt beitreten ohne erneute Registrierung.
- Was passiert, wenn jemand ohne Konto über einen Einladungslink kommt? → Weiterleitung zur Registrierung, danach automatisch der Familie beitreten. *(Aus PROJ-1 EC-5 übernommen – war dort noch nicht implementiert.)*
- Was passiert, wenn der letzte Admin sich selbst entfernen will? → Aktion blockiert mit Erklärung.
- Was passiert, wenn ein Mitglied bereits einer anderen Familie angehört? → Eindeutige Fehlermeldung (ein Nutzer = eine Familie).
- Was passiert nach dem Erstellen einer Familie im Onboarding? → Middleware erkennt jetzt `family_id` und leitet zu `/dashboard` weiter (kein erneuter Login nötig).

## Technical Requirements
- RLS-Policies: Nutzer sehen und bearbeiten nur Daten ihrer eigenen Familie.
- Einladungslinks/Codes werden sicher in der DB gespeichert (mit Ablaufzeit).
- Rollenwechsel sind sofort wirksam (keine erneute Anmeldung nötig).
- **`profiles`-Tabelle erweitern (nicht neu erstellen):** PROJ-1 hat bereits `profiles` mit RLS und Auto-Trigger angelegt. PROJ-2 fügt `family_id` (FK → `families`) und `role` (enum: `admin`, `adult`, `child`) hinzu.
- **Middleware-Whitelist (BUG-19/PROJ-1):** Bei der Middleware-Anpassung für den Family-Check auf Whitelist-Logik umstellen (öffentliche Routen definieren, alles andere automatisch schützen), damit neue Routen nicht versehentlich ungeschützt bleiben.
- **Middleware-Update (BUG-4/PROJ-1):** Middleware muss nach dem Family-Check entweder zu `/dashboard` (hat Familie) oder `/onboarding` (keine Familie) weiterleiten.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
**Designed by:** /architecture skill
**Date:** 2026-03-19

### Seitenstruktur

```
App (Next.js)
│
├── Middleware (aktualisiert)
│   ├── Öffentliche Routen (Whitelist) → durchlassen
│   ├── Eingeloggt, keine Familie → /onboarding
│   └── Eingeloggt + Familie → Zugang zur App
│
├── /onboarding (bereits gebaut – nur Backend verbinden)
│   ├── Karte "Familie erstellen"
│   │   └── Formular: Familienname eingeben → Familie anlegen + Admin werden
│   └── Karte "Familie beitreten"
│       └── Formular: 6-stelligen Code eingeben → Familie beitreten
│
└── /family/settings (neue Seite)
    ├── Abschnitt: Familienname (anzeigen + bearbeiten, nur Admin)
    ├── Abschnitt: Mitgliederliste
    │   └── Tabelle: Name, E-Mail, Rolle, Aktionen (Rolle ändern, Entfernen) – nur Admin
    ├── Abschnitt: Mitglied einladen (nur Admin)
    │   ├── E-Mail-Einladung (E-Mail eingeben → Link per E-Mail)
    │   └── Einladungscode (6-stellig, 7 Tage gültig, anzeigen/neu generieren)
    └── Abschnitt: Familie verlassen (für alle Mitglieder, blockiert wenn letzter Admin)
```

### Datenmodell

**Neue Tabelle `families`:**
- Eindeutige ID
- Familienname
- Erstellt von (wer hat die Familie gegründet)
- Erstellt am

**Tabelle `profiles` erweitern (bereits vorhanden aus PROJ-1):**
- Neu: Familienzugehörigkeit (FK → `families`, nullable)
- Neu: Rolle in der Familie (enum: `admin`, `adult`, `child`, nullable)

**Neue Tabelle `family_invitations`:**
- Eindeutige ID
- Familienzugehörigkeit (FK → `families`)
- Typ: `email` oder `code`
- E-Mail-Adresse (nur bei E-Mail-Einladungen, nullable)
- Einladungscode (6-stellig, nur bei Code-Einladungen, nullable)
- Ablaufdatum (7 Tage ab Erstellung)
- Verwendet am (Zeitstempel wenn eingelöst, nullable)
- Erstellt von (FK → auth.users)

### Aktionen

| Aktion | Wer darf | Was passiert |
|--------|----------|--------------|
| Familie erstellen | Jeder ohne Familie | Familie anlegen, Nutzer wird Admin |
| Code einlösen | Jeder ohne Familie | Aktiver Code gesucht, Nutzer der Familie hinzugefügt |
| E-Mail einladen | Nur Admin | Einladungs-E-Mail mit tiefem Link (`/onboarding?invite=CODE`) |
| Code generieren | Nur Admin | Neuer 6-stelliger Code, 7 Tage gültig |
| Rolle ändern | Nur Admin | Sofort wirksam, kein erneuter Login nötig |
| Mitglied entfernen | Nur Admin | Sofortiger Zugriffsentzug |
| Familie verlassen | Alle | Blockiert, wenn letzter Admin |
| Familienname ändern | Nur Admin | Sofort wirksam |

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Seite `/family/settings` statt Modal | Zu viele Funktionen für ein Modal; eigene Seite klarer strukturierbar |
| Einladungslink als `/onboarding?invite=CODE` | Nutzer ohne Konto landen auf Registrierung, danach automatischer Beitritt; Nutzer mit Konto sehen direkt den Beitritts-Dialog |
| Server Actions (kein API-Endpunkt) | Gleiche Architektur wie PROJ-1; sicherer, einfacher |
| Whitelist-Middleware | Statt nur `/dashboard` zu schützen: alle neuen Routen automatisch abgesichert |
| 6-stelliger numerischer Code | Einfach zu tippen auf Mobilgeräten (kein Copy-Paste nötig) |
| RLS auf allen neuen Tabellen | Nutzer sehen ausschließlich Daten ihrer eigenen Familie – auch ohne App-Logik |
| Route-Group `(app)` | Neue geschützte Seiten in eigener Gruppe; Middleware schützt alles außerhalb der Public-Whitelist automatisch |

### Neue Dateien & Änderungen

| Datei | Neu/Änderung | Was |
|-------|-------------|-----|
| `src/middleware.ts` | Änderung | Whitelist + Family-Check (BUG-4 + BUG-19 aus PROJ-1) |
| `src/app/(auth)/onboarding/page.tsx` | Änderung | Backend-Calls verbinden (war console.log + setTimeout) |
| `src/app/(app)/family/settings/page.tsx` | Neu | Familienverwaltungs-Seite |
| `src/lib/actions/family.ts` | Neu | Server Actions: createFamily, joinByCode, inviteByEmail, generateCode, updateRole, removeMember, updateFamilyName, leaveFamily |
| `src/lib/validations/family.ts` | Neu | Zod-Schemas für alle Familienformulare |

### Keine neuen Pakete nötig
Alle benötigten shadcn/ui-Komponenten (`Table`, `Dialog`, `Select`, `Badge`) sind bereits installiert. E-Mail-Versand über Supabase Auth (keine externe Bibliothek).

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
