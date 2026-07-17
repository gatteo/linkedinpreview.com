# T-002 — Use the branding profile in the post preview

> Status: done · Opened: 2026-06-14 · Closed: 2026-06-14
> Touches: [`../features/completed/080-profile-section.md`](../features/completed/080-profile-section.md),
> [`../features/completed/021-realtime-post-preview.md`](../features/completed/021-realtime-post-preview.md)

## Goal

- Make the LinkedIn post preview show the user's own name, headline, and avatar from their branding
  profile, instead of the hard-coded author identity it ships today.

## Context

- `components/tool/preview/user-info.tsx` hard-codes the author block to a fixed name, headline,
  and a static SVG avatar. The branding profile fields (`profile.name`, `profile.headline`,
  `profile.avatarUrl`) are stored but never reach the preview. This makes feature 080 PARTIAL and
  undercuts feature 021's "shows the user's profile" claim. The preview is the product's signature
  surface, so the wrong identity is especially visible.

## Plan

- Read the branding profile (via `use-branding`) where the preview author block renders and pass
  name / headline / avatar into `user-info.tsx`, with sensible fallbacks for the logged-out
  homepage tool.
- Keep the homepage/embed editor working with placeholder identity when no branding exists.

## Acceptance (binary, testable)

- [x] T-002-AC-1 In the dashboard editor, the preview author block shows the branding profile's
      name and headline.
- [x] T-002-AC-2 The uploaded avatar (if any) renders in the preview; a fallback shows otherwise.
- [x] T-002-AC-3 The homepage/embed tool still renders without a branding profile present.
- [x] T-002-AC-4 Avatar upload supports cropping before saving (closes 080-AC-2).

## On completion

- Fold into [`../features/080-profile-section.md`](../features/080-profile-section.md) and
  [`../features/021-realtime-post-preview.md`](../features/completed/021-realtime-post-preview.md); recheck
  the affected ACs. Add a CHANGELOG line.

## Notes / open questions

- Avatar cropping (080-AC-2) is folded into this ticket as T-002-AC-4; split it out if it grows.
