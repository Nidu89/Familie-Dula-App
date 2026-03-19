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

### Re-Test #2 (2026-03-19)

**Tested:** 2026-03-19
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (Next.js 16.1.7 compiles successfully, 0 TypeScript errors, 1 deprecation warning)

### Bugs Fixed Since Last QA Run

- **BUG-1 (FIXED):** Middleware now checks `user.email_confirmed_at` on line 43 of `src/middleware.ts` and redirects unconfirmed users away from `/dashboard`. AC-2 now PASSES.
- **BUG-8 (FIXED):** In-memory rate limiting added in `src/lib/actions/auth.ts` via `checkRateLimit()` function. Login: 10 attempts/15min per IP, Register: 5/hr per IP, Forgot-password: 5/hr per IP.
- **BUG-9 (FIXED):** `safeRedirectPath()` function in `src/app/auth/callback/route.ts` validates that `next` starts with `/` and does NOT start with `//`. Falls back to `/dashboard`.

### Acceptance Criteria Status

#### AC-1: Registrierung mit E-Mail + Passwort funktioniert; Nutzer erhaelt Bestaetigungs-E-Mail
- [x] Registration form has email, password, confirm password, and display name fields
- [x] Zod validation enforces required fields and min 8 chars for password
- [x] `registerAction` calls `supabase.auth.signUp` with `emailRedirectTo` pointing to `/auth/callback`
- [x] On success, a confirmation screen is displayed instructing the user to check email
- [x] On error, a German error message is shown
- **Result: PASS** (code-level; requires live Supabase to fully verify email delivery)

#### AC-2: Ohne E-Mail-Bestaetigung kann kein vollstaendiger Zugriff auf die App erfolgen
- [x] Supabase Auth enforces email confirmation by default
- [x] Middleware checks `user.email_confirmed_at` (line 43 of middleware.ts) and redirects unconfirmed users to `/login`
- **Result: PASS** (previously BUG-1, now fixed)

#### AC-3: Login mit korrekten Daten leitet zum Dashboard weiter; bei Fehler erscheint eine verstaendliche Fehlermeldung
- [x] `loginAction` calls `supabase.auth.signInWithPassword` and redirects to `/dashboard` on success
- [x] On error, displays: "Anmeldung fehlgeschlagen. Bitte pruefe deine Zugangsdaten."
- [x] Error message is in German and user-friendly
- **Result: PASS**

#### AC-4: Passwort-Reset-Flow: Nutzer gibt E-Mail ein, erhaelt Reset-Link, kann neues Passwort setzen
- [x] `/forgot-password` page accepts email and calls `forgotPasswordAction`
- [x] `forgotPasswordAction` calls `supabase.auth.resetPasswordForEmail` with redirect to `/auth/callback?next=/auth/reset-password`
- [x] `/auth/callback` exchanges code and redirects to `/auth/reset-password` (now with validated `next` parameter)
- [x] `/auth/reset-password` uses browser client `supabase.auth.updateUser` to set new password
- [x] Success message shown, auto-redirect to `/login` after 2 seconds
- [x] Error state shows "Neuen Link anfordern" link
- **Result: PASS**

#### AC-5: Logout beendet die Session und leitet zur Login-Seite weiter
- [x] `logoutAction` calls `supabase.auth.signOut()` and redirects to `/login`
- [ ] BUG: No logout button exists anywhere in the current UI. The action exists but there is no UI element to trigger it. No `/dashboard` page exists yet.
- **Result: FAIL** (see BUG-2 -- blocked by PROJ-3 Dashboard)

#### AC-6: Passwort muss Mindestanforderungen erfuellen (min. 8 Zeichen)
- [x] `loginSchema` enforces `.min(8, "Passwort muss mindestens 8 Zeichen lang sein")`
- [x] `registerSchema` enforces same min 8 constraint
- [x] `resetPasswordSchema` enforces same min 8 constraint
- **Result: PASS** (core requirement met; max-length is a hardening issue, see BUG-7)

#### AC-7: Bereits registrierte E-Mail zeigt klare Fehlermeldung bei erneuter Registrierung
- [ ] BUG: The `registerAction` returns a generic error message "Registrierung fehlgeschlagen. Bitte versuche es erneut." for ALL errors, including duplicate email. The Supabase error is not parsed to provide a specific "already registered" message.
- **Result: FAIL** (see BUG-3)

#### AC-8: Nutzer ohne Familie werden nach Login zum Onboarding geleitet
- [ ] BUG: The middleware does NOT check for family membership. All logged-in users go to `/dashboard`. The onboarding page is in the `authRoutes` list, so logged-in users are actively redirected AWAY from it.
- **Result: FAIL** (see BUG-4 -- acknowledged as deferred to PROJ-2)

#### AC-9: Eingeloggte Nutzer werden von Login/Register-Seiten automatisch zum Dashboard weitergeleitet
- [x] Middleware checks `authRoutes = ['/login', '/register', '/forgot-password', '/onboarding']` and redirects logged-in users to `/dashboard`
- **Result: PASS**

#### AC-10: Sessions bleiben ueber Browser-Neustarts hinweg erhalten (Supabase persistente Sessions)
- [x] `@supabase/ssr` manages cookies with proper `getAll`/`setAll` in middleware and server client
- [x] Middleware refreshes session on every request
- **Result: PASS** (standard Supabase SSR behavior)

### Edge Cases Status

#### EC-1: Bestaetigungs-E-Mail kommt nicht an -- Link zum erneuten Versenden anbieten
- [ ] BUG: The confirm error page (`/auth/confirm`) shows "Neuen Bestaetigungslink anfordern" but links to `/register` (full re-registration), NOT to a resend-confirmation endpoint.
- **Result: FAIL** (see BUG-5)

#### EC-2: Reset-Link nach Ablauf genutzt -- Fehlermeldung + neuer Link anfordern
- [x] `/auth/reset-password` shows error with "Neuen Link anfordern" link pointing to `/forgot-password`
- **Result: PASS**

#### EC-3: Mehrere Tabs offen, in einem ausloggen -- alle Tabs abmelden
- [ ] BUG: No `onAuthStateChange` listener is set up in client components.
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
- [x] Middleware protects `/dashboard` route -- unauthenticated users are redirected to `/login`
- [x] Middleware checks `email_confirmed_at` -- unconfirmed users cannot access `/dashboard`
- [x] Server Actions use `createClient()` from server module (not browser client)
- [x] PKCE flow used via `exchangeCodeForSession` in `/auth/callback`
- [x] Rate limiting implemented: login (10/15min), register (5/hr), forgot-password (5/hr) per IP
- [ ] NOTE: Rate limiting is in-memory only -- resets on server restart and does not work across multiple server instances. Acceptable for private family project, but not for production at scale.

#### Authorization
- [x] Profiles table has RLS enabled (per backend notes)
- [x] Supabase Anon Key is used (not service role key) in client-facing code
- [x] `/auth/callback` `next` parameter validated by `safeRedirectPath()` -- rejects `//` prefix and non-`/` starts

#### Input Validation
- [x] Client-side Zod validation on all forms
- [ ] BUG: Server Actions (`loginAction`, `registerAction`, `forgotPasswordAction`) do NOT validate input with Zod on the server side. They accept raw `string` parameters and pass them directly to Supabase. The security rules mandate: "Validate ALL user input on the server side with Zod. Never trust client-side validation alone." (see BUG-10)

#### Secrets / Data Exposure
- [x] `.env.local` is in `.gitignore`
- [x] No hardcoded secrets found in source code
- [x] `NEXT_PUBLIC_` prefix used only for Supabase URL and Anon Key (safe to expose)
- [ ] NOTE: `.env.local.example` was deleted (shown as `D` in git status). This is a minor documentation gap but does not affect security.

#### Security Headers
- [ ] BUG: Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security) are NOT configured in `next.config.ts`. (see BUG-11)

#### XSS
- [x] React's JSX auto-escapes user content by default
- [x] No use of `dangerouslySetInnerHTML`
- [x] Error messages are hardcoded strings, not reflecting user input

#### New Finding: Redirect Path Traversal Residual Risk
- [x] `safeRedirectPath()` blocks `//evil.com` and non-`/` prefixed paths
- [ ] BUG: Path traversal via `next=/../../etc/passwd` would still be accepted (starts with `/`, not `//`). While browsers normalize `http://localhost:3000/../../etc/passwd` to `http://localhost:3000/etc/passwd` staying on the same origin, a whitelist approach would be more robust. (see BUG-14)

#### New Finding: Rate Limit Key Spoofing
- [ ] BUG: `getIP()` uses `x-forwarded-for` header which can be spoofed by the client if no trusted proxy is configured. An attacker could rotate the `X-Forwarded-For` value to bypass rate limiting entirely. (see BUG-15)

### Cross-Browser Testing
- Cannot be performed via code review only. Requires manual browser testing.
- Code uses standard CSS (Tailwind), no browser-specific APIs. Expected to work in Chrome, Firefox, Safari.

### Responsive Testing
- Cannot be performed via code review only. Requires manual viewport testing.
- Code uses `max-w-md` cards, `md:flex-row` breakpoints, `px-4 py-8` padding. Expected to render correctly at 375px, 768px, 1440px.

### Bugs Found

#### FIXED Bugs (verified in this re-test)

- ~~BUG-1: Middleware does not verify email confirmation status~~ -- FIXED (middleware line 43 checks `email_confirmed_at`)
- ~~BUG-8: No rate limiting on authentication endpoints~~ -- FIXED (in-memory rate limiting added)
- ~~BUG-9: Open redirect potential in /auth/callback~~ -- FIXED (`safeRedirectPath()` validates `next` param)

#### BUG-2: No logout button in the UI (STILL OPEN)
- **Severity:** High
- **Steps to Reproduce:**
  1. Log in successfully
  2. Expected: A logout button is visible somewhere (dashboard, header, etc.)
  3. Actual: `logoutAction` exists in code but no UI element triggers it. No `/dashboard` page exists yet.
- **Priority:** Fix before deployment (blocked by PROJ-3 Dashboard)

#### BUG-3: Generic error message for duplicate email registration (STILL OPEN)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Register with email "test@example.com"
  2. Confirm the account
  3. Try to register again with "test@example.com"
  4. Expected: "Diese E-Mail ist bereits registriert" or similar specific message
  5. Actual: "Registrierung fehlgeschlagen. Bitte versuche es erneut."
- **Priority:** Fix before deployment

#### BUG-4: No onboarding redirect for users without a family (STILL OPEN)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Log in as a user without a family
  2. Expected: Redirected to `/onboarding`
  3. Actual: Redirected to `/dashboard` (which does not exist yet)
- **Note:** Acknowledged deviation, deferred to PROJ-2
- **Priority:** Fix in next sprint (PROJ-2)

#### BUG-5: "Resend confirmation" link leads to full re-registration (STILL OPEN)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Navigate to `/auth/confirm?error=invalid_link`
  2. Click "Neuen Bestaetigungslink anfordern"
  3. Expected: A page or action to resend the confirmation email
  4. Actual: Link goes to `/register`, which requires full re-registration
- **Priority:** Fix before deployment

#### BUG-6: Cross-tab logout sync not implemented (STILL OPEN)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open the app in two browser tabs
  2. Log out in one tab
  3. Expected: Second tab detects logout and redirects to login
  4. Actual: Second tab remains in its current state until next navigation
- **Priority:** Fix in next sprint

#### BUG-7: No maximum password length enforcement (STILL OPEN)
- **Severity:** Low
- **Steps to Reproduce:**
  1. On register or reset-password page, enter a password with 100,000+ characters
  2. Expected: Validation rejects excessively long passwords
  3. Actual: Password is sent to Supabase API without length cap
- **Priority:** Nice to have

#### BUG-10: No server-side input validation in Server Actions (STILL OPEN)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Call `loginAction` directly with malformed inputs (bypassing client-side form)
  2. Expected: Server validates input with Zod before processing
  3. Actual: Raw strings are passed directly to Supabase without server-side validation
- **Priority:** Fix before deployment

#### BUG-11: Security headers not configured (STILL OPEN)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Run the app and inspect HTTP response headers
  2. Expected: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS headers present
  3. Actual: `next.config.ts` has no `headers()` configuration
- **Priority:** Fix before deployment

#### BUG-12: Onboarding "Familie erstellen" still uses console.log + simulated delay (STILL OPEN)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Navigate to `/onboarding`
  2. Click "Familie erstellen", enter a name, and submit
  3. Expected: Family is created in the database
  4. Actual: `console.log("Create family:", familyName)` and `setTimeout`
- **Note:** Acknowledged as deferred to PROJ-2
- **Priority:** Fix in next sprint (PROJ-2)

#### BUG-13: Deprecated middleware file convention (STILL OPEN)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Run `npm run build`
  2. Observe warning: 'The "middleware" file convention is deprecated. Please use "proxy" instead.'
  3. Expected: No deprecation warnings
  4. Actual: Next.js 16 has deprecated `middleware.ts` in favor of the new `proxy` convention
- **Priority:** Fix in next sprint

#### BUG-14: Redirect path traversal not fully sanitized (NEW)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Craft URL: `/auth/callback?code=VALID_CODE&next=/../../some-path`
  2. Expected: Only known internal paths are accepted
  3. Actual: `safeRedirectPath()` only checks for `//` prefix; path traversal sequences like `/../../` pass validation. Browsers normalize these to the same origin, so exploitation is limited, but a whitelist of allowed paths would be more robust.
- **Priority:** Nice to have

#### BUG-15: Rate limit key spoofable via X-Forwarded-For header (NEW)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Send login requests with different `X-Forwarded-For` header values
  2. Expected: Rate limiting reliably identifies the requesting client
  3. Actual: `getIP()` in `src/lib/actions/auth.ts` reads `x-forwarded-for` which can be spoofed if no trusted reverse proxy strips/overwrites it. An attacker can bypass rate limiting by rotating this header.
- **Note:** In production behind Vercel, Vercel sets its own headers and this is harder to spoof. In development or self-hosted scenarios, this is exploitable.
- **Priority:** Fix before deployment (configure trusted proxy or use Vercel-specific headers like `x-real-ip`)

### Summary
- **Acceptance Criteria:** 7/10 passed, 3 failed (AC-5, AC-7, AC-8)
- **Edge Cases:** 2/5 passed, 2 failed, 1 not testable
- **Bugs Fixed:** 3 (BUG-1, BUG-8, BUG-9)
- **Bugs Remaining:** 12 total (0 critical, 1 high, 6 medium, 3 low, 2 deferred to PROJ-2)
- **New Bugs Found:** 2 (BUG-14 low, BUG-15 medium)
- **Security:** Improved (rate limiting + open redirect fixed), but missing server-side validation, security headers, and spoofable rate limit key remain
- **Production Ready:** NO
- **Recommendation:** Fix BUG-2 (blocked by PROJ-3), BUG-3, BUG-5, BUG-10, BUG-11, and BUG-15 before deployment. BUG-4 and BUG-12 are expected to be resolved with PROJ-2. Low-severity bugs (BUG-6, BUG-7, BUG-13, BUG-14) can be deferred.

## Deployment
_To be added by /deploy_
