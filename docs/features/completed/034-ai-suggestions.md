# 034 — AI Suggestions

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- Generates 3 short, context-specific refinement prompts for the current post (for example "Add a concrete example from your work"). Each suggestion has a `type` (content, structure, tone, or engagement) and is short and verb-led. Suggestions appear after each chat turn and in the analyze panel, where clicking one applies it via the apply-suggestion quick action.

## Why

- Users often know a post needs work but not what to ask for. Concrete, clickable suggestions remove the blank-prompt problem and turn refinement into one tap.

## Acceptance (binary, testable)

- [x] 034-AC-1 Returns exactly 3 suggestions _(verified: `app/api/suggestions/route.schema.ts:13`)_
- [x] 034-AC-2 Each suggestion has a `type` of content/structure/tone/engagement _(verified: `app/api/suggestions/route.schema.ts:9`)_
- [x] 034-AC-3 The system prompt requires each suggestion to be 4-8 words and start with a verb _(verified: `config/prompts.ts:84`)_
- [x] 034-AC-4 The system prompt requires suggestions to reference the actual post content _(verified: `config/prompts.ts:85`)_
- [x] 034-AC-5 Counts against the `quickAction` rate limit (10/day), enforced with 429 `RATE_LIMITED` _(verified: `app/api/suggestions/route.ts:42-55`, `config/ai.ts:6`)_
- [x] 034-AC-6 Unauthenticated requests are rejected with 401 `AUTH_REQUIRED` _(verified: `app/api/suggestions/route.ts:38-40`)_
- [x] 034-AC-7 Suggestion fetch failures degrade gracefully to an empty list (no thrown error in the client) _(verified: `lib/ai-suggestions.ts:11-25`)_

## Implementation

- Route: `app/api/suggestions/route.ts` (POST, `generateObject`).
- Schema: `app/api/suggestions/route.schema.ts`.
- Prompt: `SUGGESTIONS_SYSTEM_PROMPT` + `suggestionsUserPrompt` in `config/prompts.ts:83-94`.
- Client helper: `lib/ai-suggestions.ts`.
- Surfaces: `components/ai-chat/ai-generate-sheet.tsx:62-73`, `components/dashboard/analyze/analyze-panel.tsx`.

## Dependencies

- 030 (chat), 032 (apply-suggestion quick action), 033 (analyze panel).

## Open questions / known gaps

- The "4-8 words, start with a verb" rule is prompt-only; it is not validated by the Zod schema, so malformed suggestions could slip through.
- Shares the `quickAction` 10/day bucket with quick actions and extraction.
