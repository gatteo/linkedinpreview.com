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
- **Stripe billing**: embedded Checkout for two plans - **$7.99/mo** (subscription) and **$29.99
  lifetime** (one-time). A webhook is the source of truth for the `plan`.
- **Plan-aware AI limits**: free keeps the existing daily caps; `pro`/`lifetime` get a high fair-use
  ceiling (AI stays metered, honest with the lifetime promise).
- **Contextual paywall**: hitting the daily AI cap opens an upgrade dialog; a persistent "Upgrade"
  entry sits in the sidebar for free users.

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
- Client: `components/dashboard/plan-provider.tsx` (shared plan state + `usePlan`),
  `components/dashboard/upgrade-{provider,dialog}.tsx`, the onboarding flow + `steps/checkout.tsx`
  (Stripe Embedded Checkout). Wired in `app/dashboard/layout.tsx`.

## Configuration (fill before billing works)

Stripe is optional everywhere: when the keys are blank, checkout/webhook stay inert and the offer falls
back to "Continue on the free plan", so the app runs without them.

1. Create two products/prices in the Stripe dashboard: a **$7.99/mo recurring** price and a **$29.99
   one-time** price.
2. Set env (`env.mjs`, all optional until now):
    - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
    - `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_LIFETIME` (the two Price IDs)
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY` (already used by cron; required for the webhook to write `billing`)
3. Add a webhook endpoint in Stripe pointing at `/api/billing/webhook`, subscribed to
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Apply migrations `018` and `019`.

Note: the checkout session uses `ui_mode: 'embedded_page'` (the `stripe@22` value for Stripe.js
embedded checkout) with `redirect_on_completion: 'never'`; completion is handled by the client
`onComplete` callback and the plan is set authoritatively by the webhook.

## Must replace before public launch (placeholders)

Per the spec's guardrail (§1.5) and inventory (§9), these ship as clearly-flagged placeholders:

- All proof stats + testimonials in `config/onboarding-personalization.ts` (`ROLE_CONTENT[*].proof`,
  flagged `// PLACEHOLDER`).
- `config/pricing.ts`: `FOUNDING_WINDOW_END`, `MONEY_BACK_DAYS`, `COMPETITOR_PRICE_RANGE` - confirm a
  real, enforced founding window and refund policy before quoting them publicly.
- 7 per-role fallback first-post templates (`FALLBACK_POSTS`) - solid but worth a copy pass.

## Known limitation (follow-up)

Entitlements are keyed to the anonymous Supabase `user_id`. A paying user who clears
cookies/storage or switches device gets a new anonymous identity and loses access with no recovery
path. Before charging real money at scale, capture the Stripe email on the webhook and add an
email-based recovery/link flow (connecting LinkedIn already converts the anon session to an
email-backed account, which is the natural anchor).
