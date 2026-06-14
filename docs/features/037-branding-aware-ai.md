# 037 — Branding-Aware AI

> Status: PARTIAL · Area: AI · Last verified: 2026-06-14

## What

- AI generation can be personalized to the author's brand. A branding context string (author info, positioning, expertise topics, writing style, dos/donts, optional footer, knowledge-base notes) is assembled client-side and appended to generation prompts so output matches the user's voice. The creation wizard and the editor AI actions toolbar both send this context.

## Why

- Generic AI output reads generic. Feeding the user's positioning and style rules makes drafts sound like them, which is the core value of the product over a raw chatbot.

## Acceptance (binary, testable)

- [x] 037-AC-1 `/api/generate` accepts an optional `brandingContext` (max 5,000 chars) _(verified: `app/api/generate/route.schema.ts:10`)_
- [x] 037-AC-2 `brandingContext` is appended to every generation prompt via `brandingPrompt` _(verified: `config/prompts.ts:16-19,174,185,191,197,203,209,220`)_
- [x] 037-AC-3 The assembled context includes positioning, expertise topics, writing style, dos/donts, and knowledge-base notes _(verified: `lib/ai-branding.ts:18-55`)_
- [x] 037-AC-4 The creation wizard sends `brandingContext` for both hooks and posts _(verified: `components/dashboard/creation-wizard/creation-wizard.tsx:115-119,147-151`)_
- [x] 037-AC-5 The editor AI actions toolbar sends `brandingContext` for its transforms _(verified: `components/dashboard/ai-actions.tsx:40`)_
- [ ] 037-AC-6 The analyze panel's apply-suggestion sends branding context _(gap: the apply-suggestion call omits `brandingContext` — `components/dashboard/analyze/analyze-panel.tsx:118-123`)_
- [ ] 037-AC-7 The chat assistant (030) is branding-aware _(gap: `/api/chat` does not accept or use `brandingContext`; `CHAT_SYSTEM_PROMPT` has no branding hook — `app/api/chat/route.ts:63-67`)_

## Implementation

- Context assembly: `lib/ai-branding.ts` (`assembleBrandingContext`).
- Prompt injection: `brandingPrompt` in `config/prompts.ts:16-19`, applied across `GENERATE_PROMPTS`.
- Senders: `components/dashboard/creation-wizard/creation-wizard.tsx`, `components/dashboard/ai-actions.tsx`.
- Source data: `hooks/use-branding`, `lib/branding`.

## Dependencies

- 031, 032, 035 (consume branding context), 200 (strategy/branding setup populates positioning/expertise).

## Open questions / known gaps

- Branding is only wired into `/api/generate`. The chat generator (030) and the analyze apply-suggestion path are not branding-aware, so output from those surfaces is not personalized. Status is PARTIAL until those gaps are closed or the claim is scoped to `/api/generate` only.
