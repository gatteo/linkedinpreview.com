# 031 — AI Post Generation

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- The creation wizard turns raw source material into finished LinkedIn posts in two AI steps: first it generates 4 hook options (`action: 'hooks'`), then after the user picks a hook it generates 2 full post variants (`action: 'posts'`). Both steps run through `/api/generate` with structured (object) output. The chat-based generator (030) covers the topic + tone path; this feature covers the structured wizard pipeline.

## Why

- Splitting generation into hook selection then full drafts gives the user editorial control over the angle before committing to full posts, which produces more on-target output than a single one-shot.

## Acceptance (binary, testable)

- [x] 031-AC-1 `action: 'hooks'` returns exactly 4 hooks, each with `text`, `category`, and `type` _(verified: `app/api/generate/route.schema.ts:14-25`, `config/prompts.ts:168-174`)_
- [x] 031-AC-2 `action: 'posts'` returns exactly 2 full post variants, each with `text`, `wordCount`, and `label` _(verified: `app/api/generate/route.schema.ts:27-38`, `config/prompts.ts:177-185`)_
- [x] 031-AC-3 Both `hooks` and `posts` actions count against the `wizard` rate limit (5/day) _(verified: `app/api/generate/route.ts:40`, `config/ai.ts:5`)_
- [x] 031-AC-4 Rate limit is enforced server-side and returns 429 `RATE_LIMITED` with `resetAt`/`remaining` _(verified: `app/api/generate/route.ts:41-54`, `supabase/migrations/002_fix_rate_limit_race.sql:19-25`)_
- [x] 031-AC-5 Unauthenticated requests are rejected with 401 `AUTH_REQUIRED` _(verified: `app/api/generate/route.ts:33-35`)_
- [x] 031-AC-6 Tone is selectable in the chat config phase before generating _(verified: `components/ai-chat/ai-generate-sheet.tsx:133`, `config/ai.ts:19-26`)_
- [x] 031-AC-7 A selected variant is converted to TipTap JSON and opened in the editor; its `label` is saved on the draft _(verified: `components/dashboard/creation-wizard/creation-wizard.tsx:167-180`)_

## Implementation

- Route: `app/api/generate/route.ts` (POST, structured output via `generateObject`).
- Schemas + action map: `app/api/generate/route.schema.ts`.
- Prompts: `GENERATE_PROMPTS.hooks` / `.posts` in `config/prompts.ts:167-186`.
- Wizard orchestration: `components/dashboard/creation-wizard/creation-wizard.tsx` (`fetchHooks`, `handleHookSelect`, `handleVariantSelect`).
- Chat config/tone entry point: `components/ai-chat/ai-generate-sheet.tsx`.

## Dependencies

- 035 (hook generation), 037 (branding context), 036 (source extraction), 030 (chat generator shares the sheet).

## Open questions / known gaps

- The "5 wizard actions/day" claim is technically "5 wizard-tier calls/day", and one full wizard run consumes 2 of them (1 hooks + 1 posts), plus extra for each regenerate. So a user gets roughly 2 complete runs per day, not 5.
- `posts` prompt asks the model to count words, but `wordCount` is model-reported and not validated server-side.
