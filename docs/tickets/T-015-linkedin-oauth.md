# T-015 - LinkedIn OAuth connection

> Status: in-review · Touches: [`../features/220-linkedin-oauth.md`](../features/220-linkedin-oauth.md) · Opened: 2026-06-15 · Closed:

## Goal

- Let a user connect and disconnect their LinkedIn account from Settings via OAuth 2.0 / OpenID
  Connect, storing an encrypted access token attached to the existing anonymous session. This is
  the Wave 4 prerequisite for publishing (221) and scheduling (222).

## Context

- Wave 4 (Scheduling & Publishing) kicked off; feature 220 graduated from `backlog/` to
  `features/`. Nothing in the codebase spoke to LinkedIn before this change, and the dashboard had
  no notion of a connected external account.

## Plan

- Add `config/linkedin.ts` (endpoints, scopes, version, error codes, `isLinkedInConfigured`).
- Add OAuth helpers (`lib/linkedin/oauth.ts`) and AES-256-GCM token crypto (`lib/linkedin/crypto.ts`).
- Add the `linkedin_connections` table + RLS (`009`) and connection CRUD (`lib/linkedin/connections.ts`).
- Add auth/callback/status/disconnect routes under `app/api/linkedin/*` (CSRF state cookie).
- Add the Settings connect/disconnect/reconnect card + `use-linkedin-status` hook.

## Acceptance (binary, testable)

- [x] T-015-AC-1 User can start consent from Settings; the callback exchanges the code, stores an encrypted token, and shows the connected account (-> 220-AC-1..5, 220-AC-8).
- [x] T-015-AC-2 The connection is attached to the existing anonymous user and `linkedin_connections` is RLS-protected (-> 220-AC-7, 220-AC-9).
- [x] T-015-AC-3 User can disconnect, and an unconfigured server presents the feature as unavailable (-> 220-AC-6, 220-AC-10).
- [ ] T-015-AC-4 A real member completes consent and the token exchange + userinfo succeed against LinkedIn (-> 220-AC-11; blocked on live LinkedIn app credentials + a connected account).

## On completion

- Folds into [`220-linkedin-oauth.md`](../features/220-linkedin-oauth.md) as 220-AC-1..10 (220-AC-11
  remains open pending live verification, so the feature stays PARTIAL).
- Changelog: 2026-06-15 Wave 4 entry (LinkedIn OAuth).

## Notes / open questions

- Self-serve apps get no programmatic refresh token (60-day token; member must reconnect). The card
  surfaces an expires-soon warning + Reconnect rather than refreshing silently.
