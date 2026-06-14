# 086 — Knowledge Base

> Status: SHIPPED · Area: Branding · Last verified: 2026-06-14

## What

- A Knowledge Base card with a single free-form textarea for extra context about
  the user, their business, products, or audience. The notes persist and are
  passed to AI generation as additional context within the assembled branding
  context.

## Why

- Gives the AI background facts it cannot infer, so generated posts can reference
  the user's real business, products, and audience.

## Acceptance (binary, testable)

- [x] 086-AC-1 The knowledge base is a free-form textarea editing `knowledgeBase.notes`. _(verified: `components/dashboard/branding/knowledge-base-section.tsx:16-23`)_
- [x] 086-AC-2 The notes persist to `branding.knowledgeBase`. _(verified: schema `lib/branding.ts:52-55`, update at `components/dashboard/branding/knowledge-base-section.tsx:18`)_
- [x] 086-AC-3 The notes are included in the AI branding context when non-empty. _(verified: `lib/ai-branding.ts:53-55` pushes `Additional context: ...` gated on `knowledgeBase.notes`)_
- [x] 086-AC-4 The branding context is appended to AI generation prompts. _(verified: `config/prompts.ts:16-19`, consumed at `app/api/generate/route.ts:69`)_

## Implementation

- UI: `components/dashboard/branding/knowledge-base-section.tsx`
- Schema `BrandingKnowledgeBase`: `lib/branding.ts:52-55`
- AI bridge: `lib/ai-branding.ts:53-55`

## Dependencies

- 037 branding-aware AI.

## Open questions / known gaps

- The card description mentions "business, products, or audience" as a single
  free-text field; there are no separate structured inputs for those, just one
  notes textarea.
- The 5000-char cap on `brandingContext` (`app/api/generate/route.schema.ts:11`)
  is shared across all branding fields, so very long notes can be truncated when
  combined with the rest of the context.
