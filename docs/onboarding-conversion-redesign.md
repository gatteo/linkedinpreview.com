# Onboarding Redesign - Personalized, Conversion-First Flow

> **Status:** Implemented on `feat/dashboard-overhaul` (flow + Stripe billing). See
> [billing.md](billing.md) for the operational reference (env, Stripe setup, placeholders to swap, the
> anon-user_id entitlement limitation). The matrix copy, stats, testimonials, and offer urgency values
> ship as flagged placeholders (§9) and must be replaced before public launch.
>
> **Original status:** Draft spec for review. Hand-off target: AI designer (visual + interaction) and AI
> coding agent (implementation). Last edited: 2026-06-27.
>
> **One-line goal:** Replace the current setup-only onboarding (feature 068) with a personalized,
> alternating onboarding that collects data, mirrors it back as tailored value, lets the user _feel_
> the product on their own data, and ends with an offer ($7.99/mo or $29.99 lifetime) so well-framed
> they convert - while never hard-blocking anyone (decline drops into the existing free dashboard).

---

## 0. How to read this document

This spec is organized so each part can be picked up independently:

1. **Strategy & principles** - the "why," the psychology, the guardrails. Read once.
2. **The flow** - screen-by-screen, in order, with copy, interaction, and the data each screen reads/writes.
3. **The personalization engine** - the role→content matrix that powers every "tailored" moment. This is the heart of the redesign.
4. **AI smart calls** - exact prompt specs and contracts for the 3 AI moments.
5. **Data model, components, analytics** - what the coding agent wires up, mapped to existing code.
6. **The offer** - pricing screen detail and pricing psychology.
7. **Edge cases, fake-data inventory, A/B tests, open questions.**

**Convention used throughout:** anything written as `«PLACEHOLDER»` is fake/illustrative data
(stats, testimonials, names) that must be swapped for real or legally-safe content before launch.
Section 9 inventories every placeholder in one place.

---

## 1. Goals, decisions, and guardrails

### 1.1 Primary goal

Convert a new dashboard user into a paying customer (**$7.99/mo** or **$29.99 lifetime, limited
time**) during or shortly after onboarding - without breaking the free, login-free, SEO-first ethos
the product is built on.

### 1.2 Decisions already locked (from product owner)

| Decision         | Choice                                                                                                                     | Implication for this spec                                                                                                                                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paywall hardness | **Soft offer, free fallback**                                                                                              | The offer screen is the climax, but "Continue on free plan" always exists. Declining lands the user in the fully-functional free dashboard with everything they configured pre-filled. We re-prompt contextually later (limit-hit moments), never with a wall. |
| LinkedIn step    | **Connect + paste profile URL**, used generally to enrich                                                                  | Connecting is the first real step and is pushed hard, but a profile-URL paste (and a manual fallback) gives us the same personalization seed for users who won't OAuth.                                                                                        |
| Personas         | **Role-driven** - user states role in a step, or we infer it from LinkedIn, then everything downstream personalizes off it | We don't hard-code 4 personas; we build a role→content matrix keyed on the 7 roles that already exist in the product (§3).                                                                                                                                     |
| Lifetime offer   | **App features lifetime, AI metered**                                                                                      | The $29.99 deal unlocks all non-AI power features forever; AI generation stays on a higher monthly allowance, not truly unlimited. Offer copy must be honest about this (§7).                                                                                  |

### 1.3 The core mechanic: alternate, don't interrogate

The flow alternates between two beat types so it never feels like a form and never feels like an ad:

- **COLLECT** beats ask for one thing (role, goal, voice, cadence). Each is fast, tappable, skippable.
- **REINFORCE / PREVIEW** beats immediately pay the collected data back as something the user wants:
  a tailored "people like you" proof point, a mirror of who they are, or - the real weapon - the
  product _doing the work on their own profile_ (a generated post in their voice).

The rhythm is: **collect → reinforce → collect → preview (aha) → collect → reinforce → build → offer.**
Every COLLECT is "earned" by the value beat right after it, so giving data feels like unlocking, not paying a toll.

### 1.4 Psychological spine (grounded in researched patterns)

- **Micro-commitment & consistency** (Duolingo): open with a single motivation tap _before_ asking
  for anything heavy. Once someone states "I'm here to win clients," they act consistently with it.
  Duolingo cut first-week churn ~47% with exactly this move.
- **Time-to-value / aha inside onboarding** (reverse-trial thinking): the user must experience the
  magic - a real post written in their voice - _before_ the offer, not after. Shorter time-to-value
  more than doubles free→paid in documented cases.
- **Mirror / "it already knows me"**: reflecting their LinkedIn back ("you're a fractional CFO who
  posts mostly text, aimed at founders") creates the "oh, this is exactly for me" feeling the owner
  asked for.
- **"People like you" social proof**: segment-specific stats and testimonials at each reinforcement
  beat. Tailored proof outperforms generic proof.
- **Endowment / loss aversion at the offer**: by the offer screen the user already has a positioning
  statement, a voice profile, a first week of posts, and a calendar configured. The offer isn't
  "buy a tool," it's "keep the system you just built." Losing it hurts.
- **Anchoring + urgency at checkout**: anchor lifetime against both the monthly price _and_
  competitors ($39–199/mo), wrap in an honest limited-time founding window.

### 1.5 Guardrails (do not cross)

These come straight from the product's monetization ethos. The redesign must hold them:

1. **Never hard-block.** Every screen past Welcome has a low-emphasis skip; the offer has a free
   fallback. Onboarding can be exited to a working free product at any point.
2. **No dark patterns.** Urgency must be real (a genuine founding window / honest countdown), scarcity
   must be true, auto-renew must be disclosed. The brand's edge over Taplio is trust.
3. **Fake data must be labeled internally and swapped before launch.** Illustrative testimonials and
   "5x" stats are fine for the prototype; shipping them as real claims is not. See §9.
4. **The free core is never sold back.** The offer sells AI volume + lifetime power features, never
   the editor/preview/format/copy that is free forever.
5. **Honesty on the lifetime deal.** "$29.99 forever" must clearly state AI stays metered (§7.3).

---

## 2. The flow, screen by screen

The flow is a state machine, same architectural pattern as the current `onboarding-modal.tsx`
(direction-aware slide transitions, progress indicator, per-step skip). It runs in the existing
non-dismissable modal on first dashboard visit.

**Step IDs (new machine):**
`welcome → connect → mirror → goal → proof → preview → voice → spotlight → cadence → building → recap → offer → (done | free-fallback)`

A persistent slim **progress bar** runs across the top. Milestone/value screens (mirror, proof,
preview, spotlight, building, recap, offer) do **not** advance the bar the way data steps do - they
read as rewards, not work. Show "~2 minutes" once, on Welcome, and never show a discouraging
"Step 9 of 13."

> **Skip behavior:** data steps carry a quiet "Skip for now." Value/preview steps carry "Continue."
> Welcome carries one low-emphasis "Skip setup." Skipping any data step still routes through the
> remaining value beats using whatever data we have (including role/goal inferred from LinkedIn).

---

### Screen 1 - Welcome (HOOK + micro-commitment)

**Goal:** state the transformation, get one tiny commitment, set the personalization seed before any friction.

**Layout:** full-bleed, on-brand. Headline, sub, and a single question with 3–5 large tap targets.
No text inputs. No "connect" yet.

**Copy:**

- Headline: **"Let's turn your LinkedIn into your #1 growth channel."**
- Sub: "Two minutes. We'll set up your voice, your strategy, and your first week of posts - personalized to you."
- Question: **"What are you here to do?"** (single select, this is the motivation seed → maps to a primary goal)

**Options (map to existing `StrategyGoal`s):**

| Tap label                             | Maps to goal                               | Seeds                          |
| ------------------------------------- | ------------------------------------------ | ------------------------------ |
| "Win more clients / revenue"          | `revenue-growth`                           | audience `new-clients`         |
| "Grow my company's awareness"         | `company-awareness`                        | audience `partners`            |
| "Build my personal brand / authority" | `revenue-growth` (creator/consultant lean) | audience `new-clients`         |
| "Find career opportunities"           | `career-opportunities`                     | audience `potential-employers` |
| "Hire / employer branding"            | `employer-branding`                        | audience `talents`             |

**Writes:** `answers.primaryGoal`, provisional `answers.audience[]`.
**CTA:** selecting an option auto-advances (no separate Next button - momentum).
**Skip:** "Skip setup" (low emphasis, bottom). Marks onboarding done with defaults → free dashboard.

---

### Screen 2 - Connect LinkedIn (COLLECT, the magic data step)

**Goal:** get the richest personalization signal we can. Primary path = OAuth; secondary = paste
profile URL; tertiary = manual. Framed as _unlocking personalization_, never as a login wall.

**Copy:**

- Headline: **"Connect LinkedIn so everything is about _you_."**
- Sub: "We read your headline, your niche, and how you already write - then tailor your whole setup. Takes 5 seconds."
- Primary CTA: **"Connect LinkedIn"** (official OAuth; emphasize "Official LinkedIn login. We never post without your say-so. No shadowban risk." - the anti-Taplio trust line.)
- Secondary, below: **"Or paste your profile URL"** → reveals an input `linkedin.com/in/...` + "Use this" button.
- Tertiary, low emphasis: "I'll set it up manually" → skips to Screen 3 using only the Welcome goal.

**What each path yields (be realistic - see §4.1):**

- **OAuth:** verified name, headline, profile photo, vanity URL. (Basic OpenID scope does _not_ return
  followers or post history - do not promise analytics here.)
- **Profile URL paste:** the URL is stored and passed to the AI enrichment call (§4.1) which infers
  niche / role / audience / tone from whatever public signal is available. Treat AI inference as
  _suggestions the user confirms_, never as scraped fact.
- **Manual:** no enrichment; we lean on the Welcome goal and the explicit role step.

**Interaction:** OAuth uses the existing persist-to-`localStorage`-then-redirect-then-rehydrate
bridge already built for feature 068 (`lp-onboarding-state`, resume in `onboarding-controller.tsx`).
On return, advance to the Mirror screen with a "reading your profile" transition.

**Writes:** `answers.linkedinConnected`, `answers.profile{name,headline,avatarUrl,vanityUrl}`,
`answers.profileUrl`.

---

### Screen 3 - Mirror / "Here's what we learned" (REINFORCE, the first wow)

**Goal:** prove the product already understands them. This is the "oh, this is exactly for me" beat.
It runs an AI enrichment call (§4.1) and reflects the result back as an editable summary.

**Transition in:** a 2–4s animated "Reading your profile…" with 3 ticking line items
("Spotting your niche ✓ / Reading your voice ✓ / Mapping your audience ✓"). This is theater, but it
makes the payoff land. (Mirrors the existing `building-step` animated checklist pattern.)

**Copy (template, AI-filled):**

> **"Here's how we see you:"**
> You're a **{role}** in **{niche}**, writing mostly for **{primaryAudience}**.
> Your current style reads **{toneSummary}**. Your biggest opportunity: **{opportunityLine}**.

Each bolded token is an inline-editable chip. "Looks right?" → **Confirm & continue.** Editing a chip
updates the underlying answer. If enrichment failed or was skipped, this screen degrades to a friendly
"Tell us who you are" with the role selector inline (so it never shows empty).

**Writes:** confirmed `answers.role`, `answers.niche`, `answers.toneSummary`, `answers.audience[]`.
**Why here:** confirming a role/niche that the product _guessed_ feels collaborative and accurate,
far better than asking cold. This is the role-driven pivot the whole engine keys on (§3).

---

### Screen 4 - Goal & audience confirm (COLLECT)

**Goal:** lock the primary goal (seeded on Welcome) and audience (seeded from Mirror), with one tap to adjust.

**Copy:**

- Headline: **"What does winning look like for you?"**
- Primary goal: pre-selected from Welcome, shown as chips (existing `STRATEGY_GOALS`), single highlight, changeable.
- Audience: pre-selected from Mirror, multi-select chips (existing `STRATEGY_AUDIENCES`, max ~3).

**Writes:** `answers.primaryGoal`, `answers.audience[]` (final).
**Skip:** "Skip for now" keeps seeded defaults.

---

### Screen 5 - "People like you" proof (REINFORCE, tailored social proof)

**Goal:** tailored proof that _this specific kind of person_ wins with the product. Pulled from the
role×goal cell of the personalization matrix (§3). Uses `«PLACEHOLDER»` stats + one testimonial card.

**Layout:** big stat, one-line claim, one testimonial card (avatar, name, role, quote, small metric).

**Copy (example, founder + revenue-growth cell):**

- Stat: **"«5×»"**
- Claim: "Founders who post 3×/week with LinkedInPreview book **«5× more inbound calls»** within 90 days."
- Testimonial: _"«I closed two deals from posts I wrote in 10 minutes here. It sounds like me, not ChatGPT.»"_ - **«Marco R., SaaS founder»**

See §3 for every role's tailored stat + testimonial. **All values are placeholders (§9).**
**CTA:** "Continue."

---

### Screen 6 - Preview / the aha (PREVIEW, product does the work on _their_ data)

**Goal:** the single most important conversion lever. The product writes a real LinkedIn post **in
their voice, on their niche, toward their goal**, and shows it inside the realistic feed-preview card.
This is the reverse-trial taste: value delivered _before_ the ask.

**Transition in:** "Writing your first post…" (2–5s). Calls the post-generation AI (§4.2) using
role + niche + goal + audience + toneSummary.

**Layout:** left = the generated post in the **realistic LinkedIn preview card** (existing component
023), formatted (Unicode bold, line breaks, a hook). Right/below = three affordances that surface
real product features without leaving onboarding:

- **"Regenerate"** (shows AI generation is one tap)
- **"Make it punchier / shorter / add a hook"** (surfaces Quick AI Actions, feature 032)
- A small live **content score** badge (readability/length, the client-side scoring 050–056) - costs nothing, looks smart.

**Copy:**

- Headline: **"Here's a post we wrote for you. In your voice."**
- Sub: "This took us 4 seconds. Imagine never staring at a blank editor again."
- Footer line: "You'll be able to edit, schedule, and publish posts like this in a minute."

**Writes:** stash the generated post as the user's **first draft** (so it's waiting for them in the
dashboard regardless of whether they convert - endowment). `answers.firstDraftId`.
**Guard:** if AI fails, fall back to a high-quality `«template post»` for their role so the screen
never breaks. Never show an error here - this is the wow moment.

---

### Screen 7 - Voice / writing style (COLLECT, fast)

**Goal:** let them tune the voice they just saw, reinforcing ownership of the output.

**Copy:**

- Headline: **"Make sure it always sounds like you."**
- Tone chips (existing `TONE_OPTIONS`: professional, casual, inspirational, educational, storytelling, humorous), pre-selected from the inferred `toneSummary`. Optional 1-line "anything we should avoid?" input (maps to dos/donts, features 087).

**Writes:** `answers.tone`, `answers.writingNotes`.
**Micro-reinforce:** when they change a tone chip, the preview post on Screen 6 (kept in state) can
re-style live if cheap, or show "We'll apply this to every post." Skippable.

---

### Screen 8 - Feature spotlight (PREVIEW, role-tailored differentiator)

**Goal:** show _one_ high-value feature chosen by role, so the product feels deep and built for them.
Not a feature tour - a single, relevant "imagine this" beat. Which feature is chosen comes from the
matrix (§3.3).

**Examples (role → spotlight):**

- Founder / Team-lead → **Analytics + inbound framing**: "See which posts actually drive profile views and DMs." (Wave 5 analytics, framed as outcome.)
- Agency / Team-lead → **Content calendar + scheduling**: "Plan a month of posts in one sitting, auto-published." (Wave 4.)
- Freelancer / Consultant / Creator → **Carousels + weekly AI ideas**: "Turn one idea into a swipeable carousel that gets saved and shared." (Wave 3 + feature 202.)
- Employee → **Weekly AI post ideas + hooks**: "Never wonder what to post - 5 ideas waiting every Monday." (Feature 202 + 035.)

**Layout:** a short looping visual/mock of the feature (designer to produce) + one outcome headline +
one line. **CTA:** "Continue."

---

### Screen 9 - Cadence & commitment (COLLECT + COMMIT)

**Goal:** Duolingo-style daily-goal commitment, adapted: pick how often you'll post. This both
configures the schedule _and_ manufactures a commitment the offer will reference.

**Copy:**

- Headline: **"How often do you want to show up?"**
- Options (map to `frequency`/schedule): "2× a week (steady)", "3× a week (recommended)", "Daily (aggressive growth)". Pre-highlight "3× a week."
- Micro-commitment line under selection: **"Great - that's ~{N} posts a month. We'll have them ready for you."**

**Writes:** `answers.frequency`, `answers.schedule[]`.
**Why:** stating a cadence creates ownership; the recap and offer screens convert that into "here's
the system that makes your {3×/week} actually happen."

---

### Screen 10 - Building your system (REINFORCE, animated payoff)

**Goal:** reuse the existing `building-step` pattern - an animated checklist while we generate the
positioning statement and suggested formats in parallel (existing `/api/strategy/positioning` and
`/api/strategy/formats`). Now it assembles _more_ perceived value.

**Checklist items (theatrical, ~4–6s):**

- "Writing your positioning statement ✓"
- "Choosing your best-fit post formats ✓"
- "Drafting your first week of posts ✓" (can reuse weekly-ideas, feature 202)
- "Setting your calendar ✓"

**Writes:** `branding.positioning`, `strategy.formats`, optionally a few `weekly ideas`.

---

### Screen 11 - Recap / "Your system is ready" (REINFORCE → sets up the offer via endowment)

**Goal:** show everything they now have, as a tangible asset, right before the ask. This is the
loss-aversion setup: they must feel they already built something worth keeping.

**Layout:** a clean "dashboard preview" summary card showing, personalized:

- Their **positioning statement** (1 line).
- Their **voice** (tone).
- **First post** (the one from Screen 6) - "ready to publish."
- **{N} more post ideas** queued.
- Their **calendar** ({cadence}).

**Copy:**

- Headline: **"{FirstName}, your LinkedIn system is ready."**
- Sub: "Positioning, voice, your first post, and a month of ideas - all set up around your goal to **{goalRestated}**."
- CTA: **"See my offer"** (primary) - leads to the offer as the natural next step, not a jarring sales jump.

---

### Screen 12 - The Offer (OFFER, the climax)

Full detail and pricing psychology in **§7**. Summary of what's on screen:

- **Transformation headline** tying their goal to the outcome: "Everything you need to **{goalRestated}** - for less than a coffee a month."
- **Two plans, lifetime anchored as hero:**
    - **Lifetime - $29.99** _(limited-time founding price)_ - "Pay once. Keep all power features forever." (AI metered - stated honestly.) Badge: "Best value."
    - **Monthly - $7.99/mo** - "Cancel anytime."
- **Anchor row:** strike-through "Others charge $39–199/mo" → "You: $29.99 once."
- **Value recap mini-list** of what unlocks (the system they just built + power features).
- **Honest urgency:** "Founding price ends {date} / for the first «500» members." Real window only.
- **Risk reversal:** "«7-day money-back», cancel in two clicks."
- **Soft fallback (always present, low emphasis):** "Continue on the free plan →".

**Writes:** on purchase → `plan` update via Stripe (existing Phase-1 billing plan). On decline →
`onboardedAt` set, drop to free dashboard.

---

### Screen 13 - Done

- **If converted:** celebratory confetti (existing `confetti.tsx`) → "Welcome to Pro. Your first post is ready." → dashboard, first draft open.
- **If declined:** "You're all set - your posts are waiting." → free dashboard, everything pre-filled,
  the Screen-6 draft open. A subtle, dismissible "Upgrade" entry point remains; contextual re-prompts
  fire at limit-hit moments (see §6 and the monetization doc's Phase-1 limit-reached modal).

---

## 3. The personalization engine (role-driven matrix)

This is the core of the redesign. Every "tailored" moment reads from one config object keyed on the
user's **role** (the 7 existing `BrandingRole`s) and cross-cut by **primary goal**. Build it as a
single typed config the coding agent can extend, so designers/PMs tune copy without touching flow logic.

### 3.1 The 7 roles (existing `BrandingRole`)

`founder` · `freelancer` · `team-lead` · `employee` · `creator` · `consultant` · `agency`

If role is unknown (skipped LinkedIn + skipped role), default to a **"creator/generalist"** branch and
personalize off the Welcome goal alone.

### 3.2 Per-role content matrix

For each role, the engine supplies: the **mirror opportunity line**, the **proof stat + claim**, a
**testimonial**, the **spotlight feature**, and **default goal/audience**. All stats/testimonials are
`«PLACEHOLDER»` (§9).

| Role           | Mirror "opportunity" line                                                   | Proof stat + claim `«fake»`                                                           | Testimonial `«fake»`                                                                       | Spotlight feature             | Default goal / audience                    |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------ |
| **founder**    | "Turn your expertise into inbound - your audience is buyers, not peers."    | **«5×»** "Founders posting 3×/week book «5× more inbound calls» in 90 days."          | _"«Closed two deals from 10-minute posts.»" - «Marco R., SaaS founder»_                    | Analytics + inbound framing   | revenue-growth / new-clients               |
| **freelancer** | "Consistent authority posts = a pipeline that doesn't depend on referrals." | **«3.2×»** "Freelancers here land «3.2× more discovery calls» per month."             | _"«Booked out 6 weeks from LinkedIn alone.»" - «Sara T., brand designer»_                  | Carousels + weekly ideas      | revenue-growth / new-clients               |
| **consultant** | "Your insight is the product - package it so prospects come pre-sold."      | **«4×»** "Consultants grow profile views «4×» and inbound «2×» in 60 days."           | _"«My discovery calls now start at 'I've read your posts'.»" - «David K., ops consultant»_ | Carousels + analytics         | revenue-growth / new-clients               |
| **agency**     | "Scale a posting machine across clients without the manual grind."          | **«10 hrs»** "Agencies save «10+ hrs/week» managing client content here."             | _"«We run 12 client accounts from one calendar.»" - «Lena M., agency owner»_               | Content calendar + scheduling | company-awareness / partners               |
| **team-lead**  | "Lead in public - your team and your hires are watching."                   | **«2.5×»** "Team leads grow reach «2.5×» and attract «2× more» qualified applicants." | _"«Three of my best hires found me through these posts.»" - «Priya S., eng director»_      | Calendar + analytics          | employer-branding / talents                |
| **employee**   | "Stand out without spending hours - show your work, get noticed."           | **«4×»** "Members posting weekly get «4× more» profile views from recruiters."        | _"«Two recruiters reached out in a month.»" - «Tom B., PM»_                                | Weekly AI ideas + hooks       | career-opportunities / potential-employers |
| **creator**    | "Compound your audience - formats that get saved and shared."               | **«6×»** "Creators here grow followers «6× faster» with carousel + hook tools."       | _"«Went from 800 to 12k followers in 4 months.»" - «Aïsha N., creator»_                    | Carousels + weekly ideas      | company-awareness / new-clients            |

### 3.3 Goal overlay

The **primary goal** (from Welcome/Screen 4) overrides the role default where they conflict, and
re-skins the offer headline and recap "goalRestated" string:

| Goal                 | `goalRestated` string used in recap/offer |
| -------------------- | ----------------------------------------- |
| revenue-growth       | "win more clients"                        |
| company-awareness    | "grow your company's reach"               |
| career-opportunities | "get noticed by the right people"         |
| employer-branding    | "attract better talent"                   |
| media-pr             | "earn media and authority"                |

### 3.4 One config object (shape for the coding agent)

```ts
// config/onboarding-personalization.ts  (new)
type RoleContent = {
    mirrorOpportunity: string
    proof: { stat: string; claim: string; testimonial: { quote: string; name: string; title: string; metric?: string } }
    spotlight: 'analytics' | 'calendar' | 'carousels' | 'weekly-ideas'
    defaultGoal: StrategyGoal
    defaultAudience: StrategyAudience[]
}
export const ROLE_CONTENT: Record<BrandingRole, RoleContent> = {
    /* §3.2 */
}
export const GOAL_RESTATED: Record<StrategyGoal, string> = {
    /* §3.3 */
}
// ALL proof/testimonial values flagged // PLACEHOLDER - replace before launch
```

---

## 4. AI smart calls (3 moments)

Three AI calls power the personalization. Two are net-new; one reuses existing strategy endpoints.
All must degrade gracefully (every screen has a non-AI fallback), and all run server-side using the
existing rate-limit infra (`check_and_record_usage`, `config/ai.ts`).

### 4.1 Profile enrichment (Screen 3 - Mirror)

**Trigger:** after Connect (OAuth or URL paste). **New endpoint:** `POST /api/onboarding/enrich`.

**Inputs:** `{ name, headline, vanityUrl, profileUrl, welcomeGoal }`.
**Important honesty constraint:** basic LinkedIn OAuth returns only name/headline/photo. Do **not**
claim to read post history or follower counts. The profile URL is passed to the model as _context for
inference_; treat outputs as suggestions the user confirms on the Mirror screen.

**Output contract (JSON):**

```json
{
    "role": "founder|freelancer|team-lead|employee|creator|consultant|agency",
    "niche": "string (e.g. 'B2B SaaS growth')",
    "primaryAudience": "one of STRATEGY_AUDIENCES",
    "toneSummary": "short phrase (e.g. 'direct and practical')",
    "opportunityLine": "one sentence, role-aware (defaults to ROLE_CONTENT.mirrorOpportunity if low confidence)",
    "confidence": 0.0
}
```

**Prompt spec (sketch):** system = "You infer a LinkedIn creator's role, niche, audience, and writing
tone from limited profile signal. Output strict JSON matching the schema. If signal is weak, pick the
safest role given the stated goal and set low confidence. Never fabricate metrics or specifics." user =
the inputs. **Fallback:** on low confidence or error, use role from the explicit selector + goal seed;
Mirror screen shows the selector inline.

### 4.2 First-post generation (Screen 6 - the aha)

**Trigger:** entering Preview. **Reuse the existing generation pipeline** (feature 031 / `/api/generate`)
with onboarding context, or a thin `POST /api/onboarding/first-post` wrapper.

**Inputs:** `{ role, niche, primaryGoal, audience, tone, name }`.
**Output:** one publish-ready LinkedIn post (hook + body + light formatting), plus a stashed draft id.
**Prompt spec:** "Write one LinkedIn post for a {role} in {niche} whose goal is {goal}, speaking to
{audience}, in a {tone} voice. Strong scroll-stopping hook, skimmable lines, one clear takeaway, no
hashtags spam, no em dashes. ~120–180 words." **Fallback:** per-role `«template post»` library so the
screen always renders something great.

### 4.3 Positioning + formats (Screen 10 - Building)

**Trigger:** Building step. **Reuse existing** `/api/strategy/positioning` and `/api/strategy/formats`
(already wired in feature 068's building step). Optionally also pull a few weekly ideas (feature 202).
No new prompt work; just pass the now-richer answer set.

> **Cost note:** these calls hit the LLM and count against limits. During onboarding, consider
> exempting the enrichment + first-post calls from the daily free cap (they're one-time, and gating
> the wow moment would be self-defeating). Flag for the coding agent: add an `onboarding` bypass or a
> separate generous onboarding bucket in `config/ai.ts`.

---

## 5. Data model, components, analytics

### 5.1 Answers object (extends current `OnboardingAnswers`)

Add to `components/dashboard/onboarding/types.ts`:

```ts
type OnboardingAnswers = {
    primaryGoal?: StrategyGoal
    profileUrl?: string
    niche?: string
    toneSummary?: string
    opportunityLine?: string
    firstDraftId?: string
    cadence?: 'steady-2x' | 'recommended-3x' | 'daily'
    // …existing: profile, role, goals, audience, expertise, writingStyle, frequency, linkedinConnected
}
```

On finish (convert _or_ decline) keep the existing write-once behavior: branding (profile, role,
expertise, positioning, writing style, `meta.onboardedAt`) + strategy (goals, audience, frequency,
schedule, formats). **New:** persist the first-post draft so it survives into the dashboard.

> **Recommended improvement (optional):** the current flow is write-once at finish, so a mid-flow
> refresh restarts the wizard (known gap in feature 068). Since this flow is longer and AI-laden,
> add **incremental persistence** of `answers` to `localStorage` after each step so OAuth round-trips
> and accidental refreshes don't lose progress and don't re-spend AI calls.

### 5.2 Component mapping (what to reuse vs build)

| Screen                                       | Reuse                                                                       | Build new                         |
| -------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------- |
| Modal shell, transitions, progress, confetti | `onboarding-modal.tsx`, `lib/motion.ts`, `confetti.tsx`                     | new step registry order           |
| Welcome                                      | shell                                                                       | motivation-tap step               |
| Connect                                      | existing LinkedIn step + OAuth resume bridge                                | add profile-URL paste sub-state   |
| Mirror                                       | `building-step` animation pattern                                           | enrich call + editable chips step |
| Goal / audience / voice / cadence            | `strategy/wizard-steps/*` (goals, audience, frequency) + `TONE_OPTIONS`     | thin wrappers                     |
| Proof / Spotlight                            | -                                                                           | matrix-driven content components  |
| Preview (aha)                                | realistic preview card (023), quick actions (032), client scoring (050–056) | first-post call + layout          |
| Building                                     | `building-step` + `/api/strategy/{positioning,formats}`                     | add post-ideas line               |
| Recap                                        | `EmptyState`/card primitives                                                | summary card                      |
| Offer                                        | existing dialog/Stripe Checkout (monetization Phase 1)                      | pricing component (§7)            |

### 5.3 Analytics (PostHog - already wired)

Fire one event per screen enter + key action, so the funnel is tunable:
`onb_welcome_view`, `onb_motivation_select{goal}`, `onb_connect_view`, `onb_connect_method{oauth|url|manual}`,
`onb_mirror_view`, `onb_mirror_edit{field}`, `onb_goal_confirm`, `onb_proof_view{role}`,
`onb_preview_view`, `onb_preview_regenerate`, `onb_voice_set{tone}`, `onb_spotlight_view{feature}`,
`onb_cadence_select{cadence}`, `onb_building_done`, `onb_recap_view`,
`onb_offer_view`, `onb_offer_select{lifetime|monthly}`, `onb_offer_decline`, `onb_purchase_success{plan}`,
plus per-step `onb_skip{step}`. Watch drop-off between Preview→Offer especially.

---

## 6. After the offer (free fallback + contextual re-prompts)

Declining is not the end of monetization, just the end of the wall-free pass.

- Land in the free dashboard with **everything pre-filled** and the first post open. The user has
  already felt ownership - that's the retention hook.
- **Contextual re-prompts** (honest, value-framed) fire at natural friction points: hitting the daily
  AI cap ("You've used today's free AI - go unlimited / lifetime"), trying to schedule/publish (Wave 4
  paywall), removing a carousel watermark. Reuse the monetization doc's limit-reached modal.
- **One-time return offer:** if they declined the founding lifetime price, a single tasteful reminder
  email/in-app within the real window ("Your founding price is still open until {date}"). No nagging.

---

## 7. The offer screen, in detail (§ pricing psychology)

### 7.1 Layout & copy

```
┌─────────────────────────────────────────────────────────────┐
│  {FirstName}, keep the system you just built.                │
│  Everything to {goalRestated} - less than a coffee a month.  │
│                                                              │
│   ┌── LIFETIME ──────────┐   ┌── MONTHLY ─────────┐         │
│   │  Best value · badge   │   │                     │         │
│   │  $29.99 once          │   │  $7.99 / mo         │         │
│   │  Founding price       │   │  Cancel anytime     │         │
│   │  Keep power features  │   │  All Pro features   │         │
│   │  forever (AI metered) │   │                     │         │
│   │  [ Get lifetime → ]   │   │  [ Start monthly → ]│         │
│   └───────────────────────┘   └─────────────────────┘         │
│                                                              │
│  Others charge $39–199/mo.  You: $29.99 once.                │
│  ✓ Your positioning, voice & first post  ✓ {N} ideas queued  │
│  ✓ Carousels  ✓ Calendar & scheduling  ✓ Higher AI limits    │
│                                                              │
│  ⏳ Founding price ends {real date}.                         │
│  «7-day money-back». Cancel in two clicks.                   │
│                                                              │
│              Continue on the free plan →  (low emphasis)     │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Why this structure (psychology, honestly applied)

- **Lifetime as hero, monthly as foil.** The cheap monthly ($7.99) makes the one-time $29.99 read as
  "less than 4 months" → obvious math, anchored to keep-forever.
- **Competitor anchor.** "$39–199/mo" (true range from the monetization competitor scan: Supergrow $39,
  Taplio $69–199) makes $29.99 once feel almost free. Keep it accurate.
- **Endowment recap.** The ✓ list is _their_ assets from §2.11, not generic features. They're keeping,
  not buying.
- **Real urgency only.** A genuine founding window (date or first-N members). No resetting fake timers.
- **Risk reversal** lowers the leap. Money-back + easy cancel.
- **Soft fallback** honors the locked "soft offer" decision and the no-wall ethos.

### 7.3 Honesty rules for this screen (non-negotiable)

- The lifetime card must state **"AI generation stays on a generous monthly limit"** in plain sight -
  it is not unlimited AI forever (per the locked decision). One line, not buried.
- Disclose auto-renew on monthly. Show the real renewal price.
- "Founding price" must correspond to a real, enforced window. If there's no plan to ever raise it,
  don't claim it's limited.

### 7.4 Numbers to confirm before build

`«money-back days»`, `«founding window date or member cap»`, the exact AI monthly limit for each plan,
and whether monthly also gets lifetime-style power features (assume yes: monthly = all Pro, lifetime =
all Pro power features forever + metered AI).

---

## 8. Edge cases & failure handling

| Case                                | Behavior                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| User skips LinkedIn + role          | Default to creator/generalist branch, personalize off Welcome goal. Mirror screen shows role selector inline.                  |
| Enrichment AI fails/low confidence  | Skip the "guessed" mirror; show editable role/niche selectors with friendly copy. Never show an error.                         |
| First-post AI fails                 | Render per-role `«template post»`. Wow moment must never break.                                                                |
| OAuth round-trip / refresh mid-flow | Rehydrate from incremental `localStorage` (§5.1) - no lost progress, no re-spent AI.                                           |
| Returning/existing user             | Existing backfill logic (feature 068 AC-2) still applies - never re-onboard someone who has strategy/role.                     |
| Offer declined                      | Free dashboard, pre-filled, first draft open; contextual re-prompts later.                                                     |
| Very fast/impatient user            | "Skip setup" on Welcome → defaults + free dashboard, no AI spend.                                                              |
| AI cost abuse                       | Onboarding AI runs once per user; gate behind the one-time `onboardedAt` and a separate onboarding bucket.                     |
| Mobile (375px)                      | Every screen must work at 375px (product success criterion). Single-column, large tap targets, no hover-dependent affordances. |

---

## 9. Fake-data inventory (replace before launch)

Everything below ships as placeholder in the prototype and **must** be replaced with real,
substantiated, or clearly-illustrative content before public launch (guardrail §1.5):

- **All proof stats** in §3.2 ("5×", "3.2×", "10 hrs", etc.) - need real data or must be reframed as
  illustrative ("creators like you aim for…") rather than factual claims.
- **All testimonials** in §3.2 (names, quotes, metrics) - replace with real customer quotes + consent,
  or remove. Do not attribute fake quotes to real-looking named people at launch.
- **Offer screen:** `«money-back days»`, `«founding window»`, `«member cap»`, exact AI limits.
- **Competitor price range** "$39–199/mo" - re-verify before quoting publicly (was accurate in the
  June 2026 monetization scan).
- **First-post fallback templates** - write 7 strong per-role templates.

---

## 10. Build sequencing (suggested)

1. **Flow skeleton** - new step machine + order, reusing modal shell, with placeholder content and no AI. Get the rhythm right.
2. **Personalization config** (§3.4) - wire role→content into Proof/Spotlight/Mirror/Recap/Offer.
3. **Connect + URL paste + enrichment** (§4.1) - the data seed.
4. **The aha** (§4.2) - first-post generation + preview card. Prioritize: this is the conversion lever.
5. **Offer screen + Stripe** (§7) - reuse monetization Phase-1 billing.
6. **Analytics** (§5.3) + incremental persistence (§5.1).
7. **Polish:** animations, mobile, fallbacks, fake-data swap.

---

## 11. Open questions for review

1. **AI cost on the aha:** OK to exempt onboarding enrichment + first-post from the daily free cap
   (one-time, but real LLM spend)? Recommended yes.
2. **Founding-price mechanics:** date-based window, member-count cap, or both? Needs a real, enforceable answer for §7.3.
3. **Lifetime AI ceiling:** what's the exact monthly AI allowance for lifetime vs monthly vs free?
   The offer copy depends on it.
4. **Pre-offer email capture:** if a user connects via URL/manual (no LinkedIn email), do we capture
   email before the offer so we can re-market a decline? (Adds friction; recommend capturing only at
   decline.)
5. **Scope of profile-URL enrichment:** rely purely on the URL string as model context (safe), or
   attempt richer fetching (ToS/privacy risk - not recommended)? Spec assumes the former.
6. **Does the offer appear every onboarding, or only when AI/preview succeeded?** Recommend always,
   but soften headline if the aha didn't fire.
