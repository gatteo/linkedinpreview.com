# 087 — Do's and Don'ts

> Status: PARTIAL · Area: Branding · Last verified: 2026-06-14

## What

- A Do's and Don'ts card with two independent add/remove lists: rules to always
  follow and rules to never break. Both lists persist and are passed to AI
  generation within the assembled branding context as "Always do" and "Never do"
  instructions.

## Why

- Lets users encode hard stylistic and content rules the AI should respect on
  every generation.

## Acceptance (binary, testable)

- [x] 087-AC-1 Do's can be added and removed individually. _(verified: `components/dashboard/branding/dos-donts-section.tsx:17-26,57`)_
- [x] 087-AC-2 Don'ts can be added and removed individually. _(verified: `components/dashboard/branding/dos-donts-section.tsx:28-37,90`)_
- [x] 087-AC-3 Both lists persist to `branding.dosDonts`. _(verified: schema `lib/branding.ts:57-62`, updates at `dos-donts-section.tsx:19,30`)_
- [x] 087-AC-4 Dos are added to the AI context as "Always do" and donts as "Never do". _(verified: `lib/ai-branding.ts:36-45`)_
- [ ] 087-AC-5 The rules are injected into the AI SYSTEM prompt as hard constraints. _(gap: dos and donts are appended to the USER prompt via brandingContext + brandingPrompt at `config/prompts.ts:16-19,174`, not the system prompt. The system prompts (`GENERATE_SYSTEM` at `config/prompts.ts:140-144`) never receive them. They are framed as voice-matching context ("use to match their voice and style", `config/prompts.ts:18`), not enforced hard constraints. Claim is false.)_

## Implementation

- UI: `components/dashboard/branding/dos-donts-section.tsx`
- Schema `BrandingDosDonts`: `lib/branding.ts:57-62`
- AI bridge: `lib/ai-branding.ts:36-45`

## Dependencies

- 037 branding-aware AI.

## Open questions / known gaps

- Rules live in the user prompt, not the system prompt, and are not enforced as
  hard constraints in code; compliance depends on the model.
- They reach only the generate route and creation wizard, not chat or analyze.
