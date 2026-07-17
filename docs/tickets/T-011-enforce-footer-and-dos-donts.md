# T-011 — Enforce branding footer and dos/donts deterministically

> Status: done · Opened: 2026-06-14 · Closed: 2026-06-14
> Touches: [`../features/completed/085-custom-footer.md`](../features/completed/085-custom-footer.md),
> [`../features/completed/087-dos-and-donts.md`](../features/completed/087-dos-and-donts.md)

## Goal

- Make the custom footer actually append to generated posts, and make dos/donts behave as hard
  constraints rather than soft voice context, satisfying 085-AC-5 and 087-AC-5.

## Context

- The footer is only a natural-language instruction in the user prompt with no deterministic append
  step (`lib/ai-branding.ts:48-50`), so compliance depends on the model. Dos/donts are appended to
  the USER prompt as voice context (`config/prompts.ts:16-19,174`), never the SYSTEM prompt, and are
  not enforced. Features 085 and 087 are PARTIAL.

## Plan

- Footer: after generation, deterministically append `footer.text` when the footer toggle is on
  (post-process, not prompt-only).
- Dos/donts: move them into the GENERATE system prompt (`config/prompts.ts:140-144`) framed as hard
  constraints.

## Acceptance (binary, testable)

- [x] T-011-AC-1 When the footer is enabled, generated output always ends with the footer text.
- [x] T-011-AC-2 Dos/donts are present in the system prompt as constraints, not just user-prompt
      voice context.

## On completion

- Fold into [`../features/085-custom-footer.md`](../features/085-custom-footer.md) and
  [`../features/087-dos-and-donts.md`](../features/087-dos-and-donts.md); move each to SHIPPED /
  `features/completed/` when its ACs pass. Add a CHANGELOG line.
