# 231 — Onboarding audit funnel

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-07-10
>
> Supersedes the flow described in [068 — Onboarding](068-onboarding.md) (the controller/gate/
> persistence machinery from 068 is retained; the step machine, screens, and offer are replaced).
> Design import: claude.ai/design project "Landing page redesign" · `onboarding/flow/*`.
> Flow spec: the "audit funnel" (18 steps, Hook → Questions → Audit → Offer).

## What

- A new user's first dashboard visit opens a full-width, non-dismissable modal that runs an
  18-step conversion funnel: a full-bleed hero ("Grow 10× on LinkedIn in 90 days") → connect
  LinkedIn or paste a profile URL → a fetching loader (fast profile fetch) → a "Nice to meet you"
  reassure card built from real profile data (photo, cover, location, languages, companies,
  awards, followers) → five question steps (goal, persona, voice, topics, schedule) masked by an
  "Analyzing your posts…" progress rail while the rich scrape runs in the background, interleaved
  with reinforcement beats (editable recap sentence, social-proof wall, consistency chart) → an
  audit-loader → a personalized audit report (pillar-mix radar, traction metrics, content-quality
  flags, topic strengths - each paired with "The fix") → a skippable email capture that saves the
  account (binds an email to the anonymous user) → a plan loader with a commitment popup
  that generates four pillar-tagged posts in the user's voice → a long-scroll paywall (ready
  checklist, modeled growth cards, the real generated posts, feature bento, review wall, golden
  Lifetime Founder Pass ticket + monthly plan, embedded Stripe checkout, quiet free-plan decline)
  → a confirm screen that hands off to the editor with the first post already saved as a draft.

## Why

- Turns the setup wizard into a conversion funnel: the audit gives users a personalized reason to
  believe before the offer is shown, the background scrape makes every claim about them real, and
  the endowed first post makes the free path valuable too. Same honesty rules as before: user
  numbers are measured or hidden, benchmarks are framed as benchmarks, only reviews/counters/offer
  scarcity are marketing content.

## Acceptance (binary, testable)

- [x] 231-AC-1 The step machine is the 18-step order welcome→confirm (email inserted after reveal, before buildplan); legacy v1/v2 resume blobs map to safe steps and never skip uncollected answers. _(verified: `components/dashboard/onboarding/types.ts:22-63`)_
- [x] 231-AC-2 Three layouts render per step (hero / split with stage illustration / wide report) with the section stepper ("Step N / 4") and user chip once identity exists. _(verified: `components/dashboard/onboarding/onboarding-modal.tsx` Shell/TopRow; `config/onboarding-flow.ts` OB_STEP_META)_
- [x] 231-AC-3 The analysis rail shows only on question steps AND only while a real scrape ran/landed (`richStatus` pending/ready/empty) - it never claims analysis that isn't happening. _(verified: `onboarding-modal.tsx` railActive)_
- [x] 231-AC-4 The fetching step fires the enrich call once (StrictMode-safe), commits identity + extended card fields, hands the rich scrape to the pipeline hook, and owns the URL-failure fallback (retry / continue without data). _(verified: `steps/fetching-step.tsx`)_
- [x] 231-AC-5 The reassure card renders only fetched fields (cover, location, languages, experience logos, awards, follower labels) and hides missing rows; the JSON-LD fallback shows a reduced card. _(verified: `primitives.tsx` LinkedInCard; `lib/linkedin/public-profile.ts` extractIdentity)_
- [x] 231-AC-6 Every selection fires an instant templated assistant reaction (goal/persona/voice/topics/schedule), never a spinner. _(verified: `config/onboarding-flow.ts` reactions; steps 04-10)_
- [x] 231-AC-7 The recap sentence plays back role/niche/language/goal as tokens; "Something's off?" stores a free-text `clarification` that is fed into post generation. _(verified: `steps/recap-step.tsx`; `steps/buildplan-step.tsx` brandingContext)_
- [x] 231-AC-8 The audit report pairs measured findings with fixes: radar mix from server-counted labels, hooks/CTA counts labeled by the LLM and counted server-side, traction from observed cadence/followers, with healthy-state positive variants and honest degraded (profile/benchmark) variants. _(verified: `app/api/onboarding/insights/route.ts` audit counts; `steps/reveal-step.tsx`)_
- [x] 231-AC-9 The buildplan step generates one post per content pillar in parallel (real AI, user's voice, scraped-post style references) and stores the gap-matching one as the endowed first draft; the paywall's post strip renders only real generated posts (section hides otherwise). _(verified: `steps/buildplan-step.tsx`; `ai.ts` generatePostIdeas; `steps/paywall-step.tsx`)_
- [x] 231-AC-10 The paywall sells the real PRICING (lifetime ticket + monthly) through the embedded Stripe checkout with the founding-window countdown tied to `FOUNDING_WINDOW_END`; scarcity counters are config-only marketing; a quiet "Continue on the free plan" always exists (also on checkout failure). _(verified: `steps/paywall-step.tsx`; `config/pricing.ts`)_
- [x] 231-AC-11 Growth projections seed from real numbers when measured and show "modeled" instead of a % when the baseline is a floor. _(verified: `config/onboarding-flow.ts` growthCards)_
- [x] 231-AC-12 Insights fire only after the goal/persona answers exist and carry them as request hints, so degraded analyses are framed around the actual goal. _(verified: `use-rich-pipeline.ts` framed gate; `app/api/onboarding/insights/route.ts` parseBodyHints)_
- [x] 231-AC-13 OAuth return resumes at the fetching step; finish() maps answers (incl. language + clarification notes) into branding/strategy exactly once. _(verified: `onboarding-controller.tsx`)_

## Implementation

- Funnel content config (steps/sections/rail, goal & voice decks + reactions, topic suggestions,
  schedule presets, testimonials, features, growth model, audit framing, ticket):
  `config/onboarding-flow.ts`.
- Modal shell (3 layouts, rail, stepper, stage): `components/dashboard/onboarding/onboarding-modal.tsx`,
  `stage.tsx`; primitives kit: `primitives.tsx`; charts (radar, growth sweep): `charts.tsx`.
- Steps: `components/dashboard/onboarding/steps/{welcome,connect,fetching,reassure,goal,persona,recap,proof,voice,topics,schedule,reinforce,building,reveal,email,buildplan,paywall,confirm}-step.tsx` (+ `checkout.tsx`).
- Email step (after `reveal`, before `buildplan`): `steps/email-step.tsx` captures a skippable email and
  binds it to the anonymous user via `bindEmail` → `supabase.auth.updateUser({ email })` (anon → permanent,
  same `user.id`; `onboarding-controller.tsx`). The email is kept in the localStorage resume answers for
  prefill only and stripped before the `onboarding_sessions` upsert (PII). Events: `onb_email_submit` /
  `onb_email_skip`.
- Extended fast identity (location/languages/experience/awards/cover/follower labels):
  `lib/linkedin/public-profile.ts` → `types/onboarding.ts` `FastIdentity` → enrich route → answers.
- Audit labels (opensWithHook / endsWithQuestion per post, server-counted):
  `app/api/onboarding/insights/route.schema.ts`, `route.ts` → `OnboardingInsights.audit`.
- Review-wall assets (team-supplied avatars + analytics screenshots): `public/images/reviews/`.
- Onboarding keyframes (`ob-pulse`, `ob-pop`, `ob-bargrow`, `ob-gsweep`, `ob-shine`, `ob-blink`):
  `styles/globals.css` `@theme`.
- Observability (2026-07-12): every `onb_*` event carries `funnel_version` (`config/analytics.ts`);
  step timing via `onb_step_completed`; server-truth events from the enrich/status/insights/
  first-post routes and the Stripe webhook (`lib/analytics/server.ts`, posthog-node in `after()`);
  PostHog persons identified with the Supabase user id (`AuthProvider`); service-role-only
  aggregate views (migration 023). Event dictionary: `docs/analytics/onboarding-funnel.md`;
  monitoring loop + skills: `docs/analytics/monitoring.md`. Copy experiments run through
  `config/onboarding-experiments.ts` + `hooks/use-ob-experiment.ts` (welcome hero wired).

## Dependencies

- 068 controller/gate/persistence (retained), 220 LinkedIn OAuth, the enrich/status/insights/
  first-post API routes, `config/pricing.ts` + Stripe embedded checkout, PostCard preview,
  `public/images/illustrations/*` stage art.

## Open questions / known gaps

- Testimonial identities are real people supplied by the team (tmp/reviews) with illustrative
  quotes/metrics - confirm consent before public launch (flagged in the flow spec's production
  checklist).
- The full rich path (Scrapingdog identity card, Bright Data audit, real posts) needs the provider
  keys; the local click-through verified every degraded path (JSON-LD identity, benchmark audit,
  fallback post, checkout-unavailable fallback). Verify the rich path on preview with keys set.
- 2026-07-11 pipeline upgrade: the analysis corpus now comes from Bright Data's "LinkedIn posts"
  dataset (discover-by-profile-URL: full text, dates, reactions/comments), triggered in parallel
  with the people-profile snapshot (migration 022 adds `posts_snapshot_id`/`posts_raw`). The
  insights route computes measured engagement (avg reactions overall and per labeled category,
  server-side math only) surfaced in the reveal Traction section; posting language is
  stopword-detected from the corpus and drives the first-post language + branding prefill; the
  analysis LLM calls use `LLM_ANALYSIS_MODEL` (default gpt-5-mini). Profile-dataset activity items
  remain the corpus fallback, and a stored profile/benchmark insights payload upgrades to a posts
  analysis when the scrape lands late.
- 2026-07-17 gated-profile fallback: when Bright Data's posts dataset returns a `dead_page`/private
  error for a member whose logged-out view is gated (`checkPostsScrape` sets `gated` in
  `lib/linkedin/rich-scrape.ts`), the analysis corpus is mined from the member's own activities/articles
  already present in the Scrapingdog profile record (`postsFromScrapingdogProfile` in
  `lib/linkedin/scrapingdog-posts.ts`, wired into `enrich/status`'s `settleFromScrapingdog`; own-post
  match by the `/posts/<slug>_` permalink, title previews only - no engagement counts or dates) instead
  of degrading to a generic benchmark. `onboarding_sessions.posts_source` (migration 024) records which
  source produced the corpus (`brightdata` / `scrapingdog` / `none`), so a rescued gated profile is
  distinguishable from a genuinely postless one.
- "Grow 10× on LinkedIn in 90 days" is a strong quantified claim - consider a process-based
  variant for paid traffic (per the flow spec's production notes).
