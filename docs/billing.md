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

## Social-proof policy

Public ratings, review counts, customer testimonials, outcome metrics, and audience counts require a current,
auditable source plus customer consent where relevant. The unsupported `SOCIAL_PROOF` rating config, aggregate-rating
schema, public review UI, and onboarding proof/testimonial wall were removed on 2026-08-29. Do not restore them
without that source.

- The offer exposes only the live plan prices and plan terms. Its expired founding-window setting, scarcity UI, unverified refund guarantee, competitor-price comparison, and unverified proof wall were removed on 2026-08-29. Do not reintroduce any such claim without a current, auditable source and, for urgency, a real enforced window.
- 7 per-role fallback first-post templates (`FALLBACK_POSTS`) - solid but worth a copy pass.

## Entitlement recovery work in progress

Migration `027_entitlement_recovery.sql` is **not applied to production and the live webhook does not use it yet**. It introduces an immutable Checkout-session ledger, append-only owner assignments, a Stripe event ledger and service-role-only recovery RPCs. Its local regression command is `pnpm test:entitlement-recovery`; it starts an isolated temporary PostgreSQL 16 database, applies `018` and `027`, and verifies the core replay sequence: grant to anonymous A, transfer to confirmed B, redeliver both the same and a distinct event for that session, then assert B stays paid, A stays free, and exactly one conversion grant exists.

The branch now also contains a test-only ingress helper, `lib/billing/entitlement-ingress.ts`, and `pnpm test:entitlement-ingress`. The test generates a real Stripe test-mode signature, retrieves a mocked canonical paid Checkout Session, deliberately supplies contradictory event/session metadata, and verifies the service RPC payload derives plan only from the allowlisted canonical price while including the immutable session identity, raw-payload digest, and normalized-email HMAC. It is not wired into the live webhook yet.

The next implementation slice must route signed, paid, allowlisted Checkout events through that immutable ledger, add server-peppered checkout-email proof to the production environment, and test the actual webhook integration before any production migration or recovery UI. Do not backfill or transfer historical paid rows automatically.

## Known limitation (follow-up)

Entitlements are currently keyed to the anonymous Supabase `user_id`. The onboarding email step and the Settings
email-OTP login now let a user bind an email (or LinkedIn) to that id, converting the anon session into
a cross-device account that survives cleared storage - the natural recovery anchor. The remaining gap is
automatic recovery: a user who never bound an email before losing the session still has no path back.
