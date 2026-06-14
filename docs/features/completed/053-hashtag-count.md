# 053 — Hashtag Count

> Status: SHIPPED · Area: Scoring · Last verified: 2026-06-14

## What

- Counts the hashtags in the post and displays the current count next to a recommendation of 3-5 in the dashboard Stats section.

## Why

- Too few hashtags miss reach; too many look spammy. Showing the count against the 3-5 guideline steers authors toward the sweet spot.

## Acceptance (binary, testable)

- [x] 053-AC-1 Hashtags are counted via regex matching `#word` tokens at start-of-string or after whitespace _(verified: `lib/content-scoring.ts:84-85`)_
- [x] 053-AC-2 The recommended range is exposed as "3-5 recommended" _(verified: `lib/content-scoring.ts:115`)_
- [x] 053-AC-3 The current count is rendered alongside the recommendation _(verified: `components/dashboard/analyze/stats-section.tsx:72-78`)_

## Implementation

- Hashtag regex and count: `lib/content-scoring.ts:84-85`.
- Recommended string: `lib/content-scoring.ts:115`.
- Render: `components/dashboard/analyze/stats-section.tsx:72-78`.

## Dependencies

- 050-056 (shared `computeContentStats`).

## Open questions / known gaps

- The scoring hashtag regex (`/(?:^|\s)#\w+/g`) differs from the preview's hashtag highlighter (`/(#[\wÀ-ɏ]+)/g` in `components/tool/preview/content-section.tsx:13`), so accented hashtags count differently than they highlight.
