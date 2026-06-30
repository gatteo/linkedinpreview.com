# 062 — Multi-Draft Management

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-14

## What

- Users can keep many posts as separate drafts. Each draft can be created, edited, duplicated,
  and deleted. A draft's title is auto-generated from the first line of its content, and each
  draft carries a status, an optional format label, word and character counts, and created/updated
  timestamps. All drafts live in Supabase, scoped to the anonymous user.

## Why

- Treating posts as independent, persistent records lets users juggle multiple ideas, revisit
  past work, and reuse content without losing anything between sessions.

## Acceptance (binary, testable)

- [x] 062-AC-1 A draft can be created via `createDraft` (optionally with initial content/label). _(verified: `lib/supabase/drafts.ts:85-116`, hook `hooks/use-drafts.ts:45-53`)_
- [x] 062-AC-2 A draft can be edited/updated, re-computing title and stats on content change. _(verified: `lib/supabase/drafts.ts:122-148`)_
- [x] 062-AC-3 A draft can be duplicated into a new record. _(verified: `lib/supabase/drafts.ts:161-192`, hook `hooks/use-drafts.ts:72-87`)_
- [x] 062-AC-4 A draft can be deleted. _(verified: `lib/supabase/drafts.ts:153-156`, hook `hooks/use-drafts.ts:55-70`)_
- [x] 062-AC-5 The title is auto-derived from the first non-empty line of content (truncated to 60 chars). _(verified: `lib/drafts.ts` `extractTitle`, used at `lib/supabase/drafts.ts:92` and `:131`)_
- [x] 062-AC-6 Each draft persists status, optional label, word*count, char_count, created_at, updated_at. *(verified: schema `supabase/migrations/004_dashboard_data.sql:1-13` + `supabase/migrations/005_add_labels.sql:1`; mapping `lib/supabase/drafts.ts:27-38`)\_

## Implementation

- CRUD layer: `lib/supabase/drafts.ts` (fetch, create, update, delete, duplicate).
- React state + optimistic updates: `hooks/use-drafts.ts:16-126`.
- Title/stats helpers: `lib/drafts.ts` (`extractTitle`, `computeStats`).
- Table schema: `supabase/migrations/004_dashboard_data.sql` and `005_add_labels.sql`.

## Dependencies

- 061 Anonymous Auth (drafts are scoped to the signed-in user).
- 065 Posts List Page (surfaces the CRUD actions in the UI).
- 066 Dashboard Editor (drives content edits).

## Open questions / known gaps

- Status is always written as `'draft'` on create and duplicate; see 063 for the gap that no UI promotes a draft to scheduled/published.
