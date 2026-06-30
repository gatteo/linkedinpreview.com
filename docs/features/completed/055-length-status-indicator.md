# 055 — Length Status Indicator

> Status: SHIPPED · Area: Scoring · Last verified: 2026-06-14

## What

- Classifies the post by character length into three states and shows a colored status: Too short (<100), Optimal (100-3000), or Too long (>3000). Optimal renders green; the other two render red.

## Why

- Very short posts under-deliver and posts over LinkedIn's 3000-character limit get cut. A clear status keeps the draft inside the useful band.

## Acceptance (binary, testable)

- [x] 055-AC-1 Length status is "too*short" when char count < 100 *(verified: `lib/content-scoring.ts:88-90`)\_
- [x] 055-AC-2 Length status is "optimal" when char count is 100-3000 inclusive _(verified: `lib/content-scoring.ts:88-95`)_
- [x] 055-AC-3 Length status is "too*long" when char count > 3000 *(verified: `lib/content-scoring.ts:91-92`)\_
- [x] 055-AC-4 The status is rendered with a label (Too short / Optimal / Too long) and color coding _(verified: `components/dashboard/analyze/stats-section.tsx:79-92`)_

## Implementation

- Threshold logic: `lib/content-scoring.ts:87-95`.
- Render and color: `components/dashboard/analyze/stats-section.tsx:79-92`.

## Dependencies

- 050-056 (shared `computeContentStats`).
- 052 (uses the same `charCount`).

## Open questions / known gaps

- None observed.
