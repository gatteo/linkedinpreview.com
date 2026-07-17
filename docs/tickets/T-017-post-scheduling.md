# T-017 - Post scheduling + cron publisher

> Status: in-review · Touches: [`../features/222-post-scheduling.md`](../features/222-post-scheduling.md) · Opened: 2026-06-15 · Closed:

## Goal

- Let a user schedule a post for a future time (timezone-aware) and have a Vercel Cron publisher
  deliver it automatically through the publish path, with retry/permanent-failure handling.

## Context

- Wave 4: feature 222 graduated from `backlog/` to `features/`. Builds on publish (221, T-016): the
  same publish path now also runs unattended from cron.

## Plan

- Migration `010`: add scheduling columns to `drafts`, a `failed` status, `idx_drafts_due`, and the
  `claim_due_linkedin_posts` (service-role) + `claim_draft_for_publish` (authenticated) RPCs.
- Add the schedule dialog (datetime-local + timezone + suggestions) and reschedule/cancel.
- Add `app/api/cron/publish/route.ts` (CRON_SECRET auth, service-role client, idempotent),
  `lib/supabase/admin.ts`, and `vercel.json` cron.

## Acceptance (binary, testable)

- [x] T-017-AC-1 User can schedule (stored UTC, shown local), and scheduled posts show in the list with their time; reschedule/cancel work (-> 222-AC-1..4, 222-AC-8).
- [x] T-017-AC-2 The cron claims due posts atomically and idempotently, is CRON_SECRET-authed, and uses a service-role client (-> 222-AC-5, 222-AC-6).
- [x] T-017-AC-3 Transient failures retry to a cap; auth failures / hit cap move the post to "failed" with the error recorded (-> 222-AC-7).
- [ ] T-017-AC-4 The cron actually delivers a scheduled post to LinkedIn at its scheduled time (-> 222-AC-9; blocked on live LinkedIn app credentials + a connected account + deployed Vercel Cron).

## On completion

- Folds into [`222-post-scheduling.md`](../features/222-post-scheduling.md) as 222-AC-1..8
  (222-AC-9 remains open; feature stays PARTIAL).
- Changelog: 2026-06-15 Wave 4 entry (post scheduling + cron).

## Notes / open questions

- Per-minute cron (`* * * * *`) requires Vercel Pro; Hobby cron runs once/day, so scheduled posts
  would publish in a daily batch rather than at the chosen minute.
