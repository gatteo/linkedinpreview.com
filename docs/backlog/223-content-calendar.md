# 223 — Content Calendar (backlog)

> Status: PLANNED · Wave: 4 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A calendar view in the dashboard showing posts by date, with month and week views. Posts are color-coded by status (draft, scheduled, published), drag-and-drop reschedules posts, and clicking a post opens it in the editor.

## Why it is parked

- Wave 4 (Scheduling & Publishing) in [`../ROADMAP.md`](../ROADMAP.md) has not started. The calendar is most useful once scheduling (222) exists, so it follows that feature.

## What would make it worth promoting

- Post scheduling (222) being in progress or shipped, so there are scheduled posts to lay out on a calendar.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `223-AC-K` IDs when the feature is built:

- Month view shows all posts on their dates.
- Week view shows posts in time slots.
- Posts are color-coded by status.
- Clicking a post opens it in the editor.
- Drag-and-drop reschedules posts (updates `scheduled_at`).
- Calendar is navigable (previous / next month / week).
- Mobile-responsive layout.

## Dependencies

- Post scheduling (222) for the `scheduled_at` data and reschedule behavior.
- Posts list (065) and the dashboard editor (066) for navigation.
- A calendar rendering approach (e.g. @fullcalendar/react or a custom grid).
