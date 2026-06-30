# 056 — Line Count

> Status: SHIPPED · Area: Scoring · Last verified: 2026-06-14

## What

- Counts the non-empty lines in the post and shows the total in the dashboard Stats section.

## Why

- Line count is a proxy for visual length and white-space rhythm on LinkedIn, where short lines and breaks improve scannability.

## Acceptance (binary, testable)

- [x] 056-AC-1 Lines are counted by splitting on newline and keeping only non-empty (trimmed) lines _(verified: `lib/content-scoring.ts:98`)_
- [x] 056-AC-2 The line count is exposed in the stats object _(verified: `lib/content-scoring.ts:117`)_
- [x] 056-AC-3 The line count is rendered in the Stats section _(verified: `components/dashboard/analyze/stats-section.tsx:64-67`)_

## Implementation

- Line counting: `lib/content-scoring.ts:98`.
- Render: `components/dashboard/analyze/stats-section.tsx:64-67`.

## Dependencies

- 050-056 (shared `computeContentStats`).

## Open questions / known gaps

- The description says "total line count" but the implementation counts non-empty lines only, so blank spacer lines are excluded.
