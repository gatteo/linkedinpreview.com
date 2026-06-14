# 201 — Content Strategy Dashboard

> Status: PARTIAL · Area: Strategy · Last verified: 2026-06-14
>
> Copy this file to `NNN-slug.md` and fill it in. This folder holds **only built features**
> (SHIPPED or PARTIAL). Not-yet-built ideas live in [`../backlog/`](../backlog/). A feature
> describes a user-facing **surface**; system internals live in
> [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## What

- The `/dashboard/strategy` page. Once a strategy exists it shows an overview of the user's
  profile/positioning/goals/audience/topics, a monthly progress section (posts created this month
  vs a computed monthly target, format distribution vs target mix, and a single-month activity
  calendar grid), and the weekly AI post ideas section. If no strategy exists yet it shows an empty
  state that launches the wizard.

## Why

- Gives users a single place to see whether they are keeping pace with the cadence and format mix
  they committed to, reducing the chance they drift or go silent.

## Acceptance (binary, testable)

- [x] 201-AC-1 Shows monthly posts created vs a target derived from strategy frequency _(verified: `components/dashboard/strategy/progress-section.tsx:56-58` `postsThisMonth` and `monthlyTarget = frequency * weeksInMonth`, rendered `:112-115`)_
- [x] 201-AC-2 Shows format distribution vs target mix _(verified: `components/dashboard/strategy/progress-section.tsx:68-73,133-141` `postsByFormat` passed to `FormatTargets`; `components/dashboard/strategy/format-targets.tsx`)_
- [ ] 201-AC-3 Posting activity heatmap covering the last 3-6 months _(gap: heatmap renders only the single selected month as a calendar grid — `components/dashboard/strategy/activity-heatmap.tsx:20-31` builds one month from `year`/`month`; navigation steps one month at a time `progress-section.tsx:75-81`. No multi-month/3-6 month view exists.)_
- [ ] 201-AC-4 Current streak display _(gap: no streak logic anywhere — grep for "streak" across components/lib/hooks/app returns no matches. Streak tracking is not implemented.)_
- [x] 201-AC-5 Handles empty state gracefully with a link to the wizard _(verified: `components/dashboard/strategy/strategy-page.tsx:72-79` renders `StrategyEmpty` with `onCreateStrategy` when `strategy.completedAt` is null)_
- [x] 201-AC-6 Metrics update as drafts change (client-side, no dedicated API) _(verified: `components/dashboard/strategy/strategy-page.tsx:39` uses `useDrafts`; `progress-section.tsx:54` derives all metrics from the live `drafts` array)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note, and
> the feature's status drops to PARTIAL.

## Implementation

- Page host with loading/empty/loaded branches: `components/dashboard/strategy/strategy-page.tsx`.
- Layout composition: `components/dashboard/strategy/strategy-dashboard.tsx` (Overview + Progress + Ideas).
- Sections: `overview-section.tsx`, `progress-section.tsx` (targets, format targets, heatmap), `format-targets.tsx`, `activity-heatmap.tsx`.
- Data: `hooks/use-strategy.ts`, `hooks/use-branding.ts`, `hooks/use-drafts.ts`. No new API route; metrics computed in `progress-section.tsx`.

## Dependencies

- Requires a completed strategy from 200.
- Reads drafts via `hooks/use-drafts.ts` (draft `createdAt`, `label`).
- Hosts 202 (weekly AI post ideas) via `ideas-section.tsx`.

## Open questions / known gaps

- Heatmap is single-month, not the documented "last 3-6 months" GitHub-style contribution grid.
- No streak tracking exists despite being a claimed acceptance criterion.
- "Updates in real-time" is client-derived from the drafts manifest on load/refresh, not a live subscription; it reflects the current in-memory drafts, which is sufficient for the page but not a websocket-style realtime feed.
- Progress counts drafts by `createdAt`, not by published status; there is no separate created-vs-published breakdown.
