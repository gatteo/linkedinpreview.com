# Changelog

> Dated history of meaningful changes to the product and its docs. Newest first. Each shipped
> change adds a line here (see [process/development-workflow.md](process/development-workflow.md)).
> This is the engineering changelog; the user-facing changelog lives in the app at `/changelog`.

## 2026-09-03 - Growth: optional post-copy email capture

- Added a dismissible, explicit-consent email-capture surface that appears only after a successful full-post copy. Copy remains free and non-blocking. The authenticated server route stores no raw email in analytics, records server-owned consent audit fields, deduplicates normalized emails atomically, and sends no email.
- Added the RLS-protected `leads` schema plus an atomic, trusted-IP-hashed five-per-day database throttle. Anonymous and authenticated clients have no direct table or RPC privileges; only the server service role may write after route validation. PR #85 passed the local, preview and production smoke gates.

## 2026-08-06 - Chore: retire the orphaned hero CTA and its flag

- **Deleted `components/home/hero-cta.tsx`.** `HeroCTA` rendered a "Get Started" / "Learn more"
  pair plus an "or open the full dashboard" link, gated on the `hero-cta-copy` multivariate
  flag. Nothing imported it - the landing page renders `components/home/hero.tsx`, whose CTAs
  were rewritten to plan framing in 736c4fa. The flag was at 100% rollout across four 25%
  variants, so it read as a live landing-page A/B test in every flag listing while deciding
  nothing; that appearance is what led a funnel baseline to record it as running.
- **Archived the PostHog flag** (id 145657, `active: false`, `archived: true`, last called
  2026-08-04). A future hero test should be written fresh: the retired variants ("Get Started",
  "Use Free Tool") predate the plan-framing rewrite.
- **Removed the `hero` entry source** from `config/entry-sources.ts` - the deleted component was
  its only emitter, so it never recorded anything and no historical volume is affected. A stray
  `?from=hero` now resolves to `direct` like any other unknown value.

## 2026-08-06 - Fix: `/api/extract` was dead for a week; name the OAuth outcomes it hid

- **`/api/extract` returned 500 for every request from 2026-07-31 to 2026-08-06.** `pdf-parse` was
  imported at the top of `route.utils.ts`; its pdfjs dependency evaluates `new DOMMatrix()` at
  module scope and self-polyfills only via a runtime `createRequire('@napi-rs/canvas')`. Bundled
  into a server chunk that lookup fails, so the module threw `ReferenceError: DOMMatrix is not
defined` while the route was still evaluating - taking URL, `.docx`, `.txt` and `.md` extraction
  down with the PDF path that caused it. Fix: import `pdf-parse` lazily inside the PDF branch,
  polyfill `DOMMatrix`/`ImageData`/`Path2D` from an explicit `@napi-rs/canvas` import (a static
  specifier Next's file tracer can see - it traced 0 canvas files before, 13 after), and add
  `pdf-parse`, `pdfjs-dist`, `@napi-rs/canvas` to `serverExternalPackages`. Verified by extracting
  a real PDF through the exact polyfill-then-import sequence.
- **The daily funnel health check could not have caught this**: its Vercel step was gated on an
  onboarding anomaly and scoped to `/api/onboarding/*` and `/api/billing/*`. Added an ungated
  weekly whole-surface error sweep to the runbook, with module-evaluation errors graded RED at
  n >= 1 - that stack shape always means the route is fully dead, not degraded.
- **LinkedIn OAuth outcomes are now observable (GH #62).** OAuth was the only lossy connect method
  (21/29 progressed vs 15/15 for URL and 17/17 for skip) and every failure fired no event, so
  refusal, breakage, and a closed tab were indistinguishable. The callback route now fires
  `onb_oauth_callback{status}` for onboarding-origin round-trips (including the account-switch
  exits, which leave the flow), and `OnboardingController` fires `onb_oauth_result{status,
resumable}` when it reads the return param - before every gate, so a return that cannot reopen
  the flow is visible instead of silent. `session` is the one outcome that cannot be attributed:
  no Supabase user resolved, so there is no distinctId.
- **Flag inventory corrected.** `hero-cta-copy` was recorded in baselines as a live landing-page
  test; its component (`HeroCTA`) is mounted nowhere, so it decides nothing (~11 flag calls per 14
  days). `onb-welcome-hero` is control-only plumbing, not an experiment. The only live experiment is
  `onb-modal-exit`. Recorded in `docs/experiments/log.md` so audits stop re-deriving it.

## 2026-08-04 - Build: remove syntax highlighting, gate redundant deploys (~40x faster builds)

- **Vercel builds took 9-11 minutes; `next build` accounted for 12 seconds of that.** The rest was
  `contentlayer build`: `lib/mdx/plugins/rehype/rehype-inline-code.ts` cached its Shiki highlighter
  in the plugin factory closure, but unified instantiates plugins once per document. That built one
  highlighter per MDX file, each loading every bundled grammar (~3s x 207 documents = ~10.5 min).
  Shiki's own "N instances have been created" warning had been printing in the build log, counting
  up to 200, since the blog was first published.
- **Syntax highlighting removed entirely** rather than repaired: the 207 documents held exactly one
  fenced block (`html`) and zero inline `{:lang}` spans - the content set is LinkedIn how-to
  writing, not code tutorials. Deleted `rehype-code.ts`, `rehype-inline-code.ts` and
  `remark-code.ts`; dropped `shiki`, `@shikijs/rehype`, `@shikijs/transformers` (21 packages).
  `rehypePlugins` is now empty. The `.shiki` CSS is replaced by a plain `pre code` rule; `Pre`
  gained horizontal padding to replace what shiki's `.line` supplied; the `code` mapping in
  `mdx.tsx` now skips the inline pill for `language-*` blocks so fenced code no longer inherits it.
  Full production build: **~350s -> 16.3s** locally, 207 documents, 260 routes, type-check and lint
  clean.
- **Build gate** (`scripts/vercel-build-gate.sh`, wired via `ignoreCommand` in `vercel.json`): skips
  deploys whose diff touches only `docs/`, `*.md`, `.github/`, `.husky/`, `.claude/`, `.agents/`,
  `.cursor/`, `LICENCE`, `.prettierignore`. Diffs against `VERCEL_GIT_PREVIOUS_SHA` so a run of
  skipped commits cannot hide a change; falls back to `HEAD^`; fails open; `[deploy]` in the commit
  message overrides. No daily deploy cap - a skipped deploy is dropped, not queued, so a cap would
  silently strand hotfixes.

## 2026-07-31 - Onboarding: answers-first flow (exit, post-OAuth URL ask, honest degrades)

- **The flow had no exit** (GH #46): no close button, Escape and outside-click both suppressed,
  no step wired the existing `skip()` - refusal and entrapment were the same signal (~217
  users/week). The modal now closes via X / Escape / outside click (`onb_flow_dismissed{step}`),
  never marking the account onboarded, so the existing resume gate reopens it at the saved step
  next visit.
- **Connect step escape + honesty** (GH #40): a quiet "Skip for now" revives `onb_connect_method`'s
  `skip` value (removed 2026-07-18) as an answers-only path instead of the fetch-failure card
  being the only way out. The trust line falsely promised "We never post or message anyone" while
  the OAuth scope requests `w_member_social` - reworded to match what the product actually does.
  Rejected pastes now fire `onb_connect_url_rejected{input_kind}` (previously unattributed: 142 of
  229 connect viewers).
- **Post-OAuth profile-URL ask** (GH #40 origin issue, connect/reveal): OAuth is the majority
  connect path and OIDC never returns a profile URL, so those sessions silently degraded to the
  generic benchmark. `fetching-step.tsx` now asks for the URL (warm, with the real OIDC
  name/avatar already shown) instead of claiming a fetch succeeded with zero data.
- **Reveal no longer freezes a stale benchmark** (GH #41): the 30s loader failsafe regularly fired
  before the server's ~40s p50 for a posts audit, and a resumed session's local state could miss an
  already-finished server payload entirely. Reveal now rehydrates from the server (GET
  `/api/onboarding/insights` echo) before ever trying the local benchmark, and upgrades the report
  in place (bounded background poll, ~2 min) with a "Your full audit just finished" note.
- **Answers-first framing** (GH #36): with no post corpus, the reveal now reads as "your
  personalized plan, built from your answers" (benchmark framed as "what works for {niche}
  creators") instead of an audit that came up short; the building loader's copy no longer claims
  to be scoring posts that don't exist.
- **Honest scrape-latency metric** (GH #38): `onb_scrape_settled.ms_since_trigger` stamped
  wall-clock since trigger unconditionally, so a resumed session reported days of absence as
  scrape latency (one sample: 367,941,450 ms, corrupting the p90). Now `null` past the plausible
  live-measurement window, with `resumed: true` on that event.
- **Rich-profile identity backfill** (best-effort hardening for GH #26): when the fast tier failed
  and the posts corpus settled before the independent identity snapshot happened to be ready,
  identity was never revisited - `enrich/status` now rechecks it opportunistically.
- Event dictionary (`docs/analytics/onboarding-funnel.md`) and feature spec (`docs/features/completed/231-onboarding-audit-funnel.md`) updated. `funnel_version` stays `v3` - no step added/removed/reordered.

## 2026-07-31 - Drop the dead LinkedIn import, align on the official analytics surface

- **Root cause**: the "Sync from LinkedIn" history import called the Posts API author finder
  (`GET /rest/posts?q=author`), which requires `r_member_social` - a permission LinkedIn closed to new
  applications entirely. It 403s unconditionally and could never work. Removed
  `app/api/analytics/import-linkedin/route.ts`, `lib/linkedin/import.ts` (`fetchMemberPosts`), and
  `import-linkedin-button.tsx`.
- **History backfill is now the CSV/XLSX export path**: `import-metrics-dialog.tsx` explains, before a
  file is picked, where to get LinkedIn's own "Post analytics" export, that it's a one-time backfill,
  and that posts published/scheduled through the app track automatically going forward. Rows not
  matched to an existing draft now create new `published` posts (`planCsvImport` in
  `lib/analytics/csv.ts`, `createImportedPublishedPost` generalized in `lib/supabase/drafts.ts`) instead
  of being silently dropped as "unmatched".
- **The route's other job survives**: refreshing metrics for posts already published through the app is
  now its own slim endpoint, `app/api/analytics/refresh-metrics/route.ts`, with no dependency on the App
  A (publishing) connection.
- **New account-wide analytics surface**: `lib/linkedin/member-analytics.ts` adds follower growth
  (`memberFollowersCount`) and account-aggregate post metrics (`memberCreatorPostAnalytics q=me`),
  gated behind a new `r_member_profileAnalytics` scope alongside the existing
  `r_member_postAnalytics`. Fetch-and-display only - never written to Supabase, per LinkedIn's 48h
  storage cap on member social activity. `linkedin-account-section.tsx` renders it on the analytics
  page once App B is connected. A `LINKEDIN_ANALYTICS_TEST_MODE` env flag serves deterministic mock
  data with a "Test data" badge so the surface is reviewable before Community Management API approval.

## 2026-07-20 — Fix cookie banner blocking the onboarding modal on mobile (GH #25)

- **Root cause**: the global cookie consent banner renders at `z-[130]`, above every dialog's
  `z-50`, so it always stays visible over ordinary pages. On mobile the onboarding modal takes up
  nearly the full viewport, so the banner's fixed bottom-left box painted directly over the connect
  step's "Use profile URL" button and trust line - and because Radix sets `body { pointer-events: none }`
  while a dialog is open (and the banner never overrode it), the banner's own Accept/Decline buttons
  went dead too, leaving users with an unreachable, undismissable overlay on their very first
  screen. This matches production: mobile never converted past connect (0/6, W29), desktop degraded
  but didn't collapse (its taller, mostly-empty dialog kept the banner off the actual CTAs).
- **Fix**: new `hooks/use-modal-open.ts` watches `document.body`'s `data-scroll-locked` attribute
  (set by any open Radix Dialog/AlertDialog/Sheet) and `ConsentBanner` now defers rendering while
  one is open, reappearing as soon as it closes. Generic fix, not onboarding-specific - protects any
  current or future full-screen dialog from the same collision.

## 2026-07-18 — Connect step: no skip, name/slug input, audit-outcome framing

- **Data**: 14-day funnel read showed the connect "Skip for now" link took 5 of 7 choosers
  around the entire scrape pipeline (`connect → goal`, bypassing `fetching`), so every recent
  reveal rendered the generic benchmark - the audit never ran for real users. The PostHog
  "drop" at fetching was this bypass, not abandonment.
- **Skip removed** from the connect step; the fetch-failure card's "Continue without my data"
  remains the only escape hatch. `onb_connect_method` no longer emits `skip` (dictionary updated).
- **Lower input effort**: the URL field now accepts a bare slug or a typed name via
  `coerceProfileInput` (NFKD slugification, canonical URL stored); wrong guesses land on the
  failure card with a retry.
- **Value-forward copy**: the step sells the audit outcome ("what's working, what's missing")
  and states the read-only guarantee explicitly.

## 2026-07-18 — Background insights generation (audit reveal timeout fix)

- **Root cause found from a live run**: `POST /api/onboarding/insights` hit Vercel's 40s task
  timeout whenever a real posts corpus reached the analysis model (gpt-5-mini), so every rich-scrape
  user got the graphless benchmark reveal and `onb_insights_result` never fired in production.
- **Background run**: POST now claims a run lock (`insights_status`/`insights_triggered_at`,
  migration 026) and answers 202 while the LLM chain (posts → stored fallback → profile →
  benchmark) continues in `after()` under `maxDuration = 120` with per-call timeout budgets.
  The client polls the new GET on the same route; stored payloads still echo synchronously.
- All settle writes are claim-guarded (a re-submitted profile URL mid-generation is never stomped),
  a stale-pending backstop (150s) fails dead runs fast, and the reveal loader failsafe widened to
  30s since waiting is now productive. Event dictionary + feature spec 231 updated.

## 2026-07-17 — Hosted Stripe Checkout as the default purchase flow

- **`CHECKOUT_UI` switch** in `config/pricing.ts` (`'hosted'` default, `'embedded'` to flip back):
  one flip switches the API route and both purchase surfaces (onboarding paywall + upgrade dialog).
- **Hosted mode**: `/api/billing/checkout` creates a `ui_mode: 'hosted_page'` session and returns
  `{ url }`; the client redirects to checkout.stripe.com. Return lands on
  `/dashboard?checkout=success|cancelled&plan&source` - the onboarding paywall resumes and calls
  `finishOffer(true)`, the upgrade provider reopens its dialog in the success state; params are
  stripped from the URL. `upgrade_success` from a hosted return carries `reason: 'hosted_return'`.
- Checkout lifecycle events now carry `ui: hosted|embedded`; abandoned = cancel-URL return in
  hosted mode (event dictionary updated). Verified in the browser: session create, hosted page
  render, cancel return (URL cleaned), and success return (dialog opens confirmed state).

## 2026-07-17 — Legal pages, cookie consent, pricing copy fix

- **`/privacy` and `/terms` pages** (app/(main)/, prose layout matching the design system), linked
  from the footer bottom bar and the sitemap. Content reflects the real stack: anonymous Supabase
  accounts, optional email/LinkedIn, the public-profile audit (Scrapingdog + Bright Data), OpenAI
  processing, PostHog EU + masked replay, Stripe ($11.99/mo, $39.99 lifetime, 7-day money-back),
  Featurebase support, Tally. Contact: support@linkedinpreview.com; Italian governing law.
- **Cookie consent banner** (bottom-left, all surfaces except /embed): PostHog now boots cookieless
  (memory persistence, no replay) until the visitor accepts; accepting upgrades PostHog to
  persistent cookies + replay at runtime and loads GTM (which no longer loads pre-consent).
  Declining keeps cookieless mode permanently. State in `lp-consent` localStorage key.
- **Pricing copy**: post-founding lifetime price on the paywall ticket corrected to $69
  (`OB_TICKET.nextPrice`); founding window confirmed at 2026-07-31. No live surface still shows the
  old $7.99/$29.99 prices (verified by grep).

## 2026-07-17 — Featurebase messenger portal rollout (phases 2-4)

- **Theme sync**: the messenger follows the dashboard's light/dark theme - boot theme from
  next-themes `resolvedTheme`, runtime toggles via `setTheme` (applied once the messenger root
  exists; the SDK drops calls made before boot and its `whenReady` lives in a different bundle
  instance than the react entry).
- **Sidebar "Help & Feedback" opens the messenger** (`useFeaturebase().show`) instead of the Tally
  popup; all other Tally surfaces (public FAB, footer link, post-copy popup) unchanged.
- **JWT identity**: new `GET /api/featurebase/jwt` signs an HS256 identity token (jose) for the
  authenticated Supabase user (`userId` = Supabase user id, same person id as PostHog; `name` from
  the branding profile with fallbacks, `email` when known). Inert 503 until
  `FEATUREBASE_JWT_SECRET` is set (billing-style pattern). `FeaturebaseIdentity` fetches it once
  auth is ready and upgrades the anonymous messenger session in place.
- **Shutdown wiring**: `shutdown()` before reload at the three identity-ending points - settings
  "Reset All Data", debug-menu "Clear everything", and the LinkedIn login-switch - so the next
  user on the same browser cannot see the previous messenger state.

## 2026-07-17 — Launch prep: landing plan CTAs, env sync, open-source hygiene

- **Landing pushes the onboarding funnel**: new `PlanCta` home section ("Grow 10× on LinkedIn in
  90 days" → Create my LinkedIn plan), navbar primary CTA swapped to "Create my plan", footer
  Product link, and the tool's post-nudge toast + bottom bar reframed around the free audit/plan
  (drafts still carry over via `?import=`). All tracked as `cta_button_clicked` with
  `button_name: 'create_plan'` and per-surface `source`.
- **All runtime env vars pushed to Vercel production** (service-role key, scraper keys, LinkedIn
  OAuth, cron secret joined the Stripe set); branch previews carry test-mode Stripe.
- **Open-source hygiene**: `.claude/` + `.agents/` + the local funnel routine script are fully
  gitignored (internal ops stay off the public repo); docs sanitized; tracked tree verified free
  of secrets and `.env` confirmed never committed.

## 2026-07-16 — Stripe billing wired for launch

- **Pricing set to $11.99/mo + $39.99 lifetime** (`config/pricing.ts`), matching the live Stripe
  prices; test-mode twins created for local/preview. Live webhook endpoint
  (`/api/billing/webhook`: checkout completed + subscription updated/deleted) and Customer Portal
  configurations (test + live) created via API; all five `STRIPE_*` env vars set on Vercel
  (production = live, branch previews = test).
- **Plan & billing settings card**: shows the current plan (free/pro/lifetime) with renewal date;
  "Manage subscription" opens the Stripe Customer Portal via the new `POST /api/billing/portal`
  (cancel, payment method, invoices). `PlanProvider` now exposes the full billing row.
- **Upgrade dialog success panel** replaces the toast-and-close after purchase; the onboarding
  confirm step remains the funnel's success screen.
- Verified end to end in test mode: paywall → embedded checkout → signed
  `checkout.session.completed` → webhook 200 → `billing` row → UI flips paid; settings → portal.

## 2026-07-16 — New logo rollout + app-wide theming

- **Logo replaced everywhere.** New warm-gradient mark: master vector at `public/images/logo.svg`
  (served directly in the header, footer, and dashboard sidebar via `next/image` `unoptimized` for
  crisp rendering at any zoom); regenerated rasters for `logo-rounded-rectangle.png`,
  `logo-with-text.png` (new single-line Bricolage lockup), the full favicon set (ico/16/32/180/192/384,
  mstile, black safari-pinned-tab silhouette), and the `og.png` badge. Blur placeholders removed from
  icon-sized logos (the placeholder bled through transparent corners as a halo).
- **Theming unified.** `ThemeProvider` moved from the dashboard layout to the root layout
  (system default, class attribute): light and dark now work across the entire site and navigating
  dashboard <-> landing no longer flips the theme. `/embed` forces light for third-party hosts.
  Dark-mode fixes on public pages: scrolled header glass now mixes `--background` (was light-only
  `--paper`), hero GitHub pill and hero-cta outline button use `bg-card` instead of `bg-white`.

## 2026-07-12 — Onboarding funnel observability + autonomous monitoring loop

- **Identity stitching + event hardening.** `AuthProvider` now calls `posthog.identify(userId)`,
  so PostHog persons join 1:1 with `onboarding_sessions`/`billing`. Every `onb_*` event carries
  `funnel_version` (v3, `config/analytics.ts`); new client events: `onb_step_completed`
  (per-step `duration_ms`), `onb_flow_complete`, `onb_checkout_opened/failed/abandoned`.
- **Server-truth events** (`lib/analytics/server.ts`, posthog-node inside `after()`): the
  enrich/status/insights/first-post routes report provider tier, scrape settlement, insights
  degrade reason, and latency; the Stripe webhook emits `purchase_completed` (conversion truth)
  and `subscription_canceled`. `onb_rate_limited` fires on any onboarding 429.
- **Agent-facing SQL views** (migration 023, service-role only): `onboarding_funnel_daily`
  (daily rollup) and `onboarding_drop_detail` (per-session, PII-free).
- **Autonomous monitoring loop**: four project skills (`.claude/skills/funnel-{data,health,audit,experiment}`),
  launchd routines (daily health check 08:17, weekly audit Mon 08:47 via `scripts/funnel-routine.sh`),
  email alerts on threshold breach, hypotheses filed as `funnel`-labeled GitHub issues. Docs:
  `docs/analytics/onboarding-funnel.md` (event dictionary) + `docs/analytics/monitoring.md` (the loop).
- **Experiment surface**: `config/onboarding-experiments.ts` + `hooks/use-ob-experiment.ts`
  (PostHog flag-gated copy variants, control-fallback; welcome hero wired as the plumbing check);
  experiment history in `docs/experiments/log.md`. Honesty invariants and pricing are excluded
  from the experiment surface by rule.

## 2026-07-04 — Onboarding v2: two-tier profile enrichment, insight cards, server-side session capture

- **Two-tier LinkedIn enrichment.** FAST tier (live Mirror screen, ~3-8s): Scrapingdog LinkedIn profile
  API (`SCRAPINGDOG_API_KEY`, new) with the JSON-LD direct fetch as fallback (`lib/linkedin/public-profile.ts`;
  the always-timing-out synchronous Bright Data `/scrape` attempt was removed). RICH tier (async 42-60s):
  Bright Data People Profile dataset via explicit trigger + poll (`lib/linkedin/rich-scrape.ts`) - the
  enrich route triggers it when a URL is submitted, `GET /api/onboarding/enrich/status` polls/downloads,
  and a single modal-level hook (`use-rich-pipeline.ts`) drives polling + insights so step remounts
  can't reset it. Scrape state (`richStatus`/`richSummary`/`insights`) lives in answers → localStorage,
  so reloads and the OAuth round-trip resume the pipeline.
- **Flow reordered so the scrape hides behind the questions:** new machine
  `welcome → connect → mirror → goal → voice → cadence → reinforce → building → insights → preview → recap → offer → done`.
  `proof` + `spotlight` steps removed (spotlight became a gap-prescribed feature row on the recap);
  `STEP_ORDER` moved to `types.ts` with `StepId` derived from it; legacy saved resume steps map to
  survivors. `building` holds up to 12s extra while the scrape lands and names real work
  ("Reading your last N posts").
- **NEW insights step** (`steps/insights-step.tsx`): three sequential pre-offer cards - topic mix
  (server-counted from LLM labels), the missing content category, and the cadence gap (observed
  posts/week from real post dates vs the chosen plan). `POST /api/onboarding/insights` does ONE
  generateObject call with a label-only schema; the server counts, verifies topic evidence by post
  index, and substring-verifies the voice excerpt. Degrades: posts → profile → static benchmark kind
  (no LLM), and the step renders a config-based benchmark variant if nothing arrives (20s failsafe).
- **Honesty pass:** fabricated `socialProofCount` deleted; `reinforce` now shows role-keyed benchmark
  patterns (`ROLE_BENCHMARKS`) + the user's real follower count when scraped. Every number on screen
  is a deterministic count or benchmark-framed config copy.
- **Personalization everywhere:** cadence step shows the observed posting rhythm; voice step explains
  its preselection; preview writes the first post to fill the diagnosed gap (`gapCategory`) using
  2-3 real scraped posts as style references (server-read, `styled` flag drives "written in your
  voice" copy); recap gains an analysis echo row + gap-matched feature row; offer echoes the
  strongest insight headline.
- **Server-side capture for analysis:** new `public.onboarding_sessions` table (migration `020`,
  applied to the live DB) - answers (debounced from the controller), fast/rich profiles, posts,
  enrichment, insights, completed/converted. RLS-scoped; no service-role usage. New `onbInsights`
  rate-limit action (3/day). Migration `021` (also applied) adds `fast_raw`/`rich_raw` columns
  holding the COMPLETE provider payloads verbatim (Scrapingdog record incl. experience/education/
  articles; full Bright Data snapshot record) so nothing from the paid API calls is lost.
- **Branding arrives populated:** at finish, the scraped About lands in `knowledgeBase.notes`,
  `writingStyle.sentenceLength`/`emojiFrequency` are inferred deterministically from their real
  posts (`inferStyleHints` in `lib/linkedin/rich-scrape.ts`), and `expertise.topics` falls back to
  `insights.currentTopics` - on top of the existing profile/role/positioning/tone-note writes.
- type-check + lint clean; reviewed via a 4-lens adversarial workflow (findings fixed in-place).

## 2026-07-02 — Onboarding: progress/width polish, answer persistence, LinkedIn-URL error handling

- **Progress bar** is now a thin full-bleed strip flush at the top of the content panel (reads as its
  top border); removed the `Step N` / `%` meta row (`onboarding-modal.tsx`).
- **Uniform step width:** one shared content width (`max-w-[520px]`, was 580) across all steps; removed
  `connect-step`'s `max-w-[340px]` cap that made it narrower. `BrandStage` widened
  (`clamp(320px,40%,520px) → clamp(340px,43%,540px)`) so the content panel is a touch smaller.
- **Answer persistence / remount trap:** steps render inside `AnimatePresence mode='wait'`, so nav
  remounts them and wipes local `useState`. Moved `welcome-step`'s selection into
  `answers.welcomeSelections` and the mirror manual-fallback flag into `answers.mirrorManual` so
  back-navigation restores state instead of resetting it.
- **Pasted LinkedIn URL that can't be read** no longer drops silently onto the manual form: `mirror-step`
  shows an explicit error ("We couldn't read that profile") with **Continue manually** / **Try a
  different URL** when `hasUrl && lowConfidence && !mirrorManual`. `connect-step` clears
  `enrichConfidence` (+`mirrorManual`) on URL submit so re-submits re-fetch; the controller drops
  `profileUrl`+`enrichConfidence` on successful OAuth so a connected identity re-enriches. Reliable
  production fetching needs `LINKEDIN_SCRAPE_API_URL` set to a residential-proxy HTML scraper
  (e.g. ScrapingBee) — LinkedIn blocks datacenter IPs.
- **Uniform question font:** promoted `goal-step`'s `Question` heading (19px) into `primitives.tsx` and
  reused it in `voice-step` so its prompts match the other data steps (were 14px `FieldLabel`s).
- type-check + lint (0 errors); verified via a multi-lens adversarial review.

## 2026-06-30 — Onboarding: manual-flow overhaul + StrictMode loading-hang fix

- **Fixed "Building your system" hanging forever** in dev. Root cause: React StrictMode runs an effect
  setup→cleanup→setup; the old building/mirror effects set `cancelled=true` + cleared their failsafe on
  cleanup, then early-returned on a `ranRef` in the second setup, so nothing re-armed the failsafe or
  advanced. Reworked both `building-step.tsx` and the `mirror-step.tsx` enrich effect to `startedRef`
  (guards the AI run once) + `advancedRef`/`settledRef` (idempotent commit) + a failsafe re-armed on
  every mount, dropping the per-mount `cancelled` gating.
- **Flow reorder:** inserted a new `reinforce` social-proof step after `mirror`, and moved `voice`
  before `preview` so the first generated post reflects the chosen tone. New machine:
  `welcome → connect → mirror → reinforce → goal → proof → voice → preview → spotlight → cadence → building → recap → offer → done`.
- **Welcome** is now multi-select (Continue button; "Other" preserves seeded goals) and the "Skip setup"
  escape was removed (plumbing deleted from context/modal/controller). **Connect** copy shortened.
  **Mirror** manual form now collects name + role + niche (a `NICHE_OPTIONS` dropdown) and requires
  them; voice/notes moved to the dedicated Voice step. **Goal** questions restyled to stand out, skip
  removed. **Reinforce** shows a deterministic, fabricated-but-stable count (`socialProofCount`).
- **Layout test:** brand image moved to the right (`max-md:flex-col-reverse`), content left-aligned,
  setup-tick stepper removed from the brand stage; swapped the hazy welcome illustration for a crisp one.
- New in `config/onboarding-personalization.ts`: `ROLE_LABELS`, `rolePlural`, `NICHE_OPTIONS`,
  `socialProofCount`. type-check + lint (0 errors); build not run (dev server holds `.next`).

## 2026-06-22 — Analytics: split LinkedIn analytics onto a separate app (App B)

- LinkedIn requires the **Community Management API to be the only product on an app**, so member post
  analytics can't share the existing Sign In + Share app (App A). Refactored the analytics integration
  to a **two-app model**: App A keeps login/publishing; a new **App B** holds the Community Management
  API and member post analytics. Members connect LinkedIn twice (publishing + analytics).
- New: `LINKEDIN_ANALYTICS_CLIENT_ID/_SECRET/_REDIRECT_URI` (replaces the `LINKEDIN_ANALYTICS_ENABLED`
  flag); `isLinkedInAnalyticsConfigured` / `linkedInAnalyticsRedirectUri` / `LINKEDIN_ANALYTICS_SCOPES`;
  App B OAuth helpers + `app/api/linkedin/analytics/{auth,callback}`; token store
  `linkedin_analytics_connections` (migration 017) via `lib/linkedin/analytics-connections.ts`.
- The import/sync now use **App B's token** for analytics calls and reuse the **App A** connection's
  person URN as the post author. The "Sync from LinkedIn" button now first offers **Connect for
  analytics** (App B consent), then imports. Still inert until App B is configured + connected.
- type-check, lint (0 errors), build pass.

## 2026-06-21 — Analytics: import existing LinkedIn posts via API (230-AC-12)

- **The dashboard only knew about posts created in the app**, so a member with a long LinkedIn history
  but no in-app published posts saw the empty state. Added an on-demand **API import** that backfills
  their existing LinkedIn posts (history + text + recent metrics) as `published` posts so they appear
  in analytics, Content DNA, and the per-post table.
- New: `lib/linkedin/import.ts` (`fetchMemberPosts` via the Posts API author finder, commentary ->
  TipTap), `app/api/analytics/import-linkedin/route.ts` (GET availability + POST import: dedup by URN,
  create published-post records, best-effort metrics for the recent batch; rate-limited `import` action,
  migration 016), `createImportedPublishedPost` / `findDraftIdByLinkedInUrn` in `lib/supabase/drafts.ts`,
  and a self-hiding `import-linkedin-button.tsx` (empty state + page header).
- **Inert until enabled.** Gated by the same `LINKEDIN_ANALYTICS_ENABLED` + `r_member_postAnalytics`
  (Community Management API) gate as the sync cron; the button self-hides otherwise. The posts
  author-finder/response shape is best-guess against current docs and needs live re-verification on
  first enable. type-check, lint (0 errors), build pass.

## 2026-06-19 — Carousel creator (Wave 3, features 210-212)

- **Shipped the carousel creator at `/dashboard/carousel`** (sidebar "Carousel" is now live, not "Soon").
  A DOM-based slide/canvas editor for LinkedIn carousel (PDF document) posts: a slide rail
  (add / duplicate / delete / drag-reorder), a fixed-artboard canvas with selectable, draggable,
  resizable, rotatable elements (text via TipTap, image, shape, icon), alignment snapping, multi-select,
  keyboard nudge/delete/duplicate, and batched undo/redo. A contextual inspector edits the element,
  the slide background/role, and the deck theme/ratio/branding chrome.
- **Editor store.** A scoped `useSyncExternalStore` store (`lib/carousel/store.ts`, bound in
  `use-carousel-store.tsx`) with immutable updates and gesture-coalesced history - deliberately not a
  global state library, per conventions. Switching aspect ratio re-lays-out elements proportionally.
- **14 templates + 11 themes.** Typed slide-role template library (`lib/carousel/templates.ts`) and a
  3-tier design-token theme system with hex palettes (never the app's oklch vars, so export is
  fidelity-proof) and self-hosted Google Font pairings (`lib/carousel/{theme,fonts}.ts`).
- **AI generation.** `/api/carousel/generate` turns a topic, pasted text, or article URL (reusing
  `/api/extract`) into a themed, branding-aware deck; `/api/carousel/edit` powers per-slide
  rewrite / shorten / punch-up. Both mirror the existing `generateObject` route shape (auth, rate
  limit `carouselGenerate`, OpenAI provider) and treat user/branding content as inert reference data.
- **Export.** Client-side, watermark-free: each slide rasterized at 2x via `modern-screenshot`
  (foreignObject, so webfonts/emoji/gradients paint correctly), assembled into a flattened multi-page
  PDF with `pdf-lib`, or a ZIP of per-slide PNGs + the PDF via `fflate` (`lib/carousel/export.ts`,
  lazy-loaded). Download PDF is the primary path; native document publishing is a later best-effort add.
- **Persistence.** Carousels live in the existing `drafts` table, discriminated by a new `kind` column
  (migration 013, defaults `'post'`). `useDrafts` is now kind-scoped so carousels and text posts stay
  in separate surfaces while sharing one table and CRUD. New runtime deps: `modern-screenshot`,
  `pdf-lib`, `fflate`. Plan: [plans/carousel-creator.md](plans/carousel-creator.md).

## 2026-06-19 — Analytics dashboard (Wave 5, feature 230)

- **Shipped the Analytics dashboard at `/dashboard/analytics`** (sidebar "Analytics" is now live, not
  "Soon"). Headline KPI cards (published, impressions, engagements, avg engagement rate) with
  animated counters, 30-day deltas, and sparklines; an engagement-over-time chart (30 / 90 / all);
  a publishing-activity heatmap + streak and a draft -> scheduled -> published -> failed pipeline;
  content insights (top formats, length, best day); a golden-hour day x time grid; and a per-post
  performance table. New `components/dashboard/analytics/*`, pure aggregation in `lib/analytics/*`.
- **Layered metrics model (no LinkedIn API dependency to start).** New `post_metrics` table (migration 012) stores one engagement snapshot per published post. Members enter metrics by hand
  (`metrics-entry-dialog`) or import a LinkedIn CSV export (`lib/analytics/csv.ts`, matched to posts
  by stored URL). Null counts are treated as "unknown", never zero.
- **Content DNA correlation engine.** `lib/analytics/content-dna.ts` relates deterministic content
  features (media, length, hashtags, hook style, structure, format, posting day) to the member's own
  engagement and surfaces the strongest "drivers" (lift vs their baseline) once 4+ posts have metrics.
- **AI Insights coach.** `POST /api/analytics/insights` builds a server-side digest from the member's
  RLS-scoped data and generates grounded wins/opportunities/experiments + a next-post recommendation
  (`generateObject`, rate-limited 5/day via the new `insights` action, migration 014). Results are
  persisted per user (migration 015) so they show across devices. Day/time advice uses the client's
  timezone offset so it matches the dashboard.
- **LinkedIn auto-sync scaffold (inert).** `lib/linkedin/analytics.ts` + `app/api/cron/sync-analytics`
  pull `memberCreatorPostAnalytics` when `LINKEDIN_ANALYTICS_ENABLED` is set and the app holds the
  `r_member_postAnalytics` scope (LinkedIn Community Management API approval). Off by default; the
  dashboard runs on manual/CSV metrics until then. Spec: `docs/features/230-analytics-dashboard.md`.

## 2026-06-19 — Onboarding rebuild + dashboard UX foundations

- **Rebuilt onboarding from a placeholder into an interactive setup wizard (068).** The old 4-slide
  tutorial dialog (gray "video" placeholders, set no data) was replaced with a non-dismissable,
  animated 11-step flow: Welcome → Connect LinkedIn → Profile (with a live LinkedIn preview card) →
  Role → Goals → Audience → Expertise → Writing style → Cadence → an animated "Building your setup"
  payoff (calls `/api/strategy/{positioning,formats}` in parallel) → a "You're all set" reveal with
  on-brand confetti. Reuses the existing strategy `wizard-steps/*` and writes branding + strategy
  once at the end, so the happy path lands a fully-configured account. New
  `components/dashboard/onboarding/*` (controller, modal, steps, types, confetti).
- **Gate moved off the per-device localStorage flag.** Onboarding is now gated by
  `branding.meta.onboardedAt` (new `BrandingMeta` on the branding JSONB - no migration; merged in
  `lib/supabase/branding.ts`), so it is per-user and survives across devices. Pre-existing users
  (with a strategy or role) are silently backfilled so they are never re-prompted. The old
  `tutorial-dialog.tsx` + `lp-tutorial-seen` flag were removed.
- **LinkedIn redirect-resume.** Because OAuth navigates away, the LinkedIn step stashes wizard state
  in `localStorage` (`lp-onboarding-state`); the controller (mounted in the dashboard layout, which
  also wraps `/dashboard/settings` where the callback lands) rehydrates on return, prefills the
  synced profile, advances past the step, and cleans the URL.
- **UX foundations (from the dashboard polish plan).** Added `lib/motion.ts` (shared `EASE_OUT` +
  variants, `MotionConfig reducedMotion="user"`), a global 3D "clicky" treatment on the shadcn button
  (layered shadow, hover lift, active depress, reduced-motion safe), a reusable
  `components/dashboard/empty-state.tsx`, and a `currentColor`/`--primary` illustration set
  (`components/dashboard/illustrations/*`). Skeleton shimmer intentionally skipped (already exists).
  Confetti uses Framer Motion (no new dependency). [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) updated.
- **Verification level (honest).** `pnpm type-check`, `pnpm lint` (baseline; 2 pre-existing
  warnings), and `pnpm build` (all routes incl. `/dashboard`) pass. The end-to-end runtime flow is
  **not** yet live click-through tested and the change has **not** been through the code-quality
  review gate; feature 068's ACs are code-verified with `file:line` evidence. Tracked under the
  68 feature spec's known-gaps.

## 2026-06-17 — LinkedIn as login: account conversion, resolution & switching (PARTIAL)

- **Connect now establishes identity, not just a publish token (220).** On first connect the
  anonymous Supabase session is converted into a real, email-backed account: the LinkedIn email is
  linked (email-confirmation link handled by a new `app/auth/confirm/route.ts`), and the name/avatar
  seed the auth-user metadata and branding profile (empty-fill, never clobbering customisations).
  New `lib/linkedin/identity-sync.ts`.
- **LinkedIn doubles as login.** `app/api/linkedin/callback` now resolves the OAuth-verified
  `linkedin_sub` against existing accounts (`findUserIdByLinkedInSub`, service-role) and branches:
  attach (new identity) / reconnect (same account) / **login-switch** (identity owned by another
  account + anonymous session → sign into it) / **block** (current session is a different saved
  account). The switch mints the target account's session server-side
  (`admin.generateLink('magiclink')` → `verifyOtp`) in new `lib/linkedin/account-link.ts`. When the
  anonymous session has drafts, the switch is deferred to a new `app/api/linkedin/switch` route behind
  a "bring your drafts?" prompt (`MergePromptDialog`); the `{from,to}` pair travels in a short-lived
  AES-GCM-encrypted httpOnly cookie so the client only sends a `merge` boolean.
- **Disconnect keeps the identity mapping.** Migration `011_linkedin_login.sql` makes `linkedin_sub`
  unique and `access_token` nullable; Disconnect now clears the token but keeps the row (via
  `disconnectConnection`) so a passwordless user can always log back in. "Connected for publishing"
  means a row exists with a non-null token; publish + cron routes skip null-token rows.
- **Sidebar profile / connect CTA.** New `components/dashboard/sidebar-profile.tsx`: avatar+name when
  connected (links to Settings, with expiry/reconnect state), or a benefit-led one-click connect CTA
  when not — rendered in the sidebar footer.
- **Still PARTIAL.** Type-check, lint, and build pass; new behaviors are code-verified with `file:line`
  ACs (220-AC-12..17). The live returning-member sign-in path (220-AC-18) shares the Wave 4 gap: no
  live LinkedIn credentials. Requires `SUPABASE_SERVICE_ROLE_KEY` set and the Supabase email template
  pointed at `/auth/confirm` with confirmations enabled (see [STATUS.md](STATUS.md)).

## 2026-06-15 — Wave 4: LinkedIn Scheduling & Publishing (PARTIAL)

- **Built Wave 4 (features 220-224).** LinkedIn OAuth + encrypted token storage, one-click publish
  from the editor (text + image/video), timezone-aware scheduling with a Vercel Cron publisher, a
  month/week content calendar with drag-to-reschedule, and phase-1 best-time-to-post suggestions.
  New: `config/linkedin.ts`, `config/best-time.ts`, `lib/linkedin/*` (oauth, crypto, posts,
  connections, serialize), `lib/supabase/admin.ts`, `app/api/linkedin/*` and `app/api/cron/publish`,
  `app/dashboard/calendar` + `components/dashboard/calendar/content-calendar.tsx`,
  `components/dashboard/{linkedin-connection,publish-controls}.tsx`, `hooks/use-linkedin-status.ts`,
  migrations `009_linkedin_connections` (table + RLS) and `010_post_scheduling` (drafts scheduling
  columns, `failed` status, `idx_drafts_due`, `claim_due_linkedin_posts` / `claim_draft_for_publish`
  RPCs), and `vercel.json` (per-minute cron). Tokens are AES-256-GCM-encrypted at rest; the publish
  route is Zod + session + connection-gated with atomic claim-for-publish; the cron is
  CRON_SECRET-authed, service-role, idempotent, with retry/permanent-failure handling. The LinkedIn
  env vars are all optional, so the features stay inert and present as "not configured" until set.

- **Marked Wave 4 PARTIAL, not SHIPPED - honest about live verification.** Type-check, lint, and
  build pass and the code-quality review returned SHIP, but **no live LinkedIn app credentials are
  configured**, so OAuth consent + token exchange, real post creation, media upload, and cron
  delivery are not end-to-end verified against LinkedIn. Each spec checks only code/build-verifiable
  ACs with `file:line` evidence and leaves the live-verification AC open. Two architectural
  constraints are recorded: self-serve apps get no programmatic refresh token (60-day token, member
  must reconnect), and per-minute scheduling requires Vercel Pro (Hobby cron runs once/day).

- **Docs: graduated 220-224 from `backlog/` to `features/` (PARTIAL)**, opened tickets
  [T-015](tickets/T-015-linkedin-oauth.md)-[T-019](tickets/T-019-best-time-to-post.md) (in-review),
  set [ROADMAP.md](ROADMAP.md) Wave 4 to IN PROGRESS with the feature links repointed, added the
  Wave 4 PARTIAL gap + a "Wave 4 setup required before it works" section to [STATUS.md](STATUS.md),
  and extended [ARCHITECTURE.md](ARCHITECTURE.md) with the `linkedin_connections` model, the new
  Draft scheduling columns, the `/api/linkedin/*` + `/api/cron/publish` routes, the new env vars,
  and LinkedIn/Vercel Cron integration rows.

## 2026-06-14 — Deployment configured (release-ready)

- **Env + Supabase configured; build verified.** `.env` now carries the LLM and Supabase keys (and
  PostHog); the Supabase project + migrations `001`-`008` + anonymous auth are set up. `pnpm
type-check` is clean, `pnpm lint` is at baseline, and `pnpm build` prerenders all 48 routes. With
  every built feature SHIPPED, the branch is release-ready: no feature work and no configuration
  blockers remain. (GTM/Tally analytics keys are intentionally left blank; the build tolerates them
  empty and analytics stay inert until filled in.) See [STATUS.md](STATUS.md) "Deployment readiness".

## 2026-06-14 — Closing PARTIAL feature gaps

- **Reconciled the inspirational-posts spec with the built design (T-014).** Corrected 088-AC-4: the
  card invites pasting LinkedIn post body text (the direct style signal), not URLs, and the card copy
  already reflected that; there is intentionally no URL ingestion. Closes the last open AC; feature
  088 (Inspirational posts) is now SHIPPED, which completes Wave 0. With this, all 63 built features
  are SHIPPED and the Foundation and Waves 0, 1, and 2 are all COMPLETE.

- **Deliberate app-wide page-view tracking (T-013).** A `PostHogPageView` client component mounted in
  the root layout (inside a Suspense boundary so public-page static generation is preserved) fires a
  snake_case `page_viewed` event on every route change, replacing reliance on autocapture defaults.
  Closes 112-AC-6; feature 112 (PostHog analytics) is now SHIPPED, which completes the Foundation
  wave.

- **Strategy dashboard gains a 6-month activity heatmap + weekly streak (T-012).** The single-month
  calendar was replaced with a rolling 26-week GitHub-style contribution grid, and a weekly posting
  streak (consecutive weeks with a post, tolerant of an in-progress current week, DST-safe) is
  computed from draft history and displayed. Both derive from pure helpers in `lib/strategy-metrics.ts`.
  Closes 201-AC-3 and 201-AC-4; feature 201 (Content strategy dashboard) is now SHIPPED, which
  completes Wave 2 (Content Strategy).

- **Custom footer + dos/donts are now enforced, not just suggested (T-011).** When the footer is
  enabled it is appended deterministically server-side to AI-generated full posts (the `posts`
  action), with word count recomputed, instead of relying on the model to comply. Dos/donts are
  injected into the generation system prompt as hard constraints for every generate action (and
  still flow as voice context for chat). Closes 085-AC-5 and 087-AC-5; features 085 (Custom footer)
  and 087 (Dos and donts) are now SHIPPED.

- **Core editor footer now shows a live word count (T-010).** The public tool's editor footer shows
  word count next to character count, computed via a shared `countWords` helper in
  `lib/content-scoring.ts` so it always matches the dashboard analyze panel. Closes 052-AC-2; feature
  052 (Character and word count) is now SHIPPED, which completes Wave 1 (Smart Content Creation).

- **URL/source generation prompt now asks for an original, attributed take (T-009).** The shared
  `posts` generation prompt instructs the model to write an original post inspired by the source
  rather than summarizing it, and to credit external sources where appropriate (with no attribution
  for the author's own notes). Closes 040-AC-6 and 040-AC-7; feature 040 (AI post generation from
  URL) is now SHIPPED.

- **Creation-wizard file picker shows audio/video as "coming soon" (T-008).** A disabled, purely
  informational "Audio / video (coming soon)" affordance now sets expectations in the file picker;
  accepted types (PDF/DOCX/TXT/MD) and the 5MB cap are unchanged, and no transcription is
  implemented (the real capability remains backlog 041). Enhancement to the already-SHIPPED feature 039.

- **Changelog page groups entries by month/year (T-006).** `/changelog` now renders entries under
  newest-first month/year headings (a pure `groupEntriesByMonth` helper in `lib/changelog.ts`)
  instead of one flat list; the sticky date column and static prerendering/metadata are unchanged.
  Closes 004-AC-6; feature 004 (Changelog) is now SHIPPED.

- **Branding context now reaches chat, analyze, and uses inspiration (T-005).** The chat assistant
  and the analyze apply-suggestion call now receive the assembled branding context, and
  `assembleBrandingContext` now includes inspirational posts and creators as a delimited style
  reference (capped for prompt budget and clamped to 5000 chars), explicitly framed as untrusted
  reference data the model must not follow as instructions. Closes 037-AC-6/AC-7, 081-AC-5,
  088-AC-5, 089-AC-5. Features 037 (Branding-aware AI), 081 (Positioning statement), and 089
  (Inspirational creators) are now SHIPPED. Feature 088 (Inspirational posts) stays PARTIAL: its AI
  wiring is done, but the card's "paste a post URL" claim still does not match the free-text input
  (now tracked by T-014).

- **Post statuses are now user-settable (T-003).** The dashboard editor header has a status control
  (Draft / Scheduled / Published) next to the format label; the choice persists to the draft and the
  posts-list status filter reflects it. This is a manual status label only - it does not publish to
  LinkedIn (real publishing/scheduling remains Wave 4). Closes 063-AC-4; feature 063 (Post statuses)
  is now SHIPPED.

- **Weekly idea "Create Post" now seeds a draft + ideas are dismissable (T-004).** Clicking Create
  Post on a weekly AI idea creates a new draft pre-filled with the idea's hook and carrying its
  format label, then opens it in the editor (reusing the creation-wizard path); each idea card also
  has a dismiss control that removes the idea from the current week and persists via the strategy
  record. Closes 202-AC-4 and 202-AC-5; feature 202 (Weekly AI post ideas) is now SHIPPED.

- **Branding profile now drives the post preview + avatar cropping (T-002).** The dashboard editor
  preview shows the user's branding name, headline, and uploaded avatar (with a placeholder fallback
  for the logged-out homepage, embed, and chat preview), and the avatar upload now opens a square
  crop dialog (drag-to-reposition, zoom, keyboard-pannable) before saving. Closes 080-AC-2 and
  080-AC-5; feature 080 (Profile section) is now SHIPPED and the 021 preview author gap is resolved.

- **Wired the LabelPicker into the dashboard editor (T-001).** Users can now assign, change, or
  clear a draft's content-format label from the editor header; the selection persists to
  `drafts.label` and survives reload, and the chosen label shows in the posts list and matches the
  format filter. Closes 064-AC-6; feature 064 (Post format labels) is now SHIPPED.

## 2026-06-14 — Documentation overhaul + quality gate

- **Fact-checked every built feature against the code.** Created/standardized 63 feature specs in
  each feature spec, with stable `NNN-AC-K` acceptance criteria checked only against `file:line`
  evidence. SHIPPED specs live in [features/completed/](features/completed/); PARTIAL specs in
  [features/](features/). Result: 46 SHIPPED, 17 PARTIAL. The fact-check corrected several false
  "Live" claims, including: changelog month/year grouping (not implemented), the in-editor "iPhone
  frame" toggle (actually a 3-way width switcher), the post preview author (hard-coded, not from
  branding), post `scheduled`/`published` statuses (no UI to set them), weekly-idea "Create Post"
  (no hook pre-fill / draft), branding-aware chat and inspiration fields (stored but never sent to
  AI), and AI-from-file audio/video support (does not exist).
- **Organized features into [completed/](features/completed/) (SHIPPED) vs [features/](features/)
  (PARTIAL)** and gave every [ROADMAP](ROADMAP.md) wave table a single linked feature column plus a
  status column.
- **Blog (002): dropped reading-time from scope and marked it SHIPPED.** Reading-time display was
  never implemented and is no longer a requirement; title-only search remains a non-blocking known
  limitation.
- **038 (post from voice): reclassified PARTIAL -> SHIPPED.** All ACs pass; the unverifiable
  mobile/Web-Audio claims were already moved to known-gaps, so PARTIAL was a stale label.
- **ROADMAP per-wave breakdown.** Every wave table now lists each feature on its own row (no
  aggregated ranges), with a status column, and a "To complete this wave" checklist. Built waves are
  labeled by completion (e.g. "Wave 0 - IN PROGRESS, 16 of 23 SHIPPED") rather than COMPLETE while
  features remain PARTIAL.
- **Tickets for every PARTIAL.** Added T-006..T-013 (changelog grouping, preview-toggle alignment,
  audio/video source, URL prompt quality, word count, footer + dos/donts enforcement, multi-month
  heatmap + streak, page-view tracking) and extended T-002 (avatar cropping) and T-005 (analyze
  apply-suggestion) so every PARTIAL feature maps to a ticket.
- **Roadmap made comprehensive.** Added a "Foundation: Public Tool & Site" section (the pre-dashboard
  product: public site, core editor, feedback/analytics) and moved every previously-unlisted built
  feature into a section, so all 63 built + 18 backlog specs appear in exactly one roadmap section.
  Documented the placement rule: `features/` once a feature's wave has started, `backlog/` until then.
- **022 (preview size toggle): decision - keep the 3-way fixed-width switcher.** Retired the
  binary-toggle and 375px-iPhone-frame criteria (former 022-AC-1/AC-2); 022 is now SHIPPED. Closes
  T-007.
- **039 (post from file): audio/video moved to backlog.** Split audio/video transcription into new
  backlog feature [041](backlog/041-audio-video-post-source.md); 039 (PDF/DOCX/TXT/MD) is now
  SHIPPED. T-008 re-scoped to a "coming soon" affordance in the file picker.
- Counts after these decisions: **48 SHIPPED, 15 PARTIAL** (63 built); backlog now 18 features.
- **Adopted the luminars docs conventions.** Added [STATUS.md](STATUS.md) (the one-screen honest
  snapshot, folding the former `RELEASE_READINESS.md`), this changelog, [backlog/](backlog/) for
  planned work, and [tickets/](tickets/) for work in flight. Moved the 17 not-yet-built features
  (waves 3-6, SEO template libraries) into the backlog.
- **Opened gap tickets** T-001..T-005 in [tickets/](tickets/) for the highest-leverage honesty
  gaps, so the PARTIAL list is actionable.
- **Added the quality gate.** Ported the `code-quality-reviewer` agent
  ([.claude/agents/code-quality-reviewer.md](../.claude/agents/code-quality-reviewer.md)) adapted
  to this stack, a CI workflow ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) running
  type-check / lint / build, and the [process/development-workflow.md](process/development-workflow.md)
  mandatory-review process doc.
- Rewrote [PRODUCT.md](PRODUCT.md) so every feature row links to its spec and carries a verified
  status, and refreshed [\_INDEX.md](_INDEX.md).

## Earlier — product history (pre-overhaul, reconstructed from git)

- **Wave 2 — Content Strategy.** 7-step strategy wizard persisted to Supabase, strategy dashboard,
  and weekly AI post ideas (`/api/ideas`). Migrations `007_strategy`, `008_add_ideas_action`.
- **Wave 1 — Smart Content Creation.** AI generation from notes/voice/file/URL, hook suggestions,
  quick actions, content scoring panel, AI suggestions, branding-aware generation.
- **Wave 0 — Dashboard Foundation & Branding.** Sidebar app shell, Supabase anonymous auth with
  RLS, multi-draft management, branding page, settings, and the integration of the pre-existing AI
  chat/generation/analysis into the dashboard.
- **Pre-Wave 0 — the free tool.** Public site (landing, blog, changelog, compare, SEO infra) and
  the login-free TipTap editor with live LinkedIn preview, feed preview, copy-to-clipboard, and
  draft-sharing URLs.
