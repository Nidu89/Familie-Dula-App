# PROJ-11: Bild-Upload im Chat

## Status: In Progress
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
_To be added by /qa_

## Deployment
_To be added by /deploy_
