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
- [ ] 088-AC-4 The card invites pasting LinkedIn post URLs. _(gap: the input is a free-text textarea labeled "Paste a LinkedIn post..." for post BODY text, not URLs; nothing parses or validates URLs. `components/dashboard/branding/inspiration-posts-section.tsx:31,48`. The "URLs" framing in the feature description is inaccurate; it accepts arbitrary text. Tracked by [T-014](../tickets/T-014-inspiration-posts-url-claim.md).)_
- [x] 088-AC-5 Inspirational posts are used as AI style reference. _(verified: `assembleBrandingContext` appends posts inside a delimited STYLE REFERENCE block, capped at `MAX_INSPIRATION_POSTS` (4) and `MAX_INSPIRATION_POST_CHARS` (400) — `lib/ai-branding.ts:6-7,77-82,93-97`. Pasted content is framed as untrusted reference data, not instructions — `lib/ai-branding.ts:90-91`.)_

## Implementation

- UI: `components/dashboard/branding/inspiration-posts-section.tsx`
- Schema `BrandingInspiration`: `lib/branding.ts:64-69`
- AI bridge: `assembleBrandingContext` `lib/ai-branding.ts:76-105` (STYLE REFERENCE block)

## Dependencies

- 090 auto-save indicator (persistence).

## Open questions / known gaps

- Posts now DO feed AI generation as style reference (088-AC-5 closed via T-005).
- 088-AC-4 remains OPEN, now tracked by
  [T-014](../tickets/T-014-inspiration-posts-url-claim.md): the card accepts
  arbitrary post BODY text, not URLs, and nothing parses or validates URLs. The
  "invites pasting LinkedIn post URLs" framing is still inaccurate. This is a
  separate gap from T-005 and keeps the feature PARTIAL.
