# Feature 201: Content Strategy Dashboard

## Goal

Show users their progress toward their content strategy goals so they stay consistent.

## Description

A dashboard view that tracks monthly posting progress against the user's strategy targets. Shows activity metrics (posts created, posts published), format distribution vs targets, posting frequency heatmap, and streak tracking. Data sourced from the drafts table and strategy settings.

## Acceptance Criteria

- [x] Shows monthly posts created vs target frequency
- [x] Shows format distribution vs target mix
- [x] Posting activity heatmap (last 3-6 months)
- [x] Current streak display
- [x] Handles empty state gracefully (no strategy set up yet - link to wizard)
- [x] Updates in real-time as drafts are created/published

## Technical Notes

- New dashboard page at `/dashboard/strategy` (or tab within it, alongside the wizard)
- Metrics computed from drafts table: count by status, count by label, count by date
- Compare actual vs target from strategy settings (200)
- Charts: simple bar/progress indicators (avoid heavy chart libraries - consider recharts or lightweight alternatives)
- Heatmap: GitHub-style contribution grid showing posting days
- All data fetched client-side from Supabase using existing hooks
- No new API routes needed - all derived from existing draft data
