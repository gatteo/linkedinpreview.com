# 224 — Best Time to Post (backlog)

> Status: PLANNED · Wave: 4 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- AI-recommended posting times based on the user's content strategy, audience timezone, and (later) historical engagement data. Suggestions appear when scheduling a post and in the content calendar. Phase 1 uses general LinkedIn best practices; Phase 2 personalizes using the user's own performance data.

## Why it is parked

- Wave 4 (Scheduling & Publishing) in [`../ROADMAP.md`](../ROADMAP.md) has not started. The suggestions surface inside scheduling (222) and the calendar (223), so it follows those. Phase 2 additionally depends on analytics (230) from Wave 5.

## What would make it worth promoting

- Scheduling (222) and the content calendar (223) being available as surfaces for the recommendations. For Phase 2, analytics (230) providing per-user performance data.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `224-AC-K` IDs when the feature is built:

- Suggested posting times are shown when scheduling a post.
- Recommendations consider the user's audience timezone.
- Best time slots are highlighted in the content calendar.
- Recommendations improve with the user's own data when available (Phase 2).

## Dependencies

- Post scheduling (222) and content calendar (223) as the surfaces for suggestions.
- Content strategy wizard (200) for audience timezone.
- Analytics (230) for Phase 2 personalized recommendations.
