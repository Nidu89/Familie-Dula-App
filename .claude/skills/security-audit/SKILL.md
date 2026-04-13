---
name: security-audit
description: Automatisierte Sicherheitsanalyse eines Features — RLS, Auth, Injection, Secrets, OWASP Top 10. Inspiriert von Trail of Bits Security Skills.
argument-hint: "PROJ-X"
user-invocable: true
---

# Security Audit

## Role
Du bist ein Security Engineer der ein Feature systematisch auf Sicherheitslücken prüft. Du denkst wie ein Angreifer und testest wie ein Verteidiger.

## Before Starting
1. Lies `features/INDEX.md` und die Feature-Spec des angegebenen PROJ-X
2. Identifiziere alle neuen/geänderten Dateien: `git diff --name-only main...HEAD` oder `git log --name-only --oneline -5`
3. Kategorisiere die Dateien in: DB-Migrationen, Server Actions, Komponenten, API-Routes

## Audit-Phasen

### Phase 1: Supabase RLS & Datenbankzugriff

**Für jede neue/geänderte Tabelle:**
```sql
-- Prüfe ob RLS aktiviert ist
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```
- Führe die Query via `mcp__supabase__execute_sql` aus
- Jede Tabelle MUSS `rowsecurity = true` haben
- Prüfe ob Policies existieren: `SELECT * FROM pg_policies WHERE tablename = 'TABLE_NAME';`

**Für jede RLS-Policy:**
- SELECT-Policy: Filtert nach `family_id` des authentifizierten Users?
- INSERT-Policy: Verhindert das Erstellen von Daten für fremde Familien?
- UPDATE/DELETE-Policy: Nur eigene Daten oder Admin-Rolle?
- Gibt es eine Policy-Lücke? (z.B. UPDATE erlaubt aber keine Policy definiert = alles erlaubt)

**Bekannte Pitfalls:**
- `FOR UPDATE` + Aggregate (`SUM`, `COUNT`) = PostgreSQL-Fehler
- `SECURITY DEFINER` ohne `SET search_path = public` = Search-Path-Injection
- CHECK-Constraints müssen bei neuen Enum-Werten aktualisiert werden

### Phase 2: Server Action Authentifizierung

**Für jede Server Action in `src/lib/actions/`:**
1. Suche nach `getCurrentProfile()` oder äquivalentem Auth-Check
2. Prüfe ob der Auth-Check VOR jeder Datenbankoperation steht
3. Prüfe ob die `family_id` aus dem Profil kommt (nicht aus User-Input)

```bash
# Finde Server Actions ohne Auth-Check
grep -rL "getCurrentProfile\|getProfile\|auth\(\)" src/lib/actions/
```

**Red Flags:**
- `family_id` kommt aus einem Form-Parameter statt aus dem authentifizierten Profil
- Auth-Check passiert nach dem DB-Zugriff
- Kein Auth-Check in der Funktion

### Phase 3: Input-Validierung & Injection

**Für jeden User-Input-Pfad:**
1. Prüfe ob Zod-Validierung VOR der Verarbeitung steht
2. Suche nach SQL-Injection-Vektoren:
   ```bash
   # String-Interpolation in SQL (GEFAHR)
   grep -rn "\\$\\{.*\\}" supabase/migrations/ --include="*.sql"
   ```
3. Suche nach XSS-Vektoren:
   ```bash
   # dangerouslySetInnerHTML mit User-Daten
   grep -rn "dangerouslySetInnerHTML" src/
   ```
4. Prüfe ob `encodeURIComponent` bei URL-Parametern verwendet wird

**Zod-Schema-Audit:**
- Maximale String-Längen definiert? (DoS via Mega-Strings)
- Numerische Grenzen definiert? (z.B. negative Punkte vergeben)
- Array-Längen begrenzt? (z.B. 1000 Items in einer Liste)

### Phase 4: Secrets & Client-Bundle

```bash
# Suche nach hardcodierten Secrets
grep -rn "sk_\|sk-\|apikey\|api_key\|secret\|password\|token" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test."

# Prüfe ob .env-Variablen korrekt geprefixt sind
# NEXT_PUBLIC_ = im Client sichtbar (NUR für unkritische Keys)
grep -rn "NEXT_PUBLIC_" .env* | grep -iv "supabase_url\|supabase_anon"
```

**Prüfe:**
- Keine Service-Role-Keys im Client-Code
- Keine API-Secrets mit `NEXT_PUBLIC_` Prefix
- `.env.local` ist in `.gitignore`

### Phase 5: Rate-Limiting & Abuse-Prevention

**Für jede Mutation (Create/Update/Delete):**
- Gibt es einen Rate-Limit-Schutz?
- Kann ein Angreifer Massendaten erstellen? (z.B. 10.000 Aufgaben)
- Gibt es File-Upload-Limits? (Dateigröße, Dateityp)

### Phase 6: Authorization (Horizontal Privilege Escalation)

**Teste gedanklich diese Szenarien:**
1. Kind-User versucht Admin-Only-Aktionen (Löschen, Erstellen, Konfigurieren)
2. User aus Familie A versucht auf Daten von Familie B zuzugreifen
3. User ändert `id` Parameter in einem Request auf eine fremde Ressource
4. Gelöschter/deaktivierter User versucht weiterhin Aktionen

**Prüfe im Code:**
```bash
# Rollen-Checks in Server Actions
grep -rn "role.*admin\|role.*parent\|role.*child\|isAdmin\|isParent" src/lib/actions/
```

## Ergebnis-Format

Erstelle einen Abschnitt `## Security Audit Results` in der Feature-Spec mit:

```markdown
## Security Audit Results

**Audit-Datum:** YYYY-MM-DD
**Auditor:** Claude Security Audit Skill

### Ergebnis: BESTANDEN / NICHT BESTANDEN

| Kategorie | Status | Details |
|-----------|--------|---------|
| RLS Policies | PASS/FAIL | ... |
| Auth Checks | PASS/FAIL | ... |
| Input Validierung | PASS/FAIL | ... |
| Secrets | PASS/FAIL | ... |
| Rate Limiting | PASS/FAIL | ... |
| Authorization | PASS/FAIL | ... |

### Gefundene Schwachstellen
- **[CRITICAL/HIGH/MEDIUM/LOW]:** Beschreibung + betroffene Datei + Zeile

### Empfehlungen
- ...
```

## Severity-Klassifikation
- **CRITICAL:** Datenleck zwischen Familien, Auth-Bypass, SQL-Injection
- **HIGH:** Fehlende RLS-Policy, SECURITY DEFINER ohne search_path, fehlender Auth-Check
- **MEDIUM:** Fehlende Input-Validierung, fehlende Rate-Limits
- **LOW:** Unnötig breite Permissions, fehlende Längen-Limits

## Wichtig
- Wenn standalone (`/security-audit`): Nur dokumentieren, NICHT fixen
- Wenn innerhalb von `/implement`: Alle CRITICAL und HIGH sofort fixen
- Bei CRITICAL-Findings: Feature ist NICHT deployment-ready

## Handoff
Falls bestanden:
> "Security Audit bestanden. Keine kritischen Schwachstellen gefunden."

Falls nicht bestanden:
> "Security Audit NICHT bestanden. [N] Schwachstellen gefunden ([Severity-Breakdown]). Diese müssen vor dem Deployment gefixt werden."
