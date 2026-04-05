# PROJ-6: Belohnungssystem (Gamification)

## Status: Deployed
**Created:** 2026-03-18
**Last Updated:** 2026-03-30

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung) – Punkte pro Kind der Familie.
- Requires: PROJ-5 (Aufgaben & To-Dos) – Automatische Punktvergabe bei Aufgabenerledigung.

---

## Feature-Erweiterung (2026-03-30)

Die ursprünglich deployete Version (v1.4.0) hatte nur ein Basis-Punktesystem (Punktekonto, Buchungslog, manuelle Anpassungen). Das Feature wird nun zur vollständigen **Rewards & Achievements**-Seite ausgebaut. Bestehende Datenbank-Grundstruktur (`points_transactions`, `points_balance`) bleibt erhalten.

---

## User Stories

### Basis-Punktesystem (bereits deployed)
- Als Kind möchte ich nach dem Erledigen einer Aufgabe automatisch Punkte erhalten, damit ich Motivation habe.
- Als Kind möchte ich mein aktuelles Punkteguthaben sehen können.
- Als Elternteil möchte ich Punkte manuell hinzufügen oder abziehen können, um Kinder zu belohnen oder Korrekturen vorzunehmen.
- Als Elternteil möchte ich die Punktehistorie eines Kindes einsehen, damit ich nachvollziehen kann, wie Punkte verdient/abgezogen wurden.
- Als Elternteil möchte ich beim Anlegen einer Aufgabe festlegen, wie viele Punkte sie wert ist.

### Familien-Leaderboard (neu)
- Als Familienmitglied möchte ich sehen, wer aktuell die meisten Punkte hat, damit Wettbewerb und Motivation entstehen.
- Als Kind möchte ich meinen Rang im Familienvergleich mit Avatar und Punktestand sehen.
- Als Elternteil möchte ich auch im Leaderboard erscheinen, damit alle Familienmitglieder sichtbar sind.

### Belohnungs-Shop (neu)
- Als Elternteil möchte ich Belohnungen anlegen (Name, Icon/Emoji, Punktekosten, Beschreibung), die Kinder einlösen können.
- Als Kind möchte ich eine Liste aller verfügbaren Belohnungen mit ihren Punktekosten sehen.
- Als Kind möchte ich eine Belohnung einlösen, wenn ich genug Punkte habe – Punkte werden automatisch abgezogen.
- Als Elternteil möchte ich sehen, welche Belohnungen ein Kind eingelöst hat (Einlösungshistorie).
- Als Kind möchte ich Belohnungen sehen, für die ich noch nicht genug Punkte habe (gesperrt/ausgegraut).

### Achievement-Badges (neu)
- Als Kind möchte ich Abzeichen (Badges) für besondere Leistungen erhalten, z. B. "Putz-Profi" für 10 erledigte Putz-Aufgaben.
- Als Kind möchte ich in einer Badge-Galerie meine verdienten Abzeichen sehen, zusammen mit gesperrten Abzeichen als Motivation.
- Als Elternteil möchte ich die Badge-Kriterien einsehen, damit ich Kindern erklären kann, wie sie Abzeichen verdienen.

### Community-Ziel / Familien-Ziel (neu)
- Als Elternteil möchte ich ein gemeinsames Familienziel anlegen (Name, Emoji, Zielbeschreibung, Punkte-Zielwert), auf das alle gemeinsam hinarbeiten.
- Als Familienmitglied möchte ich eigene Punkte zum Community-Ziel beisteuern können.
- Als Familienmitglied möchte ich den Fortschritt zum Ziel als Fortschrittsbalken sehen (gesammelte Punkte / Zielpunkte).
- Als Elternteil möchte ich ein abgeschlossenes Ziel als erreicht markieren und ein neues anlegen können.

## Acceptance Criteria

### Basis-Punktesystem (bereits deployed ✓)
- [x] Jedes Familienmitglied mit Rolle "Kind" hat ein Punktekonto.
- [x] Punktestand wird auf dem Dashboard und auf der Belohnungs-Übersichtsseite angezeigt.
- [x] Automatische Buchung: Wenn ein Kind eine punktberechtigte Aufgabe erledigt, werden die definierten Punkte seinem Konto gutgeschrieben.
- [x] Manuelle Buchung: Erwachsene/Admins können Punkte manuell hinzufügen (positiver Wert) oder abziehen (negativer Wert) mit optionalem Grund/Kommentar.
- [x] Punktestand kann nicht negativ werden (Mindestwert: 0).
- [x] Nur Erwachsene und Admins können manuelle Buchungen vornehmen.
- [x] Punkte einer Aufgabe werden nur einmal vergeben, auch wenn der Status mehrfach gewechselt wird.

### Familien-Leaderboard (neu)
- [ ] Alle Familienmitglieder (Kinder und Erwachsene) werden nach `points_balance` absteigend sortiert angezeigt.
- [ ] Jede Karte zeigt Avatar, Name und Punktestand prominent.
- [ ] Rang 1 erhält ein visuelles Highlight (Signature-Gradient-Badge mit Trophy-Icon).
- [ ] Rang 2 bekommt ein silbernes Medaillen-Icon.
- [ ] Mitglieder ohne Avatar (kein Profilbild) zeigen ein generisches Personen-Icon.
- [ ] Layout: Responsive Grid (1 Spalte mobil, bis 3 Spalten Desktop).

### Belohnungs-Shop (neu)
- [ ] Eltern können Belohnungen anlegen: Name (max 50 Zeichen), Beschreibung (max 200 Zeichen), Punktekosten (1–9999), Icon-Emoji (ein Emoji).
- [ ] Belohnungsliste zeigt maximal 6 Karten auf der Hauptseite mit "Alle anzeigen"-Link zu einer Vollansicht.
- [ ] Kinder können eine Belohnung einlösen, wenn `points_balance >= Punktekosten` – Button ist ansonsten deaktiviert/ausgegraut.
- [ ] Beim Einlösen werden die Punktekosten sofort vom Konto abgezogen und eine Buchung in `points_transactions` mit type `reward_redemption` erstellt.
- [ ] Kinder sehen den Punktepreis als Chip (secondary-container) auf jeder Karte.
- [ ] Eltern können Belohnungen bearbeiten und deaktivieren (nicht löschen, da Einlösungshistorie erhalten bleiben muss).
- [ ] Deaktivierte Belohnungen sind für Kinder nicht sichtbar.

### Achievement-Badges (neu)
- [ ] Badges werden automatisch vergeben, wenn ein definiertes Kriterium erfüllt wird (z. B. Anzahl erledigter Aufgaben eines bestimmten Typs).
- [ ] Badge-Galerie zeigt verdiente Badges farbig/gradient und gesperrte Badges ausgegraut mit Schloss-Icon.
- [ ] Beim Verdienen eines Badges erscheint eine Toast-Benachrichtigung ("Du hast das Abzeichen 'X' verdient!").
- [ ] MVP-Badges (vordefiniert, nicht konfigurierbar durch Eltern):
  - "Putz-Profi": 10 Aufgaben der Kategorie "Haushalt" erledigt
  - "Frühaufsteher": 5 Aufgaben vor 8 Uhr erledigt
  - "Teamplayer": 3 Aufgaben in einer Woche erledigt
  - "Leseratte": 10 Aufgaben der Kategorie "Schule" erledigt

### Community-Ziel / Familien-Ziel (neu)
- [ ] Pro Familie kann es maximal 1 aktives Familienziel geben.
- [ ] Eltern können ein Ziel anlegen: Name, Beschreibung, Emoji, Zielpunkte (100–100.000).
- [ ] Alle Familienmitglieder können eigene Punkte zum Ziel beisteuern (Button "Punkte beisteuern").
- [ ] Beim Beisteuern werden die Punkte vom persönlichen Konto des Mitglieds abgezogen und dem Ziel-Fortschritt hinzugerechnet.
- [ ] Fortschrittsbalken zeigt "gesammelte Punkte / Zielpunkte" und "Noch X Punkte".
- [ ] Wenn das Ziel erreicht ist (gesammelte Punkte >= Zielpunkte), wird es als "erreicht" markiert und eine Glückwunsch-Anzeige gezeigt.
- [ ] Eltern können ein abgeschlossenes oder laufendes Ziel beenden und ein neues starten.
- [ ] Abgeschlossene Ziele werden in einer Geschichte/Chronik gespeichert (nicht gelöscht).

## Edge Cases
- Aufgabe zurück auf "offen" gesetzt → Punkte bleiben; nur manuelle Korrektur durch Eltern möglich (bereits deployed).
- Nicht genug Punkte für Belohnung → "Einlösen"-Button deaktiviert, Punkte-Differenz anzeigen ("Noch 20 Pkt. fehlen").
- Punkte zum Familienziel beitragen, aber weniger Punkte als gewünscht → Maximaler Beitrag ist der aktuelle Kontostand; kein negativer Stand.
- Familienziel wird gelöscht, bevor es erreicht wurde → Gesammelte Punkte werden den Beitragenden NICHT zurückgegeben (bewusste Entscheidung).
- Zwei Kinder lösen gleichzeitig die gleiche Belohnung ein → Jede Transaktion ist unabhängig; beide können einlösen (Belohnungen sind nicht limitiert).
- Badge-Kriterium nachträglich erfüllt (z. B. Aufgabe rückwirkend eingetragen) → Badge wird beim nächsten Check-Lauf vergeben.
- Kind ohne Punkte auf der Leaderboard → Erscheint mit "0 Pkt." am Ende der Liste.

## Design-Richtlinien (aus Mockup 2026-03-30)

Die `/rewards`-Seite soll der beigefügten Stitch-Vorlage entsprechen. Entscheidende Design-Details:

### Seitenstruktur
```
/rewards
├── Familien-Leaderboard ("Wer ist vorn?")
├── Belohnungs-Shop ("Deine Belohnungen" – 3er-Grid + "Alle anzeigen")
├── Achievement-Badges ("Deine Erfolge" – horizontale Galerie)
└── Community-Ziel ("Großer Zoobesuch!" – Full-width Banner)
```

### Leaderboard-Karten
- Karte #1 (Rang 1): `surface-container-lowest`, Avatar mit `border-primary-container`, Signature-Gradient-Badge mit `workspace_premium`-Icon, Dekorelement (Activity Bubble) als Hintergrund-Shape.
- Karte #2 (Rang 2): `surface-container-lowest`, Avatar mit `border-surface-container-high`, graues `military_tech`-Icon-Badge.
- Übrige Ränge: `surface-container-low`, `opacity-70`, generisches Personen-Icon.

### Reward-Karten
- Hintergrund: `surface-container-lowest`, `rounded-xl`, Ambient Shadow.
- Icon-Container: 64×64px, `rounded-xl`, Farbe passend zur Kategorie (primary/tertiary/secondary), `FILL`-Icon.
- Punkte-Chip: `secondary-container`-Hintergrund, `on-secondary-container`-Text, `rounded-full`.
- "Einlösen"-Button: `bg-primary`, `text-on-primary`, `rounded-full`.
- Hover-Effekt: `-translate-y-2`.

### Achievement-Badge-Galerie
- Verdiente Badges: 96×96px `rounded-full`, Signature-Gradient oder farbige Varianten (`yellow-100 + border-yellow-400`, `secondary-container`), leichter Rotations-Effekt (`rotate-3`, `-rotate-6`), Hover: `rotate-0`.
- Gesperrte Badges: `surface-container-highest`, `opacity-40 grayscale`, `lock`-Icon in `outline-variant`.
- Label darunter: `font-headline font-bold text-sm`.

### Community-Ziel-Banner
- Hintergrund: `secondary-container`, `rounded-xl`, Activity-Bubble-Dekorelement rechts oben.
- Fortschrittsbalken: `h-8`, `bg-white/40 rounded-full`, Füll-Gradient `bg-signature-gradient`, Tier-Icon (`pets`) als Fortschrittsmarker am Ende.
- "Punkte beisteuern"-Button: `surface-container-lowest`, `text-secondary`, `rounded-full`, `rocket_launch`-Icon.
- Punkte-Anzeige: `text-4xl font-black text-secondary` für gesammelte Punkte.

## Technical Requirements
- Punkte-Buchungen sind unveränderlich (append-only log) – keine Bearbeitung/Löschung einzelner Buchungen.
- Transaktionale Sicherheit: Aufgabenerledigung und Punktebuchung in einer DB-Transaktion.
- RLS: Kinder können nur ihren eigenen Punktestand lesen, nicht ändern.

---

## Tech Design (Solution Architect) – Erweiterung 2026-03-30

### Komponentenstruktur (Gesamte `/rewards`-Seite)

```
/rewards Page (Server Component – lädt alle Daten parallel)
│
├── FamilyLeaderboard (Server Component)
│   └── LeaderboardCard × N  (eine Karte pro Familienmitglied, sortiert nach Punkten)
│       ├── Avatar + Rang-Badge (Gold/Silber/Neutral)
│       ├── Name + Punktestand
│       └── Activity-Bubble-Dekorelement (nur Rang 1)
│
├── RewardShop (Client Component – Interaktion: Einlösen)
│   ├── RewardCard × max. 6  (Icon, Titel, Beschreibung, Punkte-Chip, Einlösen-Button)
│   ├── RewardFormDialog  (Dialog: Anlegen/Bearbeiten – nur Eltern/Admins)
│   └── "Alle anzeigen"-Link → /rewards/shop (separate Seite für alle Belohnungen)
│
├── AchievementGallery (Server Component)
│   ├── AchievementBadge × N  (verdient, farbig, mit Rotations-Effekt)
│   └── AchievementBadge × N  (gesperrt, ausgegraut, Schloss-Icon)
│
└── CommunityGoal (Client Component – Interaktion: Beisteuern, Anlegen)
    ├── GoalProgressBar  (Fortschrittsbalken mit Signature-Gradient)
    ├── ContributePointsDialog  (Dialog: Betrag wählen, Punkte abziehen)
    └── GoalFormDialog  (Dialog: Ziel anlegen/abschließen – nur Eltern/Admins)
```

**Bestehende Komponenten, die weiterverwendet werden:**
- `PointsHistorySheet` – unverändert (seitliches Panel für Punktehistorie)
- `ManualPointsDialog` – unverändert (manuelle Buchung durch Eltern)
- `ChildPointCard` – bleibt als interne Ansicht im Leaderboard (oder wird ersetzt durch `LeaderboardCard`)

---

### Datenmodell (Neue Tabellen)

**`family_rewards`** – Belohnungskatalog der Familie:
| Feld | Beschreibung |
|------|-------------|
| id | UUID, Primärschlüssel |
| family_id | Zugehörige Familie |
| title | Name der Belohnung (max. 50 Zeichen) |
| description | Kurzbeschreibung (max. 200 Zeichen) |
| icon_emoji | Ein Emoji als Icon |
| points_cost | Punktekosten (1–9999) |
| is_active | Sichtbar für Kinder (Standard: true) |
| created_by | Elternteil, das die Belohnung angelegt hat |
| created_at | Zeitstempel |

**`reward_redemptions`** – Log aller Einlösungen (append-only):
| Feld | Beschreibung |
|------|-------------|
| id | UUID, Primärschlüssel |
| reward_id | Eingelöste Belohnung |
| redeemed_by | Kind, das eingelöst hat |
| family_id | Zugehörige Familie |
| points_spent | Kopie der Punktekosten zum Einlösungszeitpunkt |
| created_at | Zeitstempel |

**`achievements`** – Vordefinierte Badge-Definitionen (Seed-Daten, nicht von Eltern änderbar):
| Feld | Beschreibung |
|------|-------------|
| id | UUID, Primärschlüssel |
| slug | Eindeutiger Kurzname (z. B. "putz-profi") |
| title | Anzeigename |
| description | Erläuterung des Kriteriums |
| icon | Material Symbol Name |
| criteria_type | Art des Kriteriums (z. B. `task_count_by_tag`) |
| criteria_value | JSON mit Kriteriums-Parametern (z. B. `{"tag": "haushalt", "count": 10}`) |

**`profile_achievements`** – Verdiente Badges pro Profil:
| Feld | Beschreibung |
|------|-------------|
| id | UUID, Primärschlüssel |
| profile_id | Kind, das den Badge verdient hat |
| achievement_id | Verdientes Achievement |
| family_id | Zugehörige Familie |
| earned_at | Zeitstempel der Vergabe |

**`family_goals`** – Aktives und archivierte Familienziele:
| Feld | Beschreibung |
|------|-------------|
| id | UUID, Primärschlüssel |
| family_id | Zugehörige Familie |
| title | Zielname (z. B. "Großer Zoobesuch") |
| description | Kurzbeschreibung |
| emoji | Emoji (z. B. "🦒") |
| target_points | Zu erreichende Gesamtpunkte |
| collected_points | Denormalisierter Zähler aktuell gesammelter Punkte |
| status | `active`, `completed`, oder `cancelled` |
| created_by | Elternteil |
| created_at | Zeitstempel |
| completed_at | Zeitstempel bei Zielerfüllung (nullable) |

**`goal_contributions`** – Wer hat wie viel beigesteuert:
| Feld | Beschreibung |
|------|-------------|
| id | UUID, Primärschlüssel |
| goal_id | Familienziel |
| contributed_by | Profil, das beigesteuert hat |
| family_id | Zugehörige Familie |
| amount | Beigesteuerte Punkte |
| created_at | Zeitstempel |

**Erweiterung `points_transactions`:**
- Neue `type`-Werte: `reward_redemption` und `goal_contribution`
- Neues Fremdschlüsselfeld `reward_id` (nullable, für Reward-Buchungen)
- Neues Fremdschlüsselfeld `goal_id` (nullable, für Ziel-Buchungen)

---

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Leaderboard zeigt alle Mitglieder (nicht nur Kinder) | Erwachsene sollen als Vorbilder sichtbar sein; motivierender Wettbewerb für alle |
| Achievement-Kriterien hardcodiert im Backend-Code | 4 MVP-Badges erfordern keine DB-Konfiguration; einfacher erweiterbar ohne DB-Migration |
| Badge-Check nach jeder Aufgabenerledigung | Läuft als separater Aufruf nach `completeTaskAction`; kein Performance-Problem bei 4 Badges |
| Reward-Einlösung als atomare DB-RPC | Verhindert Race Conditions: Punkte-Check und -Abzug in einer Transaktion |
| Ziel-Beitrag als atomare DB-RPC | Verhindert, dass persönliche Punkte abgezogen aber Ziel nicht erhöht wird |
| `collected_points` in `family_goals` denormalisiert | Verhindert langsame `SUM()`-Abfrage bei jeder Seitenladung |
| Pro Familie max. 1 aktives Ziel | Fokus; verhindert Aufteilung der Motivation auf viele Ziele gleichzeitig |
| Kein Zurückgeben von Punkten bei Ziel-Abbruch | Bewusste Entscheidung: einmal beigesteuerte Punkte sind weg (wie im echten Leben) |

---

### Neue Server Actions

| Action | Beschreibung | Wer darf es? |
|--------|-------------|--------------|
| `getFamilyLeaderboardAction()` | Alle Familienmitglieder nach Punkten sortiert | Alle |
| `getRewardShopAction()` | Aktive Belohnungen + eigener Punktestand | Alle |
| `createRewardAction(data)` | Belohnung anlegen | Nur Eltern/Admins |
| `updateRewardAction(id, data)` | Belohnung bearbeiten oder deaktivieren | Nur Eltern/Admins |
| `redeemRewardAction(rewardId)` | Belohnung einlösen (atomare RPC) | Nur Kinder (mit ausreichend Punkten) |
| `getAchievementsAction()` | Alle Badges + welche der aktuelle Nutzer verdient hat | Alle |
| `checkAndAwardAchievementsAction(profileId)` | Badge-Check nach Aufgabenerledigung (intern) | System (kein direkter Nutzeraufruf) |
| `getFamilyGoalAction()` | Aktives Familienziel | Alle |
| `createFamilyGoalAction(data)` | Neues Ziel anlegen | Nur Eltern/Admins |
| `contributeToGoalAction(goalId, amount)` | Punkte zum Ziel beisteuern (atomare RPC) | Alle (mit ausreichend Punkten) |
| `completeFamilyGoalAction(goalId)` | Ziel als abgeschlossen markieren | Nur Eltern/Admins |

---

### Neue Datenbankmigrationen

Eine Migration (oder in logische Gruppen aufgeteilt):
- `20260330_proj6_expansion.sql`
  - Tabellen: `family_rewards`, `reward_redemptions`
  - Tabellen: `achievements` (mit Seed-Daten für 4 MVP-Badges), `profile_achievements`
  - Tabellen: `family_goals`, `goal_contributions`
  - Erweiterung: `points_transactions` um `reward_id`, `goal_id`, neue `type`-Werte
  - RPC: `redeem_reward` (atomare Einlösung mit Punkte-Abzug)
  - RPC: `contribute_to_goal` (atomare Beisteuerung mit Punkte-Abzug + Ziel-Update)
  - RLS: Familienmitglieder sehen nur eigene Familie; Kinder können nicht Belohnungen anlegen

---

### Neue Seiten & Komponenten

| Pfad | Was |
|------|-----|
| `src/app/(app)/rewards/page.tsx` | Erweiterung der bestehenden Seite (alle 4 Sektionen) |
| `src/app/(app)/rewards/shop/page.tsx` | Vollansicht aller Belohnungen ("Alle anzeigen") |
| `src/components/rewards/family-leaderboard.tsx` | Leaderboard-Sektion |
| `src/components/rewards/leaderboard-card.tsx` | Einzelne Rang-Karte |
| `src/components/rewards/reward-shop.tsx` | Shop-Sektion (Client) |
| `src/components/rewards/reward-card.tsx` | Einzelne Belohnungs-Karte |
| `src/components/rewards/reward-form-dialog.tsx` | Dialog: Belohnung anlegen/bearbeiten |
| `src/components/rewards/achievement-gallery.tsx` | Badge-Galerie |
| `src/components/rewards/achievement-badge.tsx` | Einzelner Badge (verdient + gesperrt) |
| `src/components/rewards/community-goal.tsx` | Community-Ziel-Banner (Client) |
| `src/components/rewards/contribute-points-dialog.tsx` | Dialog: Punkte beisteuern |
| `src/components/rewards/goal-form-dialog.tsx` | Dialog: Ziel anlegen/abschließen |
| `src/lib/actions/rewards.ts` | Erweiterung um alle neuen Actions |
| `src/lib/validations/rewards.ts` | Neue Zod-Schemas für Belohnungen und Ziele |

---

### Keine neuen Pakete nötig

Alle erforderlichen shadcn/ui-Komponenten sind bereits installiert:
`Dialog ✓`, `Sheet ✓`, `Progress ✓`, `Avatar ✓`, `Badge ✓`, `Button ✓`, `Card ✓`, `Textarea ✓`, `Input ✓`, `Slider ✓` (für Beisteuerungs-Dialog)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
Belohnungs-Seite (Server – lädt alle Kinderdaten)
│
├── RewardsHeader
│   └── Seitentitel "Belohnungen"
│
├── ChildrenOverview (Kacheln aller Kinder)
│   └── ChildPointCard (pro Kind)
│       ├── Avatar + Name
│       ├── Punktestand (groß, prominent)
│       ├── "Punkte vergeben"-Button (nur Erwachsene)
│       └── "Verlauf anzeigen"-Link
│
├── PointsHistorySheet (shadcn Sheet – seitliches Panel)
│   ├── HistoryEntry (pro Buchung)
│   │   ├── Datum + Uhrzeit
│   │   ├── Art (Aufgabe erledigt / Manuell)
│   │   ├── Punkte (+/- farbig)
│   │   ├── Buchungsgrund / Kommentar
│   │   └── Aktueller Stand nach Buchung
│   └── EmptyState ("Noch keine Punkte gesammelt")
│
└── ManualPointsDialog (Client – shadcn Dialog, nur Erwachsene)
    ├── Kind-Anzeige (vorausgewählt vom ChildPointCard)
    ├── Betrag-Input (positiver Wert = hinzufügen, negativer = abziehen)
    ├── Kommentar-Textarea (optional)
    └── Vorschau ("Neuer Stand: X Punkte")
```

### Datenmodell

**Tabelle `points_transactions`** – unveränderliches Buchungsprotokoll (append-only):
| Feld | Beschreibung |
|------|-------------|
| id | Eindeutige ID |
| profile_id | Kind, dessen Konto gebucht wird |
| family_id | Zugehörige Familie |
| amount | Punkte (positiv = gutschreiben, negativ = abziehen) |
| type | task_completion / manual_add / manual_deduct |
| task_id | Verweis auf erledigte Aufgabe (bei task_completion) |
| comment | Optionaler Grund (bei manuellen Buchungen) |
| created_by | Erwachsener, der gebucht hat (oder System) |
| created_at | Buchungszeitpunkt |

**Erweiterung der `profiles`-Tabelle:**
| Feld | Beschreibung |
|------|-------------|
| points_balance | Aktueller Kontostand (integer, Minimum 0) – wird bei jeder Buchung aktualisiert |

> Der `points_balance` in `profiles` ist ein denormalisierter Hilfswert für schnelle Anzeige. Die `points_transactions`-Tabelle ist die einzige Quelle der Wahrheit.

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Append-only Buchungslog | Punkte können nie nachträglich geändert/gelöscht werden – volle Nachvollziehbarkeit (wichtig für Vertrauen der Kinder) |
| `points_balance` in `profiles` denormalisiert | Verhindert langsame `SUM()`-Abfragen bei jeder Seitenanzeige; wird via DB-Trigger aktuell gehalten |
| Minimum-Balance = 0 via DB-Constraint | Negativer Kontostand ist datenbankseitig unmöglich, nicht nur UI-Einschränkung |
| Buchung transaktional mit Aufgabenerledigung | Gleiche DB-Transaktion wie in PROJ-5 – entweder beides oder nichts |
| Kein eigener Einlöse-Mechanismus | Bewusste Entscheidung laut PRD – Punkte sind nur Motivation/Anzeige, keine digitale Währung |

### Neue Pakete
Keine – alle benötigten shadcn-Komponenten (Avatar, Badge, Progress, Sheet, Dialog) sind bereits installiert.

### Neue Datenbank-Tabellen
- `points_transactions`
- Erweiterung: `profiles` erhält Spalte `points_balance`

### Neue Server Actions
- `getRewardsOverviewAction` (alle Kinder + Punktestände)
- `getPointsHistoryAction` (Buchungslog für ein Kind)
- `manualPointsAction` (manuelle Buchung durch Erwachsene)
- *(Automatische Buchung läuft über `completeTaskAction` in PROJ-5)*

### Neue Seiten & Komponenten
| Pfad | Was |
|------|-----|
| `src/app/(app)/rewards/page.tsx` | Belohnungs-Seite |
| `src/components/rewards/` | Alle Belohnungs-Komponenten |
| `src/lib/actions/rewards.ts` | Server Actions für Punkte |

## Backend Implementation Notes (2026-03-22)

**Database:**
- `points_balance` column added to `profiles` (INT NOT NULL DEFAULT 0, CHECK >= 0)
- `points_transactions` table -- append-only log, no UPDATE/DELETE policies
- RLS: children SELECT own transactions, adults/admins SELECT all in family, INSERT for adults/admins
- `manual_points_booking` SECURITY DEFINER function for atomic manual add/deduct with balance clamping
- `award_task_points` SECURITY DEFINER function (shared with PROJ-5) for atomic task completion points
- Indexes on `profile_id`, `family_id`, `created_at`
- Realtime enabled on `points_transactions`

**Server Actions (`src/lib/actions/rewards.ts`):**
- `getRewardsOverviewAction()` -- fetches all children in family with `points_balance`
- `getPointsHistoryAction(profileId)` -- fetches transactions with task title and creator name via joins
- `manualPointsAction(profileId, amount, comment)` -- calls `manual_points_booking` RPC, adults only

**Validation:** Uses `manualPointsSchema` from `src/lib/validations/tasks.ts`

**Design decisions:**
- Balance cannot go negative (DB CHECK constraint + RPC clamping)
- Points are only awarded once per task (`points_awarded` flag checked in RPC)
- Deductions are clamped to current balance (never goes below 0)

**Migration:** `supabase/migrations/20260322_proj4_proj5_proj6_backend.sql`

## QA Test Results (Basis-Punktesystem v1)

**Tested:** 2026-03-22
**App URL:** http://localhost:3000/rewards
**Tester:** QA Engineer (AI)
**Build:** Passes (npm run build + npm run lint clean)
**Result:** 8/9 AC passed (1 medium bug: missing running balance in history). Deployed as v1.4.0.

*(Full v1 test results archived. See git history for details.)*

---

## QA Test Results (Expansion v2 -- Leaderboard, Shop, Badges, Community Goal)

**Tested:** 2026-03-30
**App URL:** http://localhost:3000/rewards
**Tester:** QA Engineer (AI)
**Build:** Passes (npm run build clean, npm run lint clean)
**Scope:** All new expansion acceptance criteria + re-test of base system + security audit

### Acceptance Criteria Status -- Basis-Punktesystem (re-test)

#### AC-B1: Jedes Kind hat ein Punktekonto
- [x] PASS -- profiles.points_balance column, CHECK >= 0

#### AC-B2: Punktestand auf Dashboard und Belohnungsseite
- [x] PASS -- RewardsWidget on dashboard shows points per child
- [x] PASS -- /rewards page shows leaderboard with points for all members

#### AC-B3: Automatische Buchung bei Aufgabenerledigung
- [x] PASS -- award_task_points RPC handles atomically
- [x] PASS -- checkAndAwardAchievementsAction called after task completion (tasks.ts line 579)

#### AC-B4: Manuelle Buchung mit Kommentar
- [x] PASS -- ManualPointsDialog still functional (component preserved but not imported by main page)
- [ ] NOTE: ManualPointsDialog is no longer accessible from the main /rewards page since the page was rewritten. The old RewardsOverview/ChildPointCard components that provided access are preserved but no longer imported.

#### AC-B5: Punktehistorie pro Kind
- [x] PASS -- PointsHistorySheet handles new transaction types (reward_redemption, goal_contribution)
- [ ] BUG-P6-1 (from v1): Running balance still not shown -- STILL OPEN

#### AC-B6: Punktestand kann nicht negativ werden
- [x] PASS -- DB CHECK constraint, RPC clamping, verified in redeem_reward and contribute_to_goal RPCs

#### AC-B7: Nur Erwachsene/Admins manuelle Buchungen
- [x] PASS -- Server-side role check, RPC role check, RLS

#### AC-B8: Punkte nur einmal vergeben
- [x] PASS -- points_awarded flag checked in award_task_points RPC

### Acceptance Criteria Status -- Familien-Leaderboard (NEW)

#### AC-L1: Alle Familienmitglieder nach points_balance absteigend sortiert
- [x] PASS -- getFamilyLeaderboardAction queries all profiles in family, ORDER BY points_balance DESC
- [x] PASS -- FamilyLeaderboard renders grid of LeaderboardCards in sorted order

#### AC-L2: Jede Karte zeigt Avatar, Name und Punktestand prominent
- [x] PASS -- LeaderboardCard shows Avatar (with fallback initials), display_name, and points chip
- [x] PASS -- Points displayed with "Pkt." suffix in accent chip

#### AC-L3: Rang 1 erhaelt visuelles Highlight (Signature-Gradient-Badge mit Trophy-Icon)
- [x] PASS -- Rank 1 card has bg-card with ambient shadow, Trophy icon in gradient badge (linear-gradient 135deg #6c5a00 to #ffd709)
- [x] PASS -- Activity Bubble decoration rendered for rank 1 only

#### AC-L4: Rang 2 bekommt silbernes Medaillen-Icon
- [x] PASS -- Medal icon in bg-surface-high badge for rank 2

#### AC-L5: Mitglieder ohne Avatar zeigen generisches Personen-Icon
- [x] PASS -- AvatarFallback shows initials from display_name; User icon shown if avatarUrl exists but fails to load

#### AC-L6: Responsive Grid (1 Spalte mobil, bis 3 Spalten Desktop)
- [x] PASS -- grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

### Acceptance Criteria Status -- Belohnungs-Shop (NEW)

#### AC-S1: Eltern koennen Belohnungen anlegen (Name max 50, Beschreibung max 200, Kosten 1-9999, Emoji)
- [x] PASS -- createRewardSchema validates all constraints (title max 50, description max 200, pointsCost 1-9999)
- [x] PASS -- createRewardAction checks adult/admin role server-side
- [x] PASS -- RewardFormDialog provides form with correct validation
- [x] PASS -- DB CHECK constraints on family_rewards table match schema (char_length(title) <= 50, points_cost >= 1 AND <= 9999)

#### AC-S2: Belohnungsliste zeigt max. 6 Karten auf Hauptseite mit "Alle anzeigen"-Link
- [x] PASS -- RewardShop component uses maxVisible=6 prop
- [x] PASS -- "Alle anzeigen" link points to /rewards/shop
- [ ] BUG-P6-3: "Alle anzeigen" link only renders when rewards.length > 3 (line 131: `hasMore || showViewAll) && rewards.length > 3`), but should show when there are more than 6 rewards. With exactly 4-6 rewards, the link still appears but is unnecessary.

#### AC-S3: Kinder koennen einloesen wenn points_balance >= Kosten, sonst Button deaktiviert
- [x] PASS -- RewardCard shows "Einloesen" button if canAfford, otherwise disabled "Noch X Pkt." button with Lock icon
- [x] PASS -- redeemRewardAction calls redeem_reward RPC which checks balance atomically
- [x] PASS -- RPC raises exception if insufficient points

#### AC-S4: Einloesen zieht Punkte ab und erstellt reward_redemption + points_transaction
- [x] PASS -- redeem_reward RPC: deducts from profiles.points_balance, inserts into reward_redemptions, inserts into points_transactions with type 'reward_redemption'
- [x] PASS -- Transaction amount is negative (correctly subtracting)

#### AC-S5: Kinder sehen Punktepreis als Chip
- [x] PASS -- Points chip with "X Pkt." in accent bg, rounded-full

#### AC-S6: Eltern koennen Belohnungen bearbeiten und deaktivieren
- [x] PASS -- updateRewardAction supports partial updates (title, description, iconEmoji, pointsCost, isActive)
- [x] PASS -- RewardFormDialog shows active toggle in edit mode
- [ ] BUG-P6-4: Parents cannot see deactivated rewards to re-enable them. getRewardShopAction always filters `is_active = true` (line 353). Once a reward is deactivated, parents have no UI path to find and re-activate it.

#### AC-S7: Deaktivierte Belohnungen fuer Kinder nicht sichtbar
- [x] PASS -- getRewardShopAction filters is_active = true server-side (but also hides from parents -- see BUG-P6-4)

### Acceptance Criteria Status -- Achievement-Badges (NEW)

#### AC-A1: Badges werden automatisch vergeben wenn Kriterium erfuellt
- [x] PASS -- checkAndAwardAchievementsAction checks all criteria types: task_count_by_category, task_completed_before_hour, tasks_per_week
- [x] PASS -- Called after task completion via completeTaskAction (fire-and-forget with .catch())
- [x] PASS -- Already earned badges skipped (earnedIds Set check + UNIQUE constraint)

#### AC-A2: Badge-Galerie zeigt verdiente Badges farbig und gesperrte ausgegraut mit Schloss-Icon
- [x] PASS -- AchievementBadge: earned badges get colored bg + rotation effect, locked get opacity-40 grayscale + Lock icon
- [x] PASS -- AchievementGallery sorts earned first, then locked

#### AC-A3: Toast-Benachrichtigung beim Verdienen eines Badges
- [ ] BUG-P6-5: No toast notification when a badge is earned. The checkAndAwardAchievementsAction returns the list of awarded slugs, but the calling code in tasks.ts (line 579) uses fire-and-forget `.catch(() => {})` and never reads the result. The user is never notified of newly earned badges.

#### AC-A4: 4 MVP-Badges korrekt definiert
- [x] PASS -- "Putz-Profi": task_count_by_category, haushalt, count 10
- [x] PASS -- "Fruehaufsteher": task_completed_before_hour, hour 8, count 5
- [x] PASS -- "Teamplayer": tasks_per_week, count 3
- [x] PASS -- "Leseratte": task_count_by_category, schule, count 10
- [x] PASS -- All seeded with ON CONFLICT DO NOTHING

### Acceptance Criteria Status -- Community-Ziel / Familien-Ziel (NEW)

#### AC-G1: Max. 1 aktives Familienziel pro Familie
- [x] PASS -- createFamilyGoalAction checks for existing active goals before inserting
- [ ] NOTE: No DB-level UNIQUE constraint enforcing this -- relies on application-level check only. Concurrent requests could create duplicates.

#### AC-G2: Eltern koennen Ziel anlegen (Name, Beschreibung, Emoji, Zielpunkte 100-100.000)
- [x] PASS -- createGoalSchema validates targetPoints 100-100000
- [x] PASS -- createFamilyGoalAction checks adult/admin role
- [x] PASS -- GoalFormDialog provides form with reset on open

#### AC-G3: Alle Familienmitglieder koennen Punkte beisteuern
- [x] PASS -- contributeToGoalAction has no role restriction (all members can contribute)
- [x] PASS -- contribute_to_goal RPC verifies same family and active status

#### AC-G4: Beisteuern zieht Punkte vom persoenlichen Konto ab und erhoeht Ziel-Fortschritt
- [x] PASS -- RPC atomically: deducts from profiles.points_balance, increments family_goals.collected_points, inserts goal_contributions and points_transactions
- [x] PASS -- Amount clamped to LEAST(requested, balance, remaining goal points)

#### AC-G5: Fortschrittsbalken zeigt "gesammelte Punkte / Zielpunkte" und "Noch X Punkte"
- [x] PASS -- CommunityGoal shows collectedPoints / targetPoints with progress bar
- [x] PASS -- "Noch X Punkte bis zum Ziel" text displayed when not completed

#### AC-G6: Ziel als "erreicht" markiert wenn gesammelte >= Zielpunkte, Glueckwunsch-Anzeige
- [x] PASS -- contribute_to_goal RPC auto-completes goal when threshold met (sets status='completed', completed_at=now())
- [x] PASS -- CommunityGoal shows PartyPopper celebration banner when completed

#### AC-G7: Eltern koennen Ziel beenden und neues starten
- [x] PASS -- completeFamilyGoalAction sets status='completed' with role check
- [x] PASS -- After completion, "Neues Ziel" button opens GoalFormDialog

#### AC-G8: Abgeschlossene Ziele in Geschichte/Chronik gespeichert
- [ ] BUG-P6-6: Completed goals are stored in the database (not deleted), but there is no UI to view past/completed goals. getFamilyGoalAction only fetches status='active' goals. The spec requires a "Geschichte/Chronik" view which is missing.

### Edge Cases Status (Expansion)

#### EC-E1: Nicht genug Punkte fuer Belohnung
- [x] PASS -- Button deaktiviert, shows "Noch X Pkt." with Lock icon
- [x] PASS -- redeem_reward RPC raises "Insufficient points" if called directly

#### EC-E2: Punkte zum Familienziel beitragen mit weniger Punkte als gewuenscht
- [x] PASS -- RPC clamps to current balance via LEAST()
- [x] PASS -- ContributePointsDialog max slider value = userBalance

#### EC-E3: Familienziel geloescht bevor erreicht
- [x] PASS -- No DELETE policy on family_goals (cannot delete from UI)
- [x] PASS -- completeFamilyGoalAction sets status='completed', contributed points are not returned

#### EC-E4: Zwei Kinder loesen gleichzeitig gleiche Belohnung ein
- [x] PASS -- redeem_reward RPC locks caller profile with FOR UPDATE, each transaction independent
- [x] PASS -- No inventory limit on rewards

#### EC-E5: Badge nachtraeglich erfuellt
- [x] PASS -- checkAndAwardAchievementsAction re-checks all criteria on every call
- [x] PASS -- UNIQUE constraint prevents duplicate badge awards

#### EC-E6: Kind ohne Punkte im Leaderboard
- [x] PASS -- Appears with "0 Pkt." in accent chip, sorted at bottom

### Security Audit Results (Expansion)

#### Authentication
- [x] /rewards page redirects to /login if not authenticated
- [x] /rewards/shop page redirects to /login if not authenticated
- [x] All server actions check getCurrentProfile() for authentication

#### Authorization -- Reward Shop
- [x] createRewardAction checks adult/admin role server-side
- [x] updateRewardAction checks adult/admin role server-side
- [x] updateRewardAction verifies reward belongs to caller's family
- [x] RLS: family_rewards INSERT/UPDATE restricted to adults/admins
- [x] RLS: No DELETE policy on family_rewards (deactivation only)
- [ ] BUG-P6-7 (SECURITY): redeemRewardAction has no role restriction. Any authenticated family member (including adults/admins) can call the server action to redeem rewards. The UI hides the button for adults (isAdultOrAdmin check in RewardCard), but the server action can be called directly. While not critical (adults spending their own points is arguably valid), it bypasses the intended design where only children can redeem.

#### Authorization -- Achievements
- [x] achievements table: SELECT for all authenticated users, no INSERT/UPDATE/DELETE
- [x] profile_achievements: INSERT via server action only (no RLS INSERT policy for regular users)
- [x] checkAndAwardAchievementsAction verifies same family before awarding
- [ ] NOTE: checkAndAwardAchievementsAction is exported and can be called by any authenticated user for any profileId in their family. The function verifies family membership but does not restrict who can trigger the check. Since it only awards legitimately earned badges, this is low risk.

#### Authorization -- Community Goal
- [x] createFamilyGoalAction checks adult/admin role
- [x] completeFamilyGoalAction checks adult/admin role
- [x] completeFamilyGoalAction verifies goal belongs to caller's family
- [x] contribute_to_goal RPC verifies same family and active goal
- [x] RLS: family_goals INSERT/UPDATE restricted to adults/admins
- [x] RLS: goal_contributions SELECT family-only, INSERT via RPC only

#### Input Validation
- [x] createRewardSchema: title max 50, description max 200, pointsCost 1-9999, emoji required
- [x] updateRewardSchema: all fields optional, same constraints when provided
- [x] createGoalSchema: title max 100, description max 200, targetPoints 100-100000
- [x] contributeToGoalSchema: goalId UUID, amount 1-99999
- [x] redeemRewardSchema: rewardId UUID
- [ ] BUG-P6-8 (LOW): iconEmoji field in createRewardSchema only validates min length 1. There is no check that the input is actually a single emoji. Users could enter arbitrary strings like "abc" as the emoji icon. The DB and UI would not break, but it violates the AC "Icon-Emoji (ein Emoji)."

#### Race Conditions
- [x] redeem_reward RPC uses FOR UPDATE on profiles and family_rewards
- [x] contribute_to_goal RPC uses FOR UPDATE on profiles and family_goals
- [x] Clamping prevents over-spending even under concurrent access
- [ ] BUG-P6-9 (MEDIUM): createFamilyGoalAction checks for existing active goals at application level (SELECT then INSERT), not atomically. Two concurrent requests could both pass the check and create duplicate active goals. Should use a DB-level partial UNIQUE index on (family_id) WHERE status = 'active'.

#### Data Exposure
- [x] No secrets in client-side code
- [x] Server actions return only necessary data
- [x] Leaderboard shows all family members (intentional per spec)
- [x] SECURITY DEFINER functions set search_path = public

### Bugs Found (Expansion)

#### BUG-P6-1: Running balance not shown in points history (STILL OPEN from v1)
- **Severity:** Medium
- **Status:** Carried forward from v1 QA -- not fixed
- **Priority:** Fix in next sprint

#### BUG-P6-3: "Alle anzeigen" link visibility logic incorrect
- **Severity:** Low
- **Steps to Reproduce:**
  1. Create exactly 1-3 rewards
  2. Go to /rewards
  3. Expected: No "Alle anzeigen" link (fewer than 6 rewards)
  4. Actual: Link is hidden (correct for 1-3), but the condition `rewards.length > 3` means with 4-6 rewards the link appears unnecessarily (they all fit in the maxVisible=6 limit)
- **Code:** `reward-shop.tsx` line 131: `(hasMore || showViewAll) && rewards.length > 3`
- **Priority:** Nice to have

#### BUG-P6-4: Parents cannot see or re-activate deactivated rewards
- **Severity:** High
- **Steps to Reproduce:**
  1. As a parent, create a reward and deactivate it via edit dialog
  2. Go to /rewards or /rewards/shop
  3. Expected: Deactivated rewards visible to parents (with visual indicator) so they can re-enable
  4. Actual: getRewardShopAction filters `is_active = true` for all users. Deactivated rewards are invisible to everyone, including parents. There is no way to re-activate a reward.
- **Code:** `rewards.ts` line 353: `.eq("is_active", true)` -- no conditional logic based on role
- **Priority:** Fix before deployment

#### BUG-P6-5: No toast notification when a badge is earned
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Complete enough tasks to earn a badge (e.g., 3 tasks in one week for "Teamplayer")
  2. Expected: Toast notification "Du hast das Abzeichen 'Teamplayer' verdient!" per AC-A3
  3. Actual: checkAndAwardAchievementsAction is called fire-and-forget in tasks.ts (line 579: `.catch(() => {})`). The returned `awarded` array is never read, so no toast is shown.
- **Code:** `tasks.ts` line 579 discards the result
- **Priority:** Fix before deployment

#### BUG-P6-6: No UI for viewing completed/cancelled goals (missing goal history/chronicle)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Create and complete a family goal
  2. Go to /rewards
  3. Expected: A "Geschichte/Chronik" section showing past goals (per AC-G8)
  4. Actual: Only the active goal is shown. getFamilyGoalAction fetches only status='active'. No UI for viewing past goals.
- **Code:** `rewards.ts` getFamilyGoalAction line 739: `.eq("status", "active")`
- **Priority:** Fix in next sprint

#### BUG-P6-7: redeemRewardAction has no server-side role restriction
- **Severity:** Low (Security)
- **Steps to Reproduce:**
  1. As an adult/admin, call redeemRewardAction directly (e.g., via browser console)
  2. Expected: Error "Only children can redeem rewards" per spec design
  3. Actual: The action succeeds -- adults can redeem rewards, spending their own points. The UI hides the button but the server action is unprotected.
- **Code:** `rewards.ts` redeemRewardAction (line 497) -- no role check
- **Priority:** Nice to have (low risk since adults spending their own points is not harmful)

#### BUG-P6-8: iconEmoji validation does not enforce single emoji
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open RewardFormDialog, type "abc" in the emoji field
  2. Submit the form
  3. Expected: Validation error "Must be a single emoji"
  4. Actual: Accepted -- "abc" appears as the reward icon
- **Code:** `validations/rewards.ts` line 18: only checks `.min(1)`
- **Priority:** Nice to have

#### BUG-P6-9: Race condition in createFamilyGoalAction -- duplicate active goals possible
- **Severity:** Medium (Security)
- **Steps to Reproduce:**
  1. Two parents submit createFamilyGoalAction simultaneously (e.g., via rapid double-click or concurrent sessions)
  2. Expected: Only one active goal created
  3. Actual: Both SELECT checks find no active goal, both INSERT succeed, creating 2 active goals. No DB-level partial UNIQUE index on (family_id) WHERE status = 'active'.
- **Code:** `rewards.ts` createFamilyGoalAction lines 831-838 -- SELECT then INSERT without lock
- **Priority:** Fix before deployment

#### BUG-P6-10: CommunityGoal userBalance not updated correctly after contribution
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Contribute 50 points to a family goal
  2. Without page reload, check the "Punkte beisteuern" dialog balance display
  3. Expected: Balance reduced by 50
  4. Actual: Balance reduced by 1. Code on line 295: `setUserBalance((prev) => Math.max(0, prev - 1))` hardcodes a reduction of 1 instead of the actual contributed amount.
- **Code:** `community-goal.tsx` line 295
- **Priority:** Fix before deployment

#### BUG-P6-11: ManualPointsDialog and PointsHistorySheet are orphaned -- no access path
- **Severity:** High
- **Steps to Reproduce:**
  1. Go to /rewards as an adult/admin
  2. Try to manually add/deduct points for a child or view a child's point history
  3. Expected: Access to ManualPointsDialog and PointsHistorySheet
  4. Actual: The /rewards page was rewritten to show Leaderboard/Shop/Badges/Goal. The old RewardsOverview and ChildPointCard components (which provided "Punkte vergeben" and "Verlauf" buttons) are no longer imported. There is no UI path to these still-functional components.
- **Code:** `rewards/page.tsx` no longer imports RewardsOverview or ChildPointCard
- **Priority:** Fix before deployment

### Summary
- **Acceptance Criteria (Basis, re-test):** 7/8 passed (BUG-P6-1 still open, BUG-P6-11 blocks AC-B4)
- **Acceptance Criteria (Leaderboard):** 6/6 passed
- **Acceptance Criteria (Reward Shop):** 6/7 passed (BUG-P6-4 blocks AC-S6)
- **Acceptance Criteria (Badges):** 3/4 passed (BUG-P6-5 blocks AC-A3)
- **Acceptance Criteria (Community Goal):** 7/8 passed (BUG-P6-6 blocks AC-G8)
- **Total Acceptance Criteria:** 29/33 passed
- **Bugs Found:** 9 new + 1 carried from v1 = 10 total (0 critical, 2 high, 5 medium, 3 low)
- **Security:** Mostly solid (atomic RPCs with FOR UPDATE, proper RLS, role checks). Two findings: race condition on goal creation (BUG-P6-9), no role guard on reward redemption (BUG-P6-7).
- **Production Ready:** NO -- 2 High bugs and 3 Medium bugs should be fixed before deployment.
- **Recommendation:** Fix BUG-P6-4, BUG-P6-5, BUG-P6-9, BUG-P6-10, and BUG-P6-11 first. These are blocking or cause incorrect behavior. Then re-test and deploy.

## Deployment

**Basis-System Deployed:** 2026-03-22
**Tag:** v1.4.0-PROJ-4-5-6
**DB Migration:** `proj4_proj5_proj6_backend` – applied to `fmmorvmshvgqatnefkpf`

**Expansion Deployed:** 2026-03-30
**Commit:** `bc0598f` — feat(PROJ-6): Rewards & Achievements expansion
**Inhalt:** Leaderboard, Shop, Badges, Family Goal

**Status:** PROJ-6 → Deployed in INDEX.md

## Frontend Implementation Notes (Expansion 2026-03-30)

**New Components Created:**
- `src/components/rewards/family-leaderboard.tsx` – Server component: renders leaderboard section with header and responsive grid
- `src/components/rewards/leaderboard-card.tsx` – Individual rank card with Avatar, rank badge (gold/silver), Activity Bubble for rank 1, points chip
- `src/components/rewards/reward-shop.tsx` – Client component: shop section with grid of reward cards, add/edit dialogs, auto-refresh after redemption
- `src/components/rewards/reward-card.tsx` – Individual reward card: emoji icon, title, description, points chip (accent bg), redeem/locked button for children, edit overlay for parents
- `src/components/rewards/reward-form-dialog.tsx` – Dialog for creating/editing rewards (emoji, title, description, cost, active toggle in edit mode)
- `src/components/rewards/achievement-gallery.tsx` – Horizontal scroll gallery: earned badges (colored, rotation effect), locked badges (grayscale, lock icon)
- `src/components/rewards/achievement-badge.tsx` – Individual badge: maps slugs to lucide icons and color schemes
- `src/components/rewards/community-goal.tsx` – Client component: full-width banner with progress bar (Signature Gradient fill), contributions list, contribute/complete actions
- `src/components/rewards/contribute-points-dialog.tsx` – Slider + input for selecting contribution amount, balance preview
- `src/components/rewards/goal-form-dialog.tsx` – Dialog for creating new family goals (emoji, title, description, target points)

**New Pages:**
- `src/app/(app)/rewards/page.tsx` – Rewritten to load all 4 sections in parallel (leaderboard, shop, badges, community goal)
- `src/app/(app)/rewards/shop/page.tsx` – Full reward shop view with back link

**New shadcn/ui Component Installed:**
- `slider` – used in ContributePointsDialog

**Design System Compliance:**
- No borders for sectioning (uses bg-color shifts: card, muted, accent)
- Ghost borders only at low opacity where needed
- Minimum radius sm (0.5rem), standard cards use rounded-xl/rounded-[2rem]
- Signature Gradient (135deg, #6c5a00 -> #ffd709) used for rank 1 badge and progress bar
- Activity Bubble organic shape used for rank 1 decoration and community goal banner
- font-display (Plus Jakarta Sans) for headlines, font-body (Be Vietnam Pro) for body text
- Generous spacing (space-y-12 between sections)
- Responsive: 1 col mobile, 2-3 cols desktop for grids

**Existing Components Preserved:**
- `child-point-card.tsx`, `manual-points-dialog.tsx`, `points-history-sheet.tsx`, `rewards-overview.tsx` – kept for potential re-use but no longer imported by main page
