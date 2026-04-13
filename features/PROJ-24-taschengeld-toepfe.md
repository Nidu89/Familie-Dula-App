# PROJ-24: Virtuelle Taschengeld-Töpfe (Spend/Save/Donate)

## Status: In Progress
**Created:** 2026-04-12
**Last Updated:** 2026-04-12

## Dependencies
- Requires: PROJ-6 (Belohnungssystem) — points economy that children earn; jars split those points into named buckets

## Overview
Enhancement of the existing Belohnungssystem. Children can allocate earned points into named jars: **Ausgeben** (Spend), **Sparen** (Save), **Verschenken** (Donate). Each jar has a target goal and a visual progress bar. Parents configure jar types per child. No real money — pure in-app point economy.

## User Stories
- Als **Elternteil** möchte ich für jedes Kind individuelle Töpfe anlegen können, damit ich die Aufteilung an das Kind anpassen kann.
- Als **Kind** möchte ich nach dem Erledigen einer Aufgabe meine verdienten Punkte auf meine Töpfe verteilen, damit ich selbst entscheiden kann, wofür ich spare.
- Als **Kind** möchte ich für jeden Topf einen Fortschrittsbalken sehen, damit ich weiß, wie nah ich an meinem Ziel bin.
- Als **Kind** möchte ich sehen, wie viele Punkte ich insgesamt in jedem Topf habe, damit ich den Überblick behalte.
- Als **Elternteil** möchte ich eine Übersicht aller Töpfe pro Kind sehen, damit ich den Sparfortschritt begleiten kann.
- Als **Kind** möchte ich eine Benachrichtigung bekommen, wenn ein Topf sein Ziel erreicht hat, damit ich mich freuen und das Ziel feiern kann.
- Als **Elternteil** möchte ich die Zielbeträge der Töpfe jederzeit anpassen können, damit ich auf Veränderungen reagieren kann.

## Acceptance Criteria

### Jar CRUD (Parent)
- [ ] Parent can create a new jar for a child with name, type (Ausgeben/Sparen/Verschenken/Eigener), and target amount
- [ ] Parent can edit jar name, type, and target amount
- [ ] Parent can delete a jar (points in the jar return to unallocated balance)
- [ ] Parent can reorder jars per child

### Default Jars
- [ ] When a child joins a family, 3 default jars are automatically created: Ausgeben (Spend), Sparen (Save), Verschenken (Donate)
- [ ] Default jars have a target of 0 (no goal) until parent sets one
- [ ] Parent can rename or delete the default jars

### Point Allocation Flow
- [ ] After earning points (task completion), child sees an allocation dialog
- [ ] Dialog shows all jars with current amounts and remaining points to allocate
- [ ] Child distributes points across jars using sliders or number inputs
- [ ] Total allocated must equal total earned (no points left over)
- [ ] Allocation is confirmed with a single tap/click
- [ ] If child dismisses without allocating, points remain in an unallocated pool

### Visual Progress Bars
- [ ] Each jar shows a progress bar (current / target)
- [ ] Progress bar uses color coding: <50% surface-container, 50–99% secondary, 100% primary (gold)
- [ ] When target is reached, jar displays a celebration animation (confetti or sparkle)
- [ ] Jars without a target show current amount only (no progress bar)

### Dashboard Widget
- [ ] Rewards widget on dashboard shows a summary of each child's jars
- [ ] Widget shows top-level totals: total points earned, total allocated, total unallocated
- [ ] Clicking widget navigates to full rewards/jars page

### Jar History / Log
- [ ] Each jar has a history log showing all allocations with date and amount
- [ ] Parent can view full allocation history per child
- [ ] Log entries show source (which task triggered the points)

## Edge Cases
- **All points in one jar:** Allowed — child can put 100% into a single jar.
- **Jar target reached:** Jar stays open; child can continue adding points beyond the goal. Visual celebration triggers once at 100%.
- **Zero points to allocate:** Allocation dialog does not appear if earned amount is 0.
- **Multiple children, different jar setups:** Each child has independent jar configuration; parent manages per child.
- **Jar deleted with points:** Points return to unallocated balance with a log entry explaining the refund.
- **Concurrent allocation:** If points are earned from multiple tasks rapidly, allocation dialog queues or batches the total.
- **Child has no jars:** Points go to unallocated pool; parent is prompted to set up jars.

## Technical Requirements
- **New DB table:** `savings_jars` (id, profile_id, family_id, name, jar_type: spend/save/donate/custom, target_amount, current_amount, sort_order, created_at, updated_at)
- **New DB table:** `jar_transactions` (id, jar_id, amount, source_type, source_id, created_at)
- **Server actions:** Extend `src/lib/actions/rewards.ts` with jar CRUD, allocation, and history queries
- **Validation:** Extend `src/lib/validations/rewards.ts` with jar schemas (Zod)
- **New component:** `src/components/rewards/allocate-points-dialog.tsx`
- **New component:** `src/components/rewards/jar-progress-card.tsx`
- **Extend:** `src/components/rewards/rewards-overview.tsx` — integrate jar view
- **Extend:** `src/components/dashboard/rewards-widget.tsx` — show jar summary
- **RLS:** Jars visible to family members; only parents can CRUD jars; children can allocate to own jars

---
## Tech Design (Solution Architect)

### A) Component Structure

```
Rewards Page (rewards-overview.tsx — erweitert)
+-- Rewards Page Header
+-- Child Selector (bereits vorhanden)
+-- JarsSection (NEU)
|   +-- JarProgressCard (NEU) × n
|   |   +-- Topf-Name + Icon (Spend/Save/Donate/Custom)
|   |   +-- Punkte-Zähler (aktuell / Ziel)
|   |   +-- Progress Bar (shadcn Progress)
|   |   +-- Konfetti/Sparkle bei 100% (CSS-Animation)
|   |   +-- Jar History Button → JarHistorySheet (NEU)
|   +-- "Topf hinzufügen" Button (nur Eltern)
+-- JarFormDialog (NEU — für Eltern: Create/Edit)
|   +-- Name Input
|   +-- Typ-Selector (Ausgeben / Sparen / Verschenken / Eigener)
|   +-- Ziel-Input (optional, 0 = kein Ziel)
+-- AllocatePointsDialog (NEU — für Kinder nach Aufgabe)
|   +-- "Du hast X Punkte verdient!"
|   +-- Jar-Liste mit Number Inputs / Slider je Topf
|   +-- Gesamt-Anzeige (verteilt / gesamt, muss aufgehen)
|   +-- "Bestätigen" Button
+-- JarHistorySheet (NEU)
    +-- Log-Einträge (Datum, Menge, Quelle)

Dashboard (rewards-widget.tsx — erweitert)
+-- Gesamtpunkte des Kindes
+-- Jar-Zusammenfassung (Miniaturen der Töpfe)
+-- Unverteilte Punkte (falls vorhanden)
```

### B) Datenmodell

**Tabelle: `savings_jars`**
Jeder Topf gehört einem Kind (Profil) und einer Familie.
- ID, Kind-Profil-ID, Familien-ID
- Name (z.B. "Ferien-Kasse"), Typ (Ausgeben / Sparen / Verschenken / Eigener)
- Ziel-Punkte (0 = kein Ziel), aktuelle Punkte, Reihenfolge
- Erstellt am, zuletzt aktualisiert

**Tabelle: `jar_transactions`**
Jede Zuweisung von Punkten in einen Topf.
- ID, Topf-ID
- Menge (positiv = einzahlen, negativ = Topf gelöscht/Rückbuchung)
- Quelle-Typ (task, manual, refund), Quelle-ID
- Erstellt am

**Unverteilte Punkte:**
Berechnet als: Gesamtpunkte (aus points_transactions) − Summe aller Jar-Einzahlungen. Kein separater Datenbankwert nötig.

### C) Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Supabase DB (kein localStorage) | Mehrere Familienmitglieder sollen denselben Stand sehen |
| Separate `jar_transactions` Tabelle | Revisionssicherheit: Jede Zuweisung ist nachvollziehbar |
| Unverteilte Punkte als Berechnung | Kein separater Datenbankwert der inkonsistent werden kann |
| Allocation Dialog nach Task | Kinder sollen sofort nach dem Verdienen entscheiden |
| shadcn Progress + Slider | Bereits installiert — kein zusätzliches Package nötig |

### D) Berechtigungen (RLS)

- Eltern: Alle Töpfe ihrer Familienkinder sehen, erstellen, bearbeiten, löschen
- Kinder: Nur eigene Töpfe sehen und Punkte zuweisen (nicht löschen/umbenennen)
- Automatik: 3 Standard-Töpfe beim Familienbeitritt eines Kindes

### E) Integration mit Belohnungssystem

Bestehend: Aufgabe erledigt → Punkte in points_transactions
Erweitert: → AllocatePointsDialog öffnet sich → Kind verteilt auf Töpfe → Einträge in jar_transactions

### F) Neue Dateien

- `src/components/rewards/jar-progress-card.tsx`
- `src/components/rewards/jar-form-dialog.tsx`
- `src/components/rewards/jar-history-sheet.tsx`
- `src/components/rewards/allocate-points-dialog.tsx`
- Erweitert: `src/components/rewards/rewards-overview.tsx`
- Erweitert: `src/components/dashboard/rewards-widget.tsx`
- Erweitert: `src/lib/actions/rewards.ts`
- Neue Supabase-Migration für `savings_jars` + `jar_transactions` Tabellen

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
