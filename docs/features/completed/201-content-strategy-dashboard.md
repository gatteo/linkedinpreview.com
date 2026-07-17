# 201 — Content Strategy Dashboard

> Status: SHIPPED · Area: Strategy · Last verified: 2026-06-14

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
- [x] 201-AC-3 Posting activity heatmap covering the last 3-6 months _(verified: rolling GitHub-style 26-week (~6 month) contribution grid built by pure helper `lib/strategy-metrics.ts:46-72` `buildHeatmapColumns` (window `HEATMAP_WEEKS = 26` at `lib/strategy-metrics.ts:13`), rendered full-width via `components/dashboard/strategy/contribution-grid.tsx:21-56` and wired in `components/dashboard/strategy/progress-section.tsx:72,156`)_
- [x] 201-AC-4 Current streak display _(verified: weekly streak computed by pure helper `lib/strategy-metrics.ts:84-117` `computeWeeklyStreak`, derived in `components/dashboard/strategy/progress-section.tsx:73` and displayed in the Activity Targets card `progress-section.tsx:131`)_
- [x] 201-AC-5 Handles empty state gracefully with a link to the wizard _(verified: `components/dashboard/strategy/strategy-page.tsx:72-79` renders `StrategyEmpty` with `onCreateStrategy` when `strategy.completedAt` is null)_
- [x] 201-AC-6 Metrics update as drafts change (client-side, no dedicated API) _(verified: `components/dashboard/strategy/strategy-page.tsx:39` uses `useDrafts`; `progress-section.tsx:54` derives all metrics from the live `drafts` array)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note, and
> the feature's status drops to PARTIAL.

## Implementation

- Page host with loading/empty/loaded branches: `components/dashboard/strategy/strategy-page.tsx`.
- Layout composition: `components/dashboard/strategy/strategy-dashboard.tsx` (Overview + Progress + Ideas).
- Sections: `overview-section.tsx`, `progress-section.tsx` (month-scoped targets/format targets + weekly streak + rolling contribution grid), `format-targets.tsx`, `contribution-grid.tsx` (presentational GitHub-style grid).
- Heatmap + streak math live as pure helpers in `lib/strategy-metrics.ts` (`buildHeatmapColumns`, `computeWeeklyStreak`, `getIntensityClass`); the component stays presentational.
- Data: `hooks/use-strategy.ts`, `hooks/use-branding.ts`, `hooks/use-drafts.ts`. No new API route; metrics computed in `progress-section.tsx` from the live drafts array.

## Dependencies

- Requires a completed strategy from 200.
- Reads drafts via `hooks/use-drafts.ts` (draft `createdAt`, `label`).
- Hosts 202 (weekly AI post ideas) via `ideas-section.tsx`.

## Open questions / known gaps

- The streak is weekly (Monday-aligned), matching LinkedIn's weekly cadence; a daily streak would almost always read 0. It tolerates an in-progress current week but goes cold if the most recent posting week is older than the immediately previous week.
- "Updates in real-time" is client-derived from the drafts manifest on load/refresh, not a live subscription; it reflects the current in-memory drafts, which is sufficient for the page but not a websocket-style realtime feed.
- Progress counts drafts by `createdAt`, not by published status; there is no separate created-vs-published breakdown.
