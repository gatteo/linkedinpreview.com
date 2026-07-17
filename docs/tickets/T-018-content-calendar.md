# T-018 - Content calendar

> Status: in-review · Touches: [`../features/223-content-calendar.md`](../features/223-content-calendar.md) · Opened: 2026-06-15 · Closed:

## Goal

- Add a `/dashboard/calendar` month/week view that lays out posts by date, color-codes them by
  status, opens a post on click, and reschedules via drag-and-drop.

## Context

- Wave 4: feature 223 graduated from `backlog/` to `features/`. With scheduling (222, T-017) in
  place there are scheduled posts to lay out, and a calendar is the natural planning surface.

## Plan

- Add `app/dashboard/calendar/page.tsx` and `components/dashboard/calendar/content-calendar.tsx`
  (date-fns grid, prev/next/today nav, month/week toggle, status legend, best-day hints).
- Wire drag-to-reschedule to `setDraftSchedule` (optimistic + rollback).
- Activate the Calendar sidebar nav and add `Routes.DashboardCalendar`.

## Acceptance (binary, testable)

- [x] T-018-AC-1 Month and week views render posts on their dates, color-coded by status, with prev/next/today nav and a mobile-responsive layout (-> 223-AC-1..3, 223-AC-6, 223-AC-7).
- [x] T-018-AC-2 Clicking a post opens it in the editor; drag-and-drop reschedules (optimistic + rollback); Calendar is an active sidebar nav item (-> 223-AC-4, 223-AC-5, 223-AC-8).
- [ ] T-018-AC-3 A drag-reschedule round-trips to a real LinkedIn delivery at the new time (-> 223-AC-9; blocked on the cron's live LinkedIn delivery).

## On completion

- Folds into [`223-content-calendar.md`](../features/223-content-calendar.md) as 223-AC-1..8
  (223-AC-9 remains open; feature stays PARTIAL).
- Changelog: 2026-06-15 Wave 4 entry (content calendar).

## Notes / open questions

- Built on a custom date-fns grid (no external calendar library), keeping the bundle small.
