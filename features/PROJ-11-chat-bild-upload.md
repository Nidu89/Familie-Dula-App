# PROJ-11: Bild-Upload im Chat

## Status: Deployed
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Requires: PROJ-9 (Chat & Kommunikation) – Bild-Upload erweitert den bestehenden Chat.
- Requires: PROJ-15 (Mehrsprachigkeit) – Alle UI-Texte müssen über das i18n-System laufen.

## User Stories
- Als Familienmitglied möchte ich Bilder im Familienchat und in Direktnachrichten teilen können.
- Als Nutzer möchte ich eine Vorschau eines geteilten Bilds direkt im Chat sehen, ohne einen separaten Download.
- Als Nutzer möchte ich auf ein Bild klicken können, um es in voller Größe zu sehen.
- Als Elternteil möchte ich Bilder im Chat löschen können (eigene Bilder; Admins alle Bilder).

## Acceptance Criteria
- [ ] Bild-Upload: Nutzer kann über einen "Bild anfügen"-Button ein Bild auswählen und senden.
- [ ] Unterstützte Formate: JPEG, PNG, GIF, WebP.
- [ ] Maximale Dateigröße: 10 MB pro Bild.
- [ ] Vorschau im Chat: Hochgeladene Bilder werden als Thumbnail (max. 300×300 px) inline angezeigt.
- [ ] Vollbild-Ansicht: Klick auf Thumbnail öffnet Lightbox mit vollem Bild.
- [ ] Bilder werden in Supabase Storage in einem familienspezifischen, privaten Bucket gespeichert.
- [ ] Nur Familienmitglieder können Bilder der eigenen Familie abrufen (RLS auf Storage).
- [ ] Eigene Bilder kann jedes Mitglied löschen; Admins können alle Bilder löschen.
- [ ] Löschen eines Bilds entfernt es aus Chat-Anzeige und Storage.
- [ ] Während des Uploads wird ein Lade-Indikator angezeigt.

## Edge Cases
- Was passiert, wenn ein nicht-unterstütztes Format hochgeladen wird? → Fehlermeldung mit Liste erlaubter Formate.
- Was passiert, wenn das Bild zu groß ist? → Fehlermeldung vor dem Upload mit Größenlimit-Hinweis.
- Was passiert, wenn der Upload abbricht (schlechte Verbindung)? → Fehlermeldung + Retry-Option.
- Was passiert, wenn ein Familienmitglied entfernt wird, das Bilder hochgeladen hat? → Bilder bleiben im Chat sichtbar (nicht automatisch gelöscht).

## Technical Requirements
- Supabase Storage: Privater Bucket pro Familie (oder ein Bucket mit family_id als Ordner-Präfix).
- Signed URLs für sicheren Bild-Zugriff (zeitlich begrenzt, kein öffentlicher Zugriff).
- Client-seitige Größenvalidierung vor dem Upload.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

Diese Komponenten erweitern den bestehenden Chat aus PROJ-9:

```
Message Input Area (PROJ-9 erweitern)
+-- Bild-Anhang-Button (Büroklammer/Bild-Icon)
+-- Verstecktes File-Input (accept: image/jpeg,image/png,image/gif,image/webp)
+-- Upload-Fortschrittsanzeige (Ladebalken/Spinner während Upload)

Message Bubble (PROJ-9 erweitern)
+-- Wenn Bild vorhanden:
|   +-- Bild-Thumbnail (max. 300×300 px, CSS object-fit: cover)
|   +-- Löschen-Button (eigene Bilder / Admins alle Bilder)
+-- Wenn kein Bild: bisheriges Text-Bubble-Verhalten

Image Lightbox (neue Komponente)
+-- Dialog / Overlay
+-- Vollbild-Anzeige des Bilds
+-- Schließen-Button (X)
```

### Datenmodell

**Erweiterung von `chat_messages`** (PROJ-9):
- `image_url` (optional) — Pfad zum Bild in Supabase Storage

**Supabase Storage Bucket `chat-images`:**
- Ordnerstruktur: `{family_id}/{channel_id}/{message_id}.{ext}`
- Privater Bucket: kein öffentlicher Zugriff, nur via Signed URLs
- RLS auf Storage: nur Familienmitglieder können Bilder lesen/hochladen

**Gespeichert in:** Supabase Storage (Bilder) + Supabase-Datenbank (Nachrichten mit Bild-Pfad)

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Client-seitige Validierung vor Upload | Dateigröße (max. 10 MB) und Format werden geprüft, bevor der Upload startet → spart Bandbreite und gibt sofortiges Feedback. |
| Signed URLs (zeitlich begrenzt) | Bilder sind nicht öffentlich zugänglich. Signed URLs laufen z.B. nach 1 Stunde ab und werden bei Bedarf erneuert → sicher, auch wenn jemand die URL kopiert. |
| CSS-Thumbnails statt Server-Resize | Keine Bildverarbeitung auf dem Server nötig. Browser skaliert das Bild via CSS auf max. 300×300 px – einfach und ausreichend für Chat-Thumbnails. |
| Lightbox via shadcn Dialog | Klick auf Thumbnail öffnet einen Dialog mit dem Vollbild via Signed URL. Nutzt bereits installierte shadcn/ui Dialog-Komponente. |
| family_id-Ordner-Präfix | Isoliert Bilder verschiedener Familien im selben Bucket → kein versehentlicher Zugriff auf fremde Bilder, einfache RLS-Policy. |

### Berechtigungen (RLS)
- Alle Familienmitglieder: Bilder der eigenen Familie hochladen und anzeigen.
- Eigene Bilder: Jeder kann seine eigenen Bilder löschen.
- Admins: Können alle Bilder der Familie löschen.
- Löschen: Entfernt Bild aus Storage UND setzt `image_url` in `chat_messages` auf null.

### Neue Abhängigkeiten
Keine neuen Packages nötig — Supabase Storage ist bereits im Projekt vorhanden.

## QA Test Results

**Date:** 2026-04-09
**Tester:** QA Engineer (automated + code review)
**Status:** NOT READY — 1 High bug must be fixed

### Acceptance Criteria Results

| # | Criterion | Result |
|---|-----------|--------|
| AC-1 | Bild-Upload über "Bild anhängen"-Button | PASS |
| AC-2 | Unterstützte Formate: JPEG, PNG, GIF, WebP | PASS |
| AC-3 | Maximale Dateigröße: 10 MB | PASS |
| AC-4 | Thumbnail-Vorschau im Chat (max 300×300 px) | PASS |
| AC-5 | Vollbild-Ansicht (Lightbox) bei Klick auf Thumbnail | PASS |
| AC-6 | Bilder in Supabase Storage (privater Bucket, familienspezifisch) | PASS |
| AC-7 | Nur Familienmitglieder können Bilder abrufen (RLS) | PASS |
| AC-8 | Eigene Bilder löschen + Admins alle Bilder löschen | FAIL (mobile) |
| AC-9 | Löschen entfernt Bild aus Chat und Storage | PASS |
| AC-10 | Lade-Indikator während Upload | PASS |

**Result: 9/10 passed, 1 failed (mobile-only)**

### Edge Cases

| Edge Case | Result |
|-----------|--------|
| Nicht-unterstütztes Format → Fehlermeldung | PASS |
| Bild zu groß → Fehlermeldung vor Upload | PASS |
| Upload-Abbruch → Fehlermeldung | PASS |
| Entferntes Familienmitglied → Bilder bleiben | PASS |

### Bugs Found

| ID | Severity | Description | Steps to Reproduce |
|----|----------|-------------|-------------------|
| BUG-P11-1 | **HIGH** | Bild-Lösch-Button auf Touch-Geräten nicht erreichbar. Der Button hat `opacity-0 group-hover:opacity-100` — auf Mobilgeräten gibt es kein Hover, daher ist der Lösch-Button unsichtbar und nicht tippbar. AC-8 schlägt auf Mobile fehl. | 1. Öffne Chat auf Mobilgerät 2. Sende ein Bild 3. Versuche das Bild zu löschen → Button nicht sichtbar |
| BUG-P11-2 | **MEDIUM** | Bild-only-Nachricht wird nach Löschung des Bilds unsichtbar. Wenn eine Nachricht nur ein Bild (kein Text) enthält und das Bild gelöscht wird, bleibt eine leere Nachricht ohne sichtbaren Inhalt. | 1. Sende eine Bild-only-Nachricht 2. Lösche das Bild 3. Leere Nachricht-Bubble bleibt übrig |
| BUG-P11-3 | **MEDIUM** | Kein Bild in optimistischer Nachricht. Beim Senden eines Bilds zeigt die optimistische Nachricht `imageUrl: null`, sodass ein leerer Bubble erscheint, bis die Signed URL geholt wird. Sollte die lokale Blob-URL verwenden. | 1. Sende ein Bild 2. Beobachte den Moment des Sendens → leerer Bubble für ~1-2 Sekunden |
| BUG-P11-4 | **LOW** | Object URL Memory Leak. Wenn der Nutzer eine Datei auswählt und dann den Kanal wechselt (Component unmount), wird `URL.revokeObjectURL` nie aufgerufen. | 1. Wähle ein Bild im Input aus 2. Wechsle den Kanal ohne zu senden |
| BUG-P11-5 | **LOW** | Kein Rate-Limit auf `getSignedImageUrlAction`. RLS schützt vor unbefugtem Zugriff, aber unbegrenztes Spammen ist möglich. | Keine unmittelbare Auswirkung, aber theoretisch angreifbar |

### Security Audit

| Check | Result |
|-------|--------|
| Authentication required for all actions | PASS |
| RLS on storage bucket (family isolation) | PASS |
| Rate limiting on upload (15/min) | PASS |
| Rate limiting on delete (15/min) | PASS |
| Rate limiting on signed URL generation | FAIL (missing) |
| Server-side file type validation | PASS |
| Server-side file size validation | PASS |
| Input validation with Zod on all endpoints | PASS |
| Authorization check for delete (own or admin) | PASS |
| Signed URLs expire after 1 hour | PASS |
| No secrets exposed in API responses | PASS |

### Unit Tests

- 24 new tests for PROJ-11 validation schemas (sendMessage with image, chatImageFile, deleteChatImage, getSignedImageUrl)
- All 186 tests pass (`npm test`)

### Production-Ready Decision

**NOT READY** — BUG-P11-1 (HIGH) must be fixed. The delete button is inaccessible on touch/mobile devices, which is a core functionality gap for a responsive web app.

## Deployment

**Deployed:** 2026-04-09
**Production URL:** https://familie-dula-a9jyp2znd-nidu89s-projects.vercel.app
**Commit:** de29e70
**Git Tag:** v1.11.0-PROJ-11

**What was deployed:**
- Private `chat-images` Supabase Storage bucket with family-scoped RLS
- Image upload button in chat input (JPEG/PNG/GIF/WebP, max 10 MB)
- Thumbnail display with lightbox viewer
- Signed URLs (1h) for private bucket access
- Delete button for own images (mobile-friendly: always visible)
- Optimistic preview using local blob URL
- Placeholder for deleted image-only messages
