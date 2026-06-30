# 033 — AI Post Analysis

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- Scores the current post and breaks down the result: an overall 1-100 score plus 1-100 sub-scores for hook, readability, and CTA, a 1-10 engagement potential, and classification (topics, sentiment, category, tone, has_hook, has_cta, hook_quality), with 1-3 strengths and improvements. Results are stored in Supabase and rendered in the analyze panel with gauges and sub-score bars.

## Why

- Gives the user objective, actionable feedback on a draft before posting, and builds a history of analyses for the dashboard.

## Acceptance (binary, testable)

- [x] 033-AC-1 Returns an overall `score` and `hook_score`, `readability_score`, `cta_score` each constrained 1-100 _(verified: `app/api/analyze/route.schema.ts:16-19`)_
- [x] 033-AC-2 Returns `engagement_score` constrained 1-10 _(verified: `app/api/analyze/route.schema.ts:20`)_
- [x] 033-AC-3 Classifies sentiment (positive/neutral/negative), category (6 values), tone (3 values), and detects `has_hook`/`has_cta` plus `hook_quality` _(verified: `app/api/analyze/route.schema.ts:24-30`)_
- [x] 033-AC-4 The analysis result is inserted into the `post_analyses` Supabase table _(verified: `app/api/analyze/route.ts:73-96`, `supabase/migrations/003_post_analyses.sql:6+`)_
- [x] 033-AC-5 Counts against the `analysis` rate limit (20/day), enforced server-side with 429 `RATE_LIMITED` _(verified: `app/api/analyze/route.ts:39-51`, `config/ai.ts:4`)_
- [x] 033-AC-6 Unauthenticated requests are rejected with 401 `AUTH_REQUIRED` _(verified: `app/api/analyze/route.ts:34-36`)_
- [x] 033-AC-7 Sub-scores (hook, readability, CTA) and hook/CTA detection are rendered in the analyze panel _(verified: `components/dashboard/analyze/analyze-panel.tsx:190-227`)_

## Implementation

- Route: `app/api/analyze/route.ts` (POST, `generateObject`).
- Schema: `app/api/analyze/route.schema.ts` (`bodySchema`, `analysisSchema`).
- Prompt: `ANALYZE_SYSTEM_PROMPT` + `analyzeUserPrompt` in `config/prompts.ts:100-134`.
- Storage: `post_analyses` table, `supabase/migrations/003_post_analyses.sql`.
- UI: `components/dashboard/analyze/analyze-panel.tsx`, `circular-gauge.tsx`, `sub-score.tsx`, `stats-section.tsx`.

## Dependencies

- 034 (suggestions surfaced in the same panel), 032 (apply-suggestion).

## Open questions / known gaps

- The insert "fails silently": a DB error is logged but the analysis is still returned to the user (`app/api/analyze/route.ts:98-100`), so a stored history is best-effort, not guaranteed.
