# 230 - Analytics Dashboard

> Status: PARTIAL · Area: Analytics · Last verified: 2026-06-19
>
> Built feature (PARTIAL: open gaps). This folder holds **only built features** (SHIPPED or
> PARTIAL). Not-yet-built ideas live in [`../backlog/`](../backlog/). A feature describes a
> user-facing **surface**; system internals live in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## What

- An analytics dashboard at `/dashboard/analytics` that turns a member's published posts into
  performance insight. It shows headline KPIs (published count, impressions, engagements, average
  engagement rate), an engagement-over-time chart (30 / 90 / all-time), a publishing-activity heatmap
    - streak and a draft -> scheduled -> published -> failed pipeline, content insights (top formats,
      post length, best day to post), a golden-hour day x time grid, and a per-post performance table.
- Two differentiators sit on top of the raw metrics: a **Content DNA** correlation engine that relates
  the member's own content features (media, length, hashtags, hook style, structure, format, posting
  day) to their engagement and surfaces the strongest "drivers" (lift vs their baseline); and an **AI
  Insights** coach that turns the whole picture into grounded wins/opportunities/experiments plus a
  next-post recommendation.
- Engagement numbers come from a **layered** data model. Because LinkedIn's member post analytics API
  (`memberCreatorPostAnalytics`) is gated behind Community Management API approval, the dashboard does
  not assume API access: a member can **enter metrics by hand** per post or **import a LinkedIn CSV
  export**, and - once an operator is approved and opts in - they can **import their existing LinkedIn
  posts** (history + text + metrics) on demand and a daily cron **auto-syncs** the same numbers from
  the API. Whichever source last wrote a post's metrics wins.
- The dashboard only reflects posts that exist in the app as `published` drafts. Posts written
  directly on LinkedIn before/outside the app are not visible until imported (CSV match by URL, or the
  API import which backfills them as `published` posts). This is why a brand-new connection can show
  an empty state despite a long LinkedIn history.

## Why

- Gives creators the "what's working" view (which formats/lengths/days drive engagement) that
  otherwise requires paid tools, while staying honest about LinkedIn's API limits: it is useful from
  day one via manual/CSV entry and upgrades transparently to automatic sync when access is granted.

## Acceptance (binary, testable)

- [x] 230-AC-1 A dedicated analytics page exists and is reachable from the dashboard nav _(verified:
      route `app/dashboard/analytics/page.tsx:7`; sidebar link `components/dashboard/dashboard-sidebar.tsx:148`)_
- [x] 230-AC-2 The dashboard shows per-post performance metrics _(verified: `PostsPerformanceTable`
      rendered at `components/dashboard/analytics/analytics-page.tsx:148`; rows show impressions/engagement/rate
      in `components/dashboard/analytics/posts-performance-table.tsx`)_
- [x] 230-AC-3 An engagement trend chart over time with 30 / 90 / all-time ranges _(verified:
      `components/dashboard/analytics/engagement-trend-chart.tsx`, rendered at `analytics-page.tsx:115`;
      `engagementTimeline` filter in `lib/analytics/aggregate.ts`)_
- [x] 230-AC-4 Content insights: top formats, post length, best day _(verified:
      `components/dashboard/analytics/content-insights.tsx`; `formatBreakdown`/`lengthBreakdown`/`dayOfWeekPerformance`
      in `lib/analytics/aggregate.ts:134,165,184`)_
- [x] 230-AC-5 Members can record engagement metrics without the LinkedIn API, by manual entry and by
      CSV import _(verified: manual entry `components/dashboard/analytics/metrics-entry-dialog.tsx`; CSV parse/match
      `lib/analytics/csv.ts:51,93`; persisted via `lib/supabase/post-metrics.ts`)_
- [x] 230-AC-6 Metrics are stored for historical/trend use and isolated per user _(verified:
      `supabase/migrations/012_post_metrics.sql` table + RLS; one row per draft, upserted by source)_
- [x] 230-AC-7 Empty state when there are no published posts _(verified: `analytics-page.tsx:81`
      branch renders `AnalyticsEmpty` (`analytics-page.tsx:86`) from
      `components/dashboard/analytics/analytics-empty.tsx`)_
- [x] 230-AC-8 Mobile-responsive layout _(verified: responsive grids `sm:grid-cols-2 lg:grid-cols-4`
      in `components/dashboard/analytics/kpi-cards.tsx`; `lg:grid-cols-3` sections; rate column hidden on
      small screens in `posts-performance-table.tsx`)_
- [x] 230-AC-10 A correlation engine relates content features to the member's own engagement and shows
      ranked drivers once enough posts have metrics _(verified: `lib/analytics/content-dna.ts`
      (`analyzeContentDna`) + `lib/analytics/content-features.ts`; rendered
      `components/dashboard/analytics/content-dna-section.tsx`)_
- [x] 230-AC-11 AI insights generate grounded narrative insights + a next-post recommendation, are
      rate-limited, and persist per user across devices _(verified: `app/api/analytics/insights/route.ts`
      (GET cached + POST generate), digest `lib/analytics/digest.ts`, UI
      `components/dashboard/analytics/ai-insights-section.tsx`; `insights` rate-limit action migration 014;
      `analytics_insights` table migration 015)_
- [ ] 230-AC-9 Metrics sync automatically from the LinkedIn API _(gap: scaffold built but inert -
      `app/api/cron/sync-analytics/route.ts` returns `skipped` until `LINKEDIN_ANALYTICS_ENABLED` is set
      and the app holds the `r_member_postAnalytics` scope (`config/linkedin.ts:45,52,61`). Requires
      LinkedIn Community Management API approval; not verifiable without it.)_
- [ ] 230-AC-12 With Community Management API access, a member can import their existing LinkedIn posts
      (history + text + metrics) into analytics on demand _(built but inert/unverifiable without
      approval: availability + import `app/api/analytics/import-linkedin/route.ts`, posts author-finder
      `lib/linkedin/import.ts` (`fetchMemberPosts`), backfill `lib/supabase/drafts.ts`
      (`createImportedPublishedPost`), self-hiding UI `components/dashboard/analytics/import-linkedin-button.tsx`;
      `import` rate-limit action migration 016. Posts author-finder request/response shape needs live
      re-verification on enable.)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- Page + sections: `components/dashboard/analytics/analytics-page.tsx` composes `KpiCards`,
  `AiInsightsSection`, `EngagementTrendChart`, `GoldenHourCard`, `ContentDnaSection`, `ActivitySection`,
  `ContentInsights`, `PostsPerformanceTable`. Motion: `reveal.tsx` (house `lib/motion.ts` tokens) under
  a page-level `<MotionConfig reducedMotion="user">`; `animated-number.tsx`, `sparkline.tsx`, `stat-card.tsx`.
- Pure aggregation: `lib/analytics/aggregate.ts` (`publishedPosts`, `summarize`, `engagementTimeline`,
  `formatBreakdown`, `lengthBreakdown`, `dayOfWeekPerformance`, `goldenHour`, `periodComparison`,
  `topPosts`, `localParts` for timezone-correct day/hour). Engagement math `lib/analytics/metrics.ts`;
  formatting `lib/analytics/format.ts`.
- Insight engines: correlation `lib/analytics/content-dna.ts` + features `lib/analytics/content-features.ts`;
  AI digest `lib/analytics/digest.ts` + prompts `config/prompts.ts` (`INSIGHTS_SYSTEM_PROMPT`); content
  fetch `lib/supabase/published-posts.ts`, hook `hooks/use-published-content.ts`.
- Data layer: table `supabase/migrations/012_post_metrics.sql`; CRUD `lib/supabase/post-metrics.ts`;
  state `hooks/use-post-metrics.ts`.
- Manual / CSV entry: `metrics-entry-dialog.tsx`, `import-metrics-dialog.tsx`, parser `lib/analytics/csv.ts`.
- API sync scaffold (inert): scope `config/linkedin.ts` (`linkedInScopes`), analytics client
  `lib/linkedin/analytics.ts` (`memberCreatorPostAnalytics`), posts author-finder `lib/linkedin/import.ts`
  (`fetchMemberPosts`), refresh cron `app/api/cron/sync-analytics/route.ts` (daily, `vercel.json`),
  on-demand history import `app/api/analytics/import-linkedin/route.ts` + self-hiding
  `import-linkedin-button.tsx`, backfill `lib/supabase/drafts.ts` (`createImportedPublishedPost`),
  opt-in env `LINKEDIN_ANALYTICS_ENABLED` (`env.mjs`).
- Activity heatmap/streak reuse `lib/strategy-metrics.ts` + `components/dashboard/strategy/contribution-grid.tsx`.

## Dependencies

- Published posts (status `published`) drive the dashboard; publishing/scheduling is Wave 4 (220-222).
- Automatic sync (230-AC-9) and the API history import (230-AC-12) depend on LinkedIn **Community
  Management API** approval + `r_member_postAnalytics` scope (registered legal entity + verified company
  page). Until then the dashboard runs on manual/CSV-entered metrics.
- Charting: `recharts` via `components/ui/chart.tsx`.

## Open questions / known gaps

- Automatic API sync (230-AC-9) is built but inert pending Community Management API approval. The
  `memberCreatorPostAnalytics` request/response shape in `lib/linkedin/analytics.ts` follows the
  documented metric set but must be re-verified against the live API when first enabled (LinkedIn
  documents these counts as "best-effort" and notes they can lag the native UI).
- CSV import matches rows to drafts by the stored LinkedIn post URL, so it only covers posts published
  through this app; posts created elsewhere are reported as unmatched. The API import (230-AC-12) is the
  path for backfilling posts written directly on LinkedIn.
- The API import's posts author-finder (`lib/linkedin/import.ts`, `GET /rest/posts?q=author`) and the
  per-post analytics shape are best-guess against current docs and MUST be re-verified against the live
  API on first enable (the finder/permission and field names are the most likely points of drift).
  Import is bounded to 300 posts/run and inline metrics to the most recent batch; the rest backfill via
  the daily sync cron.
- Metrics are stored as one current snapshot per post (latest values), not per-day time series; the
  trend chart plots one point per post. Per-day snapshot history is a future extension.
- Unblocks Best Time to Post phase-2 personalization (224-AC-5), which is still not built.
