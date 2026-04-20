# Feature 223: Content Calendar

## Goal

Give users a visual calendar view of their scheduled and published posts.

## Description

A calendar view in the dashboard showing posts by date. Supports month and week views. Posts are color-coded by status (draft, scheduled, published). Users can drag and drop to reschedule posts. Clicking a post opens it in the editor.

## Acceptance Criteria

- [ ] Month view shows all posts on their dates
- [ ] Week view shows posts in time slots
- [ ] Posts are color-coded by status
- [ ] Clicking a post opens it in the editor
- [ ] Drag-and-drop reschedules posts (updates `scheduled_at`)
- [ ] Calendar is navigable (previous/next month/week)
- [ ] Mobile-responsive layout

## Technical Notes

- New dashboard page at `/dashboard/calendar` or tab within the posts page
- Data source: drafts table filtered by `scheduled_at` and `created_at`
- Calendar rendering: consider a lightweight library (e.g. @fullcalendar/react) or custom grid
- Month view: shows post titles on their scheduled/published dates
- Week view: time slots showing scheduled posts
- Drag-and-drop: updates `scheduled_at` in Supabase
- Color coding: amber (draft), blue (scheduled), green (published) - matches existing status badges
- Empty days could show a "+" button to create a new post for that date
