# 088 — Inspirational Posts

> Status: PARTIAL · Area: Branding · Last verified: 2026-06-14

## What

- An Inspirational Posts card where the user pastes LinkedIn post text into a
  textarea and adds it to a list. Each saved entry renders as a line-clamped
  (3-line) preview with a remove button. The card copy claims the posts are
  analyzed for writing style.

## Why

- Lets users supply example posts that, in principle, the AI could imitate for
  style reference.

## Acceptance (binary, testable)

- [x] 088-AC-1 A post entry can be added from the textarea and removed. _(verified: `components/dashboard/branding/inspiration-posts-section.tsx:16-25`)_
- [x] 088-AC-2 Saved entries persist to `branding.inspiration.posts`. _(verified: `inspiration-posts-section.tsx:19`, schema `lib/branding.ts:64-69`)_
- [x] 088-AC-3 Each saved entry shows a line-clamped (3-line) preview. _(verified: `components/dashboard/branding/inspiration-posts-section.tsx:36` uses `line-clamp-3`)_
- [ ] 088-AC-4 The card invites pasting LinkedIn post URLs. _(gap: the input is a free-text textarea labeled "Paste a LinkedIn post..." for post BODY text, not URLs; nothing parses or validates URLs. `components/dashboard/branding/inspiration-posts-section.tsx:31,48`. The "URLs" framing in the feature description is inaccurate; it accepts arbitrary text.)_
- [ ] 088-AC-5 Inspirational posts are used as AI style reference. _(gap: `assembleBrandingContext` never reads `branding.inspiration` at all; see the full builder `lib/ai-branding.ts:3-58`. The posts are stored but never sent to any AI prompt. Claim is false.)_

## Implementation

- UI: `components/dashboard/branding/inspiration-posts-section.tsx`
- Schema `BrandingInspiration`: `lib/branding.ts:64-69`
- AI bridge: NOT wired (absent from `lib/ai-branding.ts`)

## Dependencies

- 090 auto-save indicator (persistence).

## Open questions / known gaps

- Inspirational posts are stored only; they do not feed AI generation.
- The field accepts arbitrary text, not specifically URLs.
