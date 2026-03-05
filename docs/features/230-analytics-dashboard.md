# Feature 230: Analytics Dashboard

## Goal

Give users deep insights into their LinkedIn post performance without expensive third-party tools.

## Description

A comprehensive analytics dashboard showing post performance metrics, engagement trends, and content insights. Includes per-post metrics (impressions, reactions, comments, shares), engagement trends over time, and content performance analysis (top formats, best hooks, optimal post length). Data is fetched from the LinkedIn API and stored in Supabase for historical tracking.

## Acceptance Criteria

- [ ] Dashboard shows per-post performance metrics
- [ ] Engagement trends chart over time (last 30/90 days)
- [ ] Content insights: top formats, best hooks, optimal length
- [ ] Metrics sync automatically from LinkedIn API
- [ ] Historical data is stored for trend analysis
- [ ] Empty state when no published posts or LinkedIn not connected
- [ ] Mobile-responsive layout

## Technical Notes

- New dashboard page at `/dashboard/analytics`
- LinkedIn API: fetch post statistics via `organizationalEntityShareStatistics` or Posts API analytics endpoints
- Data model: new Supabase table for post metrics snapshots (fetched periodically)
- Background job to sync metrics: Vercel Cron or Supabase Edge Function, runs daily
- Charts: consider recharts or a lightweight charting library
- Metrics per post: impressions, unique impressions, reactions (by type), comments, shares, clicks
- Aggregate views: engagement rate over time, best performing posts, format comparison
- Content insights: correlate post characteristics (length, format, hook type, posting time) with performance
- Requires LinkedIn OAuth (220) and at least one published post
