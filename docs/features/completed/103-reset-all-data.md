# 103 — Reset All Data

> Status: SHIPPED · Area: Settings · Last verified: 2026-06-14

## What

- A Danger Zone card in settings lets the user permanently delete all of their data: drafts,
  branding, and post analyses (and strategy). Clicking Reset All Data opens a confirmation dialog;
  on confirm, the rows are deleted from Supabase and the dashboard reloads.

## Why

- Anonymous users need a clean way to wipe everything and start over, and it gives a clear,
  irreversible escape hatch for privacy.

## Acceptance (binary, testable)

- [x] 103-AC-1 The reset deletes drafts, branding, and post analyses. _(verified: `components/dashboard/settings-form.tsx:37-45` deletes drafts, branding, post_analyses)_
- [x] 103-AC-2 A confirmation dialog is required before deletion. _(verified: `components/dashboard/settings-form.tsx:90-118` AlertDialog with Cancel / Delete Everything)_
- [x] 103-AC-3 The dashboard reloads after a successful deletion. _(verified: `components/dashboard/settings-form.tsx:50` `window.location.reload()`)_
- [x] 103-AC-4 It is presented as a destructive Danger Zone with disabled/loading state during reset. _(verified: `components/dashboard/settings-form.tsx:84-99` destructive card + spinner, button disabled while `isResetting`)_

## Implementation

- Reset handler and dialog: `components/dashboard/settings-form.tsx:34-120`.
- Rendered via `app/dashboard/settings/page.tsx`.

## Dependencies

- 061 Anonymous Auth (uses the session's Supabase client).
- 062 Multi-Draft Management, branding, and analysis features (the data being cleared).

## Open questions / known gaps

- The handler also deletes a `strategy` table (`settings-form.tsx:46-47`) beyond the documented
  drafts/branding/analyses, and the card copy says "posts, branding data, and settings" rather than
  naming analyses; the deletions themselves are verified against the code.
