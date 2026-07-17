# 087 — Do's and Don'ts

> Status: SHIPPED · Area: Branding · Last verified: 2026-06-14

## What

- A Do's and Don'ts card with two independent add/remove lists: rules to always
  follow and rules to never break. Both lists persist. On generation they are
  injected into the SYSTEM prompt as enforced hard constraints, and also remain
  in the user-prompt branding context as "Always do" / "Never do" voice signal.

## Why

- Lets users encode hard stylistic and content rules the AI should respect on
  every generation.

## Acceptance (binary, testable)

- [x] 087-AC-1 Do's can be added and removed individually. _(verified: `components/dashboard/branding/dos-donts-section.tsx:17-26,57`)_
- [x] 087-AC-2 Don'ts can be added and removed individually. _(verified: `components/dashboard/branding/dos-donts-section.tsx:28-37,90`)_
- [x] 087-AC-3 Both lists persist to `branding.dosDonts`. _(verified: schema `lib/branding.ts:57-62`, updates at `dos-donts-section.tsx:19,30`)_
- [x] 087-AC-4 Dos are added to the AI context as "Always do" and donts as "Never do". _(verified: `lib/ai-branding.ts:36-45`)_
- [x] 087-AC-5 The rules are injected into the AI SYSTEM prompt as hard constraints. _(verified: `generateConstraints(dosDonts)` builds a `## Hard Constraints` block ("You MUST follow these rules with no exceptions. Always: <dos>. Never: <donts>.") at `config/prompts.ts:162-180`; composed onto the system prompt for ALL generate actions at `app/api/generate/route.ts:69` (`system: prompts.system + generateConstraints(dosDonts)`); structured `dosDonts` field on the route schema at `app/api/generate/route.schema.ts:14-20`; sent by all generate senders via `brandingRulesForGenerate` — wizard `components/dashboard/creation-wizard/creation-wizard.tsx`, quick actions `components/dashboard/ai-actions.tsx`, apply-suggestion `components/dashboard/analyze/analyze-panel.tsx`)_

## Implementation

- UI: `components/dashboard/branding/dos-donts-section.tsx`
- Schema `BrandingDosDonts`: `lib/branding.ts:57-62`
- System hard constraints: `config/prompts.ts:generateConstraints` + route composition `app/api/generate/route.ts:69`
- User-prompt voice context: `lib/ai-branding.ts:47-56` (`assembleBrandingContext`, unchanged)
- Rule extraction for senders: `lib/ai-branding.ts:brandingRulesForGenerate`

## Dependencies

- 037 branding-aware AI.

## Open questions / known gaps

- Intentional dual presence: on a generate request the dos/donts appear BOTH in
  the system prompt (enforced hard constraints, via `generateConstraints`) AND in
  the user-prompt branding context (voice matching, via `assembleBrandingContext`).
  This duplication is deliberate reinforcement, not accidental redundancy.
- `assembleBrandingContext` is left unchanged on purpose because it also feeds the
  chat route (T-005); chat continues to receive dos/donts via `brandingContext`.
  Chat does not get the system-level hard-constraints block (out of scope here).
