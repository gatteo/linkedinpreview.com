# 061 — Anonymous Auth

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-14

## What

- The first time a visitor opens any dashboard page, an anonymous Supabase session is created
  silently. There is no visible signup or login form. An `AuthProvider` performs the sign-in and
  exposes the session, while an `AuthGate` shows a spinner until the session is ready, then
  renders the dashboard.

## Why

- Users can start creating and persisting posts immediately without the friction of an account,
  while still getting per-user data isolation through Supabase row-level security.

## Acceptance (binary, testable)

- [x] 061-AC-1 The dashboard calls `supabase.auth.signInAnonymously()` when no session exists. _(verified: `components/dashboard/auth-provider.tsx:57`)_
- [x] 061-AC-2 An existing session is reused instead of creating a new one. _(verified: `components/dashboard/auth-provider.tsx:45-54`)_
- [x] 061-AC-3 The session is established transparently with no signup/login UI; only a spinner gates the dashboard. _(verified: `components/dashboard/auth-gate.tsx:10-18`)_
- [x] 061-AC-4 `AuthProvider` and `AuthGate` wrap all dashboard pages. _(verified: `app/dashboard/layout.tsx:27-28`)_
- [x] 061-AC-5 The session/user id is exposed to the app via a React context (`useAuth`). _(verified: `components/dashboard/auth-provider.tsx:75-77`, consumed in `hooks/use-drafts.ts:17`)_

## Implementation

- `components/dashboard/auth-provider.tsx:33-78` initializes the session (getSession then signInAnonymously) and provides `{ isReady, userId, supabase }`.
- `components/dashboard/auth-gate.tsx:7-19` blocks children behind a spinner until `isReady`.
- `lib/supabase/client.ts:5-7` creates the browser Supabase client.
- A standalone `hooks/use-anonymous-auth.ts:6-43` also implements anonymous sign-in, but the dashboard layout uses `AuthProvider`, not this hook.

## Dependencies

- 060 Dashboard Shell (AuthProvider/AuthGate are mounted in the layout).
- Supabase RLS policies in `supabase/migrations/004_dashboard_data.sql` enforce per-user access.

## Open questions / known gaps

- On anonymous sign-in failure, the gate still renders (`isReady` is set true) and surfaces a toast (`components/dashboard/auth-provider.tsx:58-63`); downstream queries will then fail under RLS.
- Two sign-in implementations exist (`auth-provider.tsx` and `hooks/use-anonymous-auth.ts`); the hook appears unused by the dashboard layout.
