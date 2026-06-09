# Feature 220: LinkedIn OAuth

## Goal

Connect the user's LinkedIn account to enable direct publishing and scheduling.

## Description

LinkedIn OAuth 2.0 integration that lets users connect their LinkedIn account. This is the prerequisite for one-click publish (221), scheduling (222), and analytics (230). The OAuth flow replaces or upgrades the anonymous auth session. Users who don't connect LinkedIn can still use all other features.

## Acceptance Criteria

- [ ] User can initiate LinkedIn OAuth flow from Settings page
- [ ] OAuth callback handles token exchange and storage
- [ ] LinkedIn profile info (name, avatar) is fetched and displayed
- [ ] Connected status is shown on the Settings page
- [ ] User can disconnect their LinkedIn account
- [ ] Existing anonymous session is preserved (upgraded, not replaced)
- [ ] Tokens are stored securely (encrypted at rest)

## Technical Notes

- LinkedIn OAuth 2.0 three-legged flow
- Required scopes: `w_member_social` (post on behalf), `r_liteprofile` (basic profile), `r_organization_social` (if supporting company pages later)
- OAuth callback route: `/api/auth/linkedin/callback`
- Store LinkedIn access token and refresh token in Supabase (encrypted)
- Link LinkedIn identity to existing anonymous Supabase user (upgrade, not replace)
- LinkedIn API approval must be applied for during Wave 2
- Token refresh handling for long-lived sessions
- UI: "Connect LinkedIn" button on Settings page, with connection status indicator
