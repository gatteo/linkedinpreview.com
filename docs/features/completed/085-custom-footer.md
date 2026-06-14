# 085 — Custom Footer

> Status: SHIPPED · Area: Branding · Last verified: 2026-06-14

## What

- A Custom Footer card with an enable toggle and, when enabled, a free-text
  textarea for the footer body. When enabled with text, the footer is sent to
  the generate route as a structured `footerText` field and appended
  deterministically (server-side) to every full-post variant the creation
  wizard generates.

## Why

- Lets users attach a consistent signature or CTA to generated posts without
  retyping it each time.

## Acceptance (binary, testable)

- [x] 085-AC-1 A toggle enables or disables the footer. _(verified: `components/dashboard/branding/footer-section.tsx:19-23`)_
- [x] 085-AC-2 The footer text area is shown only when enabled. _(verified: `components/dashboard/branding/footer-section.tsx:28-37`)_
- [x] 085-AC-3 Toggle and text persist to `branding.footer`. _(verified: `components/dashboard/branding/footer-section.tsx:22,31`, schema `lib/branding.ts:45-50`)_
- [x] 085-AC-4 When enabled and non-empty, the footer is extracted for the generate route as the structured `footerText` rule. _(verified: `lib/ai-branding.ts:brandingRulesForGenerate` sets `footerText` gated on `branding.footer.enabled && branding.footer.text`; sent by the creation wizard at `components/dashboard/creation-wizard/creation-wizard.tsx:148-159` (`'posts'` call))_
- [x] 085-AC-5 The footer is automatically appended to generated posts. _(verified: deterministic server-side append for the `'posts'` action at `app/api/generate/route.ts:77-84` — `text = ${post.text}\n\n${footerText}` with `wordCount` recomputed via `countWords` (`lib/content-scoring.ts:21`); schema field `footerText: z.string().max(1_000).optional()` at `app/api/generate/route.schema.ts:13`; the old prompt-only instruction was removed from `lib/ai-branding.ts:59-62` so there is no double footer)_

## Implementation

- UI: `components/dashboard/branding/footer-section.tsx`
- Schema `BrandingFooter`: `lib/branding.ts:45-50`
- Rule extraction: `lib/ai-branding.ts:brandingRulesForGenerate` (returns `footerText`)
- Deterministic append: `app/api/generate/route.ts:77-84` (`'posts'` action only)
- Route schema field: `app/api/generate/route.schema.ts:13`

## Dependencies

- 037 branding-aware AI.

## Open questions / known gaps

- The footer is now appended deterministically (server-side) to AI-generated
  posts via the `'posts'` action of the generate route. It is no longer a
  prompt instruction, so compliance is guaranteed.
- Out of scope: posts written manually in the editor do not get the footer, and
  the quick-action transforms (variation/shorten/lengthen/restyle/apply-suggestion)
  do not append it — they edit existing text that may already contain the footer,
  so appending there would duplicate it.
