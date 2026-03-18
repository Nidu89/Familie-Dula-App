# PROJ-11: Bild-Upload im Chat

## Status: Planned
**Created:** 2026-03-18
**Last Updated:** 2026-03-18

## Dependencies
- Requires: PROJ-1 (Authentifizierung & Onboarding)
- Requires: PROJ-2 (Familienverwaltung)
- Requires: PROJ-9 (Chat & Kommunikation) – Bild-Upload erweitert den bestehenden Chat.

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
