# 032 — Quick AI Actions

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- One-click transforms applied to the current post: shorten, lengthen, variation, restyle (to a chosen tone), and apply-suggestion. Each posts to `/api/generate` with the post text and returns a single rewritten post (`{ result: string }`). Surfaced as a toolbar in the editor and (for apply-suggestion) in the analyze panel.

## Why

- Common edits should be one tap, not a back-and-forth chat. Quick actions cover the high-frequency rewrites without spending the scarcer chat generation quota.

## Acceptance (binary, testable)

- [x] 032-AC-1 The route accepts `variation`, `shorten`, `lengthen`, `restyle`, and `apply-suggestion` actions _(verified: `app/api/generate/route.schema.ts:4`)_
- [x] 032-AC-2 Each quick action returns a single rewritten post as `{ result: string }` _(verified: `app/api/generate/route.schema.ts:40,42-49`)_
- [x] 032-AC-3 `restyle` rewrites in the requested tone, defaulting to professional when none is given _(verified: `config/prompts.ts:206-209`)_
- [x] 032-AC-4 Quick actions count against the `quickAction` rate limit (10/day), distinct from the wizard tier _(verified: `app/api/generate/route.ts:40`, `config/ai.ts:6`)_
- [x] 032-AC-5 Rate limit is enforced server-side and returns 429 `RATE_LIMITED` _(verified: `app/api/generate/route.ts:41-54`)_
- [x] 032-AC-6 Each transform prompt instructs the model to output only the post text (no preamble) _(verified: `config/prompts.ts:191,197,203,209,215`)_
- [x] 032-AC-7 Editor toolbar wires shorten/lengthen/variation/restyle to `/api/generate` _(verified: `components/dashboard/ai-actions.tsx:36-53,136-149`)_

## Implementation

- Route: `app/api/generate/route.ts` (shared with 031; `quickAction` branch).
- Prompts: `GENERATE_PROMPTS.variation/shorten/lengthen/restyle/apply-suggestion` in `config/prompts.ts:188-221`.
- Editor toolbar: `components/dashboard/ai-actions.tsx`.
- Apply-suggestion from analyze panel: `components/dashboard/analyze/analyze-panel.tsx:113-130`.

## Dependencies

- 031/037 (shared route + branding), 034 (suggestions feed apply-suggestion).

## Open questions / known gaps

- All five quick actions plus `/api/extract` share the single `quickAction` 10/day bucket, so extractions reduce the quick-action budget and vice versa.
- `apply-suggestion` from the analyze panel does not pass `brandingContext` (`components/dashboard/analyze/analyze-panel.tsx:118-123`), so those rewrites are not branding-aware even though the route supports it.
