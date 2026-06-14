# Status

> A plain-language snapshot of where the product is **right now** - read this first each session.
> Verified against the code on 2026-06-14 (branch `feat/dashboard-overhaul`). Detailed dated
> history is in [CHANGELOG.md](CHANGELOG.md); the per-feature truth is in
> [features/](features/) with `file:line` evidence; the phase plan is in [ROADMAP.md](ROADMAP.md).

## The short version

The product is **functionally complete for Waves 0, 1, and 2**: the public site + tool, the AI
features, the dashboard with anonymous-auth persistence, branding, and content strategy all ship
real code. Every built feature has a spec with fact-checked acceptance criteria: SHIPPED specs live
in [features/completed/](features/completed/), PARTIAL specs in [features/](features/). Of 63 built
features, **58 are SHIPPED** (every AC verified) and **5 are PARTIAL** (one or more ACs unmet - see
the gap list below). Every PARTIAL has a tracking ticket in [tickets/](tickets/). Reaching a clean
release is mostly configuration plus closing those gaps, not feature building.

## What works today (SHIPPED, AC-verified)

- **Public site + SEO** - landing page with JSON-LD, blog (Contentlayer/MDX), RSS, compare pages,
  sitemap/robots/OG/canonical, dashboard+embed `noindex`. (001, 002, 003, 005, 006)
- **Core editor** - TipTap rich text with Unicode output, live preview, preview size toggle, feed
  preview, image/video upload, copy-to-clipboard, draft-sharing URL, embeddable widget, homepage
  tool. (020, 021, 022, 023, 024, 025, 026, 027, 028)
- **Content scoring** - readability, sentence flow, hashtags, emoji, length status, line count
  (dashboard analyze panel). (050, 051, 053, 054, 055, 056)
- **AI** - chat, generation (hooks + posts), quick actions, analysis (stored), suggestions, hook
  generation, content extraction, post-from-voice, post-from-file. Rate limits match `config/ai.ts`
  and the `check_and_record_usage` RPC. (030-036, 038, 039)
- **Dashboard** - sidebar shell, anonymous auth, multi-draft CRUD, posts list (search/filter/
  paginate), editor with 2s auto-save, creation wizard, tutorial, dark mode, theme selector, reset
  all data. (060, 061, 062, 065, 066, 067, 068, 069, 100, 103)
- **Branding** - role, expertise, writing style, knowledge base, auto-save indicator (these fields
  genuinely feed AI generation). (082, 083, 084, 086, 090)
- **Content strategy** - 7-step wizard persisted to Supabase. (200)
- **Feedback/analytics** - Tally feedback, article-helpfulness widget, GTM. (110, 111, 113)

## What is PARTIAL (built, but a documented capability is missing)

The fact-check downgraded these from the previous all-"Live" docs. Each has a `[ ]` AC in its spec.

| Feature                 | Gap found                                                                           | Ticket                                                   |
| ----------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 088 inspirational posts | Card claims it invites post URLs but accepts free text (AI wiring done in T-005)    | [T-014](tickets/T-014-inspiration-posts-url-claim.md)    |
| 085 custom footer       | Footer is a prompt instruction, not a deterministic append                          | [T-011](tickets/T-011-enforce-footer-and-dos-donts.md)   |
| 087 dos and donts       | Go into the user prompt as style context, not the system prompt as hard constraints | [T-011](tickets/T-011-enforce-footer-and-dos-donts.md)   |
| 201 strategy dashboard  | Heatmap is single-month (not 3-6 months); streak tracking does not exist            | [T-012](tickets/T-012-multi-month-heatmap-and-streak.md) |
| 112 PostHog             | No app-wide page-view tracking (relies on autocapture; one manual event)            | [T-013](tickets/T-013-explicit-pageview-tracking.md)     |

## Blockers to a running/deployed build (configuration, not code)

1. **Env.** `env.mjs` validates at build time. Required: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `LLM_API_KEY` (`LLM_MODEL` optional). `NEXT_PUBLIC_GTM_MEASUREMENT_ID`
   and `NEXT_PUBLIC_POSTHOG_KEY` are required by the schema but analytics-only - make them
   `.optional()` to run without analytics. `NEXT_PUBLIC_TALLY_FORM_ID` is already optional.
2. **Supabase.** Point env at a project, apply migrations `001`-`008` (drafts, branding,
   `ai_usage`/rate-limit RPC, `post_analyses`, `strategy`, labels, ideas, all with RLS), and enable
   anonymous auth in project settings.
3. **Build.** Run `pnpm install && pnpm type-check && pnpm build` in a real environment. There may
   be a small pre-existing `type-check` baseline plus a few `@ts-ignore`/`@ts-expect-error`
   suppressions (`components/tool/editor-panel.tsx`, `lib/mdx/plugins/index.ts`,
   `components/tool/preview/content-section.tsx`); confirm no _new_ errors.

## Cleanup worth doing before shipping

- Remove dead scaffolding: `app/dash-example/` and `components/shadcn-demo/` (orphaned showcase).
- `/dashboard/strategy` works but is not registered in `config/routes.ts` (path hardcoded in
  `dashboard-sidebar.tsx`); add it for consistency.
- Posts table "Score" column is hardcoded `-` (awaits Wave 5 analytics); honest placeholder.
- A second, unused anonymous-auth implementation exists in `hooks/use-anonymous-auth.ts`.
- Possible bug: the editor hooks path in `components/dashboard/.../ai-actions.tsx` expects
  `{result}` but the route returns `{hooks}` (the wizard path is the verified one).

## Recommended next

1. Configure env + Supabase, apply migrations, verify the build (blockers 1-3).
2. Close the honesty gaps in leverage order: [T-001](tickets/T-001-wire-label-picker-in-editor.md)
   -> [T-002](tickets/T-002-branding-profile-in-post-preview.md) ->
   [T-004](tickets/T-004-idea-create-post-prefill.md) ->
   [T-003](tickets/T-003-reachable-post-statuses.md) ->
   [T-005](tickets/T-005-branding-aware-chat-and-inspiration.md).
3. Then start the next wave from [backlog/](backlog/) - Wave 3 (carousel) and Wave 4 (LinkedIn
   OAuth + scheduling) are the biggest product gaps; LinkedIn API approval has lead time, so apply
   early.

## Out of scope for "working product" (planned, in backlog/)

Wave 3 carousel (210-212), Wave 4 scheduling/publishing (220-224), Wave 5 analytics (230), Wave 6
advanced (240-244), and the SEO template libraries (007-009). These appear as disabled "Soon" items
or are absent by design.
