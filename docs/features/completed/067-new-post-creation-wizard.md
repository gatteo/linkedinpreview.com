# 067 — New Post Creation Wizard

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-14

## What

- A modal wizard for starting a new post. The first step offers four+ sources: a blank post, from
  notes, from a file, or from a URL (a voice option is also present). Choosing blank creates an
  empty draft and routes straight to the editor. The AI-backed sources run a hooks-then-variants
  flow and, on selecting a variant, create a draft pre-filled with that content and route to the
  editor.

## Why

- It lowers the barrier to starting a post: users can begin from nothing or let AI bootstrap
  content from material they already have, landing in the editor ready to refine.

## Acceptance (binary, testable)

- [x] 067-AC-1 The wizard is a modal dialog. _(verified: `components/dashboard/creation-wizard/creation-wizard.tsx:197-198` Dialog/DialogContent)_
- [x] 067-AC-2 It offers blank, from notes, from file, and from URL sources. _(verified: `components/dashboard/creation-wizard/source-picker.tsx:17-48`)_
- [x] 067-AC-3 Choosing blank creates a draft and routes to the editor with it. _(verified: `components/dashboard/creation-wizard/creation-wizard.tsx:96-107`)_
- [x] 067-AC-4 Selecting an AI variant creates a draft pre-filled with that content and routes to the editor. _(verified: `components/dashboard/creation-wizard/creation-wizard.tsx:167-180`)_
- [x] 067-AC-5 The wizard is opened from the sidebar New button and the posts page New Post CTA. _(verified: `components/dashboard/dashboard-sidebar.tsx:76-83`, `:227`; `components/dashboard/posts-list.tsx:136-139`, `:210`)_

## Implementation

- Wizard flow (source > input > hooks > variants): `components/dashboard/creation-wizard/creation-wizard.tsx:70-266`.
- Source options: `components/dashboard/creation-wizard/source-picker.tsx`.
- Input steps: `notes-input.tsx`, `voice-input.tsx`, `file-input.tsx`, `url-input.tsx`.
- AI generation calls `ApiRoutes.Generate` for hooks and posts.

## Dependencies

- 031/038/039/040 AI generation features (notes, voice, file, URL).
- 062 Multi-Draft Management (draft creation), 066 Dashboard Editor (destination).

## Open questions / known gaps

- The documented "four" sources are actually five in the UI (a Voice source is also present, `source-picker.tsx:30-35`).
