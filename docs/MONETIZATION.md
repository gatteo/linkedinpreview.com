# Monetization Strategy

> Working strategy doc. How LinkedInPreview.com introduces a paid PRO plan **without** breaking the
> free, login-free, SEO-first core that the product is built on. Grounded in the current codebase
> (verified 2026-06-19) and a competitor scan of Taplio, AuthoredUp, Supergrow, Typefully, Buffer,
> Publer, and TestFeed. Pairs with [PRODUCT.md](PRODUCT.md), [ROADMAP.md](ROADMAP.md), and
> [STATUS.md](STATUS.md). This supersedes the "Paid tier - DEFERRED" line in those docs.

## TL;DR

Introduce a single **PRO** tier at **$15/mo** (or **$12/mo billed annually**), with a **Team** tier
to follow once multi-account demand is proven. The entire free product stays free: the editor,
preview, formatting, copy, draft sharing, embed, blog, and a generous daily allowance of AI. PRO
sells three things free users genuinely cannot get for free elsewhere without paying $39+: **unlimited
AI**, **publish + schedule directly to LinkedIn**, and **a content calendar with analytics**. The
upgrade moment is already built into the product: connecting LinkedIn (Wave 4) converts an anonymous
session into a real account. That is the natural paywall boundary. Target a **3-5% free-to-paid
conversion** on dashboard users (not on total SEO traffic), which is realistic for an individual
productivity tool with hard usage limits.

The ethos is protected by one rule, stated up front and never broken: **everything that helps someone
preview, format, and copy a LinkedIn post stays free forever, login-free.** PRO only ever charges for
(a) things that cost us money per use (LLM tokens, LinkedIn publishing infra) or (b) workflow leverage
for people who post for a living.

---

## 1. Where the product stands (the monetization-relevant facts)

The product is much more than a preview tool. It is a near-complete LinkedIn content app with three
layers, and only some of them cost money to run.

**Free to serve, near-zero marginal cost.** The core editor is fully client-side (TipTap, Unicode
output, live preview, viewport toggle, copy-to-clipboard, draft-sharing via URL, embeddable widget).
Draft sharing uses `deflate-raw` + base64url with **no backend**. The blog, compare pages, RSS,
sitemap, and JSON-LD are static. This is the SEO engine and it is essentially free to run. Gating any
of it would be self-harm.

**Costs money per use.** The AI features (chat, generation, quick actions, analysis, suggestions, hook
generation, extraction, voice/file/URL) hit an LLM. The default model is `gpt-4o-mini` (cheap, but not
free at scale). They are already rate-limited **per user per day**: generation 1, refinement 3,
analysis 20, wizard 5, quick action 10, ideas 3, enforced by the `check_and_record_usage` Supabase RPC
with row-level locking. Those limits are deliberately tight, which means there is real, latent demand
to lift them. This is the cleanest cost-recovery lever in the product.

**Costs money + high willingness to pay.** Wave 4 (LinkedIn OAuth, one-click publish, scheduling,
content calendar, best-time-to-post) is built but not live-verified. Publishing and scheduling require
ongoing infra: per-minute Vercel Cron needs **Vercel Pro**, and the cron publisher uses the
service-role key to deliver scheduled posts. This is exactly the feature competitors charge $19-69/mo
for, and it is the feature that justifies a recurring subscription rather than a one-off.

**The upgrade funnel already exists.** Auth is anonymous by default (`signInAnonymously`, no signup
screen). Connecting LinkedIn converts that anonymous session into a real email-backed account (migration
`011_linkedin_login.sql`). So the product already has a clean, low-friction path from "anonymous free
user" to "identified account" at precisely the moment a user wants the highest-value paid feature.
**Connect LinkedIn is the paywall boundary**, and it is non-coincidental: the user is most committed
right when they ask to publish.

**Implication.** The pricing model writes itself. Free covers everything that is cheap to serve plus a
real taste of AI. PRO covers the two things that cost money (unlimited AI, LinkedIn publishing) plus the
calendar/analytics workflow. No part of the SEO funnel is touched.

---

## 2. Competitor landscape

Every tool below is one the product already has a `/compare` page for, so these are the real
alternatives a prospective buyer evaluates. Pricing captured June 2026; verify before quoting publicly.

| Tool           | Free tier                                 | Entry paid                             | Mid                                         | Top                            | AI gating                                   | Notable risk / gap                                                                   |
| -------------- | ----------------------------------------- | -------------------------------------- | ------------------------------------------- | ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Taplio**     | Trial only                                | $39/mo (no AI credits)                 | $69/mo (250 AI credits)                     | $199/mo (unlimited AI + leads) | AI locked above $39 starter                 | Cookie-based auth flagged for LinkedIn ToS violations, shadowban/restriction reports |
| **AuthoredUp** | Limited free (~10 posts/mo, preview only) | ~$19.95/mo individual (~$16.63 annual) | Team ~$12/profile (min 3)                   | -                              | Analytics/templates/library are paid        | Preview + analytics focus; no AI generation, no scheduling depth                     |
| **Supergrow**  | 7-day trial                               | $19/mo Starter                         | $39/mo Pro (carousels, analytics, voice AI) | $139/mo Teams                  | Carousels + analytics are Pro-only          | AI-first, priced mid-market                                                          |
| **Typefully**  | Free (15 posts/mo, 1 scheduled at a time) | ~$12.50/mo Creator                     | ~$39-49/mo Team                             | $99/mo                         | AI only on Creator+                         | Multi-platform (X-first), thin LinkedIn-specific depth                               |
| **Buffer**     | Free (3 channels, 10 posts each)          | $5-6/channel Essentials                | $10-12/channel Team                         | per-channel scaling            | General scheduler, not LinkedIn-specialized | Cross-platform, shallow LinkedIn formatting/preview                                  |
| **Publer**     | Free (limited)                            | ~$12/mo                                | higher tiers                                | -                              | General scheduler                           | Breadth over LinkedIn depth                                                          |
| **TestFeed**   | Free preview tool                         | -                                      | -                                           | -                              | n/a                                         | Direct free competitor on preview only; no AI, no dashboard                          |

**What the table tells us.**

The market splits into two camps. The _preview/formatting_ camp (AuthoredUp, TestFeed) is cheap or free
but shallow. The _AI + scheduling + analytics_ camp (Taplio, Supergrow, Typefully) starts at $19 and
runs to $199. There is a clear gap in the middle: **no one offers a genuinely free, login-free,
SEO-discoverable preview-and-format tool that also has real AI and one-click LinkedIn publishing behind
a single affordable PRO tier.** That gap is exactly where LinkedInPreview.com already sits on the free
side; it just has not turned on the paid side.

Three competitive advantages worth pricing around:

1. **Free and login-free is a wedge, not a weakness.** Taplio has no free tier, Supergrow is trial-only,
   AuthoredUp's free tier is crippled. LinkedInPreview wins the top of funnel on Google and keeps it
   free. That is the moat. Pricing must never compromise it.
2. **Taplio's ToS risk is a marketing gift.** Taplio (the category leader at $39-199) repeatedly draws
   account-restriction and shadowban complaints because of cookie-based automation. LinkedInPreview uses
   official LinkedIn OAuth (OpenID Connect + `w_member_social`). "Officially compliant, no shadowban
   risk" is a real, defensible PRO selling point against the most expensive competitor.
3. **Price below the AI camp.** Supergrow Pro is $39 and Taplio's usable tier is $69. A single PRO at
   $15/mo undercuts all of them while bundling what they fragment across tiers.

---

## 3. The free vs PRO value ladder

Design principle: **Free is complete and never crippled. PRO is leverage, not a hostage rescue.** A
free user should feel the product is generous and finish real work without paying. They upgrade because
they post often enough that limits and manual copy-paste become friction, not because the free tier was
deliberately broken.

### Free, forever, login-free (the ethos core)

Never gated, never degraded, never behind auth:

- The entire editor: rich text, Unicode bold/italic/underline/strikethrough, lists, live preview,
  mobile/tablet/desktop toggle, realistic feed preview, image/video upload.
- Copy-to-clipboard, draft sharing via URL, the embeddable widget, the homepage tool.
- All client-side content scoring: readability, sentence flow, char/word/line count, hashtag and emoji
  counts, length status. These run with no network call, so they cost nothing.
- The blog, compare pages, changelog, RSS, templates libraries (SEO track). These _are_ the funnel.
- Light dashboard use: anonymous session, a capped number of saved drafts, branding basics, dark mode.

### Free, with a daily allowance (the AI taste)

Keep AI usable for free, but metered. The current per-day limits are a reasonable free allowance. Frame
them honestly in the UI as "Free plan: X/day" so the limit reads as a plan boundary, not a bug.

- AI generation, hook generation, quick actions, analysis, suggestions, extraction at the current daily
  caps. Enough to feel the value and create a few posts a week.

### PRO ($15/mo, or $12/mo annually)

Everything in Free, plus the three pillars:

**Pillar 1 - Unlimited AI.** Lift the daily rate limits (or raise them to a high fair-use ceiling).
This is the cleanest cost-recovery upgrade: the people who hit the daily wall are exactly the people
posting daily, i.e. the ones who should pay. Also reserve the best model for PRO (e.g. route PRO to a
stronger `LLM_MODEL` while free stays on `gpt-4o-mini`).

**Pillar 2 - Publish + schedule to LinkedIn (Wave 4).** One-click publish, timezone-aware scheduling,
the content calendar with drag-to-reschedule, and best-time-to-post. This is the feature that turns a
"tool I visit" into a "tool I live in," carries real infra cost (Vercel Pro cron, token management), and
is what competitors charge $19-69 for. It is the spine of the subscription.

**Pillar 3 - Power workflow + analytics.** Unlimited saved drafts, multiple brand/voice profiles,
post performance analytics (Wave 5), content history, and export. Convenience and insight that compound
for heavy users.

### Team (future tier, ~$29/seat/mo)

Defer until PRO is validated and multi-account demand is real (it maps to backlog Wave 6 team
collaboration). Shared drafts, approval/review workflow, multiple connected LinkedIn accounts, role
management. This is where social-media-manager revenue lives, but it should not gate the initial launch.

### Feature-by-feature allocation

| Feature (current IDs)                                                           | Free                | PRO                              | Rationale                                             |
| ------------------------------------------------------------------------------- | ------------------- | -------------------------------- | ----------------------------------------------------- |
| Editor, preview, formatting, viewport toggle (020-023)                          | Yes                 | Yes                              | Ethos core; cheap to serve; the SEO product           |
| Image/video upload (024)                                                        | Yes                 | Yes                              | Core preview fidelity                                 |
| Copy, draft-share URL, embed (025-027)                                          | Yes                 | Yes                              | Core + distribution; zero backend                     |
| Client-side scoring (050-056)                                                   | Yes                 | Yes                              | No network cost; differentiator vs free competitors   |
| Blog, compare, changelog, RSS, SEO (001-006)                                    | Yes                 | Yes                              | The funnel itself                                     |
| AI generation / hooks / actions / analysis / suggestions / extraction (030-040) | Daily allowance     | Unlimited + better model         | Per-use LLM cost; heavy users self-select into paying |
| Multi-draft management (062, 065)                                               | Cap (e.g. 10-25)    | Unlimited                        | Cheap to store; cap nudges power users, not casuals   |
| Branding profile (080-090)                                                      | Single profile      | Multiple profiles                | Multi-client managers will pay for separate voices    |
| Content strategy wizard + dashboard (200-202)                                   | Yes                 | Yes (+ deeper PRO ideas cadence) | Drives engagement and retention on free               |
| LinkedIn OAuth + one-click publish (220-221)                                    | Connect for login   | Publish                          | Login free; _publishing_ is the paid action           |
| Scheduling + content calendar + best-time (222-224)                             | -                   | Yes                              | High infra cost + high willingness to pay             |
| Analytics dashboard (230, Wave 5)                                               | -                   | Yes                              | Premium insight; needs LinkedIn API + storage         |
| Carousel creator/export (210-212, Wave 3)                                       | Basic / watermarked | Full + no watermark + templates  | Visual content is high-value; freemium-friendly gate  |
| Team collaboration (240, Wave 6)                                                | -                   | Team tier                        | Separate buyer, separate tier                         |

A note on carousels (Wave 3, not yet built): they are an ideal freemium gate. Let free users make and
export a basic carousel with a small "made with LinkedInPreview" footer; PRO removes the mark and unlocks
templates and branding. This mirrors how Canva and Loom convert, and it adds a second upgrade trigger
independent of AI limits.

---

## 4. Pricing rationale

**Anchor: $15/mo, $12/mo annual (so $144/yr, ~20% annual discount).** This sits deliberately below
Supergrow ($19 Starter / $39 Pro) and far below Taplio's usable $69 tier, while reading as "real
product" rather than "cheap utility." It is in the same band as AuthoredUp (~$20) and Typefully Creator
(~$12.50), but bundles AI + publishing + scheduling that those split or omit.

**Why one tier first, not three.** Multi-tier pricing fragments value and slows the launch. A single
PRO with a clear three-pillar promise is easier to message ("everything, unlimited, $15") and easier to
build billing for. Add Team only when inbound asks for multi-account.

**Annual bias.** Push annual at checkout. It improves cash flow, cuts churn, and the 20% discount is
standard in this category (every competitor offers ~20% annual).

**Founder / launch pricing.** Offer the first cohort a locked-in lifetime rate (e.g. $9/mo or
$99/yr "founding member") to seed early MRR and testimonials. This is common for indie SaaS and creates
urgency without discounting the public price permanently.

**Do not do usage-based or credit pricing for v1.** Taplio's credit model is widely disliked. "Unlimited
AI" is a cleaner promise and the `gpt-4o-mini` default keeps the cost of that promise low. Monitor for
abuse and apply a generous fair-use ceiling rather than visible credits.

### Back-of-envelope unit economics

The point of this section is to show the model is not cost-fragile, not to forecast revenue precisely.

- **LLM cost per active PRO user.** With `gpt-4o-mini` at roughly fractions of a cent per generation,
  even a heavy daily user generating dozens of posts and analyses costs on the order of cents to low
  single-digit dollars per month. At $15/mo, AI cost of goods is a small fraction of revenue. If PRO is
  routed to a stronger model, cost rises but stays well within a healthy margin.
- **Infra.** Vercel Pro (needed for per-minute scheduling cron) is a fixed ~$20/mo platform cost, not
  per-user. Supabase scales cheaply for this data shape (text drafts, small tables). Fixed costs are
  covered within the first 2-3 PRO subscribers.
- **Breakeven.** Effectively reached at a handful of PRO users. Everything past that is margin. This is
  why the product can afford to keep the free tier genuinely generous: free users are cheap (mostly
  static + client-side), and a small paid cohort funds the whole thing.
- **Conversion math.** Benchmarks: freemium self-serve converts 2-5%; individual productivity tools with
  hard usage limits reach 5-10%+. Measure conversion on **dashboard users** (people who created a draft
  or connected LinkedIn), not on raw SEO traffic, or the number will look misleadingly tiny. A realistic
  near-term target is 3-5% of active dashboard users on PRO.

---

## 5. Implementation plan

Phased so the first paid dollar arrives quickly and the risky/expensive parts come after validation.

### Phase 0 - Decide and instrument (before any paywall)

1. **Confirm the boundary.** Ratify that the paywall is "connect LinkedIn + unlimited AI + scheduling,"
   and that nothing in the free core moves behind it. Update PRODUCT.md/ROADMAP.md to replace the
   "everything stays free / paid tier deferred" lines with this plan.
2. **Add plan state to the data model.** A `plan` enum (`free` | `pro` | `team`) on the user/account,
   plus `plan_renews_at` and `plan_source`. New migration (`012_billing.sql`). Default `free`.
3. **Make rate limits plan-aware.** `config/ai.ts` already centralizes limits; add a PRO limit set (or
   an "unlimited" sentinel) and have `check_and_record_usage` / `lib/rate-limit.ts` read the user's plan.
   This is the single most important code change and it is small.
4. **Instrument the funnel.** PostHog is already wired. Add events for: hit-daily-limit, viewed-pricing,
   clicked-upgrade, connect-LinkedIn, publish-attempt. You cannot tune a paywall you cannot see.

### Phase 1 - Turn on billing + the AI paywall (fastest revenue)

5. **Integrate Stripe** (Checkout + Customer Portal + webhooks). Webhook updates the `plan` column.
   Stripe Checkout is the least-effort path; the Customer Portal handles upgrades/cancels/invoices so you
   build almost no billing UI.
6. **Ship the upgrade surface.** A `/pricing` page (SEO-friendly, also a compare-page CTA target), an
   in-dashboard "Upgrade" button, and a tasteful limit-reached modal ("You have used today's free AI.
   Go unlimited with PRO."). Reuse existing dialog components.
7. **Gate Pillar 1 (unlimited AI).** Flip the plan-aware limits live. This monetizes immediately with
   zero dependency on the unfinished LinkedIn integration.

### Phase 2 - Finish Wave 4 and gate publishing (the subscription spine)

8. **Live-verify Wave 4** (the blocker is real LinkedIn app credentials + a connected account, per
   STATUS.md). Secure the "Sign In with LinkedIn" + "Share on LinkedIn" products, set the env vars, apply
   migrations 009-011, and complete end-to-end OAuth -> publish -> scheduled-cron verification.
9. **Provision Vercel Pro** so per-minute scheduling works (Hobby cron only fires daily).
10. **Gate publishing + scheduling + calendar to PRO.** Connect-for-login stays free; the publish and
    schedule _actions_ check `plan === pro`. Lead with the compliance angle ("official LinkedIn API, no
    shadowban risk") to differentiate from Taplio.

### Phase 3 - Deepen value and expand

11. **Ship Wave 5 analytics** as a PRO pillar (post performance, best hooks/formats, optimal length).
12. **Ship Wave 3 carousels** with the freemium watermark gate as a second upgrade trigger.
13. **Introduce the Team tier** once multi-account demand shows up in support/sales conversations.
14. **Optimize.** Use the funnel data to tune free allowances, paywall copy, and the annual nudge. Run
    price tests on new cohorts only.

### Sequencing logic

Phase 1 earns money with code you mostly already have (plan-aware limits + Stripe), independent of the
LinkedIn integration that is still unverified. Phase 2 adds the recurring-value spine once it actually
works against LinkedIn. This avoids betting first revenue on the riskiest, least-finished part of the
stack.

---

## 6. Protecting the ethos (guardrails)

These are non-negotiable constraints the plan holds itself to, so monetization never erodes what makes
the product win:

- **The free core never moves behind the paywall or behind login.** Editor, preview, formatting, copy,
  share, embed, scoring, blog. If a feature helps someone preview/format/copy a post, it is free.
- **No login wall on the funnel.** Anonymous-first stays. Auth appears only at connect-LinkedIn, which is
  also the upgrade moment, never as a gate to use the tool.
- **SEO is sacred.** `/pricing` and upgrade UI must not regress Core Web Vitals, must not add login walls
  to indexed pages, and must not break existing URLs. The blog/compare/templates funnel stays fully open
  and `noindex` stays only on dashboard/embed as today.
- **Free AI stays genuinely useful.** The daily allowance is a real taste, framed honestly as a plan
  limit, not a crippled teaser. Generosity here is what feeds word-of-mouth and conversion.
- **Honesty over dark patterns.** No fake scarcity, no hidden auto-renew surprises, no credit-model
  confusion. The brand's edge over Taplio is trust; pricing must reinforce it.
- **Open-source stays open.** The MIT-licensed repo and self-host path remain. PRO is a hosted
  convenience (managed AI keys, LinkedIn app, scheduling infra, billing), not a license change. This is
  the standard, defensible open-core posture.

---

## 7. Risks and mitigations

| Risk                                                         | Likelihood   | Mitigation                                                                                            |
| ------------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------- |
| Gating AI sours the free community / SEO reputation          | Medium       | Keep a real free daily allowance; frame as plan limit; never gate the editor or preview               |
| LinkedIn API approval/limits delay the publishing pillar     | Medium-High  | Phase 1 (AI paywall) earns revenue without it; pursue API products early (lead time noted in ROADMAP) |
| Self-serve LinkedIn tokens expire at 60 days with no refresh | High (known) | Set expectations in UI; prompt reconnect; this is a product-quality issue, not a monetization blocker |
| Low conversion because it is measured against raw traffic    | Medium       | Measure against _active dashboard users_; set 3-5% target on that denominator                         |
| Competitors undercut on price                                | Low          | $15 already undercuts the AI camp; compete on free tier + compliance, not a price race                |
| Open-source users self-host to avoid paying                  | Low          | Self-hosting requires their own AI keys, LinkedIn app, and ops; PRO sells the managed convenience     |
| Refunds/chargebacks/abuse of "unlimited" AI                  | Low          | Stripe handles billing disputes; apply a generous fair-use ceiling and monitor outliers               |

---

## 8. Success metrics

Track from day one (PostHog + Stripe):

- **Activation:** % of SEO visitors who create a draft or open the dashboard (top-of-funnel health).
- **Upgrade-intent:** daily-limit-hit rate, pricing-page views, upgrade-clicks. These predict revenue.
- **Conversion:** PRO subscribers / active dashboard users. Target 3-5% near-term.
- **Revenue:** MRR, annual mix %, ARPU, founding-member uptake.
- **Retention:** PRO monthly churn (aim < 5%), and feature usage by plan (which pillar retains best).
- **Ethos health:** organic traffic, Core Web Vitals, free-tool usage. If any of these dip after the
  paywall, something crossed the line in section 6.

---

## 9. One-paragraph recommendation

Turn on a single **PRO tier at $15/mo ($12 annual)** built on three pillars: unlimited AI, direct
LinkedIn publish/schedule, and a content calendar with analytics. Keep the entire preview/format/copy
core and the SEO funnel free and login-free, with a genuine daily AI allowance on free. Ship it in two
moves: first monetize AI limits with Stripe + plan-aware rate limits (revenue this month, no dependency
on unfinished work), then finish and gate the LinkedIn publishing layer as the recurring-value spine.
Price below the AI competitors, win on a free tier none of them offer, and market the official-API
compliance angle directly against Taplio's shadowban reputation. Add a Team tier only once multi-account
demand is proven.

---

## Sources

Competitor pricing and benchmarks captured June 2026; re-verify before any public quote.

- [Taplio pricing (CheckThat.ai)](https://checkthat.ai/brands/taplio/pricing) and [Taplio review (Supergrow)](https://www.supergrow.ai/blog/taplio-review)
- [AuthoredUp pricing](https://authoredup.com/pricing) and [AuthoredUp pricing analysis (Typing Post)](https://typingpost.com/authoredup-pricing)
- [Supergrow pricing (SocialRails)](https://socialrails.com/blog/supergrow-pricing)
- [Typefully pricing](https://typefully.com/pricing) and [Typefully pricing (SocialRails)](https://socialrails.com/blog/typefully-pricing)
- [Buffer free plan limits 2026 (Glow Social)](https://glowsocial.com/blog/buffer-pricing-free-plan-limits-2026)
- [Freemium conversion benchmarks (Userpilot)](https://userpilot.com/blog/freemium-conversion-rate/) and [open-source SaaS conversion (Monetizely)](https://www.getmonetizely.com/articles/whats-the-optimal-conversion-rate-from-free-to-paid-in-open-source-saas)
