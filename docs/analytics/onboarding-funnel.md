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
→ building → reveal → buildplan → paywall → confirm   (section 4: Audit & plan)
```

The canonical PostHog funnel is `onb_step_view` filtered per step, in this order, plus
`onb_flow_complete` as the terminal node. Conversion = `purchase_completed` (server
truth) between `onb_step_view[paywall]` and 1h after.

Every `onb_*` event carries `funnel_version` (from `config/analytics.ts`). Bump it on any
structural change (step added/removed/reordered); copy experiments keep the version
(PostHog auto-attaches `$feature/<flag>` properties for variant splits).

## Client events (posthog-js via `track()` in `components/dashboard/onboarding/ai.ts`)

### Funnel spine

| Event                | Properties                  | Fires when                                                  |
| -------------------- | --------------------------- | ----------------------------------------------------------- |
| `onb_step_view`      | `step`                      | every screen enter (incl. revisits)                         |
| `onb_step_completed` | `step`, `to`, `duration_ms` | leaving a step (any direction); duration = time on step     |
| `onb_skip`           | `step`                      | the step's skip affordance                                  |
| `onb_flow_complete`  | `converted`                 | confirm-screen CTA into the dashboard - the true funnel end |

### Step interactions

| Event                                                   | Properties                                                                          | Step                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| `onb_welcome_start`                                     | -                                                                                   | welcome                                    |
| `onb_connect_method`                                    | `method: oauth\|url\|skip`                                                          | connect                                    |
| `onb_fetch_done`                                        | `found`, `rich`                                                                     | fetching                                   |
| `onb_fetch_failed`                                      | -                                                                                   | fetching (URL fetch fell over client-side) |
| `onb_fetch_failed_action`                               | `action: retry\|manual`                                                             | fetching failure card                      |
| `onb_goal_select` / `onb_goal_confirm`                  | `goal` / -                                                                          | goal                                       |
| `onb_persona_role` / `onb_persona_niche`                | `role` / `niche`                                                                    | persona                                    |
| `onb_recap_confirm`                                     | `corrected`                                                                         | recap                                      |
| `onb_recap_correct_open`                                | -                                                                                   | recap ("Something's off?")                 |
| `onb_voice_set`                                         | `voice`, `tone`                                                                     | voice                                      |
| `onb_topics_toggle`                                     | `topic`, `selected`, `count`, `custom` (true only when typed via the free-text add) | topics                                     |
| `onb_schedule_frequency` / `onb_schedule_choose_for_me` | `frequency`                                                                         | schedule                                   |
| `onb_reinforce_view`                                    | `hasFollowers`                                                                      | reinforce                                  |
| `onb_building_done`                                     | -                                                                                   | building loader finished                   |
| `onb_reveal_view`                                       | `kind`, `postsAnalyzed`                                                             | reveal (audit report shown)                |
| `onb_reveal_continue`                                   | -                                                                                   | reveal CTA                                 |
| `onb_buildplan_done`                                    | -                                                                                   | buildplan loader finished                  |
| `onb_post_ideas_ready` / `onb_post_ideas_failed`        | `count` / -                                                                         | buildplan (4 pillar posts)                 |
| `onb_commitment`                                        | `commitment`                                                                        | commitment popup                           |

### Offer & checkout

| Event                    | Properties                                    | Meaning                                                                          |
| ------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------- |
| `onb_paywall_view`       | `ideas`                                       | paywall rendered (`ideas` = real generated posts shown)                          |
| `onb_offer_select`       | `plan`                                        | plan card clicked (opens checkout)                                               |
| `onb_checkout_opened`    | `plan`                                        | Stripe embedded checkout actually rendered                                       |
| `onb_checkout_failed`    | `plan`, `reason: unconfigured\|create-failed` | checkout could not open (user saw the free-plan fallback)                        |
| `onb_checkout_abandoned` | `plan`                                        | opened checkout unmounted without payment (back / plan switch / decline)         |
| `onb_purchase_success`   | `plan`                                        | client observed Stripe `onComplete` (optimistic sibling of `purchase_completed`) |
| `onb_offer_decline`      | -                                             | quiet "Continue on the free plan"                                                |

### Background pipeline (client-observed)

| Event                                        | Properties             | Meaning                                           |
| -------------------------------------------- | ---------------------- | ------------------------------------------------- |
| `onb_rich_scrape_done`                       | `status`, `postsCount` | poll saw the scrape settle while the tab was open |
| `onb_rich_scrape_timeout`                    | -                      | client gave up polling (~6 min)                   |
| `onb_rich_session_missing`                   | -                      | poll got no session row (bug signal)              |
| `onb_insights_ready` / `onb_insights_failed` | `kind` / -             | insights call resolved client-side                |

## Server events (posthog-node via `lib/analytics/server.ts`, distinctId = user id)

These fire whether or not the tab stays open - they are the error/latency truth.

| Event                   | Properties                                                                                                                     | Route                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `onb_enrich_result`     | `llm_ok`, `fast_source: scrapingdog\|jsonld\|oauth\|none`, `fast_found`, `has_rich_signal`, `rich_status`, `rich_reused`, `ms` | `POST /api/onboarding/enrich`                                                                    |
| `onb_scrape_settled`    | `status: ready\|empty\|failed`, `corpus: posts-dataset\|profile-activity\|null`, `authored_count`, `ms_since_trigger`          | `GET /api/onboarding/enrich/status` - fires exactly once per scrape, on the poll that settles it |
| `onb_insights_result`   | `kind: posts\|profile\|benchmark`, `authored_count`, `degraded_reason: llm-failed\|thin-corpus\|null`, `rich_status`, `ms`     | `POST /api/onboarding/insights` - only on generation, not the idempotent echo                    |
| `onb_first_post_result` | `llm_ok`, `styled`, `gap_category`, `ms`                                                                                       | `POST /api/onboarding/first-post` - fires 4x per user (one per pillar)                           |
| `onb_rate_limited`      | `action: onbEnrich\|onbInsights\|onbFirstPost`                                                                                 | any onboarding route hitting the daily cap                                                       |
| `purchase_completed`    | `plan: lifetime\|monthly`, `amount_total` (cents), `currency`                                                                  | Stripe webhook - **the conversion truth**, no `funnel_version`                                   |
| `subscription_canceled` | -                                                                                                                              | Stripe webhook                                                                                   |

## Supabase data (service-role only)

- **`onboarding_sessions`** - one row per user: raw provider payloads (`fast_raw`,
  `rich_raw`, `posts_raw`), every answer, `resume_at` (last persisted step, `'done'` =
  finished), `rich_status`, `insights_kind`, `completed_at`, `converted` (client-observed;
  `billing.plan` is the server truth).
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
   benchmark path or insights never ran).
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
- Session replay is toggled in the PostHog project settings (inputs are masked via
  `session_recording.maskAllInputs`); mark extra-sensitive blocks with `.ph-no-capture`.
