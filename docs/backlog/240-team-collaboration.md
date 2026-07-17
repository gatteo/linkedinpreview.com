# 240 — Team Collaboration (backlog)

> Status: PLANNED · Wave: 6 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A shared workspace where multiple users can access the same drafts. Includes invite-by-email, role-based access (editor, reviewer, admin), a comment / review workflow on drafts, and an activity feed. Teams share a single branding configuration.

## Why it is parked

- Wave 6 (Advanced & Scale) in [`../ROADMAP.md`](../ROADMAP.md) has not started, and it depends on all previous waves. It also requires upgrading from anonymous auth to per-member email / OAuth auth.

## What would make it worth promoting

- Wave 6 being scheduled, plus demand signal that teams (not just solo creators) want to collaborate, which the roadmap flags should be validated before deeper real-time collaboration.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `240-AC-K` IDs when the feature is built:

- User can create a team and invite members.
- Team members can view and edit shared drafts.
- Role-based access control (editor, reviewer, admin).
- Comment / review workflow on drafts.
- Activity feed showing team actions.
- Shared branding configuration per team.

## Dependencies

- A real auth upgrade beyond anonymous auth (061) for per-member identity.
- New data model: teams, team_members (role), draft `team_id`, draft comments, plus updated RLS policies.
- Optionally Supabase Realtime for live updates.
