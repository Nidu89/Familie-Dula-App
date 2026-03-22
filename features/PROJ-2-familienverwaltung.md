# PROJ-2: Familienverwaltung

## Status: In Review
**Created:** 2026-03-18
**Last Updated:** 2026-03-22

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

## Frontend Implementation Notes
**Implemented by:** /frontend skill
**Date:** 2026-03-19

### Was gebaut wurde
- **Zod-Validierungsschemas** in `src/lib/validations/family.ts`: createFamily, joinFamilyByCode, updateFamilyName, inviteByEmail, updateRole, removeMember
- **Server Action Stubs** in `src/lib/actions/family.ts`: Alle 8 Aktionen (createFamily, joinByCode, inviteByEmail, generateCode, updateFamilyName, updateMemberRole, removeMember, leaveFamily) mit Zod-Validierung und simulierten Verzoegerungen
- **Onboarding-Seite aktualisiert** (`/onboarding`): Verbunden mit Server Actions statt console.log, Unterstuetzung fuer `?invite=CODE` URL-Parameter, Suspense-Boundary fuer useSearchParams, Zod-validiertes Formular fuer "Familie erstellen", 6-stelliger numerischer Code-Input mit inputMode="numeric"
- **Familieneinstellungen-Seite** (`/family/settings`): Neue Seite in Route-Group `(app)`
  - `FamilyNameSection`: Inline-Bearbeitung des Familiennamens (nur Admin), Zod-validiert
  - `MemberListSection`: Desktop-Tabelle + Mobile-Karten-Layout, Rollen-Dropdown (Admin/Erwachsener/Kind), Mitglied-entfernen mit Bestaetigung-Dialog, Schutz vor Entfernen des letzten Admins
  - `InviteSection`: E-Mail-Einladung + 6-stelliger Einladungscode mit Kopieren-Button, Code-Generierung und Ablaufdatum-Anzeige
  - `LeaveFamilySection`: Familie-verlassen mit Bestaetigung-Dialog, Blockiert wenn letzter Admin

### Noch offen (fuer /backend)
- Alle Server Actions nutzen console.log + setTimeout statt echte Supabase-Calls
- Middleware-Update: Whitelist-Logik + Family-Check (BUG-4 + BUG-19)
- Familiendaten aus Supabase laden (aktuell Mock-Daten auf der Settings-Seite)
- E-Mail-Versand fuer Einladungen
- RLS-Policies fuer families und family_invitations Tabellen
- Datenbank-Schema: families Tabelle, profiles-Erweiterung (family_id, role), family_invitations Tabelle

### Design-Entscheidungen
- Responsive Design: Desktop-Tabelle fuer Mitgliederliste, Karten-Layout auf Mobil
- Alle Texte auf Deutsch (konsistent mit PROJ-1)
- shadcn/ui Komponenten: Card, Button, Input, Form, Table, Badge, Select, Dialog, Separator, Skeleton
- Bestaetigungs-Dialoge fuer destruktive Aktionen (Mitglied entfernen, Familie verlassen)
- Inline-Bearbeitung fuer Familienname statt separatem Formular
- Route-Group `(app)` fuer geschuetzte Seiten, `(auth)` fuer Onboarding

## Backend Implementation Notes
**Implemented by:** /backend skill
**Date:** 2026-03-20

### Was gebaut wurde
- **Datenbank-Migration** (`supabase/migrations/20260319_proj2_familienverwaltung.sql`): `families`-Tabelle, `profiles` um `family_id` + `role` erweitert, `family_invitations`-Tabelle – alle mit RLS
- **3 Security-Definer-Funktionen** in Supabase: `join_family`, `mark_invitation_used`, `invalidate_family_codes` (umgehen RLS fuer Aktionen, bei denen der Nutzer noch kein Mitglied ist)
- **`src/lib/actions/family.ts`**: Alle 8 Server Actions mit echten Supabase-Calls ersetzt (createFamily, joinByCode, inviteByEmail, generateCode, updateFamilyName, updateMemberRole, removeMember, leaveFamily, getFamilyData)
- **`src/middleware.ts`**: Whitelist-Logik (BUG-19) + Family-Check (BUG-4): eingeloggte User ohne Familie → `/onboarding`, mit Familie auf Auth-Route → `/dashboard`
- **`src/app/(app)/family/settings/page.tsx`**: Von Mock-Daten auf Server Component mit echtem `getFamilyDataAction()`-Call umgestellt; Kind-Komponenten nutzen `router.refresh()` statt State-Callbacks

### Abweichungen vom Spec
- `profiles`-Tabelle nutzt `id` (nicht `user_id`) als FK zu `auth.users` – alle Queries angepasst
- `profiles` hat keine `email`-Spalte – Mitgliederliste zeigt nur `display_name`; E-Mail wird als leerer String uebergeben (kein Breaking Change fuer die UI)
- E-Mail-Einladung nutzt `supabase.auth.signInWithOtp` mit `shouldCreateUser: true` statt `inviteUserByEmail` (erfordert keinen Service-Role-Key)

### Supabase Dashboard Konfiguration (manuell)
Keine zusaetzliche Konfiguration noetig. Migration wurde direkt angewendet.

### Bug Fixes (2026-03-22)
Migration: `supabase/migrations/20260322_proj2_bug_fixes.sql`

- **BUG-20 (CRITICAL):** Fixed middleware querying `.eq('user_id', ...)` instead of `.eq('id', ...)` on profiles table
- **BUG-28 (CRITICAL):** Replaced insecure `join_family(UUID, TEXT)` RPC with `join_family_as_creator(UUID)` (hardcodes admin, verifies creator) and `redeem_invite_code(TEXT)` (atomic find+lock+mark+join)
- **BUG-22 (HIGH):** Added `join_family_by_email_invitation()` RPC + `checkAndJoinEmailInvitationAction()` server action. Onboarding page now checks for pending email invitations on load and auto-joins.
- **BUG-23 (HIGH):** Race condition on invite code redemption fixed by `redeem_invite_code` using `SELECT ... FOR UPDATE`
- **BUG-25 (HIGH):** Added `profiles_update_self_or_admin` RLS policy so admins can update/remove family members
- **BUG-26 (MEDIUM):** `invalidate_family_codes` RPC now verifies caller is admin of the target family
- **BUG-27 (MEDIUM):** `mark_invitation_used` dropped (replaced by atomic `redeem_invite_code`)
- **BUG-24 (MEDIUM):** Added `email` column to profiles with backfill + BEFORE INSERT trigger. `getFamilyDataAction` now returns real emails.
- **BUG-21 (MEDIUM):** Added `families_delete_creator` DELETE RLS policy for rollback support
- **BUG-29 (MEDIUM):** Removed `/onboarding` from `PUBLIC_ROUTES` in middleware (requires authentication)

## QA Test Results

### Test Run #1 (2026-03-22)

**Tested:** 2026-03-22
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (Next.js 16.1.7 compiles successfully, 0 TypeScript errors, 1 deprecation warning for middleware convention)
**Lint Status:** PASS (`npm run lint` runs cleanly with `eslint src/`)

### Acceptance Criteria Status

#### AC-1: Beim ersten Login ohne Familie wird der Nutzer zur Seite "Familie erstellen oder beitreten" weitergeleitet
- [x] Middleware now uses whitelist-based route protection (PUBLIC_ROUTES array)
- [x] Middleware queries profile for `family_id` and redirects users without family to `/onboarding`
- [ ] BUG: Middleware queries `profiles` using `.eq('user_id', user.id)` (line 59 of middleware.ts) but Backend Implementation Notes state profiles uses `id` as PK/FK to auth.users, not `user_id`. The `join_family` RPC function also uses `WHERE user_id = auth.uid()`. If the column is actually `id`, the middleware query will return no rows and always redirect to `/onboarding`. If the column is `user_id`, the server actions using `.eq('id', user.id)` will fail. One of these is wrong. (see BUG-20)
- **Result: FAIL** (BUG-20 -- column name mismatch will cause runtime failure in either middleware or server actions)

#### AC-2: Familie erstellen: Nutzer gibt Familienname ein und wird Admin
- [x] `/onboarding` page has "Familie erstellen" card that transitions to a form
- [x] `createFamilyAction` validates input with Zod (min 2, max 50 chars)
- [x] Creates family in `families` table with `created_by: user.id`
- [x] Uses `join_family` RPC to set profile `family_id` and `role='admin'`
- [x] Redirects to `/dashboard` on success
- [x] Rate limited: 5 per hour per IP
- [x] Checks if user already has a family before creating
- [ ] BUG: Rollback on profile update failure does `supabase.from("families").delete().eq("id", family.id)` but no DELETE RLS policy exists on the `families` table. The rollback will silently fail, leaving an orphaned family row. (see BUG-21)
- **Result: CONDITIONAL PASS** (works on happy path; rollback is broken)

#### AC-3: Einladung per E-Mail: Admin gibt E-Mail-Adresse ein, Eingeladener erhaelt E-Mail mit Beitrittslink
- [x] `InviteSection` component has email form calling `inviteByEmailAction`
- [x] Server action validates email with Zod, verifies caller is admin
- [x] Creates `family_invitations` record of type 'email'
- [ ] BUG: `inviteByEmailAction` uses `supabase.auth.signInWithOtp({ shouldCreateUser: true })` which creates an account or sends a magic link. However, when the invited user clicks the link and arrives at `/onboarding`, there is NO mechanism to look up the pending email invitation and auto-join the corresponding family. The user would see the generic "create or join" screen with no indication which family to join, and would need a separate invite code. The email invitation flow is effectively broken end-to-end. (see BUG-22)
- **Result: FAIL** (email invitation does not result in family membership)

#### AC-4: Einladungscode: Admin kann Code generieren (6-stellig), Code ist zeitlich begrenzt (7 Tage)
- [x] `generateInviteCodeAction` generates 6-digit numeric code via `Math.floor(100000 + Math.random() * 900000)`
- [x] Code stored in `family_invitations` with 7-day expiry
- [x] Old active codes for the family are invalidated before generating new one (via `invalidate_family_codes` RPC)
- [x] Rate limited: 10 per hour per IP
- [x] Caller verified as admin
- [x] UI shows code with copy button and expiry date
- **Result: PASS**

#### AC-5: Beitritt per Code: Nutzer gibt Code ein und wird der Familie hinzugefuegt
- [x] `/onboarding` page has "Familie beitreten" card with 6-digit code input (numeric inputMode, monospace font)
- [x] `joinFamilyByCodeAction` validates 6-digit numeric code with Zod
- [x] Looks up active, non-expired, unused invitation
- [x] Marks invitation as used via `mark_invitation_used` RPC
- [x] Joins family via `join_family` RPC with role 'adult'
- [x] Checks if user already has a family
- [x] Rate limited: 10 per 15 minutes per IP
- [x] URL parameter `?invite=CODE` auto-fills the code input
- [ ] BUG: There is a race condition between checking the invitation and marking it used. Two users submitting the same code simultaneously could both successfully look up the invitation, then both mark it used (second mark is a no-op since `used_at IS NULL` check), but only the first `join_family` call succeeds for the joining. The second user's `join_family` would also succeed since it only checks `family_id IS NULL`. This means a single-use code could be used by multiple people. (see BUG-23)
- **Result: CONDITIONAL PASS** (works in normal usage; race condition exists)

#### AC-6: Rollen: Admin kann Mitgliedern die Rollen Admin, Erwachsener oder Kind zuweisen
- [x] `MemberListSection` shows role dropdown (Select component) for non-self members when caller is admin
- [x] `updateMemberRoleAction` validates memberId (UUID) and role (enum) with Zod
- [x] Verifies caller is admin
- [x] Checks last-admin constraint when demoting an admin
- [x] Updates profile role, scoped to same family_id
- [x] Rate limited: 20 per hour per IP
- **Result: PASS**

#### AC-7: Ein Nutzer gehoert immer zu genau einer Familie
- [x] `createFamilyAction` checks `existingProfile?.family_id` before creating
- [x] `joinFamilyByCodeAction` checks `existingProfile?.family_id` before joining
- [x] `join_family` RPC has `AND family_id IS NULL` guard
- **Result: PASS**

#### AC-8: Admin kann Mitglieder entfernen; entfernte Mitglieder verlieren sofort Zugriff
- [x] `removeMemberAction` validates memberId with Zod, verifies caller is admin
- [x] Prevents self-removal (directs to "Familie verlassen")
- [x] Checks last-admin constraint before removing an admin
- [x] Sets `family_id = null, role = null` on the target profile
- [x] Confirmation dialog before removal
- [x] RLS on families/invitations will block removed member from accessing data
- **Result: PASS**

#### AC-9: Mitgliederliste zeigt Name, E-Mail und Rolle jedes Mitglieds
- [x] Desktop table layout with Name, E-Mail, Rolle columns + Action column for admin
- [x] Mobile card layout with same info
- [x] Role shown as badge with icon (Shield/UserRound/Baby)
- [x] Member count displayed in card description
- [ ] BUG: E-Mail column is always empty. `getFamilyDataAction` maps `email: ""` for all members because profiles table has no email column. The Backend Notes acknowledge this: "profiles hat keine email-Spalte". The email should be fetched from auth.users or stored in profiles. (see BUG-24)
- **Result: FAIL** (email not displayed)

#### AC-10: Familienname ist editierbar (nur Admin)
- [x] `FamilyNameSection` shows inline edit button (pencil icon) only when `isAdmin`
- [x] Form with Zod validation (min 2, max 50 chars)
- [x] `updateFamilyNameAction` verifies caller is admin
- [x] Updates family name, page refreshes via `router.refresh()`
- [x] Cancel button resets form
- **Result: PASS**

#### AC-11: Mindestens ein Admin muss in der Familie verbleiben (kein Self-Remove des letzten Admins)
- [x] `updateMemberRoleAction` checks admin count when demoting an admin
- [x] `removeMemberAction` checks admin count when removing an admin
- [x] `leaveFamilyAction` checks admin count when admin leaves
- [x] UI shows "Letzter Admin" text and disables leave button when last admin
- **Result: PASS**

### Edge Cases Status

#### EC-1: Einladungslink/Code ablaeuft -- Klare Fehlermeldung, Admin kann neuen Code generieren
- [x] `joinFamilyByCodeAction` checks `expires_at > now()` in the query
- [x] Returns "Einladungscode ungueltig oder abgelaufen." on expired code
- [x] Admin can generate new code via "Neuen Code generieren" button
- **Result: PASS**

#### EC-2: Eingeladene E-Mail hat bereits ein Konto -- Direkt beitreten ohne Registrierung
- [ ] BUG: The email invitation flow does not connect the invitation to the family join. Even if the user has an account and clicks the magic link, they land on `/onboarding` without auto-joining. (see BUG-22)
- **Result: FAIL** (dependent on BUG-22)

#### EC-3: Einladungslink ohne Konto -- Registrierung + automatischer Beitritt
- [ ] BUG: Same as EC-2. The `signInWithOtp` approach creates an account but does not link to the family invitation. (see BUG-22)
- **Result: FAIL** (dependent on BUG-22)

#### EC-4: Letzter Admin entfernt sich selbst -- Aktion blockiert
- [x] `leaveFamilyAction` returns specific error message
- [x] UI shows explanatory text and hides leave button
- **Result: PASS**

#### EC-5: Mitglied gehoert bereits einer anderen Familie an -- Fehlermeldung
- [x] `createFamilyAction` returns "Du gehoerst bereits einer Familie an."
- [x] `joinFamilyByCodeAction` returns same message
- [x] `join_family` RPC has `AND family_id IS NULL` guard
- **Result: PASS**

#### EC-6: Nach Familien-Erstellen im Onboarding -- Middleware erkennt family_id und leitet zu /dashboard
- [x] `createFamilyAction` calls `redirect("/dashboard")` after successful creation
- [x] Subsequent middleware checks would find `family_id` set
- [ ] Depends on BUG-20 (middleware column name mismatch) being resolved for middleware redirect to work correctly
- **Result: CONDITIONAL PASS** (redirect works from action; middleware correctness depends on BUG-20)

### Additional Edge Cases Identified by QA

#### EC-7: Invite code brute-force attack
- [x] Rate limited to 10 attempts per 15 minutes per IP
- [ ] NOTE: 6-digit numeric code has only 900,000 possible values. At 10 per 15 min = 40/hr, it would take ~937 days to exhaust. Acceptable for private family app.
- **Result: PASS** (rate limiting adequate for threat model)

#### EC-8: Admin invites themselves by email
- [ ] No check prevents an admin from inviting their own email address. This would trigger a signInWithOtp to their own address. Not harmful, but confusing UX.
- **Result: LOW PRIORITY** (cosmetic issue)

#### EC-9: Family with no members after all leave
- [ ] If the last non-admin member leaves (after admin changes their role), the family row remains in the database with no members. No cleanup mechanism exists. Not a bug per se, but orphaned data.
- **Result: NOT A BUG** (data cleanup can be addressed later)

### Security Audit Results

#### Authentication
- [x] All server actions verify user authentication via `supabase.auth.getUser()`
- [x] `verifyAdmin()` helper checks authentication and admin role
- [x] Rate limiting on all actions (varying limits per action)
- [x] Rate limiting uses same `getIP()` pattern as PROJ-1 (prefers x-real-ip)
- [ ] NOTE: In-memory rate limiting resets on server restart, does not persist across instances. Same as PROJ-1 -- acceptable for private project.

#### Authorization
- [x] Admin-only actions verified by `verifyAdmin()`: inviteByEmail, generateCode, updateFamilyName, updateMemberRole, removeMember
- [x] RLS on `families` table: SELECT for members, UPDATE for admins, INSERT for authenticated
- [x] RLS on `family_invitations` table: SELECT/INSERT for admins, SELECT for active codes for any authenticated user
- [x] `removeMemberAction` scoped to `.eq("family_id", profile.family_id)` -- cannot remove members of other families
- [x] `updateMemberRoleAction` scoped to same family
- [ ] BUG: No DELETE RLS policy on `families` table. The rollback in `createFamilyAction` will fail silently. (see BUG-21)
- [ ] BUG: No UPDATE RLS policy on `profiles` table for setting `family_id = null, role = null` when removing members. The `removeMemberAction` and `leaveFamilyAction` do direct updates on profiles. If the existing PROJ-1 profiles RLS only allows users to update their own profile, then admin cannot update another member's profile to remove them. The `removeMemberAction` would silently fail. (see BUG-25)

#### Input Validation
- [x] All server actions use Zod `safeParse` before processing
- [x] `familyName`: min 2, max 50 chars
- [x] `code`: exactly 6 digits regex
- [x] `email`: valid email format
- [x] `memberId`: UUID format
- [x] `role`: enum (admin, adult, child)
- [x] Server actions use `parsed.data` for clean values

#### Secrets / Data Exposure
- [x] No hardcoded secrets in PROJ-2 code
- [x] Server actions use server-side Supabase client
- [x] Invite codes returned only to admin users
- [ ] NOTE: `getFamilyDataAction` returns `currentUserId` (user's UUID). This is passed to client components. UUIDs are not secrets but should not be unnecessarily exposed. Low risk.

#### Security-Definer Functions
- [x] `join_family`: Only updates own profile (`WHERE user_id = auth.uid()`), only if not already in a family (`AND family_id IS NULL`)
- [x] `mark_invitation_used`: Only marks unused invitations, no data leakage
- [x] `invalidate_family_codes`: Operates on specific family_id
- [ ] BUG: `invalidate_family_codes` accepts any `target_family_id` parameter and is SECURITY DEFINER. Any authenticated user can call this RPC to invalidate invite codes for ANY family, not just their own. There is no `auth.uid()` check in the function body. The server action checks admin status, but the RPC itself is unprotected. (see BUG-26)
- [ ] BUG: `mark_invitation_used` accepts any `invitation_id` and is SECURITY DEFINER. Any authenticated user can mark any invitation as used, even for families they don't belong to. The server action checks that the code is valid, but a direct RPC call could sabotage invitations. (see BUG-27)
- [ ] BUG: `join_family` accepts any `target_family_id` and `target_role` (including 'admin') and is SECURITY DEFINER. Any authenticated user without a family can call `join_family` directly via Supabase client with `target_role: 'admin'` to become admin of ANY family. The server action passes 'adult' for code-join and 'admin' for create, but the RPC itself allows arbitrary role escalation. (see BUG-28 -- CRITICAL)

#### XSS
- [x] React JSX auto-escapes all user content
- [x] No use of `dangerouslySetInnerHTML`
- [x] Error messages are hardcoded strings
- [x] Family name rendered via JSX (auto-escaped)

#### IDOR (Insecure Direct Object Reference)
- [x] `removeMemberAction` scoped by `family_id` -- cannot target members of other families
- [x] `updateMemberRoleAction` scoped by `family_id`
- [ ] BUG-28 (see above) allows direct RPC-based privilege escalation

### Cross-Browser Testing
- Cannot be performed via code review only. Requires manual browser testing.
- Code uses standard CSS (Tailwind), no browser-specific APIs. Expected to work in Chrome, Firefox, Safari.
- Desktop table + mobile card layout uses `hidden md:block` and `md:hidden` breakpoints.

### Responsive Testing
- Cannot be performed via code review only. Requires manual viewport testing.
- Desktop: Table layout for member list at `md:` breakpoint and above
- Mobile: Card-based layout below `md:` breakpoint
- `max-w-2xl` container with `px-4 py-8` padding
- Select dropdowns on mobile use `w-[120px]` which may be tight on 375px screens
- Expected to render correctly at 375px, 768px, 1440px based on code review

### Bugs Found

#### BUG-20: Middleware queries profiles with wrong column name (CRITICAL)
- **Severity:** Critical
- **Steps to Reproduce:**
  1. Log in with a confirmed email
  2. Middleware (line 59) queries `.eq('user_id', user.id)` on profiles table
  3. But `getCurrentProfile()` in family.ts (line 63) queries `.eq('id', user.id)`
  4. One of these must be wrong. If profiles PK is `id` that matches `auth.users.id`, then middleware will fail (no column `user_id`). If the column is `user_id`, then all server actions fail.
  5. The `join_family` RPC function uses `WHERE user_id = auth.uid()` suggesting the column IS `user_id`, but then all server actions using `.eq('id', user.id)` are broken.
- **Impact:** Either the middleware family-check always fails (redirecting all users to /onboarding forever) or all server actions fail. Core feature is non-functional.
- **Priority:** Fix immediately -- blocks all testing

#### BUG-21: No DELETE RLS policy on families table (Medium)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Register, create a family
  2. If the `join_family` RPC fails after family creation, `createFamilyAction` tries to rollback by deleting the family
  3. The delete will silently fail due to missing DELETE RLS policy
  4. Orphaned family row remains in database
- **Priority:** Fix before deployment

#### BUG-22: Email invitation flow is broken end-to-end (High)
- **Severity:** High
- **Steps to Reproduce:**
  1. As admin, invite a user by email via the InviteSection
  2. `inviteByEmailAction` sends a magic link via `signInWithOtp` and creates a `family_invitations` record
  3. Invited user clicks the magic link, arrives at `/auth/callback?next=/onboarding`
  4. User is redirected to `/onboarding`
  5. Expected: User automatically joins the family from the email invitation
  6. Actual: User sees generic "create or join family" screen. No code is pre-filled. No mechanism looks up pending email invitations for this user's email to auto-join.
- **Note:** The email invitation record is created but never consumed. The `joinFamilyByCodeAction` only handles type='code' invitations.
- **Priority:** Fix before deployment -- email invitation is a core AC

#### BUG-23: Race condition on invite code redemption (Low)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Two users submit the same invite code simultaneously
  2. Both look up the invitation (both succeed since `used_at IS NULL`)
  3. First user's `mark_invitation_used` succeeds
  4. Second user's `mark_invitation_used` is a no-op (already marked)
  5. Both users' `join_family` RPCs succeed (both have `family_id IS NULL`)
  6. Result: Single-use code is used by two people
- **Note:** Extremely unlikely in a private family app. Could be fixed with a database transaction or `SELECT ... FOR UPDATE`.
- **Priority:** Nice to have

#### BUG-24: Member list does not display email addresses (Medium)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Navigate to `/family/settings`
  2. Look at the member list
  3. Expected: Each member shows Name, E-Mail, and Role (per AC-9)
  4. Actual: E-Mail column is always empty. `getFamilyDataAction` maps `email: ""` because profiles table has no email column.
- **Note:** Backend notes acknowledge this as a known limitation. Email must be fetched from `auth.users` (requires service role or a view) or stored in profiles.
- **Priority:** Fix before deployment -- violates acceptance criteria

#### BUG-25: removeMemberAction may silently fail due to profiles RLS (High)
- **Severity:** High
- **Steps to Reproduce:**
  1. As admin, try to remove a member from the family
  2. `removeMemberAction` does `supabase.from("profiles").update({ family_id: null, role: null }).eq("id", memberId).eq("family_id", profile.family_id)`
  3. If PROJ-1 profiles RLS only allows users to update their own profile (typical: `auth.uid() = id`), this update on another user's profile will silently fail
  4. No error is returned, but the member is not actually removed
- **Note:** The exact PROJ-1 profiles RLS policies are not in the migration file (created via Supabase Dashboard). Need to verify the UPDATE policy. Same concern applies to `updateMemberRoleAction`.
- **Priority:** Verify and fix -- could make member removal and role changes non-functional

#### BUG-26: invalidate_family_codes RPC unprotected (Medium)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. As any authenticated user (even non-member), call `supabase.rpc('invalidate_family_codes', { target_family_id: '<target-family-uuid>' })`
  2. Expected: Only admins of that family can invalidate codes
  3. Actual: Any authenticated user can invalidate any family's invite codes because the SECURITY DEFINER function has no `auth.uid()` authorization check
- **Note:** Server action correctly checks admin status, but the RPC is directly callable via Supabase client.
- **Priority:** Fix before deployment

#### BUG-27: mark_invitation_used RPC unprotected (Medium)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. As any authenticated user, call `supabase.rpc('mark_invitation_used', { invitation_id: '<target-invitation-uuid>' })`
  2. Expected: Only the user redeeming a valid code should mark it used
  3. Actual: Any authenticated user can mark any invitation as used, sabotaging invitations for other families
- **Note:** Exploitation requires knowing the invitation UUID, which is harder to guess. But if codes are intercepted or UUID is leaked, invitations can be sabotaged.
- **Priority:** Fix before deployment

#### BUG-28: join_family RPC allows arbitrary role escalation (CRITICAL)
- **Severity:** Critical
- **Steps to Reproduce:**
  1. Register a new user (no family)
  2. Using browser console or any Supabase client, call: `supabase.rpc('join_family', { target_family_id: '<any-family-uuid>', target_role: 'admin' })`
  3. Expected: User can only join via valid invite code with role 'adult'
  4. Actual: User becomes admin of the target family. The SECURITY DEFINER function only checks `family_id IS NULL` on the caller's profile -- it does not verify a valid invitation exists or restrict the role parameter.
- **Impact:** Complete authorization bypass. Any authenticated user without a family can hijack any family by becoming its admin. They could then remove real members, change data, etc.
- **Priority:** Fix immediately -- critical security vulnerability

#### BUG-29: /onboarding is in PUBLIC_ROUTES whitelist (Medium)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Open `/onboarding` in a browser without being logged in
  2. Expected: Redirected to `/login` (onboarding requires authentication)
  3. Actual: Page loads. User sees the onboarding UI. Server actions will fail with "Nicht angemeldet" but the page itself is accessible.
- **Note:** The onboarding page is in the `(auth)` route group but also in PUBLIC_ROUTES. The spec says onboarding should be protected ("Geschuetzte Route -- nur eingeloggter Nutzer ohne Familie"). The server actions handle auth correctly, so the risk is cosmetic (user sees forms but cannot submit), but it violates the design.
- **Priority:** Fix before deployment

#### BUG-30: leaveFamilyAction error from server action not shown in UI (Low)
- **Severity:** Low
- **Steps to Reproduce:**
  1. As the last admin, trigger `leaveFamilyAction` (bypass UI guard)
  2. The action returns `{ error: "..." }` but the `handleLeave` function in `LeaveFamilySection` does not check the return value
  3. It only has `try { await leaveFamilyAction() } catch {}` -- any non-redirect error is swallowed
- **Note:** The UI already prevents last-admin from seeing the leave button, so this is defense-in-depth. But if someone triggers it programmatically, the error is silently swallowed.
- **Priority:** Nice to have

### Summary
- **Acceptance Criteria:** 7/11 passed (2 conditional), 4 failed (AC-1, AC-3, AC-9 outright; AC-2 and AC-5 conditional)
- **Edge Cases:** 4/6 passed (1 conditional), 2 failed (EC-2, EC-3)
- **Bugs Found:** 11 total (2 critical, 3 high, 4 medium, 2 low)
- **Security:** CRITICAL issues found -- SECURITY DEFINER functions allow privilege escalation (BUG-28) and sabotage (BUG-26, BUG-27)
- **Production Ready:** NO
- **Blocking Issues:**
  - **BUG-20 (Critical):** Column name mismatch between middleware and server actions -- one or the other is broken
  - **BUG-28 (Critical):** `join_family` RPC allows any user to become admin of any family
  - **BUG-22 (High):** Email invitation flow is broken end-to-end
  - **BUG-25 (High):** Member removal/role changes may silently fail due to RLS
  - **BUG-26, BUG-27 (Medium):** Other SECURITY DEFINER functions lack authorization checks

### Test Run #2 (2026-03-22) -- Bug Fix Verification

**Tested:** 2026-03-22
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (Next.js compiles successfully, 0 TypeScript errors, 0 lint errors)
**Lint Status:** PASS (`npm run lint` runs cleanly)
**Scope:** Verify fixes for BUG-20 through BUG-29, re-test all acceptance criteria, new security audit

### Bug Fix Verification

#### BUG-20 (CRITICAL): Middleware queries profiles with wrong column name -- FIXED
- [x] Middleware now queries `.eq('id', user.id)` on line 58 of middleware.ts, matching the profiles PK
- [x] All server actions use `.eq('id', user.id)` consistently
- [x] All RPC functions use `WHERE id = auth.uid()` consistently
- **Verdict: FIXED**

#### BUG-21 (MEDIUM): No DELETE RLS policy on families table -- FIXED
- [x] `families_delete_creator` policy added: `USING (created_by = auth.uid())`
- [x] Policy present in both the bug-fix migration and the consolidated main migration
- **Verdict: FIXED**

#### BUG-22 (HIGH): Email invitation flow broken end-to-end -- FIXED
- [x] New `join_family_by_email_invitation()` RPC created: looks up caller email from `auth.users`, finds matching pending email invitation, atomically marks it used and updates profile
- [x] New `checkAndJoinEmailInvitationAction()` server action wraps the RPC
- [x] Onboarding page is now a Server Component that calls `checkAndJoinEmailInvitationAction()` on load; if `familyId` is returned, it `redirect("/dashboard")`
- [x] RLS policy `family_invitations_select_own_email` added for users to see their own email invitations
- **Verdict: FIXED**

#### BUG-23 (LOW): Race condition on invite code redemption -- FIXED
- [x] Old two-step flow (`joinFamilyByCodeAction` lookup + `mark_invitation_used` + `join_family`) replaced with single atomic `redeem_invite_code` RPC
- [x] `redeem_invite_code` uses `SELECT ... FOR UPDATE` to lock the invitation row
- [x] Marks invitation as used and updates profile within the same function
- **Verdict: FIXED**

#### BUG-24 (MEDIUM): Member list does not display email addresses -- FIXED
- [x] `email` column added to `profiles` table
- [x] Backfill from `auth.users` for existing rows
- [x] `BEFORE INSERT` trigger (`set_profile_email`) auto-populates email from `auth.users` on new profile creation
- [x] `getFamilyDataAction` now reads `m.email` directly from profiles (line 531): `email: m.email || ""`
- **Verdict: FIXED**

#### BUG-25 (HIGH): removeMemberAction may silently fail due to profiles RLS -- FIXED
- [x] Old self-only update policies dropped (`Users can update own profile`, `profiles_update_own`)
- [x] New `profiles_update_self_or_admin` policy: allows `id = auth.uid()` OR admin of same family to update
- [x] Both USING and WITH CHECK clauses present and identical
- **Verdict: FIXED**

#### BUG-26 (MEDIUM): invalidate_family_codes RPC unprotected -- FIXED
- [x] Function now verifies `auth.uid()` is admin of `target_family_id` before executing
- [x] Raises exception `Not authorized to invalidate codes for this family` on failure
- **Verdict: FIXED**

#### BUG-27 (MEDIUM): mark_invitation_used RPC unprotected -- FIXED
- [x] Function dropped entirely (`DROP FUNCTION IF EXISTS mark_invitation_used(UUID)`)
- [x] Replaced by atomic `redeem_invite_code` which only operates on caller's own profile
- **Verdict: FIXED**

#### BUG-28 (CRITICAL): join_family RPC allows arbitrary role escalation -- FIXED
- [x] Old `join_family(UUID, TEXT)` function dropped
- [x] Replaced with `join_family_as_creator(UUID)`: hardcodes `role = 'admin'`, verifies `families.created_by = auth.uid()`
- [x] Code-based joining uses `redeem_invite_code(TEXT)`: hardcodes `role = 'adult'`, requires valid unexpired code
- [x] Email-based joining uses `join_family_by_email_invitation()`: hardcodes `role = 'adult'`, requires matching email invitation
- [x] No RPC accepts a role parameter anymore -- roles are hardcoded in the function body
- **Verdict: FIXED**

#### BUG-29 (MEDIUM): /onboarding is in PUBLIC_ROUTES whitelist -- FIXED
- [x] `/onboarding` removed from `PUBLIC_ROUTES` array (now only `/login`, `/register`, `/forgot-password`, `/auth`)
- [x] Unauthenticated users accessing `/onboarding` will be redirected to `/login` by middleware
- **Verdict: FIXED**

#### BUG-30 (LOW): leaveFamilyAction error not shown in UI -- NOT FIXED
- [ ] `handleLeave` in `leave-family-section.tsx` (line 38-44) still uses `try { await leaveFamilyAction() } catch {}` without checking the return value
- [ ] The `errorMessage` state variable exists and is rendered in the UI, but `setErrorMessage` is never called because the action result is not inspected
- **Verdict: NOT FIXED** (remains low priority)

### Re-test: Acceptance Criteria Status

#### AC-1: Beim ersten Login ohne Familie -- Weiterleitung zu /onboarding
- [x] Middleware uses whitelist (PUBLIC_ROUTES) -- BUG-19 fix verified
- [x] Middleware queries `.eq('id', user.id)` -- BUG-20 fix verified
- [x] `/onboarding` not in PUBLIC_ROUTES -- BUG-29 fix verified
- [x] Users without `family_id` redirected to `/onboarding`
- [x] Users with `family_id` on auth routes redirected to `/dashboard`
- **Result: PASS**

#### AC-2: Familie erstellen -- Nutzer wird Admin
- [x] Uses `join_family_as_creator` RPC -- BUG-28 fix verified
- [x] RPC verifies `families.created_by = auth.uid()` before setting admin
- [x] Rollback supported by `families_delete_creator` RLS -- BUG-21 fix verified
- **Result: PASS**

#### AC-3: Einladung per E-Mail -- Eingeladener erhaelt E-Mail und tritt bei
- [x] `inviteByEmailAction` sends magic link + creates email invitation record
- [x] On arriving at `/onboarding`, Server Component calls `checkAndJoinEmailInvitationAction` -- BUG-22 fix verified
- [x] `join_family_by_email_invitation` RPC auto-joins user to family
- [x] If successful, immediate redirect to `/dashboard`
- **Result: PASS**

#### AC-4: Einladungscode -- 6-stellig, 7 Tage gueltig
- [x] No changes from Test Run #1 -- still passing
- [x] `invalidate_family_codes` now properly authorized -- BUG-26 fix verified
- **Result: PASS**

#### AC-5: Beitritt per Code
- [x] Uses atomic `redeem_invite_code` RPC -- BUG-23 fix verified
- [x] No more separate lookup + mark + join steps
- [x] `FOR UPDATE` prevents race conditions
- **Result: PASS**

#### AC-6: Rollen -- Admin kann zuweisen
- [x] `profiles_update_self_or_admin` RLS policy enables admin to update other members -- BUG-25 fix verified
- **Result: PASS**

#### AC-7: Ein Nutzer gehoert immer zu genau einer Familie
- [x] All RPCs check `family_id IS NULL` -- no changes needed
- **Result: PASS**

#### AC-8: Admin kann Mitglieder entfernen
- [x] `profiles_update_self_or_admin` RLS policy enables admin to set `family_id = null` on other members -- BUG-25 fix verified
- **Result: PASS**

#### AC-9: Mitgliederliste zeigt Name, E-Mail und Rolle
- [x] `profiles.email` column exists, backfilled, auto-populated -- BUG-24 fix verified
- [x] `getFamilyDataAction` reads `m.email` from profiles
- **Result: PASS**

#### AC-10: Familienname editierbar (nur Admin)
- [x] No changes -- still passing
- **Result: PASS**

#### AC-11: Mindestens ein Admin verbleibt
- [x] No changes -- still passing
- **Result: PASS**

### Re-test: Edge Cases Status

#### EC-1: Einladungscode ablaeuft
- **Result: PASS** (no changes)

#### EC-2: Eingeladene E-Mail hat bereits ein Konto
- [x] `join_family_by_email_invitation` handles this: looks up email in `family_invitations`, auto-joins -- BUG-22 fix verified
- **Result: PASS**

#### EC-3: Einladungslink ohne Konto
- [x] `signInWithOtp({ shouldCreateUser: true })` creates account + sends magic link
- [x] After account creation and redirect, `checkAndJoinEmailInvitationAction` auto-joins
- **Result: PASS**

#### EC-4: Letzter Admin entfernt sich selbst
- **Result: PASS** (no changes)

#### EC-5: Mitglied gehoert bereits einer anderen Familie an
- **Result: PASS** (no changes)

#### EC-6: Nach Familien-Erstellen -- Middleware erkennt family_id
- [x] Middleware column name fixed -- BUG-20 fix verified
- **Result: PASS**

### New Security Audit (Post-Fix)

#### Security-Definer Functions -- Re-Audit
- [x] `join_family_as_creator(UUID)`: Verifies `families.created_by = auth.uid()`, hardcodes `role = 'admin'`, checks `family_id IS NULL` -- SECURE
- [x] `redeem_invite_code(TEXT)`: Checks `family_id IS NULL`, uses `FOR UPDATE` locking, hardcodes `role = 'adult'` -- SECURE
- [x] `join_family_by_email_invitation()`: No parameters (uses `auth.uid()` internally), checks `family_id IS NULL`, uses `FOR UPDATE` locking, hardcodes `role = 'adult'` -- SECURE
- [x] `invalidate_family_codes(UUID)`: Verifies caller is admin of target family -- SECURE
- [x] `set_profile_email()`: BEFORE INSERT trigger, reads from `auth.users` -- SECURE (no user input)

#### RLS Policies -- Re-Audit
- [x] `families`: SELECT (members), UPDATE (admins), INSERT (authenticated), DELETE (creator) -- Complete
- [x] `profiles`: UPDATE allows self OR admin of same family -- Correct
- [x] `family_invitations`: SELECT for admins, SELECT for active codes (any auth), SELECT for own email invitations, INSERT for admins -- Complete
- [ ] BUG-31: `family_invitations` has no UPDATE RLS policy. The `redeem_invite_code` and `join_family_by_email_invitation` RPCs update `family_invitations.used_at` using SECURITY DEFINER, so this works. However, there is no direct UPDATE policy, which means non-SECURITY-DEFINER paths cannot update invitations. This is correct behavior (all updates go through RPCs), but worth noting for future maintainability.
- **Result: NOT A BUG** (by design -- all updates go through RPCs)

#### New Issue Found: Rate Limit Key Collision
- [ ] BUG-31: `getIP()` in family.ts parses `x-forwarded-for` by taking the LAST IP (`ips[ips.length - 1]`). The comment says "vom vertrauenswuerdigsten Proxy gesetzt", but the standard convention is that the FIRST IP is the client IP and the LAST is the nearest proxy. This means the rate limit may be keyed by the proxy IP instead of the client IP. In a shared NAT/proxy environment, all users behind the same proxy would share rate limits. Same issue exists in auth.ts.
- **Severity:** Low
- **Impact:** Rate limiting may be less effective behind proxies. Not exploitable for rate limit bypass (if anything, it is too aggressive -- legitimate users may be rate-limited by others' actions). For a private family app, this is negligible.
- **Priority:** Nice to have

#### New Issue Found: Duplicate Supabase Client in leaveFamilyAction
- [ ] BUG-32: `leaveFamilyAction` calls `await createClient()` twice (lines 436 and 451 of family.ts). The first call is inside the admin check block, the second is for the actual update. While not a bug per se (each creates a valid client), it is wasteful and could cause subtle session inconsistencies if cookies change between calls.
- **Severity:** Low
- **Impact:** Minor performance inefficiency. No functional impact.
- **Priority:** Nice to have

#### New Issue Found: profiles_update_self_or_admin RLS allows admin to escalate other members
- [ ] BUG-33: The `profiles_update_self_or_admin` RLS policy allows any admin to update ANY column on family members' profiles (not just `role` and `family_id`). An admin could theoretically use the Supabase client directly to update another member's `display_name` or `email`. The server actions only update `role` or `family_id`, but the RLS is broader than necessary.
- **Severity:** Low
- **Impact:** Admin can modify other members' display_name or email via direct Supabase client calls. In a family app where admins are parents, this is likely acceptable behavior. Not a security escalation since admins are already trusted.
- **Priority:** Nice to have (could add column-level restrictions via a more granular policy or a SECURITY DEFINER function)

#### Cross-Browser Testing
- Cannot be fully performed via code review. Code uses standard Tailwind CSS, shadcn/ui, no browser-specific APIs.
- `navigator.clipboard.writeText` (in invite-section.tsx) requires HTTPS in some browsers. May fail on HTTP localhost in Firefox. Fallback is a silent catch -- no crash.
- Expected to work in Chrome, Firefox, Safari based on code review.

#### Responsive Testing
- Cannot be fully performed via code review.
- Desktop (1440px): Table layout for members, inline forms -- expected correct
- Tablet (768px): `md:` breakpoint is 768px, so tablet may show either table or card depending on exact width. At exactly 768px, table layout activates.
- Mobile (375px): Card layout, `w-[120px]` Select may be tight but functional. `max-w-2xl` container with `px-4` padding leaves adequate space.

### New Bugs Found

#### BUG-31: getIP() uses last IP from x-forwarded-for instead of first (Low)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Access the app through a proxy that sets `x-forwarded-for: client-ip, proxy-ip`
  2. Rate limiting is keyed by `proxy-ip` instead of `client-ip`
  3. All users behind the same proxy share rate limit counters
- **Priority:** Nice to have

#### BUG-32: leaveFamilyAction creates duplicate Supabase clients (Low)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Call `leaveFamilyAction` as an admin (non-last-admin)
  2. Two separate `createClient()` calls are made within the same action
  3. Minor performance waste; no functional impact
- **Priority:** Nice to have

#### BUG-33: profiles_update_self_or_admin RLS is broader than necessary (Low)
- **Severity:** Low
- **Steps to Reproduce:**
  1. As an admin, use Supabase client directly to update another member's `display_name`
  2. RLS allows it because the policy permits admin to update any column on family members
  3. Server actions only update `role`/`family_id`, but RLS does not restrict columns
- **Priority:** Nice to have (acceptable for family app trust model)

### Summary (Test Run #2)
- **Bug Fixes Verified:** 9/10 fixed (BUG-20 through BUG-29). BUG-30 remains unfixed (low priority).
- **Acceptance Criteria:** 11/11 PASSED
- **Edge Cases:** 6/6 PASSED
- **New Bugs Found:** 3 (all Low severity)
- **Security Audit:** All critical and high-severity security issues resolved. Remaining items are low-severity hardening opportunities.
- **Production Ready:** YES (conditional)
- **Conditions:**
  - BUG-30 (Low): `leaveFamilyAction` error not shown in UI -- acceptable as defense-in-depth; UI prevents the scenario.
  - BUG-31, BUG-32, BUG-33 (all Low): Minor issues that do not affect functionality or security for a private family app.
- **Recommendation:** Deploy. Fix remaining low-priority bugs in next iteration.

## Deployment
_To be added by /deploy_
