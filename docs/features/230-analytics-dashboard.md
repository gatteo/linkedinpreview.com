# 230 - Analytics Dashboard

> Status: PARTIAL · Area: Analytics · Last verified: 2026-07-31
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
  not assume API access: a member can **enter metrics by hand** per post, **import their LinkedIn post
  history** from LinkedIn's own CSV/XLSX export, and - once an operator is approved and a member opts
  in - **refresh metrics on demand** and get a daily cron **auto-sync** for posts published through this
  app, from the API. Whichever source last wrote a post's metrics wins.
- The dashboard only reflects posts that exist in the app as `published` drafts. Posts written directly
  on LinkedIn before/outside the app are not visible until backfilled by the CSV/XLSX history import,
  which both updates metrics for posts already tracked (matched by URL) and creates new `published`
  posts for rows it doesn't recognize - so a brand-new connection with a long LinkedIn history isn't
  stuck at an empty state.
- A separate **"LinkedIn account analytics"** section (independent of in-app posts) shows follower
  growth and account-wide aggregate KPIs (impressions, reach, reactions, comments, reshares) pulled
  live from LinkedIn once App B is connected. It fetches on demand and never persists the payload
  (LinkedIn's terms cap storage of member social activity at 48h) - a **test mode** renders the same UI
  with deterministic mock data so it's reviewable before Community Management API approval.

## Why

- Gives creators the "what's working" view (which formats/lengths/days drive engagement) that
  otherwise requires paid tools, while staying honest about LinkedIn's API limits: it is useful from
  day one via manual/CSV entry and upgrades transparently to automatic sync when access is granted.

## Acceptance (binary, testable)

- [x] 230-AC-1 A dedicated analytics page exists and is reachable from the dashboard nav _(verified:
      route `app/dashboard/analytics/page.tsx:7`; sidebar link `components/dashboard/dashboard-sidebar.tsx:148`)_
- [x] 230-AC-2 The dashboard shows per-post performance metrics _(verified: `PostsPerformanceTable`
      rendered at `components/dashboard/analytics/analytics-page.tsx`; rows show impressions/engagement/rate
      in `components/dashboard/analytics/posts-performance-table.tsx`)_
- [x] 230-AC-3 An engagement trend chart over time with 30 / 90 / all-time ranges _(verified:
      `components/dashboard/analytics/engagement-trend-chart.tsx`, rendered at `analytics-page.tsx`;
      `engagementTimeline` filter in `lib/analytics/aggregate.ts`)_
- [x] 230-AC-4 Content insights: top formats, post length, best day _(verified:
      `components/dashboard/analytics/content-insights.tsx`; `formatBreakdown`/`lengthBreakdown`/`dayOfWeekPerformance`
      in `lib/analytics/aggregate.ts:134,165,184`)_
- [x] 230-AC-5 Members can record engagement metrics without the LinkedIn API, by manual entry and by
      CSV import _(verified: manual entry `components/dashboard/analytics/metrics-entry-dialog.tsx`; CSV
      parse/plan `lib/analytics/csv.ts` (`parseLinkedInCsv`, `planCsvImport`); persisted via
      `lib/supabase/post-metrics.ts`)_
- [x] 230-AC-6 Metrics are stored for historical/trend use and isolated per user _(verified:
      `supabase/migrations/012_post_metrics.sql` table + RLS; one row per draft, upserted by source)_
- [x] 230-AC-7 Empty state when there are no published posts _(verified: `analytics-page.tsx`
      branch renders `AnalyticsEmpty` from `components/dashboard/analytics/analytics-empty.tsx`)_
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
      `app/api/cron/sync-analytics/route.ts` returns `skipped` until the analytics app (App B) is
      configured (`isLinkedInAnalyticsConfigured`) and the member has connected it. Requires a separate
      LinkedIn app with Community Management API + `r_member_postAnalytics`/`r_member_profileAnalytics`
      (it cannot share App A); not verifiable without approval.)_
- [x] 230-AC-12 REMOVED. Previously: "with Community Management API access, a member can import their
      existing LinkedIn posts (history + text + metrics) on demand via the Posts API author finder." That
      finder (`GET /rest/posts?q=author`) requires `r_member_social`, a permission LinkedIn closed to new
      applications entirely - there is no approval path, and the endpoint 403s unconditionally. Removed
      `app/api/analytics/import-linkedin/route.ts`, `lib/linkedin/import.ts` (`fetchMemberPosts`), and the
      self-hiding `import-linkedin-button.tsx`. The route's other job (refreshing metrics for posts
      already published through the app) survives as 230-AC-9's on-demand counterpart - see
      `app/api/analytics/refresh-metrics/route.ts`. History backfill is now 230-AC-13.
- [x] 230-AC-13 A member can backfill their real LinkedIn post history (impressions + engagement) from
      LinkedIn's own "Post analytics" export, with the app clearly explaining where to get the file, what
      it will do, and that it's a one-time backfill _(verified: step-numbered instructions in
      `components/dashboard/analytics/import-metrics-dialog.tsx`; rows not matched to an existing draft
      become new `published` posts via `planCsvImport` in `lib/analytics/csv.ts` +
      `createImportedPublishedPost` in `lib/supabase/drafts.ts`, wired through `useDrafts().createImportedPost`)_
- [ ] 230-AC-14 A "LinkedIn account analytics" section shows follower growth and account-wide aggregate
      KPIs, fetched live (never stored) once App B is connected, with a test mode for pre-approval review
      _(built but unverifiable live without approval: route `app/api/analytics/linkedin/route.ts`, fetchers
      `lib/linkedin/member-analytics.ts` (`fetchFollowerCount`, `fetchFollowerSeries`,
      `fetchMemberAggregate`), UI `components/dashboard/analytics/linkedin-account-section.tsx`; test mode
      `LINKEDIN_ANALYTICS_TEST_MODE` / `isLinkedInAnalyticsTestMode()` in `config/linkedin.ts` returns
      deterministic mock payloads with a "Test data" badge)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- Page + sections: `components/dashboard/analytics/analytics-page.tsx` composes `KpiCards`,
  `AiInsightsSection`, `EngagementTrendChart`, `GoldenHourCard`, `LinkedInAccountSection`,
  `ContentDnaSection`, `ActivitySection`, `ContentInsights`, `PostsPerformanceTable`. Motion:
  `reveal.tsx` (house `lib/motion.ts` tokens) under a page-level
  `<MotionConfig reducedMotion="user">`; `animated-number.tsx`, `sparkline.tsx`, `stat-card.tsx`.
- Pure aggregation: `lib/analytics/aggregate.ts` (`publishedPosts`, `summarize`, `engagementTimeline`,
  `formatBreakdown`, `lengthBreakdown`, `dayOfWeekPerformance`, `goldenHour`, `periodComparison`,
  `topPosts`, `localParts` for timezone-correct day/hour). Engagement math `lib/analytics/metrics.ts`;
  formatting `lib/analytics/format.ts`.
- Insight engines: correlation `lib/analytics/content-dna.ts` + features `lib/analytics/content-features.ts`;
  AI digest `lib/analytics/digest.ts` + prompts `config/prompts.ts` (`INSIGHTS_SYSTEM_PROMPT`); content
  fetch `lib/supabase/published-posts.ts`, hook `hooks/use-published-content.ts`.
- Data layer: table `supabase/migrations/012_post_metrics.sql`; CRUD `lib/supabase/post-metrics.ts`;
  state `hooks/use-post-metrics.ts`.
- Manual / history entry: `metrics-entry-dialog.tsx` (manual), `import-metrics-dialog.tsx` (LinkedIn CSV
  history import, with the export instructions), parser `lib/analytics/csv.ts` (`parseLinkedInCsv`,
  `planCsvImport`). Rows matched by stored LinkedIn post URL update in place; unmatched rows with at
  least one real metric become new `published` posts (`createImportedPublishedPost` in
  `lib/supabase/drafts.ts`, exposed as `useDrafts().createImportedPost`) with a placeholder title/body
  (`plainTextToTiptapDoc` in `lib/drafts.ts`) since the export has no post text.
- Two-app model: analytics lives on a SEPARATE LinkedIn app (App B) because LinkedIn requires the
  Community Management API to be the only product on an app. Config `config/linkedin.ts`
  (`isLinkedInAnalyticsConfigured`, `isLinkedInAnalyticsTestMode`, `linkedInAnalyticsRedirectUri`,
  `LINKEDIN_ANALYTICS_SCOPES` - `r_member_postAnalytics` + `r_member_profileAnalytics`), env
  `LINKEDIN_ANALYTICS_CLIENT_ID/_SECRET/_REDIRECT_URI/_TEST_MODE` (`env.mjs`). Separate OAuth: helpers in
  `lib/linkedin/oauth.ts` (`buildAnalyticsAuthorizeUrl`, `exchangeAnalyticsCodeForToken`), connect/callback
  `app/api/linkedin/analytics/{auth,callback}/route.ts`, token store `linkedin_analytics_connections`
  (migration 017) via `lib/linkedin/analytics-connections.ts`.
- Per-post analytics for posts published through this app: client `lib/linkedin/analytics.ts`
  (`memberCreatorPostAnalytics`, `q=entity`), daily cron `app/api/cron/sync-analytics/route.ts`
  (`vercel.json`), on-demand refresh `app/api/analytics/refresh-metrics/route.ts` + self-hiding
  `refresh-metrics-button.tsx` (connect vs refresh). Needs only a post's stored URN + App B's token - no
  dependency on the App A (publishing) connection.
- Account-wide analytics (not tied to any in-app post): `lib/linkedin/member-analytics.ts`
  (`fetchFollowerCount`, `fetchFollowerSeries` via `memberFollowersCount`; `fetchMemberAggregate` via
  `memberCreatorPostAnalytics` `q=me`, one `queryType` per call), route
  `app/api/analytics/linkedin/route.ts` (30/90-day window, fetch-and-display only - no Supabase write),
  UI `linkedin-account-section.tsx` (follower chart + 5 KPI tiles, quiet retry on failure).
- Activity heatmap/streak reuse `lib/strategy-metrics.ts` + `components/dashboard/strategy/contribution-grid.tsx`.

## Dependencies

- Published posts (status `published`) drive the dashboard; publishing/scheduling is Wave 4 (220-222).
- Automatic sync (230-AC-9), on-demand refresh, and the account analytics section (230-AC-14) depend on
  a **separate LinkedIn app (App B)** with the **Community Management API** + `r_member_postAnalytics` +
  `r_member_profileAnalytics` scopes (registered legal entity + verified company page). LinkedIn
  requires that API to be the only product on an app, so it cannot share App A (Sign In + Share).
  Members connect LinkedIn twice (publishing + analytics). Until App B is set up, the dashboard runs on
  manual/CSV-entered metrics, and 230-AC-14 stays in test mode.
- Charting: `recharts` via `components/ui/chart.tsx`.
- No XLSX-parsing dependency was added for the history import (230-AC-13) - the export is a multi-sheet
  workbook, so the UI asks the member to save the "Top posts" sheet as CSV first rather than parsing
  XLSX directly.

## Open questions / known gaps

- Automatic API sync (230-AC-9) and on-demand refresh are built but inert pending the App B (Community
  Management API) setup + approval. The `memberCreatorPostAnalytics` (`q=entity`) request/response shape
  in `lib/linkedin/analytics.ts` follows the documented metric set but must be re-verified against the
  live API when first enabled (LinkedIn documents these counts as "best-effort" and notes they can lag
  the native UI; the entity fetcher requests all metrics via a comma-joined `metricTypes` param, whereas
  LinkedIn's docs for `q=me`/`q=entity` describe a singular `queryType` per call - flagged here rather
  than changed, since the entity fetcher is unverified/inert either way until App B is approved).
- CSV/XLSX history import (230-AC-13): the exact column headers in LinkedIn's "Top posts" sheet aren't
  publicly documented, so `lib/analytics/csv.ts` uses fuzzy keyword matching (as before) plus a new
  date/publish-date column for backfilled posts' `publishedAtMs`. If the export's engagement number is a
  single combined "Engagements" column (rather than separate reactions/comments/reshares), it is
  currently dropped rather than guessed into one bucket - splitting a combined total would misrepresent
  the breakdown. Needs a real export sample to tighten.
- Account analytics (230-AC-14): `lib/linkedin/member-analytics.ts`'s Restli `dateRange` encoding and the
  `memberFollowersCount`/`memberCreatorPostAnalytics q=me` response parsing follow Microsoft Learn's
  documented shapes (verified 2026-07) but are unverified against a live call - flagged for
  re-verification alongside 230-AC-9 once App B is approved. Per LinkedIn's Marketing API terms, member
  social activity data can't be stored longer than 48h, so this surface is fetch-and-display only (no
  Supabase write) and has no historical trend beyond what LinkedIn's API returns per request.
- Two-app assumption: the App B token comes from a separate OAuth connection from App A (publishing).
  Nothing in the current implementation needs the App A connection for analytics anymore (the old
  history import's dependency on the App A person URN was removed with it).
- Metrics are stored as one current snapshot per post (latest values), not per-day time series; the
  trend chart plots one point per post. Per-day snapshot history is a future extension.
- Unblocks Best Time to Post phase-2 personalization (224-AC-5), which is still not built.
