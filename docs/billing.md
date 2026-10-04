# Billing + Conversion Onboarding (implementation)

> Implements [onboarding-conversion-redesign.md](onboarding-conversion-redesign.md) and the Stripe
> portion of [MONETIZATION.md](MONETIZATION.md) Phase 1. This doc is the operational reference: what was
> built, what to configure, and what must be swapped before public launch.

## What ships

- **Personalized onboarding flow** (`components/dashboard/onboarding/`): a 13-step state machine
  (`welcome -> connect -> mirror -> goal -> proof -> preview -> voice -> spotlight -> cadence ->
building -> recap -> offer -> done`) that replaces the old setup-only wizard. Alternates COLLECT and
  REINFORCE/PREVIEW beats, mirrors the user's LinkedIn back via AI enrichment, writes a real first post
  in their voice, then ends on a soft offer. Never hard-blocks: every step has a quiet skip and the
  offer has a free fallback.
- **Stripe billing**: Checkout for two plans - **$11.99/mo** (subscription) and **$39.99
  lifetime** (one-time). A webhook is the source of truth for the `plan`. The Checkout UI is
  switchable via `CHECKOUT_UI` in `config/pricing.ts`: `'hosted'` (full-page redirect to
  checkout.stripe.com, current default) or `'embedded'` (Stripe embedded checkout in the modal).
- **Plan-aware AI limits**: free keeps the existing daily caps; `pro`/`lifetime` get a high fair-use
  ceiling (AI stays metered, honest with the lifetime promise).
- **Contextual paywall**: hitting the daily AI cap opens an upgrade dialog. The sidebar footer account
  menu carries a positive plan **Badge** (Free / Pro / Lifetime) plus an Upgrade (free) or Manage plan
  (paid) item, so paid state is shown, not just the absence of the upsell.

## Data model

`public.billing` (migration `018_billing.sql`), one row per user, **written only by the Stripe webhook
via the service-role client** (RLS gives the user SELECT on their own row, no write policy):

| column                                         | meaning                                  |
| ---------------------------------------------- | ---------------------------------------- |
| `plan`                                         | `free` \| `pro` \| `lifetime`            |
| `plan_source`                                  | `stripe_monthly` \| `stripe_lifetime`    |
| `plan_renews_at`                               | monthly renewal (null for free/lifetime) |
| `stripe_customer_id`, `stripe_subscription_id` | Stripe references                        |

Migration `019_onboarding_ai_actions.sql` adds the `onbEnrich` / `onbFirstPost` rate-limit buckets (and
backfills `carouselGenerate`) to the `ai_usage` action constraint.

Types: `lib/billing.ts` (`Plan`, `BillingData`, `isPaidPlan`). Limits: `config/ai.ts`
(`AI_RATE_LIMITS`, `PRO_AI_RATE_LIMITS`, `aiLimitsForPlan`). Pricing/offer copy: `config/pricing.ts`.
Personalization matrix: `config/onboarding-personalization.ts`.

## Code map

- Server: `lib/stripe.ts`, `lib/supabase/billing.ts`, `app/api/billing/{checkout,webhook}/route.ts`,
  `app/api/onboarding/{enrich,first-post}/route.ts`, plan-aware `lib/rate-limit.ts`.
- Webhook delivery semantics: signature failures return 400 (Stripe must not retry a forgery), but a
  handler error after a valid signature returns **500 so Stripe retries on its own schedule**. Never
  200 a failed billing write - an acknowledged event is never redelivered, so one transient Supabase
  error would strand a paying customer on the free plan.
- Analytics caveat: `captureServer` is inert outside production (`lib/analytics/server.ts`), so a local
  `stripe listen` pointed at a dev server writes a real `billing` row to the shared remote Supabase
  while `purchase_completed` is dropped. That mismatch reads as a broken conversion pipeline; the
  drop is now logged via `console.debug` so it is visible rather than silent.
- Client: `components/dashboard/plan-provider.tsx` (shared plan state + `usePlan`; a Supabase Realtime
  subscription on `public.billing` so a late webhook reflects without reload; a no-session guard that
  resolves `isLoading` to the free default), `components/dashboard/account-menu.tsx` (sidebar plan badge),
  `components/dashboard/upgrade-{provider,dialog}.tsx`, the onboarding flow + `steps/checkout.tsx`
  (redirects to hosted checkout, or renders Stripe Embedded Checkout when `CHECKOUT_UI` is
  `'embedded'`). Wired in `app/dashboard/layout.tsx`.

## Configuration (fill before billing works)

Stripe is optional everywhere: when the keys are blank, checkout/webhook stay inert and the offer falls
back to "Continue on the free plan", so the app runs without them.

1. Create two products/prices in the Stripe dashboard: a **$11.99/mo recurring** price and a **$39.99
   one-time** price.
2. Set env (`env.mjs`, all optional until now):
    - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
    - `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_LIFETIME` (the two Price IDs)
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY` (already used by cron; required for the webhook to write `billing`)
3. Add a webhook endpoint in Stripe pointing at `/api/billing/webhook`, subscribed to
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Apply migrations `018` and `019` (and `025` to enable Supabase Realtime on `billing`).

Note on Checkout UI modes (`CHECKOUT_UI` in `config/pricing.ts`, one flip switches the API route
and both purchase surfaces):

- `'hosted'` (default): the session uses `ui_mode: 'hosted_page'` with
  `success_url`/`cancel_url` pointing at `/dashboard?checkout=success|cancelled&plan=...&source=
onboarding|upgrade`. The initiating surface resumes from the query params on return - the
  onboarding paywall calls `finishOffer(true)`, the upgrade provider reopens the dialog in its
  success state (`upgrade_success` fires with `reason: 'hosted_return'` since the original
  trigger reason does not survive the redirect). Params are stripped via `history.replaceState`.
- `'embedded'`: the session uses `ui_mode: 'embedded_page'` (the `stripe@22` value for Stripe.js
  embedded checkout) with `redirect_on_completion: 'never'`; completion is handled by the client
  `onComplete` callback.

Either way the plan is set authoritatively by the webhook.

## Entitlement recovery salvage

This repository contains a dormant entitlement-recovery core. None of migrations `032` through `034`
has been applied, the production webhook still writes the legacy `public.billing` projection, and all
product authorization still reads that legacy projection. This slice adds no production-enabled recovery
route, environment variable, backfill, approval record, webhook subscription, or production configuration.

The retained pieces are:

- `032_entitlement_recovery.sql`: immutable Checkout-session entitlements, append-only ownership
  assignments and Stripe event observations, service-role-only grant, lifecycle, approved-import, and
  recovery RPCs, plus the existing `billing` projection recomputation.
- `033_historical_entitlement_reconciliation.sql`: sealed, append-only approval manifests and an
  idempotent historical importer. Application roles cannot read or execute these operator paths.
- `034_monotonic_dual_read_authorization.sql`: an authenticated-caller reader where either an active
  immutable entitlement or a paid legacy `billing` row grants access. Lifetime outranks Pro, and an
  inactive ledger record suppresses only the matching legacy subscription identity. Legacy lifetime
  access remains monotonic until reconciliation provides an exact payment identity.
- Pure TypeScript seams for canonical signed Checkout ingestion, subscription lifecycle handling, and an
  authenticated recovery claim. They are testable but intentionally disconnected from live routes.
- Deterministic Node tests and disposable PostgreSQL 16 integration tests, available through
  `pnpm test:entitlement`. The synthetic 17-record cutover rehearsal is also runnable alone with
  `pnpm test:entitlement-cutover-dry-run`.

The backup's ledger-only `028_current_entitlement_reader.sql` was intentionally omitted. A temporary
ledger-only reader could return `free` for a paid legacy account before reconciliation. The salvage keeps
only the monotonic dual-read definition, renumbered after current migration `031_leads.sql`. The live
webhook and recovery route wiring were also omitted because no server-owned challenge issuance flow or
email-HMAC key configuration exists yet.

### Additive rollout and cutover gates

1. Review the SQL and test corpus. Applying a migration is a separate production-data change and is not
   part of this PR.
2. If approved later, apply `032`, `033`, and `034` in order without seeding approvals or switching a
   consumer. Existing `billing` rows and the live authorization path remain untouched.
3. Generate a fresh read-only reconciliation at one cutoff. A human must account for every paid legacy
   account and paid Stripe Checkout Session, explicitly retaining ambiguous accounts as manual exceptions.
4. Seal and import only the reviewed approval set. Require zero unexpected paid-to-free, duplicate-grant,
   former-owner-regrant, and identity-conflict results across the complete population.
5. Wire the webhook in a separate reversible PR, then observe dual writes. Wire product authorization to
   the monotonic dual reader only in another PR after the zero-difference gate passes.
6. Add recovery challenge issuance and verification before exposing the claim handler through a route.

Before any consumer cutover, rollback is non-destructive: revert the code PR or stop before the next gate;
unused additive tables and functions may remain in place. After a future consumer cutover, revert only the
consumer commit so reads return to `public.billing`. Do not drop ledger tables or delete evidence as a
rollback mechanism.

The exact stop points, readbacks, minimum remaining challenge/webhook/reader seams, and non-destructive
rollback sequence are in [entitlement-recovery-cutover-runbook.md](entitlement-recovery-cutover-runbook.md).

### Gated synthetic recovery preview

Vercel preview deployments and local development expose a synthetic recovery rehearsal at
`/entitlement-recovery-preview`. The page and corresponding `POST /api/billing/recovery/preview` route
return `404` in production. They import no Stripe or Supabase client and perform no external read or write.

The committed fixture codes model all 15 verified paid records, the grandfathered non-revenue lifetime
exception, the stale test-mode Pro row, and an unknown purchase. Verified paid fixtures simulate a restore;
the grandfathered fixture stays on legacy fallback without a paid import; stale and unknown fixtures receive
no grant. Every response includes `writesPerformed: false`.

Client analytics emit `entitlement_recovery_attempted` for each submit and
`entitlement_recovery_succeeded` only for a verified paid synthetic restore. Properties contain only the
preview surface, `synthetic_preview` mode, and the restored plan. Recovery codes, emails, user IDs, and
other PII are not sent to PostHog.

## Must replace before public launch (placeholders)

Per the spec's guardrail (§1.5) and inventory (§9), these ship as clearly-flagged placeholders:

- All proof stats + testimonials in `config/onboarding-personalization.ts` (`ROLE_CONTENT[*].proof`,
  flagged `// PLACEHOLDER`).
- `config/pricing.ts`: `FOUNDING_WINDOW_END`, `MONEY_BACK_DAYS`, `COMPETITOR_PRICE_RANGE` - confirm a
  real, enforced founding window and refund policy before quoting them publicly.
- 7 per-role fallback first-post templates (`FALLBACK_POSTS`) - solid but worth a copy pass.

## Known limitation (follow-up)

Entitlements are keyed to the anonymous Supabase `user_id`. The onboarding email step and the Settings
email-OTP login now let a user bind an email (or LinkedIn) to that id, converting the anon session into
a cross-device account that survives cleared storage - the natural recovery anchor. The remaining gap is
automatic recovery: a user who never bound an email before losing the session still has no path back.
Before charging real money at scale, also capture the Stripe email on the webhook and auto-link it to the
bound account.
