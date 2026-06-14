# 063 — Post Statuses

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-14

## What

- Every post carries one of three statuses: draft, scheduled, or published. The posts list renders
  each status as a colored badge (amber for draft, blue for scheduled, green for published) and the
  list can be filtered by status.

## Why

- A status field lets users separate work-in-progress from posts that are ready or already live,
  which is the foundation for a future scheduling/publishing workflow.

## Acceptance (binary, testable)

- [x] 063-AC-1 The status type is constrained to draft | scheduled | published. _(verified: `lib/drafts.ts` `DraftStatus`; DB check constraint `supabase/migrations/004_dashboard_data.sql:8-9`)_
- [x] 063-AC-2 Status badges use amber (draft), blue (scheduled), green (published). _(verified: `components/dashboard/posts-table.tsx:57-61`)_
- [x] 063-AC-3 The posts list can be filtered by status (All/Draft/Scheduled/Published). _(verified: `components/dashboard/posts-list.tsx:26-31` filter buttons, `:102-104` filter logic)_
- [x] 063-AC-4 Users can change a post's status to scheduled or published from the UI. _(verified: `StatusPicker` in the editor header (`components/dashboard/dashboard-editor.tsx:192-196`) bound to `saveStatus`, which persists via `updateDraft` (`hooks/use-current-draft.ts:251-260`, `lib/supabase/drafts.ts:139-141`). Status options are sourced from `STATUS_OPTIONS` (`lib/drafts.ts`). The persisted `status` feeds the existing list filter (`components/dashboard/posts-list.tsx:102-104`).)_

## Implementation

- Status type + DB constraint: `lib/drafts.ts` `DraftStatus`, `supabase/migrations/004_dashboard_data.sql:8-9`.
- Badge styles: `components/dashboard/posts-table.tsx:57-61`, rendered at `:181-187`.
- Status filter UI: `components/dashboard/posts-list.tsx:26-31` and `:144-159`.
- Status control (set draft/scheduled/published): `components/dashboard/status-picker.tsx` (options from `STATUS_OPTIONS` in `lib/drafts.ts`), wired in the editor header `components/dashboard/dashboard-editor.tsx:192-196` via `saveStatus` (`hooks/use-current-draft.ts`).

## Dependencies

- 062 Multi-Draft Management (status is a draft field).
- 065 Posts List Page (renders badges and the status filter).

## Open questions / known gaps

- Statuses are now user-settable from the editor header via the `StatusPicker`, so all three
  states are reachable. The status is a manual label only: setting `scheduled` or `published`
  here does not post to or schedule with LinkedIn. Real LinkedIn delivery (one-click publish,
  date-based scheduling) remains Wave 4 work (`backlog/221-one-click-publish.md`,
  `backlog/222-post-scheduling.md`). `scheduled` is a plain flag with no date picker for now.
