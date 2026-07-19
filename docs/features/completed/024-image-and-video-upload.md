# 024 — Image and Video Upload

> Status: SHIPPED · Area: Editor · Last verified: 2026-07-19

## What

- A media button in the editor lets the author attach a single image or video to the preview. The file is read in the browser and shown in the preview card (image or playable video). Images are capped at 5MB and videos at 25MB; oversized or non-media files are rejected with a toast. The same button removes the attached media. The attachment also travels to the standalone `/preview` feed tab through an IndexedDB handoff, so the realistic feed shows the post with its media.

## Why

- LinkedIn posts with media perform differently and frame the text differently. Previewing the post with the actual image or video shows the real composition before publishing.

## Acceptance (binary, testable)

- [x] 024-AC-1 The file input accepts images and a set of video types _(verified: `components/tool/editor-panel.tsx:509`)_
- [x] 024-AC-2 Images are limited to 5MB and videos to 25MB, with rejection toasts on overflow _(verified: `components/tool/editor-panel.tsx:352-356`)_
- [x] 024-AC-3 Non image/video files are rejected _(verified: `components/tool/editor-panel.tsx:347-350`)_
- [x] 024-AC-4 The file is read client-side as a base64 data URL and stored in component state _(verified: `components/tool/editor-panel.tsx:358-377`, `components/tool/tool.tsx:29,187-189`)_
- [x] 024-AC-5 The preview card renders the attached image or a `<video controls>` element _(verified: `components/tool/preview/post-card.tsx:42-65`)_
- [x] 024-AC-6 The media can be removed, clearing it from the preview _(verified: `components/tool/editor-panel.tsx:387-393`)_
- [x] 024-AC-7 The attached media reaches the standalone `/preview` feed tab _(verified: writers `components/tool/tool.tsx:200-215` and `components/dashboard/dashboard-editor.tsx:128-139` store the media and append `&m=<key>`; reader `components/feed-preview/preview-page-client.tsx:29-37,60-87,177`)_
- [x] 024-AC-8 A clear-all restores the media together with the text when undone _(verified: `components/tool/editor-panel.tsx:395-433` captures `previousMedia` and re-applies it from the toast action)_

## Implementation

- File picking, validation, and FileReader to data URL: `components/tool/editor-panel.tsx:339-385`.
- Media type (`{ type: 'image' | 'video'; src: string }`): `components/tool/tool.tsx:29`.
- Media render in the card: `components/tool/preview/post-card.tsx:42-65`.
- Handoff to the feed preview tab (IndexedDB store, TTL and max-record reclamation): `lib/draft-media.ts`.

## Dependencies

- 021 Realtime preview (media slot in the card).
- 023 Realistic feed preview (consumes the handoff).
- 026 Draft sharing - note media is not part of the shared/persisted draft; only the `/preview` handoff carries it.

## Open questions / known gaps

- Media is still base64 in memory: it is not persisted to localStorage nor encoded into the shareable draft URL. The `/preview` handoff is a same-browser IndexedDB record keyed off the URL, so a `?draft=` link opened on another device or browser has no attachment.
- The handoff record expires after the TTL and the store is capped at the most recent entries (`lib/draft-media.ts:21,23`), so a preview tab opened much later falls back to a text-only post.
- The description mentions storing as "base64 or URL"; the code path only produces base64 data URLs from local files (no remote URL ingestion).
