# 223 - Content Calendar

> Status: PARTIAL · Area: Dashboard · Last verified: 2026-06-15
>
> Built feature (PARTIAL: open gaps). This folder holds **only built features** (SHIPPED or
> PARTIAL). Not-yet-built ideas live in [`../backlog/`](../backlog/). A feature describes a
> user-facing **surface**; system internals live in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## What

- A calendar view in the dashboard (`/dashboard/calendar`) that lays out posts by date in a month
  or week view. Each post chip is color-coded by status (draft, scheduled, published, failed),
  carries its time, and clicking it opens the post in the editor. Posts are dragged across days to
  reschedule (updating `scheduled_at`, optimistic with rollback on failure), the calendar navigates
  previous/next and back to today, and best posting days are hinted. The layout is mobile-first and
  the Calendar entry is an active item in the dashboard sidebar.

## Why

- Gives creators a single at-a-glance plan of what is going out and when, and a fast way to
  rebalance their schedule by dragging, which a flat posts list cannot show.

## Acceptance (binary, testable)

- [x] 223-AC-1 Month view shows all posts on their dates _(verified: `components/dashboard/calendar/content-calendar.tsx:72-94` month grid + `byDay` bucketing; chips at `:220-244`)_
- [x] 223-AC-2 Week view is available _(verified: `components/dashboard/calendar/content-calendar.tsx:72-80` week branch; view toggle `:152-162`)_
- [x] 223-AC-3 Posts are color-coded by status (draft / scheduled / published / failed) _(verified: `components/dashboard/calendar/content-calendar.tsx:33-47` `STATUS_DOT`/`STATUS_CHIP`; legend `:166-174`)_
- [x] 223-AC-4 Clicking a post opens it in the editor _(verified: `components/dashboard/calendar/content-calendar.tsx:229` `router.push(Routes.DashboardEditor(item.id))`)_
- [x] 223-AC-5 Drag-and-drop reschedules a post (updates `scheduled_at`), optimistically with rollback on error _(verified: `components/dashboard/calendar/content-calendar.tsx:100-131` `handleDrop` -> `setDraftSchedule`, optimistic update + rollback; published posts are blocked `:108-111`)_
- [x] 223-AC-6 Calendar is navigable (previous / next and today) _(verified: `components/dashboard/calendar/content-calendar.tsx:96-98` `goPrev`/`goNext`/`goToday`; toolbar `:139-151`)_
- [x] 223-AC-7 Layout is mobile-responsive _(verified: `components/dashboard/calendar/content-calendar.tsx:137`,`:198-201` responsive padding/min-heights; toolbar uses `flex-wrap` `:139`)_
- [x] 223-AC-8 The Calendar is reachable from the dashboard sidebar as an active nav item _(verified: `components/dashboard/dashboard-sidebar.tsx:131-141` Calendar link to `/dashboard/calendar` with `isActive`; route `app/dashboard/calendar/page.tsx`; `Routes.DashboardCalendar` at `config/routes.ts:30`)_
- [ ] 223-AC-9 A drag-reschedule round-trips to a real LinkedIn delivery at the new time _(gap: depends on the cron's live LinkedIn delivery (222-AC-9); pending real LinkedIn app credentials + a connected account for end-to-end verification - see [STATUS.md](../STATUS.md))_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- Page + header: `app/dashboard/calendar/page.tsx`.
- Calendar grid, navigation, status colors, click-to-edit, drag-to-reschedule, best-day hints: `components/dashboard/calendar/content-calendar.tsx` (built on `date-fns`; no external calendar lib).
- Reschedule persistence: `lib/supabase/drafts.ts:210` `setDraftSchedule`; drafts read via `hooks/use-drafts.ts`.
- Sidebar nav: `components/dashboard/dashboard-sidebar.tsx:131-141`; route constant `config/routes.ts:30`.
- Best-day hints: `config/best-time.ts` (`BEST_TIME_SLOTS` `:17`, `BEST_TIME_SUMMARY` `:27`).

## Dependencies

- Post scheduling (222) for `scheduled_at` and the reschedule path.
- Best time to post (224) for the best-day hints.
- Posts list (065) and dashboard editor (066) for navigation.
- See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) "Data Models" (Draft scheduling columns).

## Open questions / known gaps

- Shared Wave 4 gap: the calendar surface itself is fully wired in code (verified above), but the
  reschedule -> live publish loop depends on the cron's unverified LinkedIn delivery (223-AC-9),
  which is pending real LinkedIn app credentials + a connected account for end-to-end verification.
  Tracked in [STATUS.md](../STATUS.md).
