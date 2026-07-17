# 221 - One-Click Publish

> Status: PARTIAL · Area: Editor · Last verified: 2026-06-15
>
> Built feature (PARTIAL: open gaps). This folder holds **only built features** (SHIPPED or
> PARTIAL). Not-yet-built ideas live in [`../backlog/`](../backlog/). A feature describes a
> user-facing **surface**; system internals live in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## What

- A "Publish" control in the dashboard editor that posts the current draft directly to the user's
  LinkedIn profile via the LinkedIn Posts API. It is a split control: the primary button publishes
  now (after a confirmation dialog), and a dropdown offers "Schedule for later" (222). When
  LinkedIn is connected the post is serialized to LinkedIn-ready text, any image/video attachment
  is uploaded, and the post is created. On success the draft status becomes "published", the live
  post URL is stored, and the control flips to a "View on LinkedIn" link. When the integration is
  unconfigured the control is hidden; when configured but not connected it points the user to
  Settings.

## Why

- Removes the copy/paste step entirely - the highest-friction part of the existing tool - so a
  finished draft reaches LinkedIn in one click without leaving the editor.

## Acceptance (binary, testable)

- [x] 221-AC-1 A Publish control is shown in the editor when LinkedIn can publish (configured + connected + not expired) _(verified: `components/dashboard/publish-controls.tsx:174-218` Publish split button; gated by `canPublish` from `hooks/use-linkedin-status.ts:39`; mounted at `components/dashboard/dashboard-editor.tsx:226`)_
- [x] 221-AC-2 The control is hidden when unconfigured and replaced with a "Connect LinkedIn" link when configured-but-not-connected _(verified: `components/dashboard/publish-controls.tsx:157-160` returns null when not configured; `:163-172` "Connect LinkedIn" link to Settings when not connected)_
- [x] 221-AC-3 Publishing is confirmed before it fires _(verified: `components/dashboard/publish-controls.tsx:221-243` AlertDialog "Publish to LinkedIn now?")_
- [x] 221-AC-4 The publish route validates input (Zod), checks the session, and requires a live (configured, connected, unexpired) connection _(verified: `app/api/linkedin/publish/route.ts:29-35` `bodySchema.safeParse`, `:37-46` session check, `:49-61` connection + `isExpired` checks; schema `app/api/linkedin/publish/route.schema.ts`)_
- [x] 221-AC-5 The post body is serialized to the same LinkedIn-ready Unicode text the editor's Copy produces _(verified: `app/api/linkedin/publish/route.ts:69` `tiptapToLinkedInText`; helper `lib/linkedin/serialize.ts:8-12` reuses `components/tool/utils` `processNodes`/`toPlainText`)_
- [x] 221-AC-6 Empty posts and posts over the 3000-char LinkedIn limit are rejected _(verified: `app/api/linkedin/publish/route.ts:70-84` empty + `LINKEDIN_MAX_POST_CHARS` checks; limit at `config/linkedin.ts:37`)_
- [x] 221-AC-7 Image/video attachments are uploaded and attached to the published post _(verified: `lib/linkedin/posts.ts:137-163` `publishMemberPost` uploads media first via `uploadImage` `:45` / `uploadVideo` `:69` then sets `content.media`)_
- [x] 221-AC-8 On success the draft status updates to "published" and the live LinkedIn URL is stored and linked _(verified: route `app/api/linkedin/publish/route.ts:116` `markDraftPublished`; `lib/supabase/drafts.ts:231-244` writes status/`published_at`/`linkedin_post_urn`/`linkedin_post_url`; editor flips to "View on LinkedIn" `components/dashboard/publish-controls.tsx:146-155`)_
- [x] 221-AC-9 A double publish (manual + cron, or two clicks) cannot post twice _(verified: `app/api/linkedin/publish/route.ts:89-107` atomic `claim_draft_for_publish` RPC; `supabase/migrations/010_post_scheduling.sql:62-77` claim guarded on `linkedin_post_urn is null` + 10-min lock; the post URN is read from the `x-restli-id` header and a missing URN is treated as a failure, `lib/linkedin/posts.ts:178-181`)_
- [x] 221-AC-10 API failures surface clear messages (expired token, rate limit, generic failure) and release the claim so the post is retryable _(verified: `app/api/linkedin/publish/route.ts:118-145` maps `LinkedInApiError` 401/429, releases the lock; client toasts at `components/dashboard/publish-controls.tsx:89-104`)_
- [ ] 221-AC-11 A real post actually appears on the connected member's LinkedIn profile, including uploaded media _(gap: pending real LinkedIn app credentials + a connected account for end-to-end verification - see [STATUS.md](../STATUS.md))_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- Editor UI: `components/dashboard/publish-controls.tsx` (mounted at `components/dashboard/dashboard-editor.tsx:226`).
- Route: `app/api/linkedin/publish/route.ts` (`maxDuration = 60` at `:12`) + `route.schema.ts`.
- LinkedIn Posts API + media upload: `lib/linkedin/posts.ts` (`publishMemberPost` `:137`, `uploadImage` `:45`, `uploadVideo` `:69`, `postUrlFromUrn` `:129`, `LinkedInApiError` `:10`).
- Serialization: `lib/linkedin/serialize.ts`.
- Draft state writes: `lib/supabase/drafts.ts` (`markDraftPublished` `:231`); current-draft hook `hooks/use-current-draft.ts` (`flush` `:215`, `applyPublished` `:276`).
- Idempotency RPC: `supabase/migrations/010_post_scheduling.sql:62-77` `claim_draft_for_publish`.

## Dependencies

- LinkedIn OAuth (220) for the connection and encrypted token.
- Post statuses (063) for the `published`/`failed` states; dashboard editor (066) for the action.
- Post scheduling (222) shares this route's publish path (used by the cron publisher).
- See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) "API Routes" and "Integrations" (LinkedIn).

## Open questions / known gaps

- Shared Wave 4 gap: pending real LinkedIn app credentials + a connected account for end-to-end
  verification. Type-check, lint, and build pass and the code-quality review returned SHIP, but no
  live LinkedIn app is configured, so actual post creation and media upload are not verified
  against LinkedIn (221-AC-11). Tracked in [STATUS.md](../STATUS.md).
