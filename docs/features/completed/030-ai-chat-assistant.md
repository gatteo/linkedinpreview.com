# 030 — AI Chat Assistant

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- A streaming, multi-turn chat assistant for writing and iteratively refining a LinkedIn post. The user picks a topic and tone in a config phase, the assistant streams a first draft, and then the user keeps chatting to refine it. Each assistant turn outputs the complete updated post. The assistant is hard-scoped to LinkedIn content and refuses anything off-topic. Surfaced as a side sheet (desktop) or drawer (mobile) in the editor.

## Why

- Conversational refinement is faster and more natural than re-running a one-shot generator. Users can nudge tone, length, and angle in plain language and always get a full, paste-ready post back.

## Acceptance (binary, testable)

- [x] 030-AC-1 The chat route streams responses via the Vercel AI SDK (`streamText` + `toUIMessageStreamResponse`) _(verified: `app/api/chat/route.ts:63,69`)_
- [x] 030-AC-2 The assistant is scoped to LinkedIn posts and refuses off-topic/jailbreak requests with a `[REFUSED]` prefix _(verified: `config/prompts.ts:25,37-38`)_
- [x] 030-AC-3 Every assistant turn outputs the complete updated post, no diffs or preamble _(verified: `config/prompts.ts:74-77`)_
- [x] 030-AC-4 First message counts as `generation` (limit 1/day); subsequent messages count as `refinement` (limit 3/day) _(verified: `app/api/chat/route.ts:42-43`, `config/ai.ts:2-3`)_
- [x] 030-AC-5 Rate limits are enforced server-side via the `check_and_record_usage` Supabase RPC and return HTTP 429 with `RATE_LIMITED` when exceeded _(verified: `app/api/chat/route.ts:43-56`, `lib/rate-limit.ts:18-29`, `supabase/migrations/002_fix_rate_limit_race.sql:19-25`)_
- [x] 030-AC-6 Unauthenticated requests are rejected with 401 `AUTH_REQUIRED` _(verified: `app/api/chat/route.ts:37-39`)_
- [x] 030-AC-7 Request body is validated: 1-30 messages, each text part max 10,000 chars _(verified: `app/api/chat/route.schema.ts:14,4-9`)_

## Implementation

- Route: `app/api/chat/route.ts` (POST, `maxDuration = 30`, streaming).
- Body schema: `app/api/chat/route.schema.ts`.
- System prompt: `CHAT_SYSTEM_PROMPT` in `config/prompts.ts:25-77`.
- Rate limit helper: `lib/rate-limit.ts`; limits in `config/ai.ts:1-8`; RPC in `supabase/migrations/002_fix_rate_limit_race.sql`.
- Client surface: `components/ai-chat/ai-generate-sheet.tsx` (uses `useChat` + `DefaultChatTransport` to `ApiRoutes.Chat`).

## Dependencies

- 031 (post generation config phase shares the same sheet), 034 (suggestions are fetched after each non-refusal turn).
- See [`../ARCHITECTURE.md`](../../ARCHITECTURE.md) AI section.

## Open questions / known gaps

- Rate limits are bypassed entirely when `NODE_ENV === 'development'` and fail open if the DB is unreachable (`lib/rate-limit.ts:14-16,24-26`). Intended, but means limits are not enforced locally.
- The "generation" limit of 1/day is shared with the editor chat; a single first message exhausts the daily generation quota.
