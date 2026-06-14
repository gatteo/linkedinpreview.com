# 080 — Profile Section

> Status: SHIPPED · Area: Branding · Last verified: 2026-06-14

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
- [x] 080-AC-2 Avatar upload supports cropping before saving. _(verified: the uploaded file opens a square crop dialog with drag-to-reposition (`onPointerDown` at `components/dashboard/branding/avatar-crop-dialog.tsx:138`) and a zoom slider (`type='range'` at `components/dashboard/branding/avatar-crop-dialog.tsx:152`); the cropped square is rendered to a data URL via `cropToDataUrl` at `lib/image-crop.ts:51-71` and persisted on apply at `components/dashboard/branding/profile-section.tsx:36-38`. Upload only opens the cropper, it never saves the raw file directly: `components/dashboard/branding/profile-section.tsx:20-34`.)_
- [x] 080-AC-3 Full name is an editable text input persisted to branding. _(verified: `components/dashboard/branding/profile-section.tsx:71-77`)_
- [x] 080-AC-4 Headline is an editable text input persisted to branding. _(verified: `components/dashboard/branding/profile-section.tsx:82-87`)_
- [x] 080-AC-5 Name, headline, and avatar are shown in the post preview. _(verified: `UserInfo` accepts an optional `author` prop and renders the branding name/headline/avatar at `components/tool/preview/user-info.tsx:22-24,37,44-45`; the dashboard editor reads branding and passes `previewAuthor` into both PreviewPanel instances at `components/dashboard/dashboard-editor.tsx:120-124,171,260`. The author prop is threaded PreviewPanel -> PostCard -> UserInfo (`components/tool/preview/preview-panel.tsx`, `components/tool/preview/post-card.tsx`). Missing fields fall back to the prior hard-coded identity at `components/tool/preview/user-info.tsx:16-18,22-24`.)_
- [x] 080-AC-6 Avatar can be removed once set. _(verified: `components/dashboard/branding/profile-section.tsx:57-65`)_

## Implementation

- Card and inputs: `components/dashboard/branding/profile-section.tsx`
- Avatar crop dialog: `components/dashboard/branding/avatar-crop-dialog.tsx`
- Canvas crop helpers: `lib/image-crop.ts`
- Preview author wiring: `components/tool/preview/user-info.tsx`, threaded via `preview-panel.tsx` -> `post-card.tsx`
- Schema: `BrandingProfile` at `lib/branding.ts:5-12`
- Persistence: `hooks/use-branding.ts:38-52`, `lib/supabase/branding.ts:48-54`
- Strategy overview reuse: `components/dashboard/strategy/overview-section.tsx:43-69`

## Dependencies

- 090 auto-save indicator (persistence path).
- 037 branding-aware AI (name and headline feed the AI context via
  `assembleBrandingContext`; avatar does NOT, see `lib/ai-branding.ts:7-11`).

## Open questions / known gaps

- avatarUrl is never sent to AI generation (only name and headline are).
- Cropping outputs a 256x256 PNG square. The homepage/embed tool and chat
  preview still render the placeholder identity by design (no branding context
  when logged out).
