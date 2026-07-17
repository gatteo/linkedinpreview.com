# 220 - LinkedIn OAuth (connect + login)

> Status: PARTIAL · Area: Settings · Last verified: 2026-06-17
>
> Built feature (PARTIAL: open gaps). This folder holds **only built features** (SHIPPED or
> PARTIAL). Not-yet-built ideas live in [`../backlog/`](../backlog/). A feature describes a
> user-facing **surface**; system internals live in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## What

- A LinkedIn OAuth 2.0 (authorization-code + OpenID Connect) integration that lets a user connect
  their LinkedIn account from the Settings page (or the sidebar CTA). The connect button opens
  LinkedIn consent; the callback exchanges the code for an access token, fetches the member's
  identity (name, avatar, email, person id), and stores an encrypted token. Settings shows the
  connected account with its avatar, name, and expiry, plus reconnect/disconnect controls.
- **LinkedIn doubles as the login.** Connecting also establishes identity: on first connect the
  anonymous session is converted into a real, email-backed account (email-confirmation link) and the
  LinkedIn name/avatar seed the auth profile + branding. If the connected LinkedIn identity already
  belongs to an account here, the user is **signed into that account** instead of stranding them on
  a throwaway session — silently when the current session is empty, or behind a "bring your drafts?"
  prompt when it has drafts. When the current session is already a _different_ saved account, the
  connect is **blocked** with a clear message. **Disconnect** clears the publish token but keeps the
  identity mapping, so the user can always log back in via LinkedIn.
- It is the prerequisite for one-click publish (221) and scheduling (222).

## Why

- LinkedIn write access is the gate for publishing and scheduling, and — since the app has no
  password or login screen — LinkedIn is also the only way a returning user gets back into their
  account. Treating connect as login keeps the friction-free core intact while giving opted-in
  members a durable, recoverable identity.

## Acceptance (binary, testable)

- [x] 220-AC-1 User can initiate the LinkedIn OAuth flow from Settings _(verified: `components/dashboard/linkedin-connection.tsx:128-133` "Connect LinkedIn" links to `ApiRoutes.LinkedInAuth`, rendered in Settings via `components/dashboard/settings-form.tsx:85`)_
- [x] 220-AC-2 The auth route requires an existing session and sets a CSRF state cookie before redirecting to LinkedIn consent _(verified: `app/api/linkedin/auth/route.ts:20-39` session check + `OAUTH_STATE_COOKIE` then `buildAuthorizeUrl(state)`)_
- [x] 220-AC-3 The callback validates the CSRF state, exchanges the code for a token, fetches user info, and upserts the connection _(verified: `app/api/linkedin/callback/route.ts:30-54` state match, `exchangeCodeForToken`, `fetchUserInfo`, `upsertConnection`)_
- [x] 220-AC-4 LinkedIn profile info (name, avatar) is fetched and displayed _(verified: fetched at `lib/linkedin/oauth.ts:66-75` `fetchUserInfo`; displayed at `components/dashboard/linkedin-connection.tsx:81-96`)_
- [x] 220-AC-5 Connected status (and expiry / expires-soon warnings) is shown on Settings _(verified: `components/dashboard/linkedin-connection.tsx:97-112`; status from `app/api/linkedin/status/route.ts:6-25` and `lib/linkedin/connections.ts:44-54` `toStatus`)_
- [x] 220-AC-6 User can disconnect their LinkedIn account _(verified: `components/dashboard/linkedin-connection.tsx:41-53` POST to `ApiRoutes.LinkedInDisconnect`; `app/api/linkedin/disconnect/route.ts:6-24` deletes the row via `deleteConnection`)_
- [x] 220-AC-7 The existing anonymous session is preserved (the connection is attached to the current user, not swapped) _(verified: `app/api/linkedin/callback/route.ts:37-54` reads the current `supabase.auth.getUser()` and upserts keyed on `user.id`)_
- [x] 220-AC-8 Tokens are stored encrypted at rest (AES-256-GCM, key never leaves the server) _(verified: `lib/linkedin/connections.ts:95` `encryptToken(...)` before upsert; `lib/linkedin/crypto.ts:24-30` AES-256-GCM with `LINKEDIN_TOKEN_ENC_KEY`)_
- [x] 220-AC-9 RLS restricts each user to their own `linkedin_connections` row _(verified: `supabase/migrations/009_linkedin_connections.sql:16-28` RLS enabled with select/insert/update/delete policies keyed on `auth.uid() = user_id`)_
- [x] 220-AC-10 When the integration is not configured on the server, the UI presents it as unavailable instead of offering a broken flow _(verified: `config/linkedin.ts:66-68` `isLinkedInConfigured`; `components/dashboard/linkedin-connection.tsx:74-77` "not configured" copy; `app/api/linkedin/auth/route.ts:15-17` redirects to `?linkedin=unavailable`)_
- [ ] 220-AC-11 A real member can complete consent end-to-end and the token exchange + userinfo succeed against LinkedIn _(gap: pending real LinkedIn app credentials + a connected account for end-to-end verification - see [STATUS.md](../STATUS.md))_
- [x] 220-AC-12 First connect converts the anonymous user into a real account: the LinkedIn email is linked (triggering an email-confirmation link handled at `/auth/confirm`) and the name/avatar seed the auth profile + branding _(verified: `lib/linkedin/identity-sync.ts:42-95` `syncIdentityFromLinkedIn` (email link, metadata, empty-fill branding); `app/auth/confirm/route.ts:21-35` `verifyOtp`; called from `app/api/linkedin/callback/route.ts:83-97`)_
- [x] 220-AC-13 `linkedin_sub` is the unique login identity and "connected for publishing" requires a non-null token _(verified: `supabase/migrations/011_linkedin_login.sql` unique(linkedin_sub) + nullable access_token; `lib/linkedin/connections.ts:68-93` `getConnectionStatus` null-token guard + `findUserIdByLinkedInSub`)_
- [x] 220-AC-14 Connecting a LinkedIn identity owned by another account signs the user into that account when the current session is anonymous (silently with no drafts; behind a merge prompt with drafts) _(verified: `app/api/linkedin/callback/route.ts:119-166` `handleSwitch`; `app/api/linkedin/switch/route.ts`; `lib/linkedin/account-link.ts` `mintSession`/`mergeDraftsInto`/pending-switch cookie; prompt UI `components/dashboard/linkedin-connection.tsx` `MergePromptDialog`)_
- [x] 220-AC-15 Connecting an identity owned by a different account is blocked when the current session is already a saved (non-anonymous) account _(verified: `app/api/linkedin/callback/route.ts:134-138` blocks on `user.is_anonymous === false` -> `?linkedin=linked-elsewhere`)_
- [x] 220-AC-16 The login-switch decision is server-derived from the verified `linkedin_sub`; the client only sends a `merge` boolean (the `{from,to}` pair travels in an AES-GCM-encrypted httpOnly cookie) _(verified: `lib/linkedin/account-link.ts:28-50` encode/decode; `app/api/linkedin/switch/route.ts:30-38` re-checks the session matches `from`)_
- [x] 220-AC-17 Disconnect clears the publish token but keeps the row so the identity mapping survives for future logins _(verified: `lib/linkedin/connections.ts:127-138` `disconnectConnection`; `app/api/linkedin/disconnect/route.ts`)_
- [ ] 220-AC-18 A real returning member is signed back into their existing account end-to-end (consent -> resolve -> magic-link mint -> session swap) _(gap: requires live LinkedIn credentials + a second connected member; same shared Wave 4 gap as 220-AC-11)_

> Acceptance IDs are stable forever (`220-AC-3` is always `220-AC-3`). A box is checked `[x]` **only**
> when verified against the code with a `file:line` citation. Anything unverified or contradicted
> stays `[ ]` with a gap note, and the feature's status is PARTIAL.

## Implementation

- Config + capability check: `config/linkedin.ts` (endpoints `:9-20`, scopes `:34`, `LINKEDIN_API_VERSION` `:26`, `isLinkedInConfigured` `:66`, `linkedInRedirectUri` `:71`).
- OAuth helpers: `lib/linkedin/oauth.ts` (`buildAuthorizeUrl` `:31`, `exchangeCodeForToken` `:43`, `fetchUserInfo` `:66`, `personUrn` `:78`).
- Token encryption: `lib/linkedin/crypto.ts` (`encryptToken` `:24`, `decryptToken` `:32`).
- Connection persistence: `lib/linkedin/connections.ts` (`getConnectionStatus` (null-token guard), `upsertConnection`, `disconnectConnection`, `findUserIdByLinkedInSub`, `isExpired`/`expiresSoon`).
- Identity sync (first connect): `lib/linkedin/identity-sync.ts` (email link, auth-metadata, empty-fill branding); email confirm handler `app/auth/confirm/route.ts`.
- Login / account switch: `lib/linkedin/account-link.ts` (`mintSession` via `admin.generateLink`+`verifyOtp`, `mergeDraftsInto`, encrypted pending-switch cookie); admin client `lib/supabase/admin.ts`.
- Routes: `app/api/linkedin/{auth,callback,status,disconnect,switch}/route.ts` (callback holds the attach/reconnect/login-switch/block decision tree); `app/auth/confirm/route.ts`.
- UI: `components/dashboard/linkedin-connection.tsx` (status card + `MergePromptDialog`, in Settings via `settings-form.tsx`); sidebar profile/CTA `components/dashboard/sidebar-profile.tsx`; client status hook `hooks/use-linkedin-status.ts`.
- Tables + RLS: `supabase/migrations/009_linkedin_connections.sql`; `supabase/migrations/011_linkedin_login.sql` (unique `linkedin_sub`, nullable `access_token`).
- Env vars `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`, `LINKEDIN_TOKEN_ENC_KEY`: `env.mjs:11-19`. `SUPABASE_SERVICE_ROLE_KEY` is required for the login/switch path (account resolution + session minting).

## Dependencies

- Anonymous auth (061) - the LinkedIn connection is keyed to the existing Supabase user.
- Feeds one-click publish (221) and post scheduling (222), which read the stored token.
- See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) "Data Models" (linkedin_connections), "API Routes",
  and "Integrations" (LinkedIn).

## Open questions / known gaps

- Shared Wave 4 gap: pending real LinkedIn app credentials + a connected account for end-to-end
  verification. Type-check, lint, and build pass and the code-quality review returned SHIP, but no
  live LinkedIn app is configured, so consent, the token exchange, and userinfo are not verified
  against LinkedIn (220-AC-11). Tracked in [STATUS.md](../STATUS.md).
- Architectural constraint: self-serve LinkedIn apps receive **no** programmatic refresh token
  (those are MDP-partner-only). Access tokens last 60 days; renewal means the member re-runs the
  consent flow. The UI surfaces an expires-soon warning and a Reconnect button rather than
  silently refreshing (`components/dashboard/linkedin-connection.tsx:102-119`).
- LinkedIn-as-login requires server config that lives outside the repo: `SUPABASE_SERVICE_ROLE_KEY`
  must be set (account resolution + magic-link session minting), and the Supabase email template
  must point its confirmation link at `/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}`
  with email confirmations enabled. Without the service-role key, connect degrades to attach-only
  and cannot sign returning users into an existing account.
- Auto-login matches on `linkedin_sub` only (OAuth-verified). An email-only collision (no `sub`
  match but the LinkedIn email already belongs to another account) is not auto-resolved: the
  email-link step fails and is logged; the connection is still saved. Rare, since every connection
  stores its `sub` so returning members match by `sub`.
- Edge: signing into an existing account requires that account to have a usable (confirmed) email;
  if not, the switch fails with `?linkedin=signin-failed` rather than proceeding.
