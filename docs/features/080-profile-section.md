# 080 — Profile Section

> Status: PARTIAL · Area: Branding · Last verified: 2026-06-14

## What

- In the Branding page, a Profile card lets the user upload an avatar (rejected
  if over 2MB), enter a full name, and enter a headline. The avatar is read as a
  data URL and stored on the branding record. Name and headline are plain text
  inputs.

## Why

- Captures the author identity so generated content can reference the right name
  and headline, and (as claimed) so the preview can render a realistic author
  block.

## Acceptance (binary, testable)

- [x] 080-AC-1 Avatar upload rejects files larger than 2MB with an error toast. _(verified: `components/dashboard/branding/profile-section.tsx:20-23`)_
- [ ] 080-AC-2 Avatar upload supports cropping before saving. _(gap: no crop UI or crop library exists; the file is read straight to a data URL via FileReader at `components/dashboard/branding/profile-section.tsx:24-29`. Claim is false.)_
- [x] 080-AC-3 Full name is an editable text input persisted to branding. _(verified: `components/dashboard/branding/profile-section.tsx:71-77`)_
- [x] 080-AC-4 Headline is an editable text input persisted to branding. _(verified: `components/dashboard/branding/profile-section.tsx:82-87`)_
- [ ] 080-AC-5 Name, headline, and avatar are shown in the post preview. _(gap: the editor preview author block is hard-coded to "Matteo Giardino", "Founder @ devv.it", and a static SVG avatar at `components/tool/preview/user-info.tsx:18,25,26`; PreviewPanel receives no branding props at `components/dashboard/dashboard-editor.tsx:162-167`. Name/headline/avatar ARE surfaced in the Strategy overview card at `components/dashboard/strategy/overview-section.tsx:63-69`, but not the post preview. Claim is false for the preview.)_
- [x] 080-AC-6 Avatar can be removed once set. _(verified: `components/dashboard/branding/profile-section.tsx:57-65`)_

## Implementation

- Card and inputs: `components/dashboard/branding/profile-section.tsx`
- Schema: `BrandingProfile` at `lib/branding.ts:5-12`
- Persistence: `hooks/use-branding.ts:38-52`, `lib/supabase/branding.ts:48-54`
- Strategy overview reuse: `components/dashboard/strategy/overview-section.tsx:43-69`

## Dependencies

- 090 auto-save indicator (persistence path).
- 037 branding-aware AI (name and headline feed the AI context via
  `assembleBrandingContext`; avatar does NOT, see `lib/ai-branding.ts:7-11`).

## Open questions / known gaps

- No cropping implemented despite the claim.
- Post preview ignores the branding profile entirely; it renders hard-coded
  author data.
- avatarUrl is never sent to AI generation (only name and headline are).
