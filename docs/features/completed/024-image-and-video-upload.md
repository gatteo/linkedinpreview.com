# 024 — Image and Video Upload

> Status: SHIPPED · Area: Editor · Last verified: 2026-06-14

## What

- A media button in the editor lets the author attach a single image or video to the preview. The file is read in the browser and shown in the preview card (image or playable video). Images are capped at 5MB and videos at 25MB; oversized or non-media files are rejected with a toast. The same button removes the attached media.

## Why

- LinkedIn posts with media perform differently and frame the text differently. Previewing the post with the actual image or video shows the real composition before publishing.

## Acceptance (binary, testable)

- [x] 024-AC-1 The file input accepts images and a set of video types _(verified: `components/tool/editor-panel.tsx:298`)_
- [x] 024-AC-2 Images are limited to 5MB and videos to 25MB, with rejection toasts on overflow _(verified: `components/tool/editor-panel.tsx:198-202`)_
- [x] 024-AC-3 Non image/video files are rejected _(verified: `components/tool/editor-panel.tsx:193-196`)_
- [x] 024-AC-4 The file is read client-side as a base64 data URL and stored in component state _(verified: `components/tool/editor-panel.tsx:204-223`, `components/tool/tool.tsx:66,107-109`)_
- [x] 024-AC-5 The preview card renders the attached image or a `<video controls>` element _(verified: `components/tool/preview/post-card.tsx:28-49`)_
- [x] 024-AC-6 The media can be removed, clearing it from the preview _(verified: `components/tool/editor-panel.tsx:233-239`)_

## Implementation

- File picking, validation, and FileReader to data URL: `components/tool/editor-panel.tsx:181-231`.
- Media type (`{ type: 'image' | 'video'; src: string }`): `components/tool/tool.tsx:23`.
- Media render in the card: `components/tool/preview/post-card.tsx:28-49`.

## Dependencies

- 021 Realtime preview (media slot in the card).
- 026 Draft sharing — note media is held only in transient state and is not part of the shared/persisted draft.

## Open questions / known gaps

- Media is stored as base64 in memory only; it is not persisted to localStorage nor encoded into the shareable draft URL, so attachments do not travel with a shared link.
- The description mentions storing as "base64 or URL"; the code path only produces base64 data URLs from local files (no remote URL ingestion).
