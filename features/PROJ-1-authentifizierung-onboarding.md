# PROJ-1: Authentifizierung & Onboarding

## Status: In Review
**Created:** 2026-03-18
**Last Updated:** 2026-03-19

## Dependencies
- None (Basis für alle anderen Features)

## User Stories
- Als neuer Nutzer möchte ich mich mit E-Mail und Passwort registrieren, damit ich ein Konto anlegen kann.
- Als registrierter Nutzer möchte ich meine E-Mail-Adresse bestätigen, damit mein Konto aktiviert wird.
- Als Nutzer möchte ich mich mit E-Mail und Passwort einloggen, damit ich auf meine Familiendaten zugreifen kann.
- Als Nutzer möchte ich mein Passwort zurücksetzen können, wenn ich es vergessen habe.
- Als eingeloggter Nutzer möchte ich mich ausloggen können, damit meine Session sicher beendet wird.
- Als Nutzer möchte ich nach dem Login automatisch zur richtigen Seite weitergeleitet werden (Dashboard oder Onboarding, falls noch keine Familie).

## Acceptance Criteria
- [ ] Registrierung mit E-Mail + Passwort funktioniert; Nutzer erhält Bestätigungs-E-Mail.
- [ ] Ohne E-Mail-Bestätigung kann kein vollständiger Zugriff auf die App erfolgen.
- [ ] Login mit korrekten Daten leitet zum Dashboard weiter; bei Fehler erscheint eine verständliche Fehlermeldung.
- [ ] Passwort-Reset-Flow: Nutzer gibt E-Mail ein, erhält Reset-Link, kann neues Passwort setzen.
- [ ] Logout beendet die Session und leitet zur Login-Seite weiter.
- [ ] Passwort muss Mindestanforderungen erfüllen (min. 8 Zeichen).
- [ ] Bereits registrierte E-Mail zeigt klare Fehlermeldung bei erneuter Registrierung.
- [ ] Nutzer ohne Familie werden nach Login zum Onboarding (Familie erstellen/beitreten) geleitet.
- [ ] Eingeloggte Nutzer werden von Login/Register-Seiten automatisch zum Dashboard weitergeleitet.
- [ ] Sessions bleiben über Browser-Neustarts hinweg erhalten (Supabase persistente Sessions).

## Edge Cases
- Was passiert, wenn die Bestätigungs-E-Mail nicht ankommt? → Link zum erneuten Versenden anbieten.
- Was passiert, wenn ein Nutzer den Reset-Link nach Ablauf nutzt? → Fehlermeldung + neuer Link anfordern.
- Was passiert, wenn ein Nutzer mehrere Tabs offen hat und sich in einem ausloggt? → Alle anderen Tabs sollten ebenfalls abgemeldet werden (Supabase Session-Sync).
- Was passiert bei sehr langsamer Verbindung während des Logins? → Lade-Indikator anzeigen, Button deaktivieren während Anfrage läuft.
- Was passiert, wenn ein Nutzer zu einer Familie eingeladen wurde, aber noch kein Konto hat? → Registrierung und direkte Verknüpfung mit der Einladung.

## Technical Requirements
- Security: Supabase Auth (GoTrue), PKCE Flow für sichere Token-Übertragung.
- Passwörter werden nie im Klartext gespeichert (Supabase übernimmt Hashing).
- Alle Auth-Routen sind serverseitig geschützt (Middleware).
- Redirect-URLs sind auf die eigene Domain beschränkt.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Seitenstruktur

```
App (Next.js)
│
├── Middleware (schützt alle Routen serverseitig)
│   ├── Nicht eingeloggt → weiter zu /login
│   ├── Eingeloggt, keine Familie → weiter zu /onboarding
│   └── Eingeloggt + Familie → Zugang zum App-Bereich
│
├── /login                      ← Öffentliche Route
│   ├── E-Mail/Passwort-Formular
│   ├── Link "Passwort vergessen"
│   └── Link "Registrieren"
│
├── /register                   ← Öffentliche Route
│   ├── E-Mail/Passwort-Formular (mit Bestätigung)
│   └── Link "Bereits registriert"
│
├── /forgot-password            ← Öffentliche Route
│   ├── E-Mail-Eingabe
│   └── Bestätigungsmeldung nach Versand
│
├── /auth/reset-password        ← Öffentliche Route (via E-Mail-Link)
│   └── Neues Passwort setzen
│
├── /auth/confirm               ← Callback von Supabase
│   └── E-Mail-Bestätigung verarbeiten + weiterleiten
│
└── /onboarding                 ← Geschützte Route (nur eingeloggter Nutzer ohne Familie)
    ├── Karte "Familie erstellen"
    └── Karte "Familie beitreten (Code eingeben)"
```

### Datenmodell

**Supabase Auth verwaltet automatisch:**
- E-Mail-Adresse, Passwort-Hash, Session-Token, E-Mail-Bestätigungsstatus

**Eigene `profiles`-Tabelle** (ergänzt auth.users):
- Benutzer-ID (Verknüpfung zu auth.users)
- Anzeigename
- Profilbild-URL (optional)
- Erstellt-am

> `family_id` und Rolle kommen mit PROJ-2; `profiles` wird dann erweitert.

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Supabase Auth | Kein eigenes Auth-System nötig; E-Mail-Verifizierung, Passwort-Hashing, PKCE-Flow fertig. |
| Next.js Middleware | Routenschutz serverseitig vor dem Laden der Seite – kein Flackern, keine unsicheren Client-Checks. |
| Server Components für Session | Session serverseitig lesen – sicherer, kein Token im Browser-JS. |
| Client Components nur für Formulare | Formulare brauchen interaktiven Zustand (Validierung, Lade-Indikatoren). |
| react-hook-form + Zod | Bereits im Stack; typsichere Validierung vor dem Absenden. |
| @supabase/ssr | Offizielles Paket für Next.js App Router – verwaltet Cookies korrekt auf Server und Client. |

### Datenfluß: Login

```
Nutzer tippt E-Mail + Passwort
       ↓
react-hook-form validiert (Format, min. 8 Zeichen)
       ↓
Supabase Auth API aufrufen
       ↓
Fehler → Fehlermeldung anzeigen
Erfolg → Cookie gesetzt
       ↓
Middleware prüft: Hat Nutzer eine Familie?
       ↓
Ja → /dashboard   |   Nein → /onboarding
```

### Neue Pakete
- `@supabase/supabase-js` – Supabase-Client
- `@supabase/ssr` – Next.js App Router Integration für Supabase Sessions

## Frontend Implementation Notes
**Implemented by:** /frontend skill
**Date:** 2026-03-18

### Was gebaut wurde
- **Pastel-Theme:** Kinderfreundliche Pastellfarben (Lila-Primaerfarbe, Rosa-Sekundaerfarbe, Minze-Akzent) in globals.css
- **AuthLayout-Komponente:** Wiederverwendbares Layout mit dekorativen Hintergrund-Formen und Familien-Logo
- **Login-Seite** (`/login`): E-Mail/Passwort-Formular mit Passwort-Anzeige-Toggle, Zod-Validierung, Loading/Error-States
- **Registrierungs-Seite** (`/register`): Anzeigename + E-Mail + Passwort mit Bestaetigung, Erfolgsanzeige mit E-Mail-Bestaetigungshinweis
- **Passwort-vergessen-Seite** (`/forgot-password`): E-Mail-Eingabe mit Erfolgsbestaetigung
- **Passwort-zuruecksetzen-Seite** (`/auth/reset-password`): Neues Passwort setzen mit Bestaetigung, Hinweis auf abgelaufene Links
- **E-Mail-Bestaetigungs-Seite** (`/auth/confirm`): Loading/Success/Error-States
- **Onboarding-Seite** (`/onboarding`): Auswahl zwischen "Familie erstellen" und "Familie beitreten" (Code-Eingabe)
- **Zod-Validierungsschemas** in `src/lib/validations/auth.ts`
- **Root-Redirect:** `/` leitet vorlaeufig zu `/login` weiter

### Noch offen (fuer /backend)
- Supabase Auth-Calls in allen Formularen (aktuell nur console.log + simulierte Verzoegerung)
- Next.js Middleware fuer Routenschutz
- E-Mail-Bestaetigungs-Callback in `/auth/confirm`
- Session-Management und automatische Weiterleitung

### Design-Entscheidungen
- Tablet-first responsive Design (max-w-md Karten, md:flex-row fuer Onboarding-Karten)
- Deutsche Texte, i18n-ready Architektur (alle Strings zentral austauschbar)
- shadcn/ui Komponenten: Card, Button, Input, Form, Label
- Verspielter Look: Abgerundete Ecken (radius 0.75rem), weiche Schatten, dekorative Blur-Kreise

## Backend Implementation Notes
**Implemented by:** /backend skill
**Date:** 2026-03-19

### Was gebaut wurde
- **`@supabase/ssr`** installiert – Next.js App Router Integration
- **`src/lib/supabase/client.ts`** – Browser-Client (fuer Client Components)
- **`src/lib/supabase/server.ts`** – Server-Client (fuer Server Components & Server Actions)
- **`src/middleware.ts`** – Session-Refresh + Routenschutz (geschuetzt: `/dashboard`, Auth-Redirect: `/login`, `/register`, `/forgot-password`, `/onboarding`)
- **`src/app/auth/callback/route.ts`** – PKCE Code-Exchange; leitet zu `/dashboard` oder `?next=`-Param weiter
- **`src/lib/actions/auth.ts`** – Server Actions: `loginAction`, `registerAction`, `forgotPasswordAction`, `logoutAction`
- **Datenbank:** `profiles`-Tabelle mit RLS, Trigger erstellt automatisch Profil bei Registrierung
- **`.env.local`** – `NEXT_PUBLIC_SITE_URL` hinzugefuegt
- **Alle Auth-Seiten** mit echten Supabase-Calls verbunden (kein console.log mehr)
- **`/auth/reset-password`** – nutzt Browser-Client `supabase.auth.updateUser`, Redirect zu `/login` nach Erfolg
- **`/auth/confirm`** – verarbeitet `token_hash` aus URL via `supabase.auth.verifyOtp`, Suspense-Boundary fuer `useSearchParams`

### Abweichungen vom Spec
- Onboarding-Seite bleibt vorerst Frontend-only (Familie erstellen/beitreten gehoert zu PROJ-2)
- Middleware leitet eingeloggte User ohne Familie direkt zu `/dashboard` (nicht zu `/onboarding`) – wird mit PROJ-2 angepasst

### Supabase Dashboard Konfiguration (manuell)
In **Authentication -> URL Configuration** eintragen:
- **Site URL:** `http://localhost:3000` (lokal) oder Vercel-URL (Produktion)
- **Redirect URLs:** `http://localhost:3000/**` und `https://deine-app.vercel.app/**`

## QA Test Results

### Re-Test #3 (2026-03-19)

**Tested:** 2026-03-19
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (Next.js 16.1.7 compiles successfully, 0 TypeScript errors, 1 deprecation warning)
**Lint Status:** FAIL (`npm run lint` errors with "Invalid project directory" -- see BUG-16)

### Bugs Fixed Since Re-Test #2

- **BUG-3 (FIXED):** `registerAction` now parses Supabase error messages for "already"/"registered" keywords (lines 93-96 of `src/lib/actions/auth.ts`) and returns "Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an." AC-7 now conditionally PASSES (see BUG-17 for reliability concern).
- **BUG-5 (FIXED):** `/auth/confirm` error page now links to `/auth/resend-confirmation` (a dedicated page). New `resendConfirmationAction` server action added with rate limiting (3/hr) and Zod validation. Registration success page also offers inline "Erneut senden" button. EC-1 now PASSES.
- **BUG-10 (FIXED):** All server actions (`loginAction`, `registerAction`, `forgotPasswordAction`, `resendConfirmationAction`) now validate input with Zod (`safeParse`) before calling Supabase. Uses `parsed.data` for clean values.
- **BUG-11 (FIXED):** `next.config.ts` now includes comprehensive security headers: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, HSTS, Permissions-Policy, and Content-Security-Policy with `connect-src` for Supabase domains.
- **BUG-15 (PARTIALLY FIXED):** `getIP()` now prefers `x-real-ip` header (set by Vercel/nginx) and falls back to last entry in `x-forwarded-for`. This is significantly better for Vercel deployments. Residual risk remains in self-hosted scenarios without a trusted proxy (see BUG-15 updated note).

### Acceptance Criteria Status

#### AC-1: Registrierung mit E-Mail + Passwort funktioniert; Nutzer erhaelt Bestaetigungs-E-Mail
- [x] Registration form has email, password, confirm password, and display name fields
- [x] Zod validation enforces required fields and min 8 chars for password
- [x] Server-side Zod validation in `registerAction` (BUG-10 fixed)
- [x] `registerAction` calls `supabase.auth.signUp` with `emailRedirectTo` pointing to `/auth/callback`
- [x] On success, a confirmation screen is displayed with "Erneut senden" button for resending confirmation
- [x] On error, a German error message is shown
- **Result: PASS**

#### AC-2: Ohne E-Mail-Bestaetigung kann kein vollstaendiger Zugriff auf die App erfolgen
- [x] Supabase Auth enforces email confirmation by default
- [x] Middleware checks `user.email_confirmed_at` (line 43 of middleware.ts) and redirects unconfirmed users to `/login`
- **Result: PASS**

#### AC-3: Login mit korrekten Daten leitet zum Dashboard weiter; bei Fehler erscheint eine verstaendliche Fehlermeldung
- [x] `loginAction` validates input with Zod, then calls `supabase.auth.signInWithPassword` and redirects to `/dashboard` on success
- [x] On Zod validation failure, displays: "Ungueltige Eingaben."
- [x] On auth error, displays: "Anmeldung fehlgeschlagen. Bitte pruefe deine Zugangsdaten."
- [x] Error messages are in German and user-friendly
- **Result: PASS**

#### AC-4: Passwort-Reset-Flow: Nutzer gibt E-Mail ein, erhaelt Reset-Link, kann neues Passwort setzen
- [x] `/forgot-password` page accepts email and calls `forgotPasswordAction` (with server-side Zod validation)
- [x] `forgotPasswordAction` calls `supabase.auth.resetPasswordForEmail` with redirect to `/auth/callback?next=/auth/reset-password`
- [x] `/auth/callback` exchanges code and redirects to `/auth/reset-password` (validated `next` parameter)
- [x] `/auth/reset-password` uses browser client `supabase.auth.updateUser` to set new password
- [x] Success message shown, auto-redirect to `/login` after 2 seconds
- [x] Error state shows "Neuen Link anfordern" link pointing to `/forgot-password`
- **Result: PASS**

#### AC-5: Logout beendet die Session und leitet zur Login-Seite weiter
- [x] `logoutAction` calls `supabase.auth.signOut()` and redirects to `/login`
- [ ] No logout button exists anywhere in the current UI. No `/dashboard` page exists yet.
- **Result: FAIL** (see BUG-2 -- blocked by PROJ-3 Dashboard)

#### AC-6: Passwort muss Mindestanforderungen erfuellen (min. 8 Zeichen)
- [x] `loginSchema` enforces `.min(8)` with German error message
- [x] `registerSchema` enforces same min 8 constraint
- [x] `resetPasswordSchema` enforces same min 8 constraint
- [x] Server-side Zod validation also enforces min 8 (BUG-10 fixed)
- **Result: PASS**

#### AC-7: Bereits registrierte E-Mail zeigt klare Fehlermeldung bei erneuter Registrierung
- [x] `registerAction` now checks `error.message` for "already"/"registered" keywords (case-insensitive)
- [x] Returns specific message: "Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an."
- [ ] Reliability concern: Supabase error messages may differ across API versions or locales. String matching on error.message is fragile. (see BUG-17)
- **Result: CONDITIONAL PASS** (works with current Supabase version; fragile long-term)

#### AC-8: Nutzer ohne Familie werden nach Login zum Onboarding geleitet
- [ ] Middleware does NOT check for family membership. All logged-in users go to `/dashboard`.
- **Result: FAIL** (see BUG-4 -- deferred to PROJ-2)

#### AC-9: Eingeloggte Nutzer werden von Login/Register-Seiten automatisch zum Dashboard weitergeleitet
- [x] Middleware checks `authRoutes` and redirects logged-in users to `/dashboard`
- **Result: PASS**

#### AC-10: Sessions bleiben ueber Browser-Neustarts hinweg erhalten (Supabase persistente Sessions)
- [x] `@supabase/ssr` manages cookies with proper `getAll`/`setAll` in middleware and server client
- [x] Middleware refreshes session on every request
- **Result: PASS**

### Edge Cases Status

#### EC-1: Bestaetigungs-E-Mail kommt nicht an -- Link zum erneuten Versenden anbieten
- [x] `/auth/confirm` error page links to `/auth/resend-confirmation` (dedicated resend page)
- [x] `/auth/resend-confirmation` page has email input form calling `resendConfirmationAction`
- [x] `resendConfirmationAction` calls `supabase.auth.resend({ type: 'signup' })` with proper `emailRedirectTo`
- [x] Rate limited: 3 requests/hour per IP
- [x] Registration success page also offers inline "Erneut senden" button
- **Result: PASS** (previously BUG-5, now fixed)

#### EC-2: Reset-Link nach Ablauf genutzt -- Fehlermeldung + neuer Link anfordern
- [x] `/auth/reset-password` shows error with "Neuen Link anfordern" link pointing to `/forgot-password`
- **Result: PASS**

#### EC-3: Mehrere Tabs offen, in einem ausloggen -- alle Tabs abmelden
- [ ] No `onAuthStateChange` listener is set up in client components.
- **Result: FAIL** (see BUG-6)

#### EC-4: Langsame Verbindung waehrend Login -- Lade-Indikator, Button deaktivieren
- [x] All forms use `isLoading` state with `disabled={isLoading}` on buttons and inputs
- [x] Loader2 spinner icon shown during loading
- **Result: PASS**

#### EC-5: Nutzer mit Einladung aber ohne Konto -- Registrierung + Verknuepfung
- [ ] Not implemented yet (deferred to PROJ-2 family management)
- **Result: NOT TESTED** (dependency on PROJ-2)

### Security Audit Results

#### Authentication
- [x] Middleware protects `/dashboard` route -- unauthenticated users redirected to `/login`
- [x] Middleware checks `email_confirmed_at` -- unconfirmed users cannot access `/dashboard`
- [x] Server Actions use `createClient()` from server module (not browser client)
- [x] PKCE flow used via `exchangeCodeForSession` in `/auth/callback`
- [x] Rate limiting on all auth actions: login (10/15min), register (5/hr), forgot-password (5/hr), resend-confirmation (3/hr) per IP
- [x] `getIP()` prefers `x-real-ip` over `x-forwarded-for` (improved since Re-Test #2)
- [ ] NOTE: Rate limiting is in-memory only -- resets on server restart, does not persist across instances. Acceptable for private family project.

#### Authorization
- [x] Profiles table has RLS enabled
- [x] Supabase Anon Key is used (not service role key) in client-facing code
- [x] `/auth/callback` `next` parameter validated by `safeRedirectPath()`

#### Input Validation
- [x] Client-side Zod validation on all forms
- [x] Server-side Zod validation in all Server Actions (BUG-10 fixed)
- [x] Server Actions use `parsed.data` (sanitized values) for Supabase calls
- [ ] NOTE: `resendConfirmationAction` reuses `forgotPasswordSchema` for email validation -- functional but semantically imprecise. Not a bug.

#### Secrets / Data Exposure
- [x] `.env.local` is in `.gitignore`
- [x] No hardcoded secrets found in source code
- [x] `NEXT_PUBLIC_` prefix used only for Supabase URL and Anon Key (safe to expose)
- [ ] NOTE: `.env.local.example` was deleted (shown as `D` in git status). Minor documentation gap.

#### Security Headers
- [x] X-Frame-Options: DENY -- configured in `next.config.ts`
- [x] X-Content-Type-Options: nosniff -- configured
- [x] Referrer-Policy: strict-origin-when-cross-origin -- configured
- [x] Strict-Transport-Security: max-age=63072000; includeSubDomains; preload -- configured
- [x] Permissions-Policy: camera=(), microphone=(), geolocation=() -- configured
- [x] Content-Security-Policy: frame-ancestors 'none', connect-src includes Supabase domains -- configured
- [ ] BUG: CSP allows `script-src 'unsafe-inline' 'unsafe-eval'` which weakens XSS protection. While Next.js requires `'unsafe-inline'` for inline styles, `'unsafe-eval'` should be removed in production. (see BUG-18)

#### XSS
- [x] React's JSX auto-escapes user content by default
- [x] No use of `dangerouslySetInnerHTML`
- [x] Error messages are hardcoded strings, not reflecting user input

#### Redirect Path Traversal (BUG-14 -- still open, low risk)
- [x] `safeRedirectPath()` blocks `//evil.com` and non-`/` prefixed paths
- [ ] Path traversal like `/../../` still accepted but browsers normalize to same origin. Low risk.

#### Rate Limit Key Spoofing (BUG-15 -- improved)
- [x] `getIP()` prefers `x-real-ip` (set by Vercel), falls back to last `x-forwarded-for` entry
- [ ] In self-hosted scenarios without a trusted proxy, `x-real-ip` can still be spoofed. Acceptable for Vercel deployment target.

#### New Finding: Middleware only protects /dashboard path
- [ ] BUG: Middleware only protects routes starting with `/dashboard`. If future protected routes are added under different paths (e.g., `/settings`, `/profile`), they would be unprotected. A whitelist of public routes (instead of blacklist of protected routes) would be more secure. (see BUG-19)

### Cross-Browser Testing
- Cannot be performed via code review only. Requires manual browser testing.
- Code uses standard CSS (Tailwind), no browser-specific APIs. Expected to work in Chrome, Firefox, Safari.

### Responsive Testing
- Cannot be performed via code review only. Requires manual viewport testing.
- Code uses `max-w-md` cards, `md:flex-row` breakpoints, `px-4 py-8` padding. Expected to render correctly at 375px, 768px, 1440px.

### Bugs Found

#### FIXED Bugs (cumulative across all QA runs)

- ~~BUG-1: Middleware does not verify email confirmation status~~ -- FIXED in Re-Test #2
- ~~BUG-3: Generic error message for duplicate email registration~~ -- FIXED in Re-Test #3 (string matching on Supabase error; see BUG-17 for fragility note)
- ~~BUG-5: "Resend confirmation" link leads to full re-registration~~ -- FIXED in Re-Test #3 (new `/auth/resend-confirmation` page + `resendConfirmationAction`)
- ~~BUG-8: No rate limiting on authentication endpoints~~ -- FIXED in Re-Test #2
- ~~BUG-9: Open redirect potential in /auth/callback~~ -- FIXED in Re-Test #2
- ~~BUG-10: No server-side input validation in Server Actions~~ -- FIXED in Re-Test #3 (all actions use Zod `safeParse`)
- ~~BUG-11: Security headers not configured~~ -- FIXED in Re-Test #3 (comprehensive headers in `next.config.ts`)
- ~~BUG-15: Rate limit key spoofable via X-Forwarded-For header~~ -- PARTIALLY FIXED in Re-Test #3 (prefers `x-real-ip`)

#### BUG-2: No logout button in the UI (STILL OPEN)
- **Severity:** High
- **Steps to Reproduce:**
  1. Log in successfully
  2. Expected: A logout button is visible somewhere (dashboard, header, etc.)
  3. Actual: `logoutAction` exists in code but no UI element triggers it. No `/dashboard` page exists yet.
- **Priority:** Blocked by PROJ-3 Dashboard

#### BUG-4: No onboarding redirect for users without a family (STILL OPEN)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Log in as a user without a family
  2. Expected: Redirected to `/onboarding`
  3. Actual: Redirected to `/dashboard` (which does not exist yet)
- **Note:** Acknowledged deviation, deferred to PROJ-2
- **Priority:** Deferred to PROJ-2

#### BUG-6: Cross-tab logout sync not implemented (STILL OPEN)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open the app in two browser tabs
  2. Log out in one tab
  3. Expected: Second tab detects logout and redirects to login
  4. Actual: Second tab remains in its current state until next navigation
- **Priority:** Nice to have

#### BUG-7: No maximum password length enforcement (STILL OPEN)
- **Severity:** Low
- **Steps to Reproduce:**
  1. On register or reset-password page, enter a password with 100,000+ characters
  2. Expected: Validation rejects excessively long passwords
  3. Actual: Password is sent to Supabase API without length cap
- **Priority:** Nice to have

#### BUG-12: Onboarding "Familie erstellen" still uses console.log + simulated delay (STILL OPEN)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Navigate to `/onboarding`
  2. Click "Familie erstellen", enter a name, and submit
  3. Expected: Family is created in the database
  4. Actual: `console.log("Create family:", familyName)` and `setTimeout`
- **Note:** Deferred to PROJ-2
- **Priority:** Deferred to PROJ-2

#### BUG-13: Deprecated middleware file convention (STILL OPEN)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Run `npm run build`
  2. Observe warning: 'The "middleware" file convention is deprecated. Please use "proxy" instead.'
- **Priority:** Fix in next sprint

#### BUG-14: Redirect path traversal not fully sanitized (STILL OPEN)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Craft URL: `/auth/callback?code=VALID_CODE&next=/../../some-path`
  2. Browsers normalize to same origin, so exploitation is limited.
- **Priority:** Nice to have

#### BUG-16: `npm run lint` command is broken (NEW)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Run `npm run lint`
  2. Expected: ESLint runs and reports issues
  3. Actual: Error: "Invalid project directory provided, no such directory: .../lint". The `next lint` command fails, likely due to missing or misconfigured ESLint setup for Next.js 16.
- **Priority:** Fix before deployment (lint should work for CI/CD)

#### BUG-17: Duplicate email error detection relies on fragile string matching (NEW)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Register with an already-used email
  2. `registerAction` checks `error.message.toLowerCase().includes('already')` or `.includes('registered')`
  3. Expected: Reliable detection across Supabase versions
  4. Actual: If Supabase changes its error message format (different wording, different language, or error code instead of message text), the specific "already registered" message would not be shown, falling back to generic error.
- **Note:** Works with current Supabase version. A more robust approach would check `error.status === 400` or Supabase error codes.
- **Priority:** Nice to have

#### BUG-18: CSP allows 'unsafe-eval' in script-src (NEW)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Inspect Content-Security-Policy header in `next.config.ts`
  2. `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
  3. Expected: `'unsafe-eval'` should not be present in production CSP
  4. Actual: `'unsafe-eval'` weakens XSS protections by allowing `eval()`, `Function()`, etc. While Next.js dev mode needs it, production builds should use nonces or hashes instead of `'unsafe-inline'` and remove `'unsafe-eval'` entirely.
- **Note:** `'unsafe-inline'` may be needed for Next.js inline styles. `'unsafe-eval'` should be tested for removal.
- **Priority:** Fix before production deployment

#### BUG-19: Middleware uses blacklist instead of whitelist for route protection (NEW)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Review `src/middleware.ts` -- only `/dashboard` is explicitly protected
  2. Add a new protected route (e.g., `/settings`) without updating middleware
  3. Expected: New route is automatically protected
  4. Actual: Route would be accessible without authentication. A whitelist of public routes would be safer.
- **Note:** Currently only `/dashboard` needs protection. Risk increases as more protected routes are added.
- **Priority:** Fix when adding new protected routes (PROJ-3 and beyond)

### Summary
- **Acceptance Criteria:** 8/10 passed (1 conditional), 2 failed (AC-5, AC-8)
- **Edge Cases:** 3/5 passed, 1 failed, 1 not testable
- **Bugs Fixed This Round:** 5 fully fixed (BUG-3, BUG-5, BUG-10, BUG-11) + 1 partially fixed (BUG-15)
- **Bugs Fixed Cumulative:** 8 (BUG-1, BUG-3, BUG-5, BUG-8, BUG-9, BUG-10, BUG-11, BUG-15)
- **Bugs Remaining:** 11 total (0 critical, 1 high, 4 medium, 4 low, 2 deferred to PROJ-2)
- **New Bugs Found:** 4 (BUG-16 medium, BUG-17 low, BUG-18 medium, BUG-19 low)
- **Security:** Significantly improved. Server-side validation, security headers, and improved IP detection all fixed. Remaining concerns: CSP `'unsafe-eval'` (BUG-18) and blacklist-based route protection (BUG-19).
- **Production Ready:** NO -- but much closer than Re-Test #2
- **Blocking Issues:** BUG-2 (no logout UI, blocked by PROJ-3) is the only High-severity bug. BUG-16 (broken lint), BUG-18 (unsafe-eval in CSP) should be fixed before deployment. BUG-4 and BUG-12 will resolve with PROJ-2.

## Deployment
_To be added by /deploy_
