# 088 — Inspirational Posts

> Status: SHIPPED · Area: Branding · Last verified: 2026-06-14

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
- [x] 088-AC-4 The card invites pasting LinkedIn post body text (the actual content to learn the style from), not URLs, and its copy reflects that. _(verified: card description "Paste LinkedIn posts you admire - we will analyze the writing style" and textarea placeholder "Paste a LinkedIn post..." at `components/dashboard/branding/inspiration-posts-section.tsx:31,48`; `addPost` stores the trimmed text as-is with no URL parsing `:16-21`. The earlier "post URLs" framing was a pre-fact-check doc error corrected by [T-014](../tickets/T-014-inspiration-posts-url-claim.md); the intended and built design is pasting post text, which is the direct style-reference signal.)_
- [x] 088-AC-5 Inspirational posts are used as AI style reference. _(verified: `assembleBrandingContext` appends posts inside a delimited STYLE REFERENCE block via `assembleInspirationBlock`, capped at `MAX_INSPIRATION_POSTS` (4) and `MAX_INSPIRATION_POST_CHARS` (400) — `lib/ai-branding.ts:6-7,70-72,110-142` (caps applied `:113-114`). Pasted content is framed as untrusted reference data, not instructions — `lib/ai-branding.ts:124-125`.)_

## Implementation

- UI: `components/dashboard/branding/inspiration-posts-section.tsx`
- Schema `BrandingInspiration`: `lib/branding.ts:64-69`
- AI bridge: `assembleBrandingContext` `lib/ai-branding.ts:76-105` (STYLE REFERENCE block)

## Dependencies

- 090 auto-save indicator (persistence).

## Open questions / known gaps

- None. Posts feed AI generation as style reference (088-AC-5, via T-005), and the
  spec's earlier "post URLs" claim was corrected to match the built text-paste design
  (088-AC-4, via T-014). The card accepts pasted post body text; there is intentionally
  no URL ingestion (the text itself is the style signal, with no fetch/scrape needed).
