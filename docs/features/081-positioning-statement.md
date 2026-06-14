# 081 — Positioning Statement

> Status: PARTIAL · Area: Branding · Last verified: 2026-06-14

## What

- A free-text textarea on the Branding page where the user writes a positioning
  statement, prompted with the format "I help [audience] achieve [outcome] by
  [method]". The value persists to the branding record and is passed to AI
  generation as part of the assembled branding context.

## Why

- A clear positioning line tells the AI who the user serves and how, so
  generated posts stay aligned with the user's market position.

## Acceptance (binary, testable)

- [x] 081-AC-1 The statement is a free-text textarea editing `positioning.statement`. _(verified: `components/dashboard/branding/positioning-section.tsx:16-21`)_
- [x] 081-AC-2 The UI shows the "I help [audience] achieve [outcome] by [method]" format guidance. _(verified: `components/dashboard/branding/positioning-section.tsx:11-13`)_
- [x] 081-AC-3 The statement is included in the AI branding context. _(verified: `lib/ai-branding.ts:18-20` pushes `Positioning: ...`)_
- [x] 081-AC-4 The branding context is appended to AI generation prompts. _(verified: `config/prompts.ts:16-19` brandingPrompt, used by every GENERATE_PROMPTS user builder e.g. `config/prompts.ts:174,185,191`)_
- [ ] 081-AC-5 Positioning guides ALL AI generation. _(gap: it reaches the seven generate-route actions and the creation wizard via the user prompt, but NOT the chat assistant or analyze flows. CHAT_SYSTEM_PROMPT at `config/prompts.ts:25-77` and ANALYZE_SYSTEM_PROMPT at `config/prompts.ts:100-114` never receive brandingContext. "All" is an overstatement.)_

## Implementation

- UI: `components/dashboard/branding/positioning-section.tsx`
- Schema: `BrandingPositioning` at `lib/branding.ts:14-17`
- AI bridge: `assembleBrandingContext` at `lib/ai-branding.ts:18-20`
- Prompt injection: `config/prompts.ts:16-19`; consumed in `app/api/generate/route.ts:69`

## Dependencies

- 037 branding-aware AI.
- 031 AI post generation, 032 quick AI actions (consumers of brandingContext).

## Open questions / known gaps

- Positioning is injected via the USER prompt, not the system prompt, and only
  for the generate route and creation wizard, not chat or analyze.
