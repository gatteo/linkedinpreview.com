# 064 — Post Format Labels

> Status: PARTIAL · Area: Dashboard · Last verified: 2026-06-14

## What

- Posts can be tagged with one of nine content-format labels (Personal Milestones, Mindset &
  Motivation, Career Before & After, Tool & Resource Insights, Case Studies, Actionable Guides,
  Culture Moments, Offer Highlight, Client Success Story). Each label has a color dot, is shown in
  the posts table, and the posts list can be filtered by format.

## Why

- Categorizing posts by content format helps users balance their content mix and quickly find a
  given type of post, and feeds format-aware strategy features.

## Acceptance (binary, testable)

- [x] 064-AC-1 Exactly nine post formats are defined, matching the documented set. _(verified: `lib/drafts.ts` `POST_FORMATS`, nine entries)_
- [x] 064-AC-2 A draft stores an optional label, persisted to Supabase. _(verified: column `supabase/migrations/005_add_labels.sql:1`; mapping `lib/supabase/drafts.ts:32`, `:142-144`)_
- [x] 064-AC-3 Each label maps to a distinct color via `labelColor`. _(verified: `components/dashboard/label-picker.tsx:7-20`)_
- [x] 064-AC-4 The format label is displayed with its color dot in the posts table. _(verified: `components/dashboard/posts-table.tsx:190-203` using `labelColor` imported at `:51`)_
- [x] 064-AC-5 The posts list can be filtered by format label. _(verified: `components/dashboard/posts-list.tsx:106-108` filter logic, `:161-187` selector)_
- [ ] 064-AC-6 Users can assign or change a post's format label from the editor. _(gap: `components/dashboard/label-picker.tsx:28` exports a working `LabelPicker`, but a repo-wide search shows it is never imported or rendered anywhere; only its `labelColor` helper is imported (`components/dashboard/posts-list.tsx:16`, `components/dashboard/posts-table.tsx:51`). The editor has no label control. Labels can only be set automatically when an AI-generated wizard variant carries one (`components/dashboard/creation-wizard/creation-wizard.tsx:171-173`). See [STATUS.md](../STATUS.md) and ticket T-001.)_

## Implementation

- Format constants + type: `lib/drafts.ts` `POST_FORMATS` / `PostFormat`.
- Label color map and (unused) picker: `components/dashboard/label-picker.tsx:7-56`.
- Table display: `components/dashboard/posts-table.tsx:190-203`.
- List filter selector: `components/dashboard/posts-list.tsx:161-187`.
- Auto-label from wizard variant: `components/dashboard/creation-wizard/creation-wizard.tsx:167-180`.
- Persistence: `supabase/migrations/005_add_labels.sql`, `lib/supabase/drafts.ts:142-144`.

## Dependencies

- 062 Multi-Draft Management (label is a draft field).
- 065 Posts List Page (display + filter).
- 067 New Post Creation Wizard (only path that currently assigns a label).

## Open questions / known gaps

- The `LabelPicker` component is built and exported but dead: it is not wired into the editor or
  anywhere else, so a user cannot manually tag or re-tag a post. Tracked as T-001; see
  [STATUS.md](../STATUS.md). Until then, a label only appears if an AI wizard variant supplies one.
