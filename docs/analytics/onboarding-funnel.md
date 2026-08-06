# Onboarding funnel - event dictionary & data model

> The canonical reference for onboarding observability. Every analysis (human or
> agent) must use these definitions. Feature spec: `docs/features/completed/231-onboarding-audit-funnel.md`.

## Identity model

- Dashboard visitors get an **anonymous Supabase auth user**. `AuthProvider` calls
  `posthog.identify(userId)` on session init, so the PostHog person id == the Supabase
  `user_id` == `onboarding_sessions.user_id` == `billing.user_id`. Everything joins on it.
- Events fired before the identify lands (public pages) belong to the device's anonymous
  person and merge into the identified person when the dashboard loads.
- PostHog is **uninitialized in dev** (client) and **inert outside production** (server
  helper `lib/analytics/server.ts`). Vercel previews run `NODE_ENV=production` and DO
  capture - filter by `$host` when analyzing.

## Funnel definition

`funnel_version: v3` = the 17-step audit funnel. Step order:

```
welcome → connect → fetching → reassure          (section 1: Connect)
→ goal → persona → recap → proof                 (section 2: Personalize profile)
→ voice → topics → schedule → reinforce          (section 3: Personalize content)
→ building → reveal → email → buildplan → paywall → confirm   (section 4: Audit & plan)
```

**The funnel does not start at `welcome`.** Two loss boundaries sit before the first
`onb_step_view`, and together they have historically been larger than every in-flow step
combined. Any analysis that opens at `welcome` inherits a closed-system model of a flow
users did not ask to be in, which is precisely how the largest leak went unexamined for
weeks. Always measure, in this order:

```
site visitor  ->  reached a dashboard entrypoint  ->  onb_step_view[welcome]
              ->  onb_welcome_start  ->  the 17 steps below
```

- **visitor -> entrypoint**: most traffic never reaches the flow at all. Size it before
  concluding anything about in-flow conversion; a fix that lifts a step nobody reaches is
  worth less than one that routes more people to it.
- **welcome -> `onb_welcome_start`**: arrivals who see the offer and never begin. This is a
  relevance signal, not a UI signal - read it against `entry_source` (below) and against
  what the clicked CTA promised.

The in-flow funnel is `onb_step_view` filtered per step, in this order, plus
`onb_flow_complete` as the terminal node. Conversion = `purchase_completed` (server
truth) between `onb_step_view[paywall]` and 1h after, **filtered to `amount_total > 0`**

- 100%-off comp codes issued to internal testers complete a real checkout and fire the
  event with `amount_total = 0`. The Supabase `paid` counters cannot tell a comp from a
  purchase, so PostHog is the conversion truth while comp codes are live.

Every `onb_*` event carries `funnel_version` (from `config/analytics.ts`). Bump it on any
structural change (step added/removed/reordered); copy experiments keep the version
(PostHog auto-attaches `$feature/<flag>` properties for variant splits).

## Entry attribution (`entry_source`)

Every `onb_*` event also carries `entry_source`: the surface that sent the user into the
dashboard, and therefore into the flow. Taxonomy lives in `config/entry-sources.ts` and is
grouped by what the CTA **promised**, which is the axis that predicts conversion:

| Intent     | Sources                                                                                         | What they were told                                          |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Plan/audit | `navbar`, `mobile_nav`, `mobile_nav_cta`, `plan_section`, `footer`, `tool_nudge`, `tool_footer` | a plan or an audit - matches the flow                        |
| Editor     | `hero_editor`, `features_header`, `features_card`, `showcase`, `tool_header`                    | "Open the full editor" - the majority of arrivals            |
| Branding   | `branding_popover`                                                                              | "Show your own name and photo"                               |
| Return     | `oauth_return`, `billing_return`                                                                | server redirects back into the dashboard                     |
| -          | `direct`                                                                                        | no attributable surface (typed URL, bookmark, external link) |

One source per **placement**, not per copy string: "Open the full editor" renders on four
different surfaces with an identical href, so a shared source would hide which one to fix.
The mobile sheet holds two placements and so gets two sources: `mobile_nav` is the
"Dashboard" nav row, `mobile_nav_cta` the pinned "Create my LinkedIn plan" button.

`hero` is legacy - `components/home/hero-cta.tsx` is currently mounted nowhere, so it
records nothing. The live hero button is `hero_editor`.

It is carried as a `?from=` query param on every dashboard link, NOT inferred from a click
event. A param survives keyboard activation, middle-click, and a dropped event; relying on
`cta_button_clicked` left roughly three quarters of entries unattributed. The controller
resolves it once on mount (`onboarding-controller.tsx`), hands it to `setEntrySource()` so
`track()` stamps it, and stores it on `answers.entrySource` so it lands in
`onboarding_sessions.answers` and can be joined to the paid outcome.

A **resumed** session keeps the source it started with: a later navigation's `?from=`
describes that navigation, not the original entry. That rule is for ATTRIBUTION only -
the welcome COPY resolves from the current navigation's `?from=` first (the promise the
user just clicked must be answered even on resume; `arrivalSource` in the onboarding
context), falling back to the stored source, then the default hero. Sessions started before this shipped
have no `entrySource` and resolve to `direct` - do not read pre-2026-07-31 `direct` volume
as a real acquisition channel.

Entry source is also a **content** dimension, not just a label: `config/entry-sources.ts`
maps sources to entry-coherent welcome copy, so a user who was promised one thing does not
land on a screen offering another. Sources with no entry copy fall through to the
experiment-controlled default hero.

## Client events (posthog-js via `track()` in `components/dashboard/onboarding/ai.ts`)

### Funnel spine

| Event                | Properties                  | Fires when                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onb_step_view`      | `step`                      | every screen enter (incl. revisits)                                                                                                                                                                                                                                |
| `onb_step_completed` | `step`, `to`, `duration_ms` | leaving a step (any direction); duration = time on step                                                                                                                                                                                                            |
| `onb_skip`           | `step`                      | the step's skip affordance                                                                                                                                                                                                                                         |
| `onb_flow_complete`  | `converted`                 | confirm-screen CTA into the dashboard - the true funnel end                                                                                                                                                                                                        |
| `onb_flow_dismissed` | `step`                      | modal closed via X / Escape / outside click, not finished - resumable next visit. While the `onb-modal-exit` experiment is live this only fires for the `control` variant (the `locked` variant has no exit); events carry `$feature/onb-modal-exit` for the split |

### Step interactions

| Event                                                   | Properties                                                                                                                                                                                                                                                                           | Step                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `onb_welcome_start`                                     | -                                                                                                                                                                                                                                                                                    | welcome                                                                                   |
| `onb_connect_method`                                    | `method: oauth\|url\|skip` (`skip` was removed 2026-07-18, revived 2026-07-31 as a quiet "answers-only" escape hatch instead of the fetch-failure card being the only way out - same taxonomy, same meaning, now with an honest answers-first degrade instead of a silent benchmark) | connect                                                                                   |
| `onb_connect_url_rejected`                              | `input_kind: name\|company-url\|other`                                                                                                                                                                                                                                               | connect (pasted text failed `normalizeProfileUrl`)                                        |
| `onb_oauth_result`                                      | `status: connected\|denied\|error\|session\|unavailable`, `resumable` (a saved session existed, so the flow could actually reopen)                                                                                                                                                   | connect (the OAuth round-trip returned and the controller read `?linkedin=`)              |
| `onb_fetch_done`                                        | `found`, `rich`                                                                                                                                                                                                                                                                      | fetching                                                                                  |
| `onb_fetch_failed`                                      | `reason` (same taxonomy as `onb_enrich_result.fast_fail_reason`, `'unknown'` on failsafe timeout)                                                                                                                                                                                    | fetching (URL fetch fell over client-side)                                                |
| `onb_fetch_failed_action`                               | `action: retry\|manual`                                                                                                                                                                                                                                                              | fetching failure card                                                                     |
| `onb_oauth_url_ask_view`                                | -                                                                                                                                                                                                                                                                                    | fetching (post-OAuth: connected, no profile URL - OIDC never returns one)                 |
| `onb_oauth_url_submit`                                  | -                                                                                                                                                                                                                                                                                    | fetching (OAuth-ask URL accepted, same taxonomy as `onb_connect_url_rejected` on failure) |
| `onb_oauth_url_skip`                                    | -                                                                                                                                                                                                                                                                                    | fetching ("Continue without post analysis" on the OAuth ask)                              |
| `onb_goal_select` / `onb_goal_confirm`                  | `goal` / -                                                                                                                                                                                                                                                                           | goal                                                                                      |
| `onb_persona_role` / `onb_persona_niche`                | `role` / `niche`                                                                                                                                                                                                                                                                     | persona                                                                                   |
| `onb_recap_confirm`                                     | `corrected`                                                                                                                                                                                                                                                                          | recap                                                                                     |
| `onb_recap_correct_open`                                | -                                                                                                                                                                                                                                                                                    | recap ("Something's off?")                                                                |
| `onb_voice_set`                                         | `voice`, `tone`                                                                                                                                                                                                                                                                      | voice                                                                                     |
| `onb_topics_toggle`                                     | `topic`, `selected`, `count`, `custom` (true only when typed via the free-text add)                                                                                                                                                                                                  | topics                                                                                    |
| `onb_schedule_frequency` / `onb_schedule_choose_for_me` | `frequency`                                                                                                                                                                                                                                                                          | schedule                                                                                  |
| `onb_reinforce_view`                                    | `hasFollowers`                                                                                                                                                                                                                                                                       | reinforce                                                                                 |
| `onb_building_done`                                     | -                                                                                                                                                                                                                                                                                    | building loader finished                                                                  |
| `onb_reveal_view`                                       | `kind`, `postsAnalyzed`                                                                                                                                                                                                                                                              | reveal (audit report shown)                                                               |
| `onb_reveal_continue`                                   | -                                                                                                                                                                                                                                                                                    | reveal CTA                                                                                |
| `onb_email_submit`                                      | -                                                                                                                                                                                                                                                                                    | email (bind succeeded, anon user upgraded)                                                |
| `onb_email_skip`                                        | -                                                                                                                                                                                                                                                                                    | email ("I'll do this later")                                                              |
| `onb_buildplan_done`                                    | -                                                                                                                                                                                                                                                                                    | buildplan loader finished                                                                 |
| `onb_post_ideas_ready` / `onb_post_ideas_failed`        | `count` / -                                                                                                                                                                                                                                                                          | buildplan (4 pillar posts)                                                                |
| `onb_commitment`                                        | `commitment`                                                                                                                                                                                                                                                                         | commitment popup                                                                          |

### Offer & checkout

| Event                      | Properties                                               | Meaning                                                                                                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onb_paywall_view`         | `ideas`                                                  | paywall rendered (`ideas` = real generated posts shown)                                                                                                                                                                                     |
| `onb_paywall_scroll`       | `depth: 25\|50\|75\|100`                                 | how far the offer was actually read; each milestone fires once. A paywall viewer with NO `onb_paywall_scroll` never scrolled at all, which is what distinguishes a non-reader from a decliner                                               |
| `onb_paywall_gate_blocked` | -                                                        | the CTA was clicked before the reader reached the end of the offer; the click scrolls them there instead of buying. Counts purchase intent that the old disabled button swallowed                                                           |
| `onb_offer_select`         | `plan`                                                   | plan card clicked (opens checkout)                                                                                                                                                                                                          |
| `onb_checkout_opened`      | `plan`, `ui: hosted\|embedded`                           | checkout started - embedded rendered in-modal, or redirecting to hosted Stripe                                                                                                                                                              |
| `onb_checkout_failed`      | `plan`, `reason: unconfigured\|create-failed`            | checkout could not open (user saw the free-plan fallback)                                                                                                                                                                                   |
| `onb_checkout_abandoned`   | `plan`, `via: cancel_url\|no_return_param` (hosted only) | embedded: opened checkout unmounted without payment; hosted: `cancel_url` = returned via Stripe's back link, `no_return_param` = returned via browser Back (resolved from a sessionStorage marker, so every hosted open now has an outcome) |
| `onb_purchase_success`     | `plan`                                                   | client observed the purchase (embedded `onComplete`, or hosted success return)                                                                                                                                                              |
| `onb_offer_decline`        | -                                                        | quiet "Continue on the free plan"                                                                                                                                                                                                           |

### Background pipeline (client-observed)

| Event                                        | Properties             | Meaning                                           |
| -------------------------------------------- | ---------------------- | ------------------------------------------------- |
| `onb_rich_scrape_done`                       | `status`, `postsCount` | poll saw the scrape settle while the tab was open |
| `onb_rich_scrape_timeout`                    | -                      | client gave up polling (~6 min)                   |
| `onb_rich_session_missing`                   | -                      | poll got no session row (bug signal)              |
| `onb_insights_ready` / `onb_insights_failed` | `kind` / -             | the insights kick-off + poll resolved client-side |

## Server events (posthog-node via `lib/analytics/server.ts`, distinctId = user id)

These fire whether or not the tab stays open - they are the error/latency truth.

| Event                   | Properties                                                                                                                                                                                                                                                                                                                                                                                                                            | Route                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onb_enrich_result`     | `llm_ok`, `fast_source: scrapingdog\|jsonld\|oauth\|none`, `fast_found`, `fast_fail_reason` (why the fast tier degraded: `http-<status>`\|`empty-record`\|`timeout`\|`network`\|`parse`\|`no-key`\|`html-block`\|`unknown`, null on success), `has_rich_signal`, `rich_status`, `rich_reused`, `ms`                                                                                                                                   | `POST /api/onboarding/enrich`                                                                                                                                                                           |
| `onb_scrape_settled`    | `status: ready\|empty\|failed`, `corpus: posts-dataset\|profile-activity\|null`, `authored_count`, `ms_since_trigger` (**nullable**: only reported when it's plausibly a live measurement, `<= STALE_PENDING_MS` ~6 min; a resumed session settling long after it triggered reports `null` here instead of days of wall-clock as latency), `resumed` (present and `true` only on that resumed case - absent otherwise, never `false`) | `GET /api/onboarding/enrich/status` - fires exactly once per scrape, on the poll that settles it                                                                                                        |
| `onb_insights_result`   | `kind: posts\|profile\|benchmark`, `authored_count`, `degraded_reason: llm-failed\|thin-corpus\|null`, `rich_status`, `ms`                                                                                                                                                                                                                                                                                                            | `POST /api/onboarding/insights` - once per generation run (the POST answers 202 and generates in the background past the response; the client polls GET). Never fires on the idempotent echo            |
| `onb_first_post_result` | `llm_ok`, `styled`, `gap_category`, `ms`                                                                                                                                                                                                                                                                                                                                                                                              | `POST /api/onboarding/first-post` - fires 4x per user (one per pillar)                                                                                                                                  |
| `onb_rate_limited`      | `action: onbEnrich\|onbInsights\|onbFirstPost`                                                                                                                                                                                                                                                                                                                                                                                        | any onboarding route hitting the daily cap                                                                                                                                                              |
| `onb_oauth_callback`    | `status: connected\|denied\|error\|unavailable` (onboarding returns) or `linked-elsewhere\|merge-prompt\|signin-failed\|welcome` (the account-switch exits, which end the round-trip on the settings page and therefore leave the flow)                                                                                                                                                                                               | `GET /api/linkedin/callback`, only when the round-trip started in onboarding. **Never fires for `session`** - that status means no Supabase user resolved, so there is no distinctId to attribute it to |
| `purchase_completed`    | `plan: lifetime\|monthly`, `amount_total` (cents), `currency`                                                                                                                                                                                                                                                                                                                                                                         | Stripe webhook - **the conversion truth**, no `funnel_version`                                                                                                                                          |
| `subscription_canceled` | -                                                                                                                                                                                                                                                                                                                                                                                                                                     | Stripe webhook                                                                                                                                                                                          |

## Supabase data (service-role only)

- **`onboarding_sessions`** - one row per user: raw provider payloads (`fast_raw`,
  `rich_raw`, `posts_raw`), every answer, `resume_at` (last persisted step, `'done'` =
  finished), `rich_status`, `insights_kind`, `insights_status` + `insights_triggered_at`
  (the background-generation run lock, migration 026), `completed_at`, `converted`
  (client-observed; `billing.plan` is the server truth).
- **`onboarding_funnel_daily`** (view, migration 023) - daily rollup: starts, completed,
  converted_client, paid, rich_status / insights_kind / fast_source distributions.
- **`onboarding_drop_detail`** (view, migration 023) - per-session PII-free detail:
  drop step, degrade flags, answer shape, billing plan, session_seconds.
- **`ai_usage`** - LLM call metering per action (`onbEnrich`, `onbInsights`, `onbFirstPost`).

## Known degrade modes (expected, not bugs)

1. **Fast tier**: `scrapingdog` (full identity card) → `jsonld` (reduced card) → `none`
   (manual persona form). Watch the `fast_source` mix shifting toward `jsonld`/`none`.
2. **Rich scrape**: posts-dataset corpus → profile-activity corpus (truncated previews) →
   `failed`/`unavailable` (no analysis rail, benchmark audit). Real scrapes take 42s-2.5min;
   client polls to 6 min.
3. **Insights**: `posts` (real audit) → `profile` (no post claims) → `benchmark` (static,
   never persisted - so `insights_kind is null` on a completed session usually means the
   benchmark path or insights never ran; since migration 026, `insights_status = 'failed'`
   marks that explicitly).
4. **First post**: styled (voice-referenced) → unstyled LLM → static `fallbackPost`.
5. **Checkout**: unconfigured Stripe env → `onb_checkout_failed{unconfigured}` + free-plan
   fallback (expected until billing env is live).

## Gotchas for analysis

- `onb_step_view` fires on revisits (back navigation) - use "first time" ordering or
  funnel mode "sequential" in PostHog.
- `onb_first_post_result` is 4x per user - dedupe by person for per-user rates.
- A session with `resume_at != 'done'` and stale `updated_at` is a drop; `resume_at`
  names the last step they touched, not necessarily where they got stuck emotionally
  (loaders auto-advance).
- `converted=true` without `billing.plan in (pro, lifetime)` = client observed a payment
  the webhook never confirmed (investigate). The reverse = closed tab after paying (fine).
- 2026-07-31 `ms_since_trigger` on `onb_scrape_settled` before this fix stamped wall-clock
  since trigger unconditionally, so a resumed session settling days later reported that gap
  as scrape latency (one observed sample: 367,941,450 ms) and corrupted the p90. Any p90/p95
  computed on this property from before 2026-07-31 is unreliable; recompute from events after
  that date, where the value is `null` (with `resumed: true`) whenever it isn't a live
  measurement.
- A `reveal` view can upgrade in place after first paint: the failsafe (30s) regularly fires
  before the server's ~40s p50 for a posts audit, so a benchmark/profile report shown at
  `onb_reveal_view` can still become a real posts audit a few seconds (or up to ~2 more
  minutes) later, client-side only (no repeat `onb_reveal_view`). `onb_insights_result`
  (server-side, one per generation run) is the reliable source for the final `kind` reached;
  don't assume the `kind` on `onb_reveal_view` is how the session ended.
- Session replay is toggled in the PostHog project settings (inputs are masked via
  `session_recording.maskAllInputs`); mark extra-sensitive blocks with `.ph-no-capture`.
