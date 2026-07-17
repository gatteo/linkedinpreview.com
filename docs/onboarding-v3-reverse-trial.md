# Onboarding v3 - The Audit Funnel (reverse trial)

> **Status:** Draft spec, approved direction (2026-07-04). Supersedes
> [onboarding-conversion-redesign.md](onboarding-conversion-redesign.md) (v2) in full. v2's
> infrastructure (two-tier enrichment, `onboarding_sessions`, Stripe billing, insight endpoints)
> is reused; its flow, rhythm, and monetization model are replaced.
>
> **Clickable prototype:** `docs/prototypes/onboarding-v3-prototype.html` (open in a browser,
> click through the whole funnel).
>
> **One-line goal:** Turn onboarding into a personalized LinkedIn audit that earns the user's data,
> proves the product on their own posts, and ends in a reverse trial (7 days of full Pro, no card)
> with a $7.99/mo or $29.99 lifetime conversion path - so paying feels like keeping something they
> already own, not buying something they haven't tried.

---

## 0. What changes vs v2, and why

v2 is a good "personalized wizard." v3 is a different animal: a **free LinkedIn audit that happens
to onboard you**. Three structural changes, each grounded in the conversion research
(`anatomy-of-converting-onboarding-flows.md`):

| #   | Change                     | v2                                      | v3                                                                                                                                                              | Why                                                                                                                                                                                                                      |
| --- | -------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **The frame**              | "Set up your LinkedIn system" (a chore) | "Get your free LinkedIn audit" (a prize)                                                                                                                        | The connect step stops being a data ask and becomes the thing the user came for. Handing over the profile URL is now the user's idea.                                                                                    |
| 2   | **The aha**                | One generated post                      | A full scored audit of their real posts (percentile, traction vs benchmarks, topic spread, pillar mix) **then** the generated post that fixes their biggest gap | Two stacked ahas: "it knows me" (audit) then "it works for me" (post). The paywall lands at the emotional peak of the second one.                                                                                        |
| 3   | **The monetization model** | Soft offer, free fallback               | **Reverse trial**: everyone leaves onboarding with 7 days of full Pro, no card. Conversion happens during/after the trial via endowment + loss aversion         | Reverse trials drive +15-40% conversion vs freemium. It also resolves v2's tension: we keep the "never hard-block" ethos AND get hard-paywall psychology (the day-7 downgrade is a loss event we manufactured honestly). |

Everything else in the research doc is applied as-is: paywall immediately after proof, goal in the
paywall headline, social proof on loading screens, free vs pro table, loss framing, one-tap
checkout, post-close 24h offer, premium onboarding after conversion, test timing before design.

**Competitive note.** This is deliberately the Scripe playbook (audit-report onboarding, "Top 30% -
strong work, {name}", benchmark deltas, trust wall, "claim 7 day free access") - but with two edges
they don't have: our audit numbers are deterministic (computed server-side from fetched posts, LLM
labels only - already built in v2), and we end the audit by **doing the work**: a ready first post
that fills the diagnosed gap, saved as a draft they keep.

---

## 1. Locked decisions

| Decision              | Choice                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monetization model    | **Reverse trial.** 7 days full Pro for everyone who completes onboarding. No card required to start. Day 7: downgrade to free + 24h founding-price offer.                        |
| Pricing               | **$7.99/mo** and **$29.99 lifetime (founding, limited window)**. Already wired in Stripe. Lifetime = power features forever, AI metered (stated honestly).                       |
| Data source           | Paste profile URL (primary) or OAuth (when Wave 4 ships). Two-tier fetch already built: Scrapingdog fast (3-12s) + Bright Data rich (42-60s, background).                        |
| Personalization spine | Role x goal matrix (v2 §3) stays. Goal string feeds every headline from the audit to the paywall.                                                                                |
| Guardrails            | All v2 guardrails hold: no dark patterns, real urgency only, deterministic numbers only, fake data flagged `«PLACEHOLDER»` and swapped before launch, free core never sold back. |

---

## 2. The flow

13 steps, but the shape matters more than the count: **3 collect beats, 5 reinforce/trust beats,
2 aha beats, 1 offer, and the collects are sandwiched so the user never answers two questions in a
row without getting something back.**

```
 welcome ─ connect ─ [scan] ─ mirror ─ goal ─ voice ─ cadence ─ benchmark
    │         │        │        │       └──── rich scrape runs behind these ────┘
   HOOK    COLLECT  theater  REINFORCE  C      C        C       REINFORCE
                                                                    │
 done ── offer ── recap ── first-post ── AUDIT ── [building] ───────┘
   │       │        │          │           │          │
 PREMIUM  CLAIM  ENDOWMENT   AHA #2      AHA #1    theater + trust
 ONBOARD  TRIAL
```

Rich scrape timing is the skeleton: the URL submit on `connect` triggers both fetches; the fast one
feeds `mirror` seconds later; the rich one (42-60s) completes while the user answers goal, voice,
and cadence, so the audit is ready the moment they reach it. Nobody waits.

**Progress bar:** slim, top. Only collect steps advance it (welcome, connect, goal, voice,
cadence = 5 ticks). Reinforce/aha screens hold the bar - they read as rewards, not work. Say
"about 2 minutes" once, on welcome. Never "step 9 of 13."

**Skips:** every collect past welcome has a quiet "Skip for now" (research: visible freedom
increases conversion). Skipping keeps seeded defaults and still routes through all value beats.

---

### S1 · Welcome (HOOK + micro-commitment)

Full-bleed, dark, on-brand. One question, zero inputs.

- **Headline:** "Let's find out what your LinkedIn is actually worth."
- **Sub:** "Free 2-minute audit of your real posts. Then we build you the system to fix what it finds."
- **Question:** "What are you here to do?" - multi-select tap targets mapping to `StrategyGoal`
  (win clients / grow company awareness / build authority / find opportunities / hire). First pick
  = `primaryGoal`, the variable every later headline uses.
- **Trust footer (small, real):** "«12,400» audits run · no signup · free forever core" `«PLACEHOLDER»`
- **CTA:** Continue (enabled at ≥1). No skip on this screen.

Writes: `goals[]`, `primaryGoal`, seeded `audience[]`.

---

### S2 · Connect (COLLECT - reframed as claiming the audit)

The critical reframe: we are not asking for data, we are asking where to send the auditor.

- **Headline:** "Which profile should we audit?"
- **Sub:** "Paste your LinkedIn URL. We read your public posts and score them against creators in
  your niche. Nothing is posted, nothing is changed."
- **Primary:** URL input `linkedin.com/in/...` + button **"Run my free audit"**.
- **Secondary (when OAuth ships):** "Connect LinkedIn instead" with the anti-Taplio trust line:
  "Official LinkedIn login. No cookies, no shadowban risk."
- **Tertiary, low emphasis:** "I don't have posts yet / set up manually" - routes to the manual
  branch (§8) which skips the audit and uses the v2-style mirror + generated-post path.
- **Trust row under the input:** lock icon + "Public data only. Delete anytime." + star rating `«PLACEHOLDER»`

On submit: fire fast fetch AND rich trigger simultaneously (existing `use-rich-pipeline`).
Writes: `profileUrl`.

---

### S3 · Scan (theater #1, 3-6s)

Animated ticking checklist over a blurred LinkedIn-card silhouette:
"Finding your profile ✓ · Reading your recent posts ✓ · Detecting your voice ✓ · Benchmarking your
niche…" - while the fast fetch resolves. If fast fetch fails: degrade to manual mirror (§8), never
show a raw error.

This screen carries the first **social proof insert**: one rotating testimonial card at the bottom
(real quote, name, role `«PLACEHOLDER»`). Loading screens are peak attention - use them.

---

### S4 · Mirror (REINFORCE #1 - "it already knows me")

- **Headline:** "Here's how we see you, {firstName}."
- Card with avatar + name (from fetch) and editable chips:
  "You're a **{role}** in **{niche}**, writing for **{audience}**. Your posts read **{toneSummary}**."
- One line under it: "Your full audit is being scored in the background - **{k} posts found so far**."
  (deterministic count from the rich trigger status when available; omit if not)
- **CTA:** "That's me - continue" / chips editable inline. Fallback: manual form (§8).

Writes: confirmed `role`, `niche`, `audience[]`, `toneSummary`.

---

### S5 · Goal (COLLECT)

- **Headline:** "What does winning look like?"
- Primary goal pre-selected from welcome, single-select chips; audience multi-select (max 3),
  pre-seeded from mirror.
- **Micro-reinforce on select:** one line updates live under the chips:
  "Got it. Your audit will score every post against **{goalRestated}**."

Writes: final `primaryGoal`, `audience[]`.

---

### S6 · Voice (COLLECT)

- **Headline:** "How should you sound?"
- Tone chips (`TONE_OPTIONS`), pre-selected from the observed `toneSummary` - labeled honestly:
  "Detected from your posts: **{tone}**". Optional one-line "anything to avoid?" input.
- **Micro-reinforce:** "Every post we draft will pass through this voice profile."

Writes: `tone`, `writingNotes`.

---

### S7 · Cadence (COLLECT + commitment device)

- **Headline:** "How often do you want to show up?"
- Options: 2x/week (steady) · 3x/week (recommended, pre-highlighted) · daily (aggressive).
- **The hook:** if the rich scrape has landed, show their real observed cadence next to the picker:
  "Right now you post **{observedPerWeek}x/week**." The gap between observed and chosen cadence
  becomes the audit's central tension and the offer's central promise.
- **Micro-reinforce:** "That's ~{N} posts a month. We'll have them drafted for you."

Writes: `cadence`, `frequency`, `schedule[]`.

---

### S8 · Benchmark (REINFORCE #2 - "people like you")

Role x goal cell from the personalization matrix, upgraded from v2's fake stats to honest framing:

- **Headline:** "{Role}s who post consistently get found."
- One honest industry benchmark line + their real follower count as the anchor:
  "You have **{followers} followers** watching. Creators in {niche} who hit 3x/week typically see
  compounding reach within 90 days." (benchmark-framed, no fabricated multipliers)
- One testimonial card matched to role `«PLACEHOLDER until real»`.
- Purpose in the funnel: absorbs remaining rich-scrape tail time; primes the audit.

---

### S9 · Building (theater #2 + trust wall, 4-8s)

"Scoring your last {n} posts…" ticking list (topic spread ✓ · pillar mix ✓ · traction vs benchmark ✓
· drafting your fix…). In parallel, fire `/api/onboarding/insights` + positioning + formats + the
first-post generation so everything downstream is instant.

Below the ticker, the **trust wall** (Scripe-style, ours must be real or clearly illustrative):
stat row ("«12,400» audits · «4.9» rating · featured on «X»") + 2-3 short review cards. This is the
highest-attention moment before the audit and the paywall - stack proof here. `«ALL PLACEHOLDER»`

---

### S10 · The Audit (AHA #1 - the report)

Not a modal step: a **full-screen scrollable report**, the emotional centerpiece. Every number
deterministic (server-counted), every label LLM-generated (existing insights contract). Sections,
in order:

1. **Percentile hero.** Avatar + "**Top {p}% - strong work, {firstName}**" (or the honest lower
   bracket: "You're leaving reach on the table, {firstName}"). Sub: "We scored your last {n} posts.
   Here's exactly what we found." Percentile = deterministic composite of observed cadence,
   traction vs niche benchmark, and topic focus (formula in §5; never LLM-invented).
2. **01 · Traction.** 2x2 stat grid: avg likes / avg comments / avg views (when available) /
   posts-per-week - each with a benchmark delta chip ("on benchmark" / "1.5x below" / "13x below
   sweet spot"). Copy panel: loss-framed but kind: "Every week you don't post, your older posts
   decay out of feeds. You haven't posted enough for LinkedIn to know who you are yet."
3. **02 · Topics.** "You're spread across {t} topics." Ranked topic list with the strongest
   highlighted: "**{topTopic}** is your wedge. The other {t-1} dilute your signal. Top performers
   in your niche stick to 2-3."
4. **03 · Pillar mix.** Radar/spider of personal / educational / promotional / organizational vs
   the ideal mix for their goal. One line: "Your mix is {imbalanceLabel}. {goalRestated} needs
   more {missingPillar}."
5. **04 · The prescription.** "Your biggest gap: **{gap}**. Fixable this week." CTA:
   **"Show me the fix →"** - advances to S11.

Sticky bottom CTA throughout the scroll: "Show me the fix →" so fast scrollers can't get lost.

---

### S11 · First post (AHA #2 - the product does the work)

- **Headline:** "So we wrote it for you. In your voice."
- **Sub:** "A {missingPillar} post about {topTopic}, written from your own {n} posts. This took
  4 seconds."
- The generated post inside the **realistic LinkedIn preview card** (component 023), with:
  Regenerate · "Make it punchier" (quick actions 032) · live content-score badge (050-056).
- Footer: "Saved to your drafts. It's yours either way."
- Post is written against real scraped posts as style references (existing
  `/api/onboarding/first-post` with `firstPostStyled`), targeted at `firstPostGap`.
- **Guard:** AI failure falls back to the per-role template library. This screen never errors.

Writes: draft persisted, `firstPostText`, `firstPostGap`.

---

### S12 · Recap (ENDOWMENT - "your system is ready")

Summary card, personalized, framed as assets they now own:

- **"{firstName}, your LinkedIn system is ready."**
- ✓ Your audit ({n} posts scored, top {p}%) · ✓ Positioning statement · ✓ Voice profile ({tone})
  · ✓ First post drafted (fills your {gap} gap) · ✓ {cadence} calendar · ✓ {k} post ideas queued
- Sub: "All of it built around your goal to **{goalRestated}**."
- **CTA:** "Unlock everything free for 7 days →"

---

### S13 · Offer (THE CLAIM - reverse trial)

Not a paywall. A claim screen. Full detail in §4. Summary:

- **Headline:** "Get 7 days of everything, {firstName}. Free."
- **Sub (goal-fed):** "Full Pro access - unlimited AI, scheduling, carousels, analytics - so you
  can {goalRestated} starting today. No card. After 7 days you keep the free core forever."
- **Primary CTA:** "Start my 7 free days →" (one tap, no checkout - it's free)
- **Beneath, the two conversion paths, low-pressure, visible:**
    - Lifetime $29.99 founding price ("skip the trial math, keep power features forever, AI metered") - badge: "Most popular"
    - Monthly $7.99 ("cancel anytime")
    - Anchor row: "Others charge $19-199/mo (Taplio $39+, Supergrow $19+). You: $29.99 once."
- **Free vs Pro table** (research: the single most consistent paywall addition): 5 rows max -
  AI generation (daily cap vs high ceiling), publish + schedule, carousels (watermark vs none),
  analytics, calendar.
- **Honest urgency:** "Founding price ends {real date}." Real window only.
- Tiny footer: "Continue on the free plan without the trial →" (kept for the no-trial minority;
  near-invisible but present - freedom increases conversion).

Writes: `trialStartedAt`, `trialEndsAt` (+7d), plan stays `free` with `trial` entitlement flag; or
direct Stripe checkout for lifetime/monthly (Checkout with wallet buttons, email + payment only).

---

### S14 · Done (PREMIUM ONBOARDING - do not go silent)

Research: subscribers who don't reach a _premium_ aha in session one churn before renewal. Same
logic applies to trials - a trial that's never used converts at ~0.

- Confetti. "**You're in, {firstName}. 7 days of everything starts now.**"
- Immediately route into ONE guided premium action (pick by role/goal, not a tour):
  default = open the first draft with the schedule dialog pre-opened: "Publish or schedule your
  gap-filling post right now." Alternative for creator roles: "Turn this post into a carousel."
- Persistent but calm **trial ribbon** in the dashboard: "Pro trial · {d} days left · Keep it for
  $29.99 once" - the ribbon is the ongoing contextual re-prompt.

---

## 3. The reverse-trial lifecycle (where conversion actually happens)

The offer screen starts the clock; the trial converts. Instrument each moment:

| Day   | Moment           | Surface                           | Copy angle                                                                                                                                                                                                      |
| ----- | ---------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Premium aha      | S14 guided action                 | "Schedule your first post" - usage, not selling                                                                                                                                                                 |
| 1-2   | Habit            | In-app nudge if no 2nd session    | "Your Tuesday post is drafted" (from ideas queue)                                                                                                                                                               |
| 3     | Value receipt    | In-app card (+ email if captured) | Deterministic recap: "{x} posts drafted, {y} scheduled, {z} AI actions - all Pro features"                                                                                                                      |
| 5     | Pre-loss warning | Trial ribbon turns amber + card   | Loss-framed inventory: "In 2 days you lose: scheduling, unlimited AI, carousels without watermark. Your drafts and audit stay."                                                                                 |
| 7     | Downgrade        | Modal on first post-trial session | "Your trial ended. Everything you built is still here." + both plans + **24h founding-window reminder**                                                                                                         |
| 7+24h | Post-close offer | One card, once                    | The research's welcome-offer pattern: shown ONLY to trial-expired non-converters, once, honest deadline. (Same $29.99 with hard window end, or a discounted price if pricing team approves - open question §9.) |
| any   | Limit hits       | Existing limit-reached modal      | Contextual re-prompt, unchanged from monetization doc                                                                                                                                                           |

Rules: the downgrade never deletes anything the user made (drafts, audit, calendar config persist
read-only where the feature is Pro). Loss framing describes real losses only.

---

## 4. The offer screen, in detail

```
┌──────────────────────────────────────────────────────────────┐
│        Get 7 days of everything, {firstName}. Free.          │
│  Unlimited AI, scheduling, carousels, analytics - so you     │
│  can {goalRestated} starting today. No card required.        │
│                                                              │
│            [ Start my 7 free days → ]   (primary)            │
│                                                              │
│  ────────────── or keep it from day one ──────────────       │
│   ┌── LIFETIME · Most popular ──┐  ┌── MONTHLY ──────┐       │
│   │  $29.99 once (founding)     │  │  $7.99 / mo      │       │
│   │  Power features forever     │  │  All Pro features│       │
│   │  AI on a generous monthly   │  │  Cancel anytime  │       │
│   │  allowance (not unlimited)  │  │                  │       │
│   │  [ Get lifetime → ]         │  │  [ Go monthly → ]│       │
│   └─────────────────────────────┘  └──────────────────┘       │
│                                                              │
│  Others charge $19-199/mo. You: $29.99 once.                 │
│  ┌──────────── Free vs Pro (5 rows) ────────────┐            │
│  │ AI generation   · daily taste   · high ceiling│           │
│  │ Publish+schedule· -             · ✓           │           │
│  │ Carousels       · watermark     · clean       │           │
│  │ Analytics       · -             · ✓           │           │
│  │ Calendar        · -             · ✓           │           │
│  └───────────────────────────────────────────────┘           │
│  ⏳ Founding price ends {real date}. 7-day money-back.        │
│  ★★★★★ «4.9» · "«quote»" - «name, role»                       │
│                                                              │
│         Continue on the free plan without the trial →        │
└──────────────────────────────────────────────────────────────┘
```

Psychology, honestly applied: the free trial CTA removes all risk from the primary action (near-
100% claim rate expected, which is the point - everyone enters the loss-aversion machine). Lifetime
is anchored three ways (vs monthly x4 months, vs competitors, vs the trial's implied value).
Loss framing is reserved for day 5-7 where it's true. Honesty rules from v2 §7.3 all hold
(AI-metered disclosure on lifetime, auto-renew disclosure on monthly, real founding window).

Checkout: Stripe Checkout with Apple Pay / Google Pay / Link enabled, email + payment only,
anonymous-auth flow unchanged (account creation stays deferred - the anonymous-checkout pattern
from the research is literally our existing architecture).

---

## 5. Deterministic percentile (no fabricated numbers)

The hero number must survive scrutiny. Composite score, computed server-side in
`/api/onboarding/insights`, from three observed components (each 0-100, weighted):

- **Consistency (50%):** observed posts/week vs the 3x/week sweet spot (capped, dormancy-penalized
  via `newestPostAt`).
- **Focus (25%):** topic concentration - share of posts in the top 2 topics.
- **Engagement (25%):** avg reactions+comments vs a fixed per-follower-band benchmark table
  (documented constants in `config/onboarding-benchmarks.ts`, sourced + dated).

Percentile = score mapped through a fixed distribution table (config, not LLM). The copy renders
brackets only: Top 10 / 30 / 50 / "room to grow" (never a fake-precise "Top 23.7%"). If rich data
never landed, the audit degrades to the qualitative path (§8) and shows no percentile.

---

## 6. AI call inventory (use AI everywhere it labels, never where it counts)

| Moment                | Call                                                                                                 | Status                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Mirror inference      | `/api/onboarding/enrich` (role/niche/tone/audience from fast profile)                                | exists                                      |
| Insight labels        | `/api/onboarding/insights` (topic labels, pillar classification, gap pick; server counts everything) | exists, extend with percentile + pillar mix |
| First post            | `/api/onboarding/first-post` (style refs = real posts, targets gap)                                  | exists                                      |
| Positioning + formats | `/api/strategy/positioning`, `/api/strategy/formats`                                                 | exists                                      |
| Week-of-ideas         | weekly ideas endpoint (queue {k} ideas for recap + day 1-2 nudges)                                   | exists (202)                                |
| Voice profile summary | small call summarizing observed tone into the voice chips label                                      | new, cheap                                  |
| Trial day-3 receipt   | none - deterministic usage counts only                                                               | n/a                                         |

All onboarding calls run in a separate generous onboarding bucket (v2 decision, keep), fail closed
to templates, and never gate a wow moment on an error state.

---

## 7. Analytics + experiment plan

Events (PostHog, snake_case): `onb3_welcome_view/select`, `onb3_connect_view/submit{method}`,
`onb3_scan_done{ok}`, `onb3_mirror_confirm/edit`, `onb3_goal_set`, `onb3_voice_set`,
`onb3_cadence_set{cadence,observedGap}`, `onb3_benchmark_view`, `onb3_building_done`,
`onb3_audit_view`, `onb3_audit_scroll{section}`, `onb3_audit_percentile{bracket}`,
`onb3_first_post_view/regenerate`, `onb3_recap_view`, `onb3_offer_view`,
`onb3_trial_start`, `onb3_offer_purchase{plan}`, `onb3_offer_free_decline`, per-step `onb3_skip`,
then trial lifecycle: `trial_d3_receipt_view`, `trial_d5_warning_view`, `trial_expired_view`,
`trial_convert{plan,day}`, `postclose_offer_view/convert`.

North-star funnel: connect-submit → audit-view → trial-start → trial-convert. Watch
audit-view → offer-view drop hardest.

Test **timing before design** (research's #1 rule). Priority queue:

1. Trial length 7d vs 14d (long trials convert ~70% better; 7d is the aggressive baseline).
2. Offer position: after first-post (current) vs directly after audit.
3. Day-7 modal: plans-only vs plans + discounted post-close offer.
4. Audit hero: percentile bracket vs pure benchmark deltas (no bracket).
5. Lifetime vs monthly card order.

---

## 8. Degraded paths and edge cases

| Case                                         | Behavior                                                                                                                                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No posts found / private profile             | "Qualitative audit": mirror + role benchmarks + first post; skip traction/percentile sections; copy: "You're starting fresh - that's the easiest audit we run." Trial offer unchanged. |
| Fast fetch fails                             | Manual mirror form (v2 pattern), qualitative path. Never blame the user; one retry allowed.                                                                                            |
| Rich scrape still pending at S9              | Building screen holds up to 20s with proof wall; then proceed with whatever landed; audit renders only sections with data.                                                             |
| Manual/no-URL branch                         | v2-style flow: mirror form → questions → generated post → recap → same trial offer.                                                                                                    |
| AI failure at first post                     | Per-role template library. Never an error on an aha screen.                                                                                                                            |
| Refresh / OAuth round-trip                   | Incremental localStorage persistence (v2 §5.1, keep) + server `onboarding_sessions`.                                                                                                   |
| Returning onboarded user                     | Never re-onboard (backfill logic 068 AC-2). Trial is once per user, gated server-side (entitlement row, not localStorage).                                                             |
| Trial abuse (anon accounts are free to mint) | Trial entitlement keyed to profile URL hash + device fingerprint best-effort; accept leakage at current scale, add global scrape budget before spikes (v2 known limitation stands).    |
| Mobile 375px                                 | Every screen single-column; audit sections stack; sticky CTA remains.                                                                                                                  |

---

## 9. Open questions

1. **Post-close price:** same $29.99 with hard window, or a genuine discount (e.g. $19.99/24h)?
   Discount converts better but trains discount-waiting. Recommend: same price, hard window end.
2. **Trial without card - Stripe mechanics:** trial entitlement is app-side (no Stripe object until
   purchase). Confirm entitlement flag + cron downgrade job scope.
3. **Email capture:** URL-paste users have no email. Capture optionally at trial start ("where do
   we send your day-3 report?") - benefit-framed, skippable. Needed for day-3/5/7 emails.
4. **Percentile benchmark table:** source + date the engagement bands before launch (§5).
5. **Trust wall content:** which real numbers exist today (audit count, review source)? Everything
   is `«PLACEHOLDER»` until inventoried.

---

## 10. Build sequencing

1. Step machine reorder + audit screen skeleton (static data) - get the rhythm right.
2. Percentile + pillar-mix extension to `/api/onboarding/insights` + benchmarks config.
3. Audit report UI (scroll sections, sticky CTA) + first-post gap targeting (mostly exists).
4. Trial entitlement (flag, ribbon, cron downgrade, day-3/5/7 surfaces).
5. Offer screen rework (claim-first layout, free-vs-pro table, wallets on Checkout).
6. Trial lifecycle analytics + post-close offer.
7. Polish: mobile, degraded paths, placeholder swap, copy pass (no em dashes).
