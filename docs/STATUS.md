# Status

> A plain-language snapshot of where the product is **right now** - read this first each session.
> Verified against the code on 2026-06-15 (branch `feat/dashboard-overhaul`). Detailed dated
> history is in [CHANGELOG.md](CHANGELOG.md); the per-feature truth is in
> [features/](features/) with `file:line` evidence; the phase plan is in [ROADMAP.md](ROADMAP.md).
>
> **2026-06-19 update:** the dashboard onboarding was rebuilt from a 4-slide placeholder into a full
> interactive setup wizard that prefills branding + strategy (068), and shared UX foundations were
> added (motion tokens, 3D "clicky" buttons, `<EmptyState>`, an illustration set - see
> [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)). All code/build-verified (type-check, lint, build pass) on the
> branch; not yet exercised via a live click-through and not yet through the code-quality review gate.

## The short version

The product is **functionally complete for Waves 0, 1, and 2**: the public site + tool, the AI
features, the dashboard with anonymous-auth persistence, branding, and content strategy all ship
real code. Every built feature has a spec with fact-checked acceptance criteria: SHIPPED specs live
in [features/completed/](features/completed/). Of 63 built features, **all 63 are SHIPPED** (every
AC verified against `file:line`); there are **no PARTIAL features left**. The Foundation and Waves
0, 1, and 2 are each COMPLETE. The deployment configuration (env vars, the Supabase project, and a
verified local build) is in place, so Waves 0-2 are release-ready. **Wave 4 (LinkedIn Scheduling &
Publishing) is now built but PARTIAL**: all five specs (220-224) ship real code that type-checks,
lints, builds, and passed the code-quality review (SHIP), but with no live LinkedIn app credentials
configured the OAuth, real publishing, media upload, and cron delivery are **not** end-to-end
verified against LinkedIn. See "Wave 4 setup required before it works" below.

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
  paginate), editor with 2s auto-save, creation wizard, interactive onboarding, dark mode, theme
  selector, reset all data. (060, 061, 062, 065, 066, 067, 068, 069, 100, 103)
- **Branding** - role, expertise, writing style, knowledge base, auto-save indicator (these fields
  genuinely feed AI generation). (082, 083, 084, 086, 090)
- **Content strategy** - 7-step wizard persisted to Supabase. (200)
- **Feedback/analytics** - Tally feedback, article-helpfulness widget, GTM. (110, 111, 113)

## What is PARTIAL (built, but a documented capability is missing)

- **Wave 4 - LinkedIn Scheduling & Publishing (220-224).** All five features are built and pass
  type-check, lint, build, and the code-quality review, but they are **not** live-verified. The
  shared gap is the same for each: **pending real LinkedIn app credentials + a connected account for
  end-to-end verification.** Specifically unverified against LinkedIn: a real OAuth consent +
  token exchange succeeding (220), an actual post appearing on a profile and media uploading (221),
  the cron delivering a scheduled post at its time (222), and the calendar reschedule -> live publish
  loop (223). Best time to post (224) is phase-1 general guidance only; phase-2 personalization waits
  on Wave 5 analytics (230). Architectural constraints baked into the design: self-serve LinkedIn
  apps get **no** programmatic refresh token (60-day token, the member must reconnect), and
  per-minute scheduling requires **Vercel Pro** (on Hobby, cron runs once per day). Tracked by
  tickets [T-015](tickets/T-015-linkedin-oauth.md)-[T-019](tickets/T-019-best-time-to-post.md).
  **LinkedIn now doubles as login** (220): first connect converts the anonymous session into an
  email-backed account and seeds profile/branding; connecting an identity that already owns an account
  signs the user into it (silently, or behind a "bring your drafts?" merge prompt), while a conflict
  with a different saved account is blocked. The returning-member sign-in path (resolve → magic-link
  mint → session swap) is code/build-verified but, like the rest of Wave 4, not yet live-verified
  against LinkedIn (220-AC-18).

For Waves 0-2, every built feature is SHIPPED with all acceptance criteria verified against
`file:line`; the gaps the fact-check originally found (tickets T-001 through T-014) have all been
closed. The full dated history is in [CHANGELOG.md](CHANGELOG.md).

## Wave 4 setup required before it works

Wave 4 is inert until the integration is configured. To make it function:

1. **Set the env vars** (all optional in `env.mjs`; the feature presents as "not configured" until
   they are set):
    - `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` - from the LinkedIn app.
    - `LINKEDIN_TOKEN_ENC_KEY` - the AES-256-GCM key that encrypts tokens at rest. Generate a
      64-char hex string: `openssl rand -hex 32`.
    - `LINKEDIN_REDIRECT_URI` - optional override; defaults to `${site.url}/api/linkedin/callback`.
      It must exactly match the redirect URL registered on the LinkedIn app.
    - `CRON_SECRET` - shared secret the Vercel Cron publisher sends as its bearer token.
    - `SUPABASE_SERVICE_ROLE_KEY` - used by the cron publisher **and** by LinkedIn login (account
      resolution + magic-link session minting). Service-role client, bypasses RLS; never exposed to
      the client. Without it, connect degrades to attach-only and cannot sign returning users into an
      existing account.
2. **Add the two LinkedIn Developer products** to the app: "Sign In with LinkedIn using OpenID
   Connect" (scopes `openid profile email`) and "Share on LinkedIn" (scope `w_member_social`).
3. **Apply migrations `009`, `010`, and `011`** to the Supabase project (`linkedin_connections` table
    - RLS; the drafts scheduling columns + `claim_due_linkedin_posts` / `claim_draft_for_publish` RPCs;
      and `011` makes `linkedin_sub` unique + `access_token` nullable for LinkedIn-as-login).
      3a. **Enable email confirmations** in Supabase and point the confirmation email template at
      `/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}` so first-connect account conversion
      works.
4. **Per-minute scheduling needs Vercel Pro.** `vercel.json` schedules the publisher every minute; on
   the Hobby plan cron runs at most once per day, so scheduled posts would publish in a daily batch.

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
3. Then start the next wave from [backlog/](backlog/) - Wave 4 (LinkedIn OAuth + scheduling) is the
   biggest remaining product gap; LinkedIn API approval has lead time, so apply early. (Wave 3
   carousel is now built - see below.)

## Out of scope for "working product" (planned, in backlog/)

Wave 6 advanced (240-244) and the SEO template libraries (007-009). These appear as disabled "Soon"
items or are absent by design. (Wave 3 carousel (210-212), Wave 4 scheduling/publishing (220-224), and
Wave 5 analytics (230) are now built - carousel is feature-complete for v1 with export and AI;
publish/analytics remain PARTIAL - see "What is PARTIAL" above. Carousel export fidelity wants a
real-browser smoke test before calling it fully verified.)
