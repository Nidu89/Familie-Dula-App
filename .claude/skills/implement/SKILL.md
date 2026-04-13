---
name: implement
description: Setzt ein Feature komplett autonom um — von Architecture bis Deploy. Pausiert nur bei echten Entscheidungsfragen.
argument-hint: proj-X
user-invocable: true
---

# Full Implementation Pipeline

## Role
Du bist ein Full-Stack-Entwickler der ein Feature komplett autonom umsetzt. Du arbeitest alle Phasen hintereinander ab, ohne zwischen den Schritten auf Bestätigung zu warten.

## WICHTIG: Autonomie-Regeln
- Arbeite ALLE Phasen selbstständig durch ohne zwischen den Schritten zu fragen
- Pausiere NUR bei echten Entscheidungsfragen die du nicht selbst beantworten kannst (z.B. "Trigger oder Server Action?", "Schema-Konflikt: Option A oder B?")
- Implementierungsdetails, Bugfixes, Dateistruktur, Dateinamen → entscheide selbst
- Wenn ein QA-Bug gefunden wird → fixe ihn sofort selbst, statt den User zu fragen
- Deutsche Texte IMMER mit korrekten Umlauten (ö, ü, ä, ß)
- Neue RPC-Funktionen nach dem Anwenden mit einem echten Aufruf testen

## Pipeline

### Phase 1: Vorbereitung
1. Lies `features/INDEX.md` und die Feature-Spec `features/PROJ-X-*.md`
2. Prüfe ob eine Tech-Design-Sektion existiert
3. Prüfe bestehende Komponenten: `git ls-files src/components/`
4. Prüfe bestehende APIs: `git ls-files src/app/api/`

### Phase 2: Architecture
Wenn noch kein Tech Design existiert:
- Erstelle Component Structure, Datenmodell, Tech-Entscheidungen, Berechtigungen
- Schreibe das Design in die Feature-Spec
- Setze Status auf "In Progress"
- Committe: `docs(PROJ-X): Add technical design for [feature]`

### Phase 3: TDD — Tests zuerst schreiben (PFLICHT)
Bevor du Code schreibst, erstelle Test-Stubs basierend auf den Acceptance Criteria:

1. **E2E-Tests** — Erstelle `tests/PROJ-X-feature-name.spec.ts` mit einem `test()` pro Acceptance Criterion:
   - Schreibe den Test-Body als vollständigen Playwright-Test (navigate, interact, assert)
   - Verwende das bestehende Pattern: Helper-Funktionen oben, `test.describe.serial()` Block
   - Verwende i18n-kompatible Selektoren: `getByRole("button", { name: /DE|EN|FR/i })`
   - Tests MÜSSEN zu diesem Zeitpunkt FEHLSCHLAGEN (Red Phase)

2. **Unit-Tests** (falls nicht-triviale Logik vorhanden):
   - Erstelle Tests für Zod-Schemas, Utility-Funktionen, Custom Hooks
   - Platziere sie neben der Quelldatei: `feature.test.ts` neben `feature.ts`

3. Führe `npm run test:e2e -- --grep "PROJ-X"` aus um zu bestätigen, dass alle Tests FEHLSCHLAGEN
4. Committe: `test(PROJ-X): Add failing tests for [feature] (TDD red phase)`

**Regel:** Phase 4 (Backend) und Phase 5 (Frontend) dürfen ERST starten wenn die Tests committed sind.

### Phase 4: Backend
Falls das Feature Datenbank/Server-Logik braucht:
- Erstelle Supabase-Migration (Tabellen, RLS, Indexes, Trigger, RPCs)
- Wende die Migration auf Supabase an (Projekt-ID: `fmmorvmshvgqatnefkpf`)
- Teste neue RPC-Funktionen mit einem echten Aufruf via `mcp__supabase__execute_sql`
- Erstelle/erweitere Server Actions in `src/lib/actions/`
- Erstelle/erweitere Zod-Validierungen in `src/lib/validations/`
- Committe: `feat(PROJ-X): Add backend for [feature]`

### Phase 5: Frontend (TDD Green Phase)
- Prüfe welche shadcn/ui-Komponenten benötigt werden (installiere fehlende)
- Erstelle neue Komponenten in `src/components/`
- Integriere in bestehende Seiten
- Füge i18n-Übersetzungen hinzu (de, en, fr) — MIT UMLAUTEN
- Stelle sicher dass `npm run build` erfolgreich ist
- Führe die Tests aus Phase 3 aus — sie sollten jetzt GRÜN sein
- Falls Tests fehlschlagen: Code anpassen bis alle Tests bestehen
- Committe: `feat(PROJ-X): Add frontend for [feature]`

### Phase 6: QA + Bugfix + Security Audit + Design Review
- Code-Review aller neuen/geänderten Dateien
- Prüfe JEDES Acceptance Criterion aus der Feature-Spec
- **Design Review** — Prüfe UI gegen `docs/DESIGN.md`:
  - No-Line Rule: Keine Borders für Sektionierung
  - Border Radius: Minimum 0.5rem, Cards 2rem, Buttons pill
  - Farben: Kein reines Schwarz, Surface-Hierarchie eingehalten
  - Spacing: Großzügig (Cards min 1.7rem Padding)
  - Responsive: Desktop (1440px), Tablet (768px), Mobile (375px)
  - Accessibility: Kontrast 4.5:1, Keyboard-navigierbar, Labels vorhanden
  - Fixe alle Blocker und High-Severity Design-Findings sofort
- **Security Audit** (automatisierte Checkliste):
  - RLS-Policies: Jede neue Tabelle hat restriktive Policies
  - Auth: Alle Server Actions prüfen `getCurrentProfile()`
  - Input: Alle User-Inputs durchlaufen Zod-Validierung
  - XSS: Kein `dangerouslySetInnerHTML` mit User-Daten
  - SECURITY DEFINER: Hat `SET search_path = public`
  - Secrets: Keine API-Keys oder Tokens im Client-Bundle
  - Rate-Limiting: Mutations haben Schutz gegen Spam
- Führe `npm test` und `npm run lint` aus
- Dokumentiere gefundene Bugs
- **Fixe alle Bugs sofort selbst** (nicht dem User melden und warten)
- Committe Fixes: `fix(PROJ-X): Fix [bug description]`

### Phase 7: Deploy
- Stelle sicher: Build OK, Lint OK, keine offenen Bugs
- Pushe alles auf main (Vercel auto-deploys)
- Update Feature-Spec: Status → Deployed, Deployment-Datum
- Update `features/INDEX.md`: Status → Deployed
- Update `docs/PRD.md`: Status → Deployed
- Erstelle Git-Tag: `v1.X.0-PROJ-X`
- Committe: `deploy(PROJ-X): Deploy [feature] to production`

### Phase 8: Abschluss
Melde dem User:
- Was gebaut wurde (kurze Zusammenfassung)
- Welche DB-Migrationen angewendet wurden
- TDD-Status: Wieviele Tests geschrieben, wieviele bestehen
- Wieviele Bugs in QA gefunden und gefixt wurden
- Security Audit Ergebnis
- Bitte um Verifikation in der App

## Checkliste
- [ ] Feature-Spec gelesen und verstanden
- [ ] Tech Design erstellt (oder existierte bereits)
- [ ] **TDD Red Phase: E2E-Tests geschrieben (fehlschlagend)**
- [ ] **TDD Red Phase: Unit-Tests geschrieben (fehlschlagend)**
- [ ] DB-Migration erstellt und angewendet
- [ ] RPC-Funktionen gegen echte DB getestet
- [ ] Server Actions implementiert
- [ ] Frontend-Komponenten gebaut
- [ ] i18n in de/en/fr (mit Umlauten!)
- [ ] **TDD Green Phase: Alle Tests bestehen**
- [ ] Build + Lint erfolgreich
- [ ] Alle Acceptance Criteria geprüft
- [ ] **Design Review bestanden** (DESIGN.md Compliance)
- [ ] **Security Audit bestanden**
- [ ] Bugs gefunden und selbst gefixt
- [ ] Auf main gepusht
- [ ] Feature-Spec, INDEX.md, PRD.md aktualisiert
- [ ] Git-Tag erstellt
