# 050 — Readability Score

> Status: SHIPPED · Area: Scoring · Last verified: 2026-06-14

## What

- The post text is scored with the Flesch-Kincaid grade-level formula and shown as a number plus a plain-language label: Easy, Standard, or Complex. The score is computed entirely client-side from the draft text and displayed in the dashboard analyze panel's Stats section.

## Why

- Grade level is a quick proxy for how approachable a post is. Surfacing it nudges authors toward simpler, more scannable writing that performs better on LinkedIn.

## Acceptance (binary, testable)

- [x] 050-AC-1 The Flesch-Kincaid grade level is computed with the standard coefficients (0.39, 11.8, -15.59) _(verified: `lib/content-scoring.ts:49`)_
- [x] 050-AC-2 The grade is clamped to 0–20 and rounded to one decimal _(verified: `lib/content-scoring.ts:50`)_
- [x] 050-AC-3 A label is derived: Easy (<6), Standard (6–10), Complex (>10) _(verified: `lib/content-scoring.ts:54-61`)_
- [x] 050-AC-4 The grade and label are rendered together in the Stats section _(verified: `components/dashboard/analyze/stats-section.tsx:22-27`)_
- [x] 050-AC-5 Computation is synchronous and client-side (no network/async) _(verified: `lib/content-scoring.ts:32-120`, memoized at `components/dashboard/analyze/stats-section.tsx:7`)_

## Implementation

- Syllable counting and FK grade math: `lib/content-scoring.ts:21-61`.
- Render: `components/dashboard/analyze/stats-section.tsx:22-27`.

## Dependencies

- All 050-056 share `computeContentStats` in `lib/content-scoring.ts` and the `StatsSection` renderer.

## Open questions / known gaps

- The "<100ms" claim is not benchmarked or enforced anywhere in code; it is a reasonable expectation for this pure-JS path but unverified.
- The stats (including readability) render only in the dashboard AnalyzePanel, not in the core homepage/standalone editor.
