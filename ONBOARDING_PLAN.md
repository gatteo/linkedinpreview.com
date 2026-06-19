# Onboarding Rebuild + Foundations Plan

**The vision:** A new user lands in the dashboard and is met with a beautiful, non-dismissable setup experience. It gets to know them, optionally links LinkedIn to autofill identity, and walks them through a few delightful steps. At the end, their Branding, Content Strategy, and Profile pages are already filled in. Everything is skippable, but the happy path produces a fully set-up account in about two minutes. Animated component content (like the landing page), clean line-art illustrations, and optional Midjourney background art on the milestone steps. No video.

This document covers two things: the approved **foundations** (motion tokens, EmptyState, illustration set, 3D buttons) and the **onboarding rebuild** itself.

---

## Part A — Foundations (approved, build first)

These are shared primitives the onboarding and the rest of the dashboard reuse.

### A1. Motion tokens — `lib/motion.ts`

A single source of truth so every animation feels coherent.

- `EASE_OUT = [0.16, 1, 0.3, 1]` (already used in the hero — standardize on it)
- Variants: `fadeUp`, `staggerChildren`, `slideStep` (direction-aware wizard transitions), `pressable` (whileTap 0.97)
- Wrap dashboard + onboarding roots in `<MotionConfig reducedMotion="user">` so `prefers-reduced-motion` is handled globally, once.

### A2. 3D "clicky" buttons — `components/ui/button.tsx`

Make every button feel physical. This is a global change to the shadcn button variants, so it propagates everywhere for free.

- Resting state: subtle layered shadow using existing tokens (`--shadow-subtle` → a touch more for primary).
- Hover: lift slightly (`-translate-y-px`) + `--shadow-elevated`.
- Active/press: `translate-y-0` + inset/reduced shadow + `scale-[0.98]` so it visibly depresses.
- Add a hairline top highlight on primary (inset light) for the rounded-3D look. Keep it tasteful, ~120ms transitions.
- Respect reduced motion (drop the translate, keep the shadow).

### A3. `<EmptyState>` — `components/dashboard/empty-state.tsx`

Reusable: `illustration`, `title`, `description`, `action`, optional `secondaryAction`. Content fades/scales in on mount. Used later across posts / drafts / calendar / strategy empties.

### A4. Illustration set — `components/dashboard/illustrations/*`

Inline React SVGs, `currentColor` + `--primary` only, so they theme automatically (light/dark/future rebrand). Clean, minimal, geometric.

- Onboarding milestone art: `WelcomeMark`, `BuildingSetup` (for the generating step), `SetupComplete`.
- Empty states (reused from the polish plan): `EmptyPosts`, `EmptyDrafts`, `EmptyCalendar`, `EmptyStrategy`.
- Per-step accents (small, optional): role, goals, audience, writing style.

_(Skeleton shimmer intentionally skipped — already exists.)_

---

## Part B — The Onboarding Experience

### B0. Why this is cheaper than it looks

The onboarding is largely a **re-composition of things you already have**, with a new shell and two new "moment" steps:

- `strategy-wizard` already has working, validated step components for **role, goals, audience, expertise, frequency, positioning, formats** and an `onComplete` that returns `StrategyData` + `Partial<BrandingData>`. We lift these step bodies into the onboarding.
- `/api/strategy/positioning` and `/api/strategy/formats` already generate the "magic" outputs from `{role, goals, audience, topics}`.
- `useBranding().updateBranding()` and `useStrategy().updateStrategy()` already persist to JSONB. No migration needed.
- LinkedIn OAuth already fetches name + avatar and syncs them into `branding.profile` via `syncIdentityFromLinkedIn()`.
- The `feed-preview` component already renders a live LinkedIn post card — perfect for a "see yourself" moment.

So new work concentrates on: the modal shell, choreography, the LinkedIn + profile + writing-style steps, the animated "building your setup" payoff, and the reveal.

### B1. The step flow

| #   | Step                    | Collects → writes to                                                           | Skippable                      | Notes                                                                                                                 |
| --- | ----------------------- | ------------------------------------------------------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 0   | **Welcome**             | nothing                                                                        | n/a (only "Skip setup" escape) | Big, animated. `WelcomeMark` + ambient. One CTA: "Let's go."                                                          |
| 1   | **Connect LinkedIn**    | `branding.profile.{name, avatarUrl}` (auto)                                    | Yes → manual profile           | The shortcut. OAuth redirects out and back — see B4.                                                                  |
| 2   | **Your profile**        | `branding.profile.{name, headline, avatarUrl}`                                 | Yes                            | Prefilled if LinkedIn linked. Live `feed-preview` card beside the form — the delight beat.                            |
| 3   | **Your role**           | `branding.role`                                                                | Yes                            | Reuse `role-step`.                                                                                                    |
| 4   | **Your goals**          | `strategy.goals` (max 3)                                                       | Yes                            | Reuse `goals-step`.                                                                                                   |
| 5   | **Your audience**       | `strategy.audience`                                                            | Yes                            | Reuse `audience-step`.                                                                                                |
| 6   | **Your expertise**      | `branding.expertise.topics` (2+)                                               | Yes                            | Reuse `expertise-step`. Optionally AI-suggest topics from role/headline.                                              |
| 7   | **Writing style**       | `branding.writingStyle.{language, sentenceLength, postLength, emojiFrequency}` | Yes                            | New small step. Default `language` from browser locale.                                                               |
| 8   | **Posting cadence**     | `strategy.{frequency, schedule}`                                               | Yes                            | Reuse `frequency-step`.                                                                                               |
| 9   | **Building your setup** | calls positioning + formats APIs in parallel                                   | n/a                            | The payoff. Animated checklist ticks as each result lands; turns API latency into delight (`BuildingSetup`).          |
| 10  | **You're all set**      | writes everything + `onboardedAt`                                              | n/a                            | Reveal: generated positioning (lightly editable), suggested formats, filled profile card. CTA → dashboard + confetti. |

**Persistence:** the wizard holds all answers in local state and writes once, at step 10 — `updateBranding({profile, role, expertise, positioning, writingStyle})` + `updateStrategy({goals, audience, frequency, schedule, formats, completedAt})`. (Optionally also write incrementally after the API step so a mid-flow drop-off still leaves partial setup.)

### B2. Skippable, but not dismissable

"Not dismissable" and "everything skippable" reconciled:

- The modal shell blocks Escape (`onEscapeKeyDown` preventDefault), outside-click (`onPointerDownOutside` preventDefault), and has no `X`. You can't _accidentally_ leave.
- Every data step has a quiet **"Skip for now"** that advances with sensible defaults.
- The Welcome step carries one low-emphasis **"Skip setup"** escape hatch that completes onboarding with defaults and marks it done (so it never nags again). This respects users who want to dive straight in without trapping them.

### B3. The onboarding gate (replaces `lp-tutorial-seen`)

Today onboarding is gated by a `localStorage` flag, which is per-device and resets. Recommendation: store `onboardedAt` inside the existing **branding JSONB** (e.g. `branding.meta.onboardedAt`). No migration (it's JSONB), per-user, survives across devices, and works for anonymous users too (AuthProvider supports `isAnonymous`). `app/dashboard/layout.tsx` opens the onboarding modal when `branding.meta.onboardedAt` is empty, instead of mounting `tutorial-dialog`. The old `getting-started-checklist` can stay as a lighter post-onboarding nudge or be retired — your call.

### B4. The one real technical wrinkle: LinkedIn redirect

LinkedIn OAuth navigates away from the app and returns via `/api/linkedin/callback`. The modal would unmount. Handle it by:

1. Before redirect, persist wizard state to `localStorage` (`lp-onboarding-state`) including current answers + a "resume at step 2" marker.
2. Callback already lands back on `/dashboard`; on mount, if `lp-onboarding-state` has a resume marker, reopen the modal and rehydrate answers, advancing past the LinkedIn step with profile now prefilled.
3. Clear the marker once consumed.

Everything else (the API calls, the writes) happens in-app with no navigation, so this is the only place needing redirect handling.

### B5. Auth note

Onboarding works for anonymous users — branding/strategy persist under their anon `user_id`, and connecting LinkedIn later converts them to a permanent, email-backed account while keeping the data. So we don't need to force signup before setup, which keeps the happy path frictionless.

---

## Part C — Visual & motion direction

**Default approach: animated component content**, exactly like the landing page (`AnimateIn`, staggered reveals, the spring nav-highlight technique from `dashboard-showcase`). Data-entry steps stay clean and focused with small line-art SVG accents so nothing competes with the inputs. Each step transition is a direction-aware slide+fade via `AnimatePresence`. The "building your setup" step is the animation showpiece: a checklist that ticks itself off, a progress ring, subtle particle/gradient motion.

**Optional Midjourney art** for the three milestone steps only (Welcome, Building, Complete), used as soft full-bleed backgrounds behind the content. If you want to generate them, here are on-brand prompts (style locked for consistency):

- **Welcome:** `minimalist abstract background, soft off-white canvas, subtle geometric line shapes, single LinkedIn-blue accent gradient orb, lots of negative space, clean corporate SaaS aesthetic, soft shadows, flat vector, no text --ar 16:10 --style raw`
- **Building your setup:** `abstract assembling shapes coming together, light grey background, thin geometric lines forming a structure, blue accent nodes connecting, sense of construction and progress, minimal, airy, soft depth, flat vector illustration, no text --ar 16:10 --style raw`
- **You're all set:** `minimalist celebration scene, soft confetti of thin geometric shapes, off-white background, gentle blue accent, calm and premium not loud, clean vector, soft shadows, generous negative space, no text --ar 16:10 --style raw`

Keep them desaturated and low-contrast so foreground text/inputs stay legible; the content, not the art, carries the step.

---

## Part D — Build order

1. **Foundations** — motion tokens (A1), 3D buttons (A2), EmptyState (A3), illustration set (A4). Self-contained, low-risk, visible immediately.
2. **Onboarding shell** — non-dismissable modal, step state machine, direction-aware transitions, progress, Skip/Back/Continue, the gate in `layout.tsx`.
3. **Reused data steps** — lift role/goals/audience/expertise/frequency step bodies; add profile (with live preview) and writing-style steps.
4. **LinkedIn step + redirect resume** (B4).
5. **Payoff + reveal** — parallel API calls with animated progress, then the summary/edit/confetti finish and the single write.
6. **Verification** — run dev build, click the full happy path + each skip path, confirm branding/strategy/profile pages reflect the data, confirm the gate doesn't re-trigger, test reduced-motion and mobile.

Phases 2–5 are the onboarding; phase 1 stands alone and can ship first.

---

## Open question

Do you want to generate the three Midjourney milestone backgrounds (prompts above), or should I build the whole thing with animated components + line-art SVGs only? I can build it fully self-contained now and you can drop the art in later without rework — the milestone steps will be designed to look complete either way.
