# 023 — Realistic Feed Preview

> Status: SHIPPED · Area: Editor · Last verified: 2026-07-19

## What

- A simulated LinkedIn feed that places the author's post among blurred placeholder posts, a "Start a post" bar, and left/right sidebars (desktop) so the post is judged in context. It is reachable two ways: an in-editor link ("See in a realistic LinkedIn feed") that opens the standalone `/preview` page, and the `/preview` route itself which accepts `?draft=<encoded>` for sharing a specific draft. An attached image or video travels with the post through an IndexedDB handoff keyed by a `&m=` param, so the feed shows the real composition rather than text alone.

## Why

- A post looks different surrounded by other content than alone in a card. Seeing it inline in a feed-like layout gives a more honest read of scannability and the truncation point.

## Acceptance (binary, testable)

- [x] 023-AC-1 The feed renders the author post surrounded by blurred placeholder posts and a "Start a post" bar _(verified: `components/feed-preview/feed-layout.tsx:42-80`, `components/feed-preview/placeholder-post.tsx:13-91`)_
- [x] 023-AC-2 The in-editor preview exposes a link that opens the standalone feed preview _(verified: `components/tool/preview/preview-panel.tsx:47-54`, `components/tool/tool.tsx:200-215`)_
- [x] 023-AC-3 A standalone `/preview` route exists and reads `?draft=` from search params _(verified: `app/preview/page.tsx:48-53`)_
- [x] 023-AC-4 The `?draft=` value is decoded back into post content for rendering _(verified: `components/feed-preview/preview-page-client.tsx:60-87`)_
- [x] 023-AC-5 Desktop feed shows left and right sidebars; mobile collapses to a single centered column _(verified: `components/feed-preview/feed-layout.tsx:42-80`)_
- [x] 023-AC-6 An image or video attached in the editor renders on the post inside the feed _(verified: writer `components/tool/tool.tsx:200-215` and `components/dashboard/dashboard-editor.tsx:128-139` append `&m=<key>`; reader `components/feed-preview/preview-page-client.tsx:29-37,60-87` resolves the key and passes the media to `FeedPostCard` at `:177`)_
- [x] 023-AC-7 The media read is non-destructive, so reloading the preview tab inside the TTL still shows the media _(verified: `lib/draft-media.ts:138-155` reads without deleting; reclamation is a separate `pruneDraftMedia` pass at `:175-197`)_

## Implementation

- Feed layout (sidebars, start-a-post bar, placeholder ordering): `components/feed-preview/feed-layout.tsx:42-80`.
- Placeholder post variants: `components/feed-preview/placeholder-post.tsx:13-91`.
- Standalone page entry: `app/preview/page.tsx:48-53`; client, decode and media resolve: `components/feed-preview/preview-page-client.tsx:29-37,60-87`.
- In-editor "open feed" handler that encodes the draft into the URL and stores the media: `components/tool/tool.tsx:200-215`.
- Media handoff store (IndexedDB, TTL and max-record reclamation): `lib/draft-media.ts`.

## Dependencies

- 026 Draft sharing (the `?draft=` encoding/decoding pipeline).
- 022 Preview size toggle (the feed page desktop/mobile mode).
- 024 Image and video upload (the media the handoff carries).

## Open questions / known gaps

- The media handoff is per-browser: the record lives in the visitor's IndexedDB, not in the URL, so a `?draft=` link opened on another device or browser renders the post without its image or video.
- Records expire after the TTL and the store is capped at the most recent entries (`lib/draft-media.ts:21,23`), so a preview tab opened long after the editor, or after several other previews, falls back to a text-only post.
