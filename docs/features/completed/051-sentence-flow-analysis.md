# 051 — Sentence Flow Analysis

> Status: SHIPPED · Area: Scoring · Last verified: 2026-06-14

## What

- The post is split into sentences and each sentence is bucketed by word count into five categories: tiny, short, medium, long, very long. The distribution is shown as percentages, rendered as a "Sentence mix" stacked bar with a color legend in the Stats section.

## Why

- Varied sentence length keeps a post readable and rhythmic. Showing the mix helps authors spot monotony (all long sentences) or choppiness at a glance.

## Acceptance (binary, testable)

- [x] 051-AC-1 Sentences are bucketed into five categories: tiny (<=5), short (<=10), medium (<=20), long (<=30), very long (>30 words) _(verified: `lib/content-scoring.ts:69-73`)_
- [x] 051-AC-2 Each category is expressed as a percentage of total sentences, rounded to one decimal _(verified: `lib/content-scoring.ts:75-80`)_
- [x] 051-AC-3 The distribution is rendered as a stacked bar sized by each category's percentage _(verified: `components/dashboard/analyze/stats-section.tsx:31-42`)_
- [x] 051-AC-4 A legend lists each non-zero category with its percentage and color _(verified: `components/dashboard/analyze/stats-section.tsx:43-52`)_
- [x] 051-AC-5 The five categories carry distinct labels and colors _(verified: `components/dashboard/analyze/stats-section.tsx:9-15`)_

## Implementation

- Sentence splitting and bucketing: `lib/content-scoring.ts:40,64-81`.
- Bar and legend render: `components/dashboard/analyze/stats-section.tsx:29-53`.

## Dependencies

- 050 (shares sentence counting in `computeContentStats`).

## Open questions / known gaps

- Sentence splitting uses a simple `[.!?]` regex; abbreviations and ellipses may be mis-split.
