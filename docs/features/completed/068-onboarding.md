# 068 — Onboarding

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-19

## What

- On a new user's first dashboard visit, a beautiful, non-dismissable setup modal opens. It walks
  them through an animated, direction-aware flow: Welcome → Connect LinkedIn (optional shortcut) →
  Profile (with a live LinkedIn preview card) → Role → Goals → Audience → Expertise → Writing style →
  Posting cadence → an animated "Building your setup" payoff that generates a positioning statement
  and suggested post formats in parallel → a "You're all set" reveal. Every data step has a quiet
  "Skip for now"; the Welcome step has one low-emphasis "Skip setup" escape. The happy path leaves
  the user's Branding (profile, role, expertise, positioning, writing style) and Content Strategy
  (goals, audience, cadence, formats) prefilled. It never reappears once finished or skipped.

## Why

- Closes the perception gap between the marketing site and the dashboard, and turns a cold empty
  account into a configured one in about two minutes - while seeding the branding/strategy that make
  AI generation good. Replaces the old placeholder 4-slide tutorial dialog (which only showed gray
  "video" placeholders and set no data).

## Acceptance (binary, testable)

- [x] 068-AC-1 A non-dismissable modal (no close button, Escape / outside-click / interact-outside all prevented) gates new users. _(verified: `components/dashboard/onboarding/onboarding-modal.tsx:163-166`)_
- [x] 068-AC-2 It opens only for un-onboarded users; the gate reads `branding.meta.onboardedAt` and pre-existing users (with a strategy or role) are silently backfilled so they are never prompted. _(verified: `components/dashboard/onboarding/onboarding-controller.tsx:75-90`)_
- [x] 068-AC-3 The flow is an 11-step state machine (welcome, linkedin, profile, role, goals, audience, expertise, writing-style, frequency, building, complete) with direction-aware slide transitions and a progress bar. _(verified: `components/dashboard/onboarding/onboarding-modal.tsx:53-100`, `:192-213`)_
- [x] 068-AC-4 Every data step is skippable ("Skip for now"); the Welcome step carries a "Skip setup" escape that marks onboarding done with defaults. _(verified: `components/dashboard/onboarding/onboarding-modal.tsx:239-246`; skip-setup `onboarding-controller.tsx:115-118`)_
- [x] 068-AC-5 On finish, branding (profile, role, expertise, positioning, writing style, `meta.onboardedAt`) and strategy (goals, audience, frequency, schedule, formats, `completedAt`) are written once. _(verified: `components/dashboard/onboarding/onboarding-controller.tsx:93-112`)_
- [x] 068-AC-6 The "Building your setup" step calls `/api/strategy/positioning` and `/api/strategy/formats` in parallel behind an animated checklist, then reveals the (editable) results. _(verified: `components/dashboard/onboarding/steps/building-step.tsx:24-49`, `:97`; reveal `steps/complete-step.tsx`)_
- [x] 068-AC-7 The LinkedIn step persists wizard state to `localStorage` (`lp-onboarding-state`) before the OAuth redirect and rehydrates on return, prefilling the synced profile and advancing past the LinkedIn step. _(verified: persist `components/dashboard/onboarding/types.ts:48-72`; redirect `onboarding-controller.tsx:120-122`; resume `onboarding-controller.tsx:41-72`)_
- [x] 068-AC-8 The modal is mounted in the dashboard layout (replacing the old tutorial dialog). _(verified: `app/dashboard/layout.tsx:46`)_

## Implementation

- Controller (gate, LinkedIn resume, persistence bridge): `components/dashboard/onboarding/onboarding-controller.tsx`.
- Modal shell + step registry + transitions: `components/dashboard/onboarding/onboarding-modal.tsx`.
- Custom steps: `components/dashboard/onboarding/steps/{welcome,linkedin,profile,writing-style,building,complete}-step.tsx`; data steps (role/goals/audience/expertise/frequency) are reused from `components/dashboard/strategy/wizard-steps/*`.
- Answer types + `localStorage` resume helpers: `components/dashboard/onboarding/types.ts`.
- On-brand geometric confetti (no new dependency): `components/dashboard/onboarding/confetti.tsx`.
- Gate field: `branding.meta.onboardedAt` (added to `lib/branding.ts`; JSONB, no migration; merged in `lib/supabase/branding.ts`).
- Mounted at `app/dashboard/layout.tsx:46`.

## Dependencies

- 060 Dashboard Shell (mount point); 200 Content Strategy wizard (reused step bodies + `/api/strategy/{positioning,formats}`); 220 LinkedIn OAuth (the connect step + identity sync). Built on the UX foundations: `lib/motion.ts` tokens, the 3D button treatment, `<EmptyState>`, and the `components/dashboard/illustrations/*` set (see [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)).

## Open questions / known gaps

- Code/build-verified on branch `feat/dashboard-overhaul` (`pnpm type-check`, `pnpm lint`, `pnpm build` all pass). The end-to-end runtime flow has **not** yet been exercised via a live click-through (the AI generation step depends on the strategy APIs; the LinkedIn resume depends on a configured LinkedIn app - see Wave 4 in [STATUS.md](../../STATUS.md)), and the change has not yet been through the code-quality review gate.
- Persistence is write-once at finish (no incremental save), so a refresh mid-flow restarts the wizard. Optional incremental persistence is deferred.
- Milestone steps (Welcome / Building / Complete) ship with animated line-art SVGs; optional Midjourney background art can be dropped in later without rework.
