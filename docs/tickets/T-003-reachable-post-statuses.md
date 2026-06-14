# T-003 — Make post statuses reachable from the UI

> Status: proposed
> Touches: [`../features/063-post-statuses.md`](../features/063-post-statuses.md) · Opened: 2026-06-14

## Goal

- Give the user a way to move a draft to `scheduled` or `published`, so the three-status model is
  real and not dead UI.

## Context

- The `draft | scheduled | published` type, the colored status badges, and the status filter all
  exist, but no code path ever writes a status other than `draft`. Two of the three statuses are
  unreachable. Feature 063 is PARTIAL as a result. (True scheduling/publishing is Wave 4 and needs
  LinkedIn OAuth; this ticket is only the manual status control, not real publishing.)

## Plan

- Add a status control to the editor and/or the posts-list row actions that updates the draft's
  `status` through the existing update path.
- Keep `published`/`scheduled` honest: a manual mark, with no implied LinkedIn delivery until
  Wave 4 ([`../backlog/221-one-click-publish.md`](../backlog/221-one-click-publish.md),
  [`../backlog/222-post-scheduling.md`](../backlog/222-post-scheduling.md)).

## Acceptance (binary, testable)

- [ ] T-003-AC-1 The user can set a draft to `scheduled` or `published` from the UI.
- [ ] T-003-AC-2 The change persists and the status filter reflects it.
- [ ] T-003-AC-3 Copy does not imply the post was delivered to LinkedIn.

## On completion

- Fold into [`../features/063-post-statuses.md`](../features/063-post-statuses.md); recheck ACs.
  Add a CHANGELOG line.

## Notes / open questions

- Decide whether `scheduled` requires a date now or stays a plain flag until Wave 4.
