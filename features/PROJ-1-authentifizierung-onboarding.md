# PROJ-1: Authentifizierung & Onboarding

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
