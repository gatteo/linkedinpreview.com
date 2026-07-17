# T-019 - Best time to post (phase 1)

> Status: in-review · Touches: [`../features/224-best-time-to-post.md`](../features/224-best-time-to-post.md) · Opened: 2026-06-15 · Closed:

## Goal

- Surface non-personalized best-time-to-post recommendations where a user schedules: one-tap
  suggested slots and a summary in the schedule dialog, and best-day hints in the calendar.

## Context

- Wave 4: feature 224 graduated from `backlog/` to `features/`. The scheduling (222) and calendar
  (223) surfaces now exist to host the suggestions. Phase 2 (personalized) waits on Wave 5
  analytics (230).

## Plan

- Add `config/best-time.ts` (tiered `BEST_TIME_SLOTS`, `BEST_TIME_SUMMARY`, `isPreferredTime`,
  `suggestNextSlots` producing local-time slots, soonest first).
- Render suggested-slot chips + summary in the schedule dialog and best-day hints in the calendar.

## Acceptance (binary, testable)

- [x] T-019-AC-1 The schedule dialog shows a summary and one-tap suggested slots, computed in local time, soonest first, strongest marked (-> 224-AC-1, 224-AC-2, 224-AC-4).
- [x] T-019-AC-2 The content calendar highlights the strongest posting days (-> 224-AC-3).
- [ ] T-019-AC-3 Recommendations personalize from the member's own performance data (-> 224-AC-5; deferred to Phase 2 / Wave 5 analytics 230).

## On completion

- Folds into [`224-best-time-to-post.md`](../features/224-best-time-to-post.md) as 224-AC-1..4
  (224-AC-5 remains open as Phase 2; feature stays PARTIAL).
- Changelog: 2026-06-15 Wave 4 entry (best time to post).

## Notes / open questions

- Phase-1 logic is pure (no LinkedIn dependency); slots reflect general 2026 LinkedIn engagement
  guidance (weekday afternoons; Wed/Thu/Fri strongest).
