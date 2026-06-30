# 035 — AI Hook Generation

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- Generates 4 attention-grabbing opening hooks from source material, each tagged with a `category` (e.g. Question, Bold Claim, Story, Stat) and a `type` (e.g. curiosity, authority, empathy, controversy). The user picks one hook to drive full post generation, can write their own, or regenerate the set. Used in the creation wizard and the editor AI actions toolbar.

## Why

- The first line decides whether a LinkedIn post gets read. Offering varied, labeled hooks lets the user choose an angle deliberately before committing to a draft.

## Acceptance (binary, testable)

- [x] 035-AC-1 Returns exactly 4 hooks, each with `text`, `category`, and `type` _(verified: `app/api/generate/route.schema.ts:14-25`)_
- [x] 035-AC-2 The prompt instructs varied hook styles and per-hook category + type tags _(verified: `config/prompts.ts:170-172`)_
- [x] 035-AC-3 Hooks and their category/type badges are rendered for selection _(verified: `components/dashboard/creation-wizard/hook-picker.tsx:29-49`)_
- [x] 035-AC-4 The user can pick a hook to apply (drives `posts` generation) _(verified: `components/dashboard/creation-wizard/creation-wizard.tsx:144-165`)_
- [x] 035-AC-5 The user can regenerate the hook set _(verified: `components/dashboard/creation-wizard/hook-picker.tsx:77-84`, `creation-wizard.tsx:140-142`)_
- [x] 035-AC-6 The user can instead write their own hook _(verified: `components/dashboard/creation-wizard/hook-picker.tsx:52-73`)_
- [x] 035-AC-7 Hook generation counts against the `wizard` rate limit (5/day) _(verified: `app/api/generate/route.ts:40`, `config/ai.ts:5`)_

## Implementation

- Route: `app/api/generate/route.ts` with `action: 'hooks'`.
- Schema: `hooksSchema` in `app/api/generate/route.schema.ts:14-25`.
- Prompt: `GENERATE_PROMPTS.hooks` in `config/prompts.ts:168-174`.
- UI: `components/dashboard/creation-wizard/hook-picker.tsx`; also editor `components/dashboard/ai-actions.tsx` (`hooks` action).

## Dependencies

- 031 (full post generation consumes the chosen hook), 037 (branding context), 036 (source extraction).

## Open questions / known gaps

- Each regenerate spends another `wizard` quota unit, so repeated regeneration quickly exhausts the daily 5.
- In the editor `ai-actions.tsx`, the `hooks` action expects `{ result }`, but the route returns `{ hooks }` for that action; the wizard path is the verified working path.
