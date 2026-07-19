# 052 — Character and Word Count

> Status: SHIPPED · Area: Scoring · Last verified: 2026-07-19

## What

- Live character and word counts of the draft. A character count is always visible at the bottom of the core editor, shown against the 3000-character limit with an over-limit readout. Both character and word counts are shown together in the dashboard analyze panel's Stats section, recomputed as the text changes.
- Characters are counted in grapheme clusters over the exact string the copy path produces. A skin-tone emoji, a flag, a ZWJ sequence and each astral-plane Unicode-styled letter all count as 1, and list markers and Shift+Enter hard breaks count because they are part of what lands on LinkedIn.

## Why

- Character count matters for LinkedIn's 3000-character limit and the "...more" fold; word count gauges overall length. Keeping them visible removes guesswork while writing.
- The count is only useful if it matches LinkedIn's. Counting `editor.getText()` by UTF-16 length disagreed on both ends: it added 2 characters per block, counted hard breaks as zero, and charged multi-code-unit graphemes several characters each.

## Acceptance (binary, testable)

- [x] 052-AC-1 A live character count is always visible in the core editor _(verified: `components/tool/editor-panel.tsx:450-451,486-493`)_
- [x] 052-AC-2 A word count is always visible in the core editor _(verified: `components/tool/editor-panel.tsx:452,494-496` - live `countWords(editor.getText())` rendered next to the char count in the footer)_
- [x] 052-AC-3 Both character and word counts are computed in `computeContentStats` _(verified: `lib/content-scoring.ts:39-44` - chars via `countPostCharacters`, words via shared `countWords`)_
- [x] 052-AC-4 Both character and word counts are rendered together in the dashboard Stats section _(verified: `components/dashboard/analyze/stats-section.tsx:60-71`)_
- [x] 052-AC-5 Word count splits on whitespace and ignores empty tokens _(verified: `lib/content-scoring.ts:24-26` - shared `countWords` helper)_
- [x] 052-AC-6 Characters are counted as grapheme clusters, not UTF-16 code units _(verified: `lib/linkedin/char-count.ts:41-65` segments with `Intl.Segmenter`, falling back to code points then `.length`)_
- [x] 052-AC-7 The editor counts the same string it copies _(verified: `components/tool/editor-panel.tsx:450-451` counts `getEditorContent().text`, the value the copy path writes at `:283-294`)_
- [x] 052-AC-8 The dashboard Stats section counts the same string _(verified: `components/dashboard/analyze/stats-section.tsx:8-12` serializes the document with `tiptapToLinkedInText` before `computeContentStats`)_
- [x] 052-AC-9 The 3000-character limit is a single shared constant and is surfaced on both counters _(verified: `lib/linkedin/char-count.ts:16` `LINKEDIN_CHAR_LIMIT`, consumed at `components/tool/editor-panel.tsx:454-455,492,497-499`, `components/dashboard/analyze/stats-section.tsx:63-66` and `lib/content-scoring.ts:98`)_

## Implementation

- Grapheme-aware counter and shared limit: `lib/linkedin/char-count.ts` (`countPostCharacters`, `LINKEDIN_CHAR_LIMIT`).
- Core editor char + word count and over-limit readout: `components/tool/editor-panel.tsx:450-455,486-500`.
- Shared word-count helper: `lib/content-scoring.ts:24-26` (`countWords`), reused by `computeContentStats` (`:44`) and the editor footer.
- Char/word computation: `lib/content-scoring.ts:39-44`.
- Dashboard render of both, over the serialized copy text: `components/dashboard/analyze/stats-section.tsx:8-12,60-71`; wired from `components/dashboard/analyze/analyze-panel.tsx:351`.

## Dependencies

- 050-056 (shared `computeContentStats`).
- 025 Copy to clipboard (the serialized string both counters measure).

## Open questions / known gaps

- Words are counted on the raw editor text rather than the serialized copy text, deliberately: counting the serialized string would make injected list markers such as "•" and "1." into words.
- `Intl.Segmenter` is the counting path; browsers without it fall back to a code point count, which over-counts multi-code-point graphemes such as ZWJ emoji sequences.
