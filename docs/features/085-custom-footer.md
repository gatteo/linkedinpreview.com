# 085 — Custom Footer

> Status: PARTIAL · Area: Branding · Last verified: 2026-06-14

## What

- A Custom Footer card with an enable toggle and, when enabled, a free-text
  textarea for the footer body. When enabled with text, the footer is added to
  the AI branding context with an instruction to append it to every generated
  post.

## Why

- Lets users attach a consistent signature or CTA to generated posts without
  retyping it each time.

## Acceptance (binary, testable)

- [x] 085-AC-1 A toggle enables or disables the footer. _(verified: `components/dashboard/branding/footer-section.tsx:19-23`)_
- [x] 085-AC-2 The footer text area is shown only when enabled. _(verified: `components/dashboard/branding/footer-section.tsx:28-37`)_
- [x] 085-AC-3 Toggle and text persist to `branding.footer`. _(verified: `components/dashboard/branding/footer-section.tsx:22,31`, schema `lib/branding.ts:45-50`)_
- [x] 085-AC-4 When enabled and non-empty, the footer is added to the AI branding context with an append instruction. _(verified: `lib/ai-branding.ts:48-50` pushes `Append this footer to every post: ...` gated on `footer.enabled && footer.text`)_
- [ ] 085-AC-5 The footer is automatically appended to generated posts. _(gap: there is no deterministic post-processing step that appends the footer. It is only passed to the model as a natural-language instruction inside the user prompt at `lib/ai-branding.ts:48-50`; whether it is actually appended depends on the model complying. No code concatenates `footer.text` onto AI output. Claim of guaranteed auto-append is not met.)_

## Implementation

- UI: `components/dashboard/branding/footer-section.tsx`
- Schema `BrandingFooter`: `lib/branding.ts:45-50`
- AI bridge: `lib/ai-branding.ts:48-50`

## Dependencies

- 037 branding-aware AI.

## Open questions / known gaps

- Footer appending is best-effort via prompt instruction, not enforced in code.
- The footer is not appended to posts written manually in the editor, only
  passed to AI generation.
