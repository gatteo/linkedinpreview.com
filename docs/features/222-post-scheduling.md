# 222 - Post Scheduling

> Status: PARTIAL · Area: Editor · Last verified: 2026-06-15
>
> Built feature (PARTIAL: open gaps). This folder holds **only built features** (SHIPPED or
> PARTIAL). Not-yet-built ideas live in [`../backlog/`](../backlog/). A feature describes a
> user-facing **surface**; system internals live in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## What

- Lets a user pick a future date and time to publish a post automatically. The editor's Publish
  control offers "Schedule for later", which opens a dialog with a `datetime-local` picker (labelled
  with the user's resolved timezone) and best-time suggestions. Scheduling sets the draft to the
  "scheduled" status with its time; the post then shows in the posts list and content calendar with
  a "scheduled" badge and the scheduled time, and can be rescheduled or cancelled. A Vercel Cron
  publisher runs on a schedule, atomically claims due posts, and publishes each to LinkedIn through
  the same publish path as one-click publish (221). Posts that permanently fail move to a "failed"
  status with the error recorded.

## Why

- Lets creators batch-write and post at high-engagement times without being online, which is the
  core promise of a scheduling tool.

## Acceptance (binary, testable)

- [x] 222-AC-1 User can schedule a post for a specific future date and time, with the timezone shown _(verified: `components/dashboard/publish-controls.tsx:246-262` schedule dialog with `datetime-local` + `TIMEZONE` label `:47`,`:254`; future-time guard `:110-116`)_
- [x] 222-AC-2 Scheduling sets the "scheduled" status and persists the time as UTC _(verified: `hooks/use-current-draft.ts:262-272` `saveSchedule`; `lib/supabase/drafts.ts:210-229` `setDraftSchedule` writes `status='scheduled'` and `scheduled_at` via `toISOString()`)_
- [x] 222-AC-3 Scheduled posts show a "scheduled" badge and the scheduled time in the posts list _(verified: `components/dashboard/posts-table.tsx:186-200` status badge + scheduled time)_
- [x] 222-AC-4 User can reschedule or cancel a scheduled post _(verified: `components/dashboard/publish-controls.tsx:130-137` cancel via `onScheduled(null)`, `:176-190` reschedule/cancel controls; calendar drag-reschedule `components/dashboard/calendar/content-calendar.tsx:100-131`)_
- [x] 222-AC-5 A cron publisher claims due posts atomically and publishes them, idempotently (tolerant of missed/duplicate runs) _(verified: `app/api/cron/publish/route.ts:34-109`; `claim_due_linkedin_posts` RPC at `supabase/migrations/010_post_scheduling.sql:26-57` with `for update skip locked` + 10-min lock and a `linkedin_post_urn is null` guard)_
- [x] 222-AC-6 The cron endpoint is authenticated (CRON*SECRET bearer) and uses a service-role client that bypasses RLS only for this trusted path *(verified: `app/api/cron/publish/route.ts:35-39` bearer check; `lib/supabase/admin.ts:12-19` `createAdminClient` with `SUPABASE_SERVICE_ROLE_KEY`)\_
- [x] 222-AC-7 Transient failures retry up to a cap; auth failures and a hit cap are permanent and move the post to "failed" with the error recorded _(verified: `app/api/cron/publish/route.ts:96-106` permanence rule using `LINKEDIN_MAX_PUBLISH_ATTEMPTS`; `lib/supabase/drafts.ts:257` `markDraftPublishFailed`; `failed` status added at `supabase/migrations/010_post_scheduling.sql:14-16`)_
- [x] 222-AC-8 Timezones are handled correctly: stored UTC, displayed in the user's local time _(verified: stored via `toISOString()` `lib/supabase/drafts.ts:220`; displayed local via `toLocaleString` in `components/dashboard/publish-controls.tsx:49-51` and `components/dashboard/posts-table.tsx:193-198`)_
- [ ] 222-AC-9 The cron actually delivers a scheduled post to LinkedIn at (or shortly after) its scheduled time _(gap: pending real LinkedIn app credentials + a connected account for end-to-end verification, and a deployed Vercel Cron - see [STATUS.md](../STATUS.md))_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- Schedule UI: `components/dashboard/publish-controls.tsx` (schedule dialog `:246`, cancel `:130`).
- Draft schedule writes: `lib/supabase/drafts.ts` (`setDraftSchedule` `:210`, `markDraftPublished` `:231`, `markDraftPublishFailed` `:257`); current-draft hook `hooks/use-current-draft.ts` (`saveSchedule` `:262`).
- Cron publisher: `app/api/cron/publish/route.ts` (`maxDuration = 60` `:13`); service-role client `lib/supabase/admin.ts`; cron registration `vercel.json` (`* * * * *`).
- Migration: `supabase/migrations/010_post_scheduling.sql` (drafts columns `:5-11`, `failed` status `:14-16`, `idx_drafts_due` `:19-21`, `claim_due_linkedin_posts` `:26`, `claim_draft_for_publish` `:62`).
- Config: `config/linkedin.ts` (`LINKEDIN_MAX_PUBLISH_ATTEMPTS` `:47`, `LINKEDIN_CRON_BATCH` `:50`); env `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` `env.mjs:21-24`.

## Dependencies

- LinkedIn OAuth (220) and one-click publish (221) - the cron reuses the publish path.
- Content calendar (223) - the visual surface for scheduled posts and drag-to-reschedule.
- Best time to post (224) - feeds the schedule dialog's suggestions.
- See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) "Data Models" (Draft scheduling columns) and
  "API Routes" (`/api/cron/publish`).

## Open questions / known gaps

- Shared Wave 4 gap: pending real LinkedIn app credentials + a connected account for end-to-end
  verification. Type-check, lint, and build pass and the code-quality review returned SHIP, but the
  cron's actual delivery to LinkedIn at the scheduled time is unverified (222-AC-9). Tracked in
  [STATUS.md](../STATUS.md).
- Architectural constraint: per-minute scheduling (`vercel.json` cron `* * * * *`) requires **Vercel
  Pro**. On the Hobby plan cron runs at most once per day, so scheduled posts would publish in a
  daily batch, not at the chosen minute.
