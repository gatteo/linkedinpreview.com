# 023 — Realistic Feed Preview

> Status: SHIPPED · Area: Editor · Last verified: 2026-06-14

## What

- A simulated LinkedIn feed that places the author's post among blurred placeholder posts, a "Start a post" bar, and left/right sidebars (desktop) so the post is judged in context. It is reachable two ways: an in-editor link ("See in a realistic LinkedIn feed") that opens the standalone `/preview` page, and the `/preview` route itself which accepts `?draft=<encoded>` for sharing a specific draft.

## Why

- A post looks different surrounded by other content than alone in a card. Seeing it inline in a feed-like layout gives a more honest read of scannability and the truncation point.

## Acceptance (binary, testable)

- [x] 023-AC-1 The feed renders the author post surrounded by blurred placeholder posts and a "Start a post" bar _(verified: `components/feed-preview/feed-layout.tsx:42-79`, `components/feed-preview/placeholder-post.tsx:13-91`)_
- [x] 023-AC-2 The in-editor preview exposes a link that opens the standalone feed preview _(verified: `components/tool/preview/preview-panel.tsx:75-86`, `components/tool/tool.tsx:120-125`)_
- [x] 023-AC-3 A standalone `/preview` route exists and reads `?draft=` from search params _(verified: `app/preview/page.tsx:20-27`)_
- [x] 023-AC-4 The `?draft=` value is decoded back into post content for rendering _(verified: `components/feed-preview/preview-page-client.tsx:47-58`)_
- [x] 023-AC-5 Desktop feed shows left and right sidebars; mobile collapses to a single centered column _(verified: `components/feed-preview/feed-layout.tsx:42-79`)_

## Implementation

- Feed layout (sidebars, start-a-post bar, placeholder ordering): `components/feed-preview/feed-layout.tsx:42-80`.
- Placeholder post variants: `components/feed-preview/placeholder-post.tsx:13-91`.
- Standalone page entry: `app/preview/page.tsx:24-27`; client and decode: `components/feed-preview/preview-page-client.tsx:27-58`.
- In-editor "open feed" handler that encodes the draft into the URL: `components/tool/tool.tsx:120-125`.

## Dependencies

- 026 Draft sharing (the `?draft=` encoding/decoding pipeline).
- 022 Preview size toggle (the feed page desktop/mobile mode).

## Open questions / known gaps

- None observed.
