# 052 — Character and Word Count

> Status: SHIPPED · Area: Scoring · Last verified: 2026-06-14

## What

- Live character and word counts of the draft. A character count is always visible at the bottom of the core editor. Both character and word counts are shown together in the dashboard analyze panel's Stats section, recomputed as the text changes.

## Why

- Character count matters for LinkedIn's 3000-character limit and the "...more" fold; word count gauges overall length. Keeping them visible removes guesswork while writing.

## Acceptance (binary, testable)

- [x] 052-AC-1 A live character count is always visible in the core editor _(verified: `components/tool/editor-panel.tsx:255,288-289`)_
- [x] 052-AC-2 A word count is always visible in the core editor _(verified: `components/tool/editor-panel.tsx:256,291-293` - live `countWords(text)` rendered next to the char count in the footer)_
- [x] 052-AC-3 Both character and word counts are computed in `computeContentStats` _(verified: `lib/content-scoring.ts:37,41` - char/word, word via shared `countWords`)_
- [x] 052-AC-4 Both character and word counts are rendered together in the dashboard Stats section _(verified: `components/dashboard/analyze/stats-section.tsx:56-63`)_
- [x] 052-AC-5 Word count splits on whitespace and ignores empty tokens _(verified: `lib/content-scoring.ts:21-23` - shared `countWords` helper)_

## Implementation

- Core editor char + word count: `components/tool/editor-panel.tsx:255-256,286-294`.
- Shared word-count helper: `lib/content-scoring.ts:21-23` (`countWords`), reused by `computeContentStats` (`:41`) and the editor footer.
- Char/word computation: `lib/content-scoring.ts:36-41`.
- Dashboard render of both: `components/dashboard/analyze/stats-section.tsx:55-63`.

## Dependencies

- 050-056 (shared `computeContentStats`).

## Open questions / known gaps

- None. The core editor footer now shows a live char + word count (`components/tool/editor-panel.tsx:286-294`), and both the footer and the dashboard Stats section count words through the single shared `countWords` helper (`lib/content-scoring.ts:21-23`), so the two surfaces always agree. Status SHIPPED.
