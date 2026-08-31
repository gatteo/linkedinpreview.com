# 231 — Onboarding audit funnel

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-07-10
>
> Supersedes the flow described in [068 — Onboarding](068-onboarding.md) (the controller/gate/
> persistence machinery from 068 is retained; the step machine, screens, and offer are replaced).
> Design import: claude.ai/design project "Landing page redesign" · `onboarding/flow/*`.
> Flow spec: the "audit funnel" (18 steps, Hook → Questions → Audit → Offer).

## What

- A new user's first dashboard visit opens a full-width modal that runs an
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
- [x] 231-AC-10b The offer's scroll gate never dead-ends a buyer. The CTA stays clickable: before the reader reaches the end it carries them to the offer and fires `onb_paywall_gate_blocked`, rather than sitting disabled (a disabled button swallows the click, so purchase intent was invisible AND the decline link is below the fold too - a user who did not scroll saw no working affordance). Scroll depth is reported via `onb_paywall_scroll{depth}` at 25/50/75/100 so a non-scroller is distinguishable from a decliner. _(verified: `scroll-progress-button.tsx`; `steps/paywall-step.tsx`; `use-scroll-gate.ts`)_
- [x] 231-AC-11 Growth projections seed from real numbers when measured and show "modeled" instead of a % when the baseline is a floor. _(verified: `config/onboarding-flow.ts` growthCards)_
- [x] 231-AC-12 Insights fire only after the goal/persona answers exist and carry them as request hints, so degraded analyses are framed around the actual goal. Generation is driven deterministically from the building + reveal steps (with the pipeline hook as an early best-effort trigger), all sharing one deduped request. _(verified: `steps/building-step.tsx` + `steps/reveal-step.tsx` drivers, `use-rich-pipeline.ts` framed gate, `ai.ts` dedupe; `app/api/onboarding/insights/route.ts` parseBodyHints)_
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
- 2026-07-18 background insights generation: the analysis LLM chain used to run inside the POST
  request and died on Vercel's timeout for real posts corpora (504 at `maxDuration = 40`, benchmark
  reveal, no graphs - first observed on a live production run). `POST /api/onboarding/insights` now
  claims a run lock (`insights_status` + `insights_triggered_at`, migration 026, mirroring
  `rich_status`/`rich_triggered_at`), answers 202 immediately, and generates in `after()`
  (`maxDuration = 120`, per-call `AbortSignal.timeout` budgets: posts 70s, profile 30s); the client
  (`fetchInsights`) polls the new GET on the same route (3s interval, 160s deadline, past the
  server's 150s stale-pending backstop). Stored payloads still echo as a synchronous 200. Every
  settle write is guarded on the claim timestamp so a re-submitted URL mid-generation is never
  stomped; the enrich route resets the lock with the rest of the insights columns on a new URL.
  The reveal loader failsafe widened 20s → 30s since waiting is now productive, and
  `onb_insights_result` finally fires reliably (it previously died with the function).
- 2026-07-18 connect step hardening (data-driven): funnel analysis showed 5 of 7 connect-step
  choosers hit "Skip for now", so every recent reveal was `kind: benchmark` and the audit
  effectively never ran. The connect skip is removed entirely - the only bypass left is the
  fetch-failure card's "Continue without my data" (`onb_fetch_failed_action{manual}`), so
  `onb_connect_method` is now `oauth|url` only. The URL input accepts a bare slug or a typed
  name (`coerceProfileInput` in `lib/linkedin/profile-url.ts`: NFKD-slugified, canonical URL
  stored in answers; a wrong name guess surfaces on the fetch-failure card). Step copy is
  value-forward, framed on the audit outcome, with a stronger read-only trust line.
- 2026-07-19 audit-reliability fixes (funnel-audit W29, GH #24/#25/#26): production stayed ~100%
  benchmark with `insights_triggered_at` null for EVERY session (including ready ones that reached
  paywall/done) because of TWO compounding bugs, both fixed and verified end-to-end in a live local
  run against the prod DB (a real `posts` audit generated + persisted through claim -> generate ->
  settle): - Server (the primary blocker): the atomic claim in `app/api/onboarding/insights/route.ts` used a
  PostgREST `.or()` filter on an RLS-enforced UPDATE
  (`.update(...).eq('user_id').or('insights_status.neq.pending,...')`). That specific shape fails
  at the PostgREST layer with a spurious `42703 column onboarding_sessions.insights_status does
not exist` for the `authenticated` role - even though the column exists, the role HAS UPDATE
  privilege, a plain `.update({insights_status}).eq('user_id')` on the same column succeeds, and
  the identical `.or()` works for the service role and as raw SQL. So the claim silently matched 0
  rows, the run was never claimed, generation never ran, and the reveal always fell to the local
  benchmark - while observability (service role) read the columns fine, so dashboards looked
  green. Fixed by replacing the `.or()` with an optimistic-concurrency guard on the exact
  `insights_triggered_at` we read (`.eq(ts)` / `.is(null)`); Postgres re-checks the predicate
  under the row lock so exactly one writer still wins, and a stale-pending row is reclaimed the
  same way. NOTE: a schema-cache reload / GRANT does NOT fix this - it is the `.or()` query shape,
  not privileges or cache (verified: `has_column_privilege('authenticated', ...) = true`, and
  `notify pgrst, 'reload schema'` had no effect). - Client: even once the claim works, the POST was fired only from the `use-rich-pipeline.ts`
  effect, gated on the browser observing the slow rich scrape settle while framed and the modal
  stayed mounted - a coincidence that held ~0% of the time. Generation is now driven
  deterministically from the steps every user reaches and stays mounted on: `building-step.tsx`
  kicks it after the scrape's window, and `reveal-step.tsx` drives it on mount as the guaranteed
  backstop. All callers (building, reveal, pipeline hook) share one in-flight request deduped in
  `ai.ts`, which also fires `onb_insights_ready`/`onb_insights_failed` exactly once per generation
  (was triple-counting). The pure-manual (no-scrape) path still keeps the benchmark.
- 2026-07-19 mobile modal fix (GH #25): `onboarding-modal.tsx` sized the dialog with `90vh`, which
  on mobile resolves against the large (chrome-hidden) viewport; at page-load - when the modal
  auto-opens and the chrome is fully visible - the fixed, centered dialog overflowed the visible
  screen and clipped the CTA with no scroll recovery, a 100% mobile wipeout at connect. Changed to
  `90svh` (the `svh` convention already used in `strategy-wizard.tsx` / `dashboard/layout.tsx`).
- 2026-07-19 fast-tier diagnosability (GH #26): the Scrapingdog fetch collapsed every failure mode
  (quota 402/403, rate-limit 429, timeout, empty-record, datacenter-IP block) to a bare `null` /
  `fast_source: none` with no logging, making a gradual production degradation undiagnosable.
  `fetchViaScrapingdog` (`lib/linkedin/public-profile.ts`) now returns a `failReason`, logs each
  mode, and threads it onto `onb_enrich_result.fast_fail_reason`. The likely root cause is external
  (Scrapingdog quota/plan) and the JSON-LD fallback is unreachable from Vercel's datacenter IP
  unless `LINKEDIN_SCRAPE_API_URL` (a residential/raw-HTML proxy) is configured.
- 2026-07-20 re-derived the GH #26 root cause with the new instrumentation (Vercel prod logs, last
  7 days): every single production fast-tier failure - 10 of 10 - is `fetchViaScrapingdog` hitting
  its OWN 9s `SCRAPINGDOG_TIMEOUT_MS` abort (`fast_fail_reason: 'timeout'`), never a quota/rate-limit
  HTTP status; the "quota/plan" hypothesis in the 2026-07-19 entry above is unconfirmed by any log
  evidence and should be treated as superseded. The JSON-LD fallback IS confirmed unreachable in
  prod, but not because it can't work in principle - `BRIGHTDATA_UNLOCKER_ZONE` and
  `LINKEDIN_SCRAPE_API_URL` are both unset (logs show `linkedin html blocked 999 ... no
unlocker/proxy configured` on every fallback attempt), so the direct fetch always hits LinkedIn's
  datacenter-IP block. Fixed a real bug this exposed: `fetchPublicProfile` shared one 12s clock
  across both tiers, so whenever Scrapingdog spent its full 9s timing out, the fallback inherited
  only the ~3s remainder - never enough for a real HTTP fetch even with a proxy configured. The
  fallback now gets its own independent `FALLBACK_TIMEOUT_MS` (8s) window. Also threaded
  `fetchFailReason` onto the enrich API response and the `onb_fetch_failed` event, and made the
  fetching-step failure card's copy match the actual reason (`failureCopy` in
  `fetching-step.tsx`) instead of always claiming "LinkedIn blocked the request" when the real
  cause was a timeout. Left `SCRAPINGDOG_TIMEOUT_MS` unchanged (9s) on purpose: every observed
  failure hit that ceiling with no successful completion nearby, so raising it would only slow
  down an already-failing request, working against the "fail faster" goal - the fix here doesn't
  change today's success rate on its own; someone still has to confirm Scrapingdog account/plan
  health and configure `BRIGHTDATA_UNLOCKER_ZONE` (or `LINKEDIN_SCRAPE_API_URL`) for the fallback to
  actually start rescuing failures.
- "Grow 10× on LinkedIn in 90 days" is a strong quantified claim - consider a process-based
  variant for paid traffic (per the flow spec's production notes).
- 2026-07-20 connect wall root cause #2 (GH #25 reopened): the 2026-07-19 `90svh` fix was correct
  but insufficient - mobile stayed at a 100% wipeout. The real remaining cause: `ConsentBanner`
  (`components/consent-banner.tsx`) renders globally in the root layout with `z-[130]`, deliberately
  above every dialog's `z-50` (so it's never hidden behind ordinary page content). On mobile the
  onboarding modal occupies nearly the whole viewport, so the banner's fixed `bottom-4 left-4` box
  paints directly over the connect step's lower controls - confirmed with a live Playwright render at
  375×667: the "Use profile URL" button and the read-only trust line were fully covered. Worse,
  Radix's dialog scroll-lock sets `body { pointer-events: none }` while a dialog is open, and the
  banner has no override, so its own Accept/Decline buttons went dead too (verified: Playwright's
  `click()` timed out on "Accept" while the modal was open) - a user who tries to dismiss the banner
  to see what's under it gets no response at all. Desktop only degrades partially because the dialog
  there is far taller than its centered content, so the banner's fixed corner position mostly overlaps
  blank padding, not the CTAs. Fixed generically (not onboarding-specific): new `hooks/use-modal-open.ts`
  watches `document.body`'s `data-scroll-locked` attribute (set by every Radix Dialog/AlertDialog/Sheet
  while open) and `ConsentBanner` now renders `null` while any of them is open, reappearing the instant
  it closes. Verified end-to-end with Playwright at 375×667: banner absent and both connect-step CTAs
  fully visible/reachable while the modal is open, banner still renders normally elsewhere. Not verified
  on a real device with a dynamic mobile browser toolbar (Playwright's mobile emulation doesn't
  reproduce that address-bar-driven `svh`/`lvh` behavior) - only this z-index/pointer-events collision,
  which is viewport-static and fully reproducible without one.
- 2026-07-30 suspended-tab insights recovery (funnel-audit W31, GH #43): `fetchInsights`'s 160s poll
  deadline is wall-clock, so a tab suspended mid-generation could sleep through the whole budget and
  return `null` without one live poll deciding anything (on wake the in-flight poll aborts instantly -
  its 15s abort timer expired during the freeze). The client then persisted `insightsStatus: 'failed'`
  and the reveal froze the local benchmark even though a completed posts audit sat in the session row
  (observed live: audit persisted 08:02, client marked failed 09:14, benchmark reveal 09:25, paywall
  drop). `generateInsights` now makes one final fresh poll after the deadline loop exits, so a run
  that completed during the suspension resolves `ready` via the idempotent echo instead of branding
  the session failed.
- 2026-07-31 answers-first restructure (GH #26/#36/#38/#39/#40/#41/#46): OAuth is the majority
  connect path and OIDC never returns a profile URL (a LinkedIn API constraint - `r_member_social`
  is closed, `r_basicprofile` is CMA-only), so those sessions silently degraded to the generic
  benchmark with no way to notice or recover, and the modal itself had no exit at all (no close
  button, Escape and outside-click both suppressed, and no step wired the existing `skip()`) - so a
  user who wanted out could only close the tab, making refusal and entrapment the same signal.
  Fixed on several fronts:
    - **Exit** (#46): the modal gained an X / Escape / outside-click exit
      (`onboarding-modal.tsx`), firing `onb_flow_dismissed{step}`. From 2026-08-01 the exit was
      experiment-gated (`onb-modal-exit`): `control` dismissible, `locked` with no exit and Radix
      dismissal suppressed. The experiment concluded 2026-08-19 - **locked shipped** (paywall
      reach 23.3% vs 7.6%, z=4.23; see docs/experiments/log.md), so the exit affordance and
      `onb_flow_dismissed` are gone again, this time as a measured decision rather than an
      accident. Answers still persist incrementally and the resume gate
      (`onboarding-controller.tsx`) reopens the flow at the saved step on the next visit.
    - **Connect-step escape + honesty** (#40): a quiet "Skip for now" revives the `skip` value on
      `onb_connect_method` (removed 2026-07-18, see above) and jumps straight to `goal` - an
      answers-only plan instead of the fetch-failure card being the only way out. The trust line's
      "Read-only. We never post or message anyone." was false (the OAuth scope requests
      `w_member_social` for the separate publish feature) - reworded to "We never post anything
      without you pressing publish." A rejected paste now fires `onb_connect_url_rejected{input_kind}`
      (`classifyProfileUrlRejection` in `lib/linkedin/profile-url.ts`) so a typed name is
      distinguishable from a pasted company URL from genuinely bad input.
    - **Post-OAuth URL ask** (#39): `fetching-step.tsx` no longer treats `connected && !profileUrl` as
      success - it never had data to fetch. `OAuthUrlAsk` renders instead of the loader, showing the
      real OIDC name/avatar with a warm ask for the profile URL (submit re-enters the normal fetch
      path; "Continue without post analysis" advances honestly, with no fake `mirrorFetchOk`/rich
      claim). Events: `onb_oauth_url_ask_view`, `onb_oauth_url_submit`, `onb_oauth_url_skip`.
    - **Reveal never freezes a stale benchmark** (#41): three pinned failure modes shared one root
      cause - `reveal-step.tsx`'s `frozen` local state locked in the benchmark and ignored anything
      that arrived after (the failsafe firing 3s before generation landed; the same for the profile
      fallback; a resumed session whose `localStorage` never carried the already-finished server
      payload). Fixed with `fetchInsightsStatus` (`ai.ts`, a GET-only echo of
      `/api/onboarding/insights`, no LLM spend): reveal now rehydrates from the server before ever
      trying the local benchmark, and keeps a bounded (~2 min) background poll running after a
      benchmark/profile freeze that upgrades the report in place with a one-line "Your full audit
      just finished" note the instant a real posts audit lands.
    - **Answers-first framing** (#36): when there is no post corpus (`richStatus`
      empty/failed/absent, `insights.kind === 'benchmark'`, or either skip path above), the reveal
      now reads as "your personalized plan, built from your answers" with the benchmark framed as
      "what works for {niche} creators" - the Traction/Content sections' no-data copy no longer
      implies a failed measurement ("You haven't given LinkedIn enough..." / "We could not score
      your posts this time"). The building loader's copy is conditional
      (`BUILDING_TASKS_NO_CORPUS` in `config/onboarding-flow.ts`): "Building your plan" instead of
      "Auditing your LinkedIn" when there's nothing to score. The buildplan/paywall pillar-post
      generation already worked from answers alone and needed no change.
    - **Honest scrape-latency metric** (#38): `onb_scrape_settled.ms_since_trigger`
      (`enrich/status/route.ts`) stamped `now - rich_triggered_at` unconditionally, so a session
      resumed long after triggering reported days of wall-clock absence as scrape latency (one
      observed sample: 367,941,450 ms, corrupting the p90). Now `null` unless the gap is
      `<= STALE_PENDING_MS` (the same ~6 min ceiling the route already treats snapshots as stale
      past), with `resumed: true` on the event when it was suppressed for that reason. The settle
      behavior itself is unchanged.
    - **Rich-profile identity backfill** (best-effort hardening for GH #26): when the fast tier
      failed entirely (no Scrapingdog/JSON-LD card) and the posts corpus settled the scrape before
      the independent Bright Data people-profile snapshot happened to be ready in that same poll,
      identity was never revisited once `rich_status` left `pending`, leaving recap/reveal with a
      blank name despite a working audit. `enrich/status/route.ts` now opportunistically rechecks
      the identity snapshot whenever the merged profile still has no name/headline and the snapshot
      id is on file (a status read only, never a re-trigger).
    - `funnel_version` stays `v3` - no step was added, removed, or reordered; only affordances and
      framing changed.
