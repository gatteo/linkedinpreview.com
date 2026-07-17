# 054 — Emoji Count

> Status: SHIPPED · Area: Scoring · Last verified: 2026-06-14

## What

- Counts the total number of emoji in the post and shows it in the dashboard Stats section.

## Why

- Emoji affect tone and scannability. A count lets authors keep emoji deliberate rather than accidental.

## Acceptance (binary, testable)

- [x] 054-AC-1 Emoji are counted via a Unicode range regex covering the common emoji blocks _(verified: `lib/content-scoring.ts:101-105`)_
- [x] 054-AC-2 The total emoji count is exposed in the stats object _(verified: `lib/content-scoring.ts:118`)_
- [x] 054-AC-3 The emoji count is rendered in the Stats section _(verified: `components/dashboard/analyze/stats-section.tsx:68-71`)_

## Implementation

- Emoji regex and count: `lib/content-scoring.ts:101-105`.
- Render: `components/dashboard/analyze/stats-section.tsx:68-71`.

## Dependencies

- 050-056 (shared `computeContentStats`).

## Open questions / known gaps

- The character-class regex counts each emoji code point individually, so multi-code-point emoji (ZWJ sequences, flags, skin-tone modifiers) can register as more than one. This differs from the `\p{Emoji_Presentation}` approach in `lib/post-analytics.ts:22`.
