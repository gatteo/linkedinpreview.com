# 222 — Post Scheduling (backlog)

> Status: PLANNED · Wave: 4 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- Lets users pick a date and time (with timezone support) to schedule a post for automatic publishing. Scheduled posts appear in the posts list with a "scheduled" status badge and the scheduled time; when the time arrives, the post is published via the LinkedIn API.

## Why it is parked

- Wave 4 (Scheduling & Publishing) in [`../ROADMAP.md`](../ROADMAP.md) has not started, and it depends on LinkedIn OAuth (220) and the publish path (221), neither of which is built.

## What would make it worth promoting

- LinkedIn OAuth (220) and one-click publish (221) being shipped, plus a chosen background-job mechanism for time-based publishing.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `222-AC-K` IDs when the feature is built:

- User can schedule a post with a specific date, time, and timezone.
- Scheduled posts show "scheduled" status with the scheduled time.
- Posts are automatically published at the scheduled time.
- User can edit or cancel a scheduled post.
- Failed publishes notify the user and allow retry.
- Timezone is handled correctly (stored UTC, displayed local).

## Dependencies

- LinkedIn OAuth (220) and one-click publish (221) for the publish path.
- Post statuses (063) - reuses the existing "scheduled" status.
- A background scheduler (e.g. Vercel Cron, Supabase Edge Functions with pg_cron) and a `scheduled_at` field on the draft record.
