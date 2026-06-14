# T-005 — Extend branding context to chat and wire inspiration into AI

> Status: proposed
> Touches: [`../features/037-branding-aware-ai.md`](../features/037-branding-aware-ai.md),
> [`../features/081-positioning-statement.md`](../features/081-positioning-statement.md),
> [`../features/088-inspirational-posts.md`](../features/088-inspirational-posts.md),
> [`../features/089-inspirational-creators.md`](../features/089-inspirational-creators.md) · Opened: 2026-06-14

## Goal

- Make the branding context actually reach the AI surfaces that claim it: the chat assistant, and
  the inspirational posts / creators fields.

## Context

- `lib/ai-branding.ts` (`assembleBrandingContext`) builds the branding string only for the seven
  `/api/generate` actions and the wizard. The chat route (`030`) gets no branding, so "branding-
  aware AI" (037) and "guides all AI generation" (081) are overstated. Separately,
  `inspiration.posts` and `inspiration.creators` are stored but never read by
  `assembleBrandingContext`, so features 088 and 089 are dead-ends for the model. All three are
  PARTIAL.

## Plan

- Include the branding context in the chat route's system/user assembly (scoped to keep prompts
  within token budget).
- Add `inspiration.posts` and `inspiration.creators` to `assembleBrandingContext` as style
  reference, with clear labeling so the model treats them as voice examples, not instructions.

## Acceptance (binary, testable)

- [ ] T-005-AC-1 The chat assistant receives the branding context (verifiable in the assembled
      prompt). Closes 037-AC-7 and 081-AC-5.
- [ ] T-005-AC-2 Inspirational posts and creators are included in the AI branding context for
      generation. Closes 088-AC-5 and 089-AC-5.
- [ ] T-005-AC-3 Pasted inspiration is treated as reference data, never as model instructions.
- [ ] T-005-AC-4 The analyze panel's apply-suggestion sends branding context. Closes 037-AC-6.

## On completion

- Fold into features 037, 081, 088, 089; recheck ACs. Add a CHANGELOG line.

## Notes / open questions

- Watch prompt length; consider truncating long inspiration lists.
