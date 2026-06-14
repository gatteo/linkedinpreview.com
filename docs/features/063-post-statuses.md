# 063 — Post Statuses

> Status: PARTIAL · Area: Dashboard · Last verified: 2026-06-14

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
- [ ] 063-AC-4 Users can change a post's status to scheduled or published from the UI. _(gap: `updateDraft` accepts a `status` field (`lib/supabase/drafts.ts:139-141`) but no component ever calls it with a status; drafts are only ever written as `'draft'` (`lib/supabase/drafts.ts:104`, `:180`). The scheduled/published states are unreachable through the app. See [STATUS.md](../STATUS.md))_

## Implementation

- Status type + DB constraint: `lib/drafts.ts` `DraftStatus`, `supabase/migrations/004_dashboard_data.sql:8-9`.
- Badge styles: `components/dashboard/posts-table.tsx:57-61`, rendered at `:181-187`.
- Status filter UI: `components/dashboard/posts-list.tsx:26-31` and `:144-159`.

## Dependencies

- 062 Multi-Draft Management (status is a draft field).
- 065 Posts List Page (renders badges and the status filter).

## Open questions / known gaps

- No surface (editor, posts list, or actions menu) lets a user set a post to scheduled or
  published, so two of the three statuses are dead UI today. Status promotion belongs with future
  scheduling/publishing work.
