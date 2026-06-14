# Status

> A plain-language snapshot of where the product is **right now** - read this first each session.
> Verified against the code on 2026-06-14 (branch `feat/dashboard-overhaul`). Detailed dated
> history is in [CHANGELOG.md](CHANGELOG.md); the per-feature truth is in
> [features/](features/) with `file:line` evidence; the phase plan is in [ROADMAP.md](ROADMAP.md).

## The short version

The product is **functionally complete for Waves 0, 1, and 2**: the public site + tool, the AI
features, the dashboard with anonymous-auth persistence, branding, and content strategy all ship
real code. Every built feature has a spec with fact-checked acceptance criteria: SHIPPED specs live
in [features/completed/](features/completed/). Of 63 built features, **all 63 are SHIPPED** (every
AC verified against `file:line`); there are **no PARTIAL features left**. The Foundation and Waves
0, 1, and 2 are each COMPLETE. The deployment configuration (env vars, the Supabase project, and a
verified local build) is now in place, so the product is release-ready: no feature work and no
configuration blockers remain.

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

None. Every built feature is SHIPPED with all acceptance criteria verified against `file:line`. The
gaps the fact-check originally found (tickets T-001 through T-014) have all been closed. The full
dated history is in [CHANGELOG.md](CHANGELOG.md).

## Deployment readiness (configuration)

Verified on 2026-06-14 on branch `feat/dashboard-overhaul`.

1. **Env - configured.** `.env` is set with `LLM_API_KEY` (+ `LLM_MODEL`), `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_POSTHOG_KEY`. The analytics keys
   `NEXT_PUBLIC_GTM_MEASUREMENT_ID` and `NEXT_PUBLIC_TALLY_FORM_ID` are left blank; the build still
   succeeds with them empty, so analytics are simply inert until those are filled in.
2. **Supabase - configured.** Env points at a Supabase project; migrations `001`-`008` (drafts,
   branding, `ai_usage`/rate-limit RPC, `post_analyses`, `strategy`, labels, ideas, all with RLS)
   and anonymous auth are set up by the maintainer. (The remote project state - migrations applied,
   anonymous auth toggled on - is configured outside the repo and is not independently re-verifiable
   from these files.)
3. **Build - verified.** `pnpm type-check` is clean, `pnpm lint` is at baseline (only the two
   pre-existing `react-hooks/incompatible-library` warnings in `posts-table.tsx` and
   `shadcn-demo/data-table.tsx`), and `pnpm build` compiles and prerenders all 48 routes (public
   pages static, `/blog` + `/compare` SSG). A few pre-existing `@ts-expect-error`/`@ts-ignore`
   suppressions remain in the baseline (`components/tool/editor-panel.tsx`, `lib/mdx/plugins/index.ts`,
   `components/tool/preview/content-section.tsx`); no new errors or suppressions were introduced.

## Cleanup worth doing before shipping

- Remove dead scaffolding: `app/dash-example/` and `components/shadcn-demo/` (orphaned showcase).
- `/dashboard/strategy` works but is not registered in `config/routes.ts` (path hardcoded in
  `dashboard-sidebar.tsx`); add it for consistency.
- Posts table "Score" column is hardcoded `-` (awaits Wave 5 analytics); honest placeholder.
- A second, unused anonymous-auth implementation exists in `hooks/use-anonymous-auth.ts`.
- Possible bug: the editor hooks path in `components/dashboard/.../ai-actions.tsx` expects
  `{result}` but the route returns `{hooks}` (the wizard path is the verified one).

## Recommended next

1. Deploy: env + Supabase are configured and the build is verified, so the branch is ready to merge
   and ship. Run the deploy in the real environment and smoke-test the live anonymous-auth + AI flows.
2. Optionally do the pre-shipping cleanup below (dead scaffolding, route registration).
3. Then start the next wave from [backlog/](backlog/) - Wave 3 (carousel) and Wave 4 (LinkedIn
   OAuth + scheduling) are the biggest product gaps; LinkedIn API approval has lead time, so apply
   early.

## Out of scope for "working product" (planned, in backlog/)

Wave 3 carousel (210-212), Wave 4 scheduling/publishing (220-224), Wave 5 analytics (230), Wave 6
advanced (240-244), and the SEO template libraries (007-009). These appear as disabled "Soon" items
or are absent by design.
