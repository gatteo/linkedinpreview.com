# 202 — Weekly AI Post Ideas

> Status: SHIPPED · Area: Strategy · Last verified: 2026-06-14

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
- [x] 202-AC-4 Clicking an idea creates a new draft with the hook pre-filled _(verified: `components/dashboard/strategy/idea-card.tsx:36-50` `handleCreatePost` builds draft content from `idea.hook` via `textToTipTapJson`, creates the draft with `createDraft(content)`, sets the idea's format label via `updateDraft(draft.id, { label: idea.format })`, then opens the editor on the new draft with `router.push(Routes.DashboardEditor(draft.id))` — same draft-seeding path as the creation wizard `components/dashboard/creation-wizard/creation-wizard.tsx:167-180`.)_
- [x] 202-AC-5 User can dismiss ideas _(verified: dismiss control `components/dashboard/strategy/idea-card.tsx:55-63` (icon-only button with `aria-label='Dismiss idea'`) calls `onDismiss`; `components/dashboard/strategy/ideas-section.tsx:99-106` `handleDismissIdea` removes the idea from `weeklyIdeas.ideas` and persists via the existing `onUpdateStrategy` path so the change survives reload.)_
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

- Create Post now seeds a draft from the idea's hook and format label and opens it in the editor
  (`idea-card.tsx:36-50`), reusing the creation wizard's draft-seeding path. The draft content
  starts from the one-line hook only; it is intentionally not a full post, so the user still writes
  the body in the editor.
- Dismiss removes a single idea from the current week's `weeklyIdeas.ideas` and persists through the
  existing strategy update path (`strategy.data` JSONB), so dismissals survive reload. Dismissal is
  permanent for that week's batch and cannot be undone except by regenerating ideas. When every idea
  is dismissed the section falls back to the empty/regenerate state (`ideas-section.tsx:42`).
- The "no strategy set up" prompt is handled one level up: the page shows the wizard empty state
  (`strategy-page.tsx:72-79`) before reaching the ideas section, so the ideas section itself assumes
  a strategy exists.
- "Refreshes weekly" is on-demand: ideas only update when the user clicks Generate/Regenerate; there
  is no scheduled/automatic weekly regeneration. Stale-week ideas are simply treated as absent.
- Neither `/api/ideas` nor `/api/strategy/*` is listed in `config/routes.ts` `ApiRoutes`; the fetch
  URL is hardcoded in `ideas-section.tsx:65`.
