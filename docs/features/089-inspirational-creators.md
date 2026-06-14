# 089 — Inspirational Creators

> Status: PARTIAL · Area: Branding · Last verified: 2026-06-14

## What

- An Inspirational Creators card where the user adds a creator by name plus an
  optional LinkedIn URL. Saved entries list the name with a "Profile" link when a
  URL is present, and a remove button. The card copy claims these inform AI
  style reference.

## Why

- Lets users name creators whose style they admire so the AI could (in theory)
  emulate them.

## Acceptance (binary, testable)

- [x] 089-AC-1 A creator is added with a required name and optional URL. _(verified: `components/dashboard/branding/inspiration-creators-section.tsx:17-28`; name required via `:18` and disabled button `:78`, URL optional `:71-77`)_
- [x] 089-AC-2 Each creator can be removed. _(verified: `inspiration-creators-section.tsx:30-37,58`)_
- [x] 089-AC-3 A "Profile" link renders only when a URL is set. _(verified: `inspiration-creators-section.tsx:49-57`)_
- [x] 089-AC-4 Creators persist to `branding.inspiration.creators`. _(verified: `inspiration-creators-section.tsx:20-26`, schema `lib/branding.ts:64-69`)_
- [ ] 089-AC-5 Inspirational creators are used as AI style reference. _(gap: `assembleBrandingContext` never reads `branding.inspiration` (see full builder `lib/ai-branding.ts:3-58`). Creators are stored but never sent to any AI prompt. Claim is false.)_

## Implementation

- UI: `components/dashboard/branding/inspiration-creators-section.tsx`
- Schema `BrandingInspiration`: `lib/branding.ts:64-69`
- AI bridge: NOT wired (absent from `lib/ai-branding.ts`)

## Dependencies

- 090 auto-save indicator (persistence).

## Open questions / known gaps

- Creators are stored only; they do not feed AI generation.
