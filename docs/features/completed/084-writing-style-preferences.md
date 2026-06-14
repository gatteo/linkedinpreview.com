# 084 — Writing Style Preferences

> Status: SHIPPED · Area: Branding · Last verified: 2026-06-14

## What

- A Writing Style card on the Branding page with four controls: language (a
  7-option select with flag emojis), sentence length (short/standard/long),
  post length (short/standard/long), and emoji frequency (none/moderate/a lot).
  All four persist and are passed to AI generation as part of the assembled
  branding context.

## Why

- These knobs let the AI match the user's preferred voice: language, pacing,
  length, and emoji density.

## Acceptance (binary, testable)

- [x] 084-AC-1 Language offers exactly 7 options, each with a flag. _(verified: `components/dashboard/branding/writing-style-section.tsx:12-20` lists 7 languages with flag codes; `flagEmoji` at `lib/flag-emoji.ts:1-7` renders the flag)_
- [x] 084-AC-2 Sentence length offers short/standard/long. _(verified: `components/dashboard/branding/writing-style-section.tsx:76-91`)_
- [x] 084-AC-3 Post length offers short/standard/long. _(verified: `components/dashboard/branding/writing-style-section.tsx:117-132`)_
- [x] 084-AC-4 Emoji frequency offers none/moderate/a-lot. _(verified: `components/dashboard/branding/writing-style-section.tsx:158-173`)_
- [x] 084-AC-5 All four fields are included in the AI branding context. _(verified: `lib/ai-branding.ts:30-33` pushes Language, Sentence length, Post length, Emoji frequency unconditionally)_
- [x] 084-AC-6 The branding context is appended to AI generation prompts. _(verified: `config/prompts.ts:16-19`, consumed at `app/api/generate/route.ts:69`)_

## Implementation

- UI: `components/dashboard/branding/writing-style-section.tsx`
- Flag rendering: `lib/flag-emoji.ts`
- Schema `BrandingWritingStyle`: `lib/branding.ts:34-43`
- AI bridge: `lib/ai-branding.ts:28-33`

## Dependencies

- 037 branding-aware AI.

## Open questions / known gaps

- All four style fields are emitted into the branding context even at their
  default values, so the AI always receives them.
- They are injected via the user prompt, not the system prompt, and only for
  generate-route and creation-wizard flows (not chat or analyze).
