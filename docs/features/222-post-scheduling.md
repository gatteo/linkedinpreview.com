# Feature 222: Post Scheduling

## Goal

Let users schedule posts to publish at a specific date and time on LinkedIn.

## Description

Users pick a date and time (with timezone support) to schedule a post for automatic publishing. Scheduled posts appear in the posts list with a "scheduled" status badge and the scheduled time. When the time arrives, the post is published via the LinkedIn API. Requires LinkedIn OAuth (220).

## Acceptance Criteria

- [ ] User can schedule a post with a specific date, time, and timezone
- [ ] Scheduled posts show "scheduled" status with the scheduled time
- [ ] Posts are automatically published at the scheduled time
- [ ] User can edit or cancel a scheduled post
- [ ] Failed publishes notify the user and allow retry
- [ ] Timezone is handled correctly (stored UTC, displayed local)

## Technical Notes

- Scheduling UI: date/time picker in the editor toolbar or a "Schedule" option next to "Publish"
- Store `scheduled_at` timestamp on the draft record in Supabase
- Background job to publish at scheduled time: consider Vercel Cron Jobs, Supabase Edge Functions with pg_cron, or a third-party scheduler
- Timezone handling: store as UTC, display in user's local timezone
- Allow editing/canceling scheduled posts before they publish
- After publishing, update status to "published" and store LinkedIn post URL
- Handle failures: retry logic, notification to user if publish fails
