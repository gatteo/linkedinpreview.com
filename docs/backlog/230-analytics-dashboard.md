# 230 — Analytics Dashboard (backlog)

> Status: PLANNED · Wave: 5 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A comprehensive analytics dashboard showing per-post performance metrics (impressions, reactions, comments, shares), engagement trends over time, and content insights (top formats, best hooks, optimal length). Data is fetched from the LinkedIn API and stored in Supabase for historical tracking.

## Why it is parked

- Wave 5 (Analytics & Insights) in [`../ROADMAP.md`](../ROADMAP.md) has not started, and it requires LinkedIn API access from Wave 4 plus at least one published post to have data.

## What would make it worth promoting

- Wave 4 (LinkedIn OAuth and publishing) being shipped, so there are published posts and an authenticated API connection to pull metrics from.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `230-AC-K` IDs when the feature is built:

- Dashboard shows per-post performance metrics.
- Engagement trends chart over time (last 30 / 90 days).
- Content insights: top formats, best hooks, optimal length.
- Metrics sync automatically from the LinkedIn API.
- Historical data is stored for trend analysis.
- Empty state when there are no published posts or LinkedIn is not connected.
- Mobile-responsive layout.

## Dependencies

- LinkedIn OAuth (220) for API access and at least one published post (221).
- A Supabase table for metric snapshots plus a background sync job (Vercel Cron / Supabase Edge Function).
- A charting library (e.g. recharts).
