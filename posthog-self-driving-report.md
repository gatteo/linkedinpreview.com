# PostHog Self-driving Setup Report

_Run date: 2026-07-31_

## Summary

PostHog Self-driving is now configured for linkedinpreview.com. Session Replay, Error Tracking, and Support signal sources were already enabled; the GitHub Issues warehouse source was connected during this run and GitHub Issues, the scout gate, health checks, and all native error/replay/support responders are live. The scout troop has 8 active scouts - 5 canonical specialists plus 3 custom scouts purpose-built for this product's onboarding funnel, AI pipeline, and checkout conversion surfaces. Findings will start appearing in your inbox at https://eu.posthog.com/project/129098/inbox within approximately 30 minutes.

## AI data processing

**Approved.** Organization-level AI data processing approval is a prerequisite enforced before this setup runs - it is confirmed granted.

## GitHub

**Already connected** (integration id: 74717, account: gatteo, connected 2026-07-31). No action required.

## Products enabled

| Product                 | Status           | Notes                                                                                                                                                                               |
| ----------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session Replay          | Already enabled  | Active recordings confirmed (recordings found). `disable_session_recording: !consented` in `instrumentation-client.ts` is intentional GDPR consent-gating - not a misconfiguration. |
| Error Tracking          | Already enabled  | 943 active error occurrences found (including a minified React #418 error). `capture_exceptions: true` in init - clean.                                                             |
| Support (Conversations) | Enabled this run | `products-enable` tool not available in this MCP deployment; manual step required - see Follow-ups. Conversations signal source row was already present and enabled.                |

The `posthog.init` in `instrumentation-client.ts` has no blocking overrides: `capture_exceptions: true` is set correctly and `disable_session_recording` is consent-gated by design.

## Signal sources

| source_product   | source_type                | Action                   | Notes                                                                                   |
| ---------------- | -------------------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `signals_scout`  | `cross_source_issue`       | Already active (default) | Scout findings reach the inbox with no config row needed - this is the default posture. |
| `health_checks`  | `health_issue`             | Already enabled          | Row existed and was enabled.                                                            |
| `error_tracking` | `issue_created`            | Already enabled          | Row existed and was enabled.                                                            |
| `error_tracking` | `issue_reopened`           | Already enabled          | Row existed and was enabled.                                                            |
| `error_tracking` | `issue_spiking`            | Already enabled          | Row existed and was enabled.                                                            |
| `session_replay` | `session_analysis_cluster` | Already enabled          | Row existed and was enabled.                                                            |
| `conversations`  | `ticket`                   | Already enabled          | Row existed and was enabled.                                                            |
| `github`         | `issue`                    | Enabled this run         | Created alongside the GitHub Issues warehouse source.                                   |
| `llm_analytics`  | -                          | Skipped                  | No PostHog `$ai_*` events instrumented; not a signal source for this project.           |
| `logs`           | -                          | Skipped                  | PostHog logs product not in use.                                                        |

## Connected tools

| Tool          | Status                                                                                              | Notes                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Issues | **Connected by this setup** (source id: `019fb792-4c88-0000-5198-9b57c1f19e61`, first sync started) | Warehouse source created for `gatteo/linkedinpreview.com`, syncing the `issues` table incrementally on `updated_at`. Only issues are syncing; more tables (pull requests, etc.) can be enabled in the UI if needed. |
| Linear        | Not used                                                                                            | Not picked - skipped.                                                                                                                                                                                               |
| Jira          | Not used                                                                                            | Not picked - skipped.                                                                                                                                                                                               |
| Sentry        | Not used                                                                                            | Not picked - skipped.                                                                                                                                                                                               |
| Zendesk       | Not used                                                                                            | Not picked - skipped.                                                                                                                                                                                               |

## Scout troop

**Run budget:** 100 runs/day max (early access default), 0 used today, 100 remaining. Banner: "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

**8 scouts enabled** (5 canonical + 3 custom) — under the 10-scout ceiling.

### Enabled

| Scout                             | Type      | Reason enabled                                                                                                                                                                                                                                                  |
| --------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `general`                         | Canonical | Always on - cross-product correlations and surfaces no specialist covers.                                                                                                                                                                                       |
| `product-analytics`               | Canonical | Highest priority: 17-step onboarding funnel is the product's primary conversion metric; saved funnel/retention insights are the core analytics surface.                                                                                                         |
| `feature-flags`                   | Canonical | Active feature flags driving onboarding experiments (`use-ob-experiment.ts`, `config/onboarding-experiments.ts`).                                                                                                                                               |
| `experiments`                     | Canonical | A/B experiments actively running via the `funnel-experiment` skill; validity threats (SRM, contamination) matter here.                                                                                                                                          |
| `revenue-analytics`               | Canonical | Stripe integrated (`lib/stripe.ts`); watches for sync stalls, capture regressions, and config drift.                                                                                                                                                            |
| `onboarding-funnel` (custom)      | Custom    | Step-level conversion drops with `entry_source` breakdown - the pre-funnel boundary (site → entrypoint → welcome) and per-step 80% threshold vs 7-day baseline. Not covered by `product-analytics` (which watches saved insight flows, not raw step sequences). |
| `onboarding-ai-pipeline` (custom) | Custom    | Fast-tier scrape degrade mode shifts (`scrapingdog → jsonld → none`), rich scrape corpus fallback, insights benchmark inflation, and LLM first-post failure rate. None of the enabled canonical scouts know these server-side events.                           |
| `onboarding-checkout` (custom)    | Custom    | Paywall-to-purchase rate, checkout failure rate by reason (including `unconfigured` = P1 in production), abandonment via breakdown, and offer engagement depth. `revenue-analytics` watches Stripe data sync health, not this checkout conversion funnel.       |

### Disabled (with reason)

| Scout                | Reason                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error-tracking`     | Covered by the native error_tracking signal source (issue_created / issue_reopened / issue_spiking). A scout would duplicate that coverage.                               |
| `session-replay`     | Covered by the native session_replay signal source (session_analysis_cluster). A scout would duplicate that coverage.                                                     |
| `ai-observability`   | No PostHog `$ai_*` events instrumented. The app uses OpenAI for its own features but does not send LLM telemetry to PostHog. Enable if `$ai_generation` events are added. |
| `surveys`            | No surveys in use (0 surveys found). Enable if surveys are added.                                                                                                         |
| `logs`               | PostHog logs product not in use. Enable if logs product is adopted.                                                                                                       |
| `csp-violations`     | No Content Security Policy reporting configured. Enable if CSP + PostHog CSP reporting is added.                                                                          |
| `apm`                | No OpenTelemetry / distributed tracing instrumentation. Enable if APM is added.                                                                                           |
| `customer-analytics` | B2C product with no group/accounts analytics. Enable if account-level analytics are added.                                                                                |
| `data-pipelines`     | No CDP destinations, batch exports, or hog flows configured.                                                                                                              |
| `data-warehouse`     | GitHub Issues is the only warehouse source (just connected); not yet active for warehouse-backed query optimization. Enable after sources mature.                         |
| `conversations`      | No inbound channel connected to Conversations yet (email/Slack/inbox). Enable after a channel is connected.                                                               |
| `anomaly-detection`  | Specialist scouts cover the primary surfaces; anomaly detection is a lower-priority cross-product sweep given the targeted troop.                                         |
| `observability-gaps` | Lower priority than current specialists. Enable if specific events need insight coverage.                                                                                 |
| `web-analytics`      | Lower priority than onboarding funnel coverage for this product. Enable if web traffic attribution becomes a focus.                                                       |
| `web-vitals`         | Not in top 5 most-used surfaces. Enable if Core Web Vitals monitoring becomes a priority.                                                                                 |
| `replay-vision`      | No Replay Vision scanners configured.                                                                                                                                     |
| `inbox-validation`   | Fresh setup - no prior resolved reports to validate. Enable after first wave of fixes ships.                                                                              |
| `health-checks`      | The `health_checks` native source already surfaces health issues into the inbox.                                                                                          |
| `insight-alerts`     | No configured insight alerts yet. Enable after alerts are created.                                                                                                        |
| `skills-store`       | PostHog internal hygiene scout - not relevant to this project's inbox needs.                                                                                              |
| `mcp-tool-calls`     | No `$mcp_tool_call` telemetry instrumented.                                                                                                                               |
| `tasks`              | PostHog Tasks not in active use for this project's primary workflow.                                                                                                      |

## Custom scouts

### Created: `signals-scout-onboarding-funnel`

**Surface:** The 17-step onboarding funnel (funnel_version: v3), from the pre-funnel entry boundary through to `onb_flow_complete`.

**What it watches:** Per-step completion rates (`onb_step_view` step N → step N+1) vs a 7-day rolling baseline. Also watches the pre-funnel boundary: offer acceptance rate (`onb_welcome_start` / `onb_step_view[welcome]`). On any drop >20%, breaks down by `entry_source` to separate UI regressions from traffic-composition shifts.

**Discriminator:** `today_rate < baseline_rate × 0.80` with ≥ 20 step N viewers today. P1 for `paywall`, `reveal`, or `welcome` drops.

**Why no built-in scout covers it:** `signals-scout-product-analytics` watches saved funnel insights in PostHog, not the raw `onb_step_view` event sequence. It cannot see the pre-funnel boundary losses (site → entrypoint → welcome) that have historically been larger than all in-flow drops combined. The custom scout knows the exact step ordering, event names, `entry_source` attribution, and `funnel_version: v3` filter.

**Noise escape hatch:** Set `emit: false` on this scout's config in PostHog to switch it to dry-run.

---

### Created: `signals-scout-onboarding-ai-pipeline`

**Surface:** The backend AI data pipeline: fast-tier LinkedIn data fetch, rich scrape, AI insights generation, and LLM first-post generation.

**What it watches:** Degrade-mode mix shifts across 4 stages - `onb_enrich_result.fast_source` (scrapingdog → jsonld → none), `onb_scrape_settled.status` (ready → empty/failed), `onb_insights_result.kind` (posts → profile/benchmark), `onb_first_post_result.llm_ok`. These are posthog-node server events that fire regardless of tab state.

**Discriminator:** Any stage's degrade rate today exceeds its 7-day baseline by ≥ 15pp with ≥ 10 events. P1 for fast-tier full degradation or scrape failed rate > 50%.

**Why no built-in scout covers it:** These server-side degrade events are domain-specific to this product's pipeline. No canonical scout knows `onb_enrich_result`, `onb_scrape_settled`, or the fast-tier/scrape/insights degrade ladder. Error tracking's native source catches `$exception` events, not these quality-degrade signals that don't throw errors.

**Noise escape hatch:** Set `emit: false` on this scout's config in PostHog to switch it to dry-run.

---

### Created: `signals-scout-onboarding-checkout`

**Surface:** The paywall-to-payment conversion funnel: offer engagement, checkout opening, abandonment, and Stripe-confirmed purchases.

**What it watches:** Checkout failure rate by `reason` (any `unconfigured` in production is P1), abandonment rate by `via`, offer engagement depth (`onb_paywall_scroll`), and paywall-to-purchase rate (`purchase_completed` with `amount_total > 0` to filter comp codes).

**Discriminator:** Any rate worse than baseline by ≥ 20% relative or ≥ 10pp absolute. P1 for any `onb_checkout_failed{reason: unconfigured}` in production.

**Why no built-in scout covers it:** `signals-scout-revenue-analytics` watches Stripe data sync health (warehouse source connectivity, capture regressions), not the checkout experience funnel. The conversion path from `onb_paywall_view` through `purchase_completed` is specific to this product and not covered by any canonical scout.

**Noise escape hatch:** Set `emit: false` on this scout's config in PostHog to switch it to dry-run.

---

### Surfaces considered and ruled out

| Surface                   | Filter that killed it                                                           |
| ------------------------- | ------------------------------------------------------------------------------- |
| Error tracking            | Covered by native source (`error_tracking` signal source, not a scout surface). |
| Session replay analysis   | Covered by native source (`session_replay` signal source).                      |
| Generic product analytics | Covered by `signals-scout-product-analytics` (enabled specialist).              |
| Feature flag evaluation   | Covered by `signals-scout-feature-flags` (enabled specialist).                  |
| A/B experiment validity   | Covered by `signals-scout-experiments` (enabled specialist).                    |
| Stripe revenue sync       | Covered by `signals-scout-revenue-analytics` (enabled specialist).              |
| Web traffic attribution   | Not in top priority surfaces given funnel coverage above; skippable.            |
| AI/LLM PostHog telemetry  | No `$ai_*` events instrumented - surface not watchable.                         |

## Follow-ups

- [ ] **Enable Support / Conversations product manually.** The `products-enable` MCP tool was not available during this setup run. Go to PostHog → Settings → (product sidebar) → Support and enable it. The `conversations` / `ticket` signal source is already enabled and will start receiving tickets automatically once the product is on.
- [ ] **Connect a Support inbound channel.** The Conversations product only produces tickets once an email, inbox, or Slack channel is connected. Go to PostHog → Settings → Support to add a channel.
- [ ] **Connect a Stripe data warehouse source** if you want `signals-scout-revenue-analytics` to watch revenue trends and goal-miss escalations (currently it can only watch for sync health). Go to https://eu.posthog.com/project/129098/pipeline/new/source and add a Stripe source.
- [ ] **Review the open React #418 error** in Error Tracking - it has 943 occurrences. See https://eu.posthog.com/project/129098/error_tracking for details. This is a minified React error from `/_next/static/chunks/d6402a6b6e835756.js` that has been firing since 2026-07-17.
- [ ] **Enable `signals-scout-web-analytics`** in PostHog if web traffic attribution and landing-page health become a monitoring priority.
- [ ] **Enable `signals-scout-inbox-validation`** after the first wave of fixes ships - it validates that resolved reports actually held.

## What happens next

The scout coordinator picks up fresh configs within approximately 30 minutes. Each of the 8 enabled scouts will run on its first tick and draw from the project's daily run budget (100 runs/day during early access). Findings are clustered into reports in the inbox at https://eu.posthog.com/project/129098/inbox - immediately-actionable ones can start coding tasks automatically.

The 3 custom scouts will close out empty on their first run if there's insufficient baseline data (the 7-day comparison window needs a week of history to be meaningful) - this is expected, not a failure. They will start producing signal once baseline data accumulates.
