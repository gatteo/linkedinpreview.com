# 220 — LinkedIn OAuth (backlog)

> Status: PLANNED · Wave: 4 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A LinkedIn OAuth 2.0 integration that lets users connect their LinkedIn account. It is the prerequisite for one-click publish (221), scheduling (222), and analytics (230). The OAuth flow upgrades the anonymous auth session rather than replacing it, and users who do not connect LinkedIn can still use all other features.

## Why it is parked

- Anchor of Wave 4 (Scheduling & Publishing) in [`../ROADMAP.md`](../ROADMAP.md), which has not started. It is also gated by external LinkedIn API approval, which must be applied for ahead of the wave.

## What would make it worth promoting

- LinkedIn API / partner approval being secured, plus Wave 4 being scheduled. This unblocks the entire publishing and analytics line.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `220-AC-K` IDs when the feature is built:

- User can initiate the LinkedIn OAuth flow from the Settings page.
- OAuth callback handles token exchange and storage.
- LinkedIn profile info (name, avatar) is fetched and displayed.
- Connected status is shown on the Settings page.
- User can disconnect their LinkedIn account.
- Existing anonymous session is preserved (upgraded, not replaced).
- Tokens are stored securely (encrypted at rest).

## Dependencies

- Anonymous auth (061) - LinkedIn identity is linked to the existing Supabase user.
- External LinkedIn API approval and the required scopes (e.g. `w_member_social`, `r_liteprofile`).
- OAuth callback route and encrypted token storage in Supabase.
