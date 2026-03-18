# PROJ-1: Authentifizierung & Onboarding

## Status: In Progress
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
