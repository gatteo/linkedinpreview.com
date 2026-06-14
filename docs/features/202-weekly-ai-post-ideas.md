# 202 — Weekly AI Post Ideas

> Status: PARTIAL · Area: Strategy · Last verified: 2026-06-14
>
> Copy this file to `NNN-slug.md` and fill it in. This folder holds **only built features**
> (SHIPPED or PARTIAL). Not-yet-built ideas live in [`../backlog/`](../backlog/). A feature
> describes a user-facing **surface**; system internals live in
> [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## What

- A "Post Ideas" section on the strategy dashboard. The user clicks Generate Ideas and the app
  calls `/api/ideas`, which uses the LLM to return 5-7 ideas, each with a topic, recommended format,
  one-line hook, and reasoning. Ideas are rendered as cards (format badge, topic, quoted hook, and a
  Create Post button) and stored with the strategy, stamped with the Monday of the current week.
  When the stored ideas belong to the current week the button becomes "Regenerate Ideas".

## Why

- Removes the blank-page problem by handing the user concrete, strategy-aligned starting points each
  week.

## Acceptance (binary, testable)

- [x] 202-AC-1 AI generates 5-7 ideas per request _(verified: `app/api/ideas/route.schema.ts:12-23` `ideasSchema` enforces `.min(5).max(7)`; route uses it in `app/api/ideas/route.ts:56-61`)_
- [x] 202-AC-2 Ideas reflect strategy, branding, and recent posting history _(verified: `components/dashboard/strategy/ideas-section.tsx:48-76` sends goals, audience, topics, formats, positioning, and `recentTitles` (last 20 drafts); prompt built in `config/prompts.ts:262-264` `IDEAS_SYSTEM_PROMPT`/`ideasUserPrompt`)_
- [x] 202-AC-3 Each idea has topic, format label, and hook _(verified: `lib/strategy.ts:36-41` `PostIdea` type; rendered in `components/dashboard/strategy/idea-card.tsx:31-43`)_
- [ ] 202-AC-4 Clicking an idea creates a new draft with the hook pre-filled _(gap: the Create Post button only navigates to `/dashboard/editor` with no hook payload — `components/dashboard/strategy/idea-card.tsx:50` `router.push('/dashboard/editor')`; no query param, no draft creation, hook is not passed.)_
- [ ] 202-AC-5 User can dismiss ideas _(gap: no dismiss control or handler exists in `idea-card.tsx` or `ideas-section.tsx`; grep for "dismiss" in the strategy components returns no matches.)_
- [x] 202-AC-6 Ideas are scoped to the current week and refresh weekly _(verified: `components/dashboard/strategy/ideas-section.tsx:22-35` `getMondayOfWeek`/`isCurrentWeek`; stored `weekOf` set at `:88`; stale-week ideas fall through to the regenerate/empty path `:42,105-109`)_
- [x] 202-AC-7 Generation is auth-gated and rate-limited _(verified: `app/api/ideas/route.ts:31-51` requires authenticated user and calls `checkRateLimit(supabase, 'ideas')`; `supabase/migrations/008_add_ideas_action.sql` adds the `ideas` action)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note, and
> the feature's status drops to PARTIAL.

## Implementation

- API: `app/api/ideas/route.ts` (auth, rate limit, `generateObject`), `app/api/ideas/route.schema.ts` (request + 5-7 idea schema).
- Prompt: `config/prompts.ts:262` `IDEAS_SYSTEM_PROMPT` and `ideasUserPrompt`.
- UI: `components/dashboard/strategy/ideas-section.tsx` (generate/regenerate, loading skeletons, empty state), `components/dashboard/strategy/idea-card.tsx` (card + Create Post).
- Storage: ideas saved onto `StrategyData.weeklyIdeas` via `onUpdateStrategy` -> `hooks/use-strategy.ts` -> `lib/supabase/strategy.ts` (`strategy.data` JSONB).
- Types: `lib/strategy.ts:36-47` (`PostIdea`, `WeeklyIdeas`).

## Dependencies

- Requires strategy (200) and branding (037) for prompt context.
- Hosted inside the strategy dashboard (201).
- Rate limiting via `lib/rate-limit.ts` and the `ideas` action (`008_add_ideas_action.sql`).

## Open questions / known gaps

- Create Post does not pre-fill the hook or create a draft; it just opens an empty editor. The
  documented "click an idea to create a draft pre-filled with the hook" behavior is not implemented.
- No dismiss capability for individual ideas.
- The "no strategy set up" prompt is handled one level up: the page shows the wizard empty state
  (`strategy-page.tsx:72-79`) before reaching the ideas section, so the ideas section itself assumes
  a strategy exists.
- "Refreshes weekly" is on-demand: ideas only update when the user clicks Generate/Regenerate; there
  is no scheduled/automatic weekly regeneration. Stale-week ideas are simply treated as absent.
- Neither `/api/ideas` nor `/api/strategy/*` is listed in `config/routes.ts` `ApiRoutes`; the fetch
  URL is hardcoded in `ideas-section.tsx:65`.
