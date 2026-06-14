# T-012 — Multi-month activity heatmap and streak tracking

> Status: proposed
> Touches: [`../features/201-content-strategy-dashboard.md`](../features/201-content-strategy-dashboard.md) · Opened: 2026-06-14

## Goal

- Show a 3-6 month posting heatmap and a current-streak display on the strategy dashboard,
  satisfying 201-AC-3 and 201-AC-4.

## Context

- The heatmap renders only the single selected month (`activity-heatmap.tsx:20-31`,
  `progress-section.tsx:75-81`), and streak logic does not exist anywhere (no "streak" match in the
  codebase). Feature 201 is PARTIAL.

## Plan

- Heatmap: build a rolling 3-6 month grid from drafts' dates instead of a single month.
- Streak: compute consecutive posting days/weeks from draft history and display it.

## Acceptance (binary, testable)

- [ ] T-012-AC-1 The heatmap covers the last 3-6 months.
- [ ] T-012-AC-2 A current streak is computed from posting history and displayed.

## On completion

- Fold into [`../features/201-content-strategy-dashboard.md`](../features/201-content-strategy-dashboard.md);
  move to SHIPPED / `features/completed/` when ACs pass. Add a CHANGELOG line.
