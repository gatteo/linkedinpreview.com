# 052 — Character and Word Count

> Status: PARTIAL · Area: Scoring · Last verified: 2026-06-14

## What

- Live character and word counts of the draft. A character count is always visible at the bottom of the core editor. Both character and word counts are shown together in the dashboard analyze panel's Stats section, recomputed as the text changes.

## Why

- Character count matters for LinkedIn's 3000-character limit and the "...more" fold; word count gauges overall length. Keeping them visible removes guesswork while writing.

## Acceptance (binary, testable)

- [x] 052-AC-1 A live character count is always visible in the core editor _(verified: `components/tool/editor-panel.tsx:253-254,284-289`)_
- [ ] 052-AC-2 A word count is always visible in the core editor _(gap: the core editor footer only renders character count; no word count is shown there — see `components/tool/editor-panel.tsx:284-289`)_
- [x] 052-AC-3 Both character and word counts are computed in `computeContentStats` _(verified: `lib/content-scoring.ts:33-37`)_
- [x] 052-AC-4 Both character and word counts are rendered together in the dashboard Stats section _(verified: `components/dashboard/analyze/stats-section.tsx:56-63`)_
- [x] 052-AC-5 Word count splits on whitespace and ignores empty tokens _(verified: `lib/content-scoring.ts:36`)_

## Implementation

- Core editor char count: `components/tool/editor-panel.tsx:253-254,284-289`.
- Char/word computation: `lib/content-scoring.ts:33-37`.
- Dashboard render of both: `components/dashboard/analyze/stats-section.tsx:55-63`.

## Dependencies

- 050-056 (shared `computeContentStats`).

## Open questions / known gaps

- The description says char and word counts are "always-visible in editor", but the always-visible footer in the core tool editor shows only the character count. The combined char + word view exists only in the dashboard AnalyzePanel. Status held at PARTIAL.
