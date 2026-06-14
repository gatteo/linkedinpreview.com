# T-006 — Group changelog entries by month/year

> Status: proposed
> Touches: [`../features/004-changelog.md`](../features/004-changelog.md) · Opened: 2026-06-14

## Goal

- Render changelog entries grouped under month/year headings instead of one flat newest-first list,
  satisfying 004-AC-6.

## Context

- `app/(main)/changelog/page.tsx:67-103` renders a flat list with a per-entry date; there is no
  grouping. The sticky date sidebar exists but groups nothing. Feature 004 is PARTIAL on this AC.

## Plan

- Group the sorted entries by `YYYY-MM` (in `lib/changelog.ts` or the page) and render a heading per
  group; keep the sticky sidebar in sync.

## Acceptance (binary, testable)

- [ ] T-006-AC-1 Entries render under month/year group headings, newest first.
- [ ] T-006-AC-2 The sticky date sidebar reflects the groups.

## On completion

- Fold into [`../features/004-changelog.md`](../features/004-changelog.md) (check 004-AC-6, move to
  SHIPPED, relocate spec to `features/completed/`). Add a CHANGELOG line.
