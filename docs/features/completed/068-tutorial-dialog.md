# 068 — Tutorial Dialog

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-14

## What

- On a user's first dashboard visit, a four-slide onboarding dialog appears: Welcome, Create
  Posts, Brand Your Voice, and Analyze & Improve. Users page through with Back/Next, click dots to
  jump, and finish with Get Started. Once dismissed, it never reappears because a flag is stored in
  `localStorage` under `lp-tutorial-seen`.

## Why

- A short guided intro orients new users to the dashboard's main capabilities so they know where
  to start.

## Acceptance (binary, testable)

- [x] 068-AC-1 The tutorial has exactly four slides with the documented titles. _(verified: `components/dashboard/tutorial-dialog.tsx:18-42`)_
- [x] 068-AC-2 It auto-opens on first visit when the seen flag is absent. _(verified: `components/dashboard/tutorial-dialog.tsx:48-55`)_
- [x] 068-AC-3 Dismissal persists via `localStorage` key `lp-tutorial-seen`. _(verified: `components/dashboard/tutorial-dialog.tsx:10` key, `:57-62` set on close)_
- [x] 068-AC-4 Users can navigate slides (Back/Next, dot indicators, Get Started on the last slide). _(verified: `components/dashboard/tutorial-dialog.tsx:84-116`)_
- [x] 068-AC-5 The dialog is mounted in the dashboard layout. _(verified: `app/dashboard/layout.tsx:46`)_

## Implementation

- Component: `components/dashboard/tutorial-dialog.tsx:44-121`.
- Mounted once per dashboard session in `app/dashboard/layout.tsx:46`.

## Dependencies

- 060 Dashboard Shell (mount point).

## Open questions / known gaps

- Slides show text placeholders for videos (`videoPlaceholder`, e.g. `tutorial-dialog.tsx:22`); no actual onboarding videos are wired up yet.
