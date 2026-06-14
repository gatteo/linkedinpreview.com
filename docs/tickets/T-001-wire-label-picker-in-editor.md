# T-001 — Wire the label picker into the editor

> Status: proposed
> Touches: [`../features/064-post-format-labels.md`](../features/064-post-format-labels.md) · Opened: 2026-06-14

## Goal

- Let a user assign a content-format label to a draft from the dashboard editor, closing the only
  Live-claimed feature with a real functional gap.

## Context

- `components/dashboard/label-picker.tsx` exports a working `LabelPicker`, but a repo-wide grep
  shows it is never imported or rendered. Only its `labelColor` helper is used (in `posts-list.tsx`
  and `posts-table.tsx`) for display. Labels are therefore set only when an AI wizard variant
  happens to carry one - the user cannot pick or change a label while editing. Feature 064 is
  marked PARTIAL because of this (064-AC-6 is `[ ]`).

## Plan

- Render `LabelPicker` in the dashboard editor surface, bound to the current draft's label.
- Persist the selection through the existing draft update path (the 2s debounced auto-save in
  `use-current-draft.ts`) so it lands in the `drafts` table.
- Confirm the picked label shows in the posts list and is filterable.

## Acceptance (binary, testable)

- [ ] T-001-AC-1 The dashboard editor renders a label control bound to the open draft.
- [ ] T-001-AC-2 Choosing or clearing a label persists to the `drafts` row and survives reload.
- [ ] T-001-AC-3 The chosen label appears in the posts list and the label filter matches it.

## On completion

- Fold into [`../features/064-post-format-labels.md`](../features/064-post-format-labels.md): check
  064-AC-6, move status to SHIPPED. Add a CHANGELOG line.

## Notes / open questions

- Reuse `POST_FORMATS` and `labelColor`; do not duplicate the label list.
