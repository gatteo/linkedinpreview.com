# T-016 - One-click publish to LinkedIn

> Status: in-review · Touches: [`../features/221-one-click-publish.md`](../features/221-one-click-publish.md) · Opened: 2026-06-15 · Closed:

## Goal

- Add a Publish control in the dashboard editor that posts the current draft to the connected
  member's LinkedIn profile (text + image/video), flips the draft to "published", and stores the
  live post URL.

## Context

- Wave 4: feature 221 graduated from `backlog/` to `features/`. With LinkedIn OAuth (220, T-015) in
  place, the editor can now publish directly instead of relying on copy/paste.

## Plan

- Add the Posts API client + media upload (`lib/linkedin/posts.ts`) and the TipTap->LinkedIn text
  serializer (`lib/linkedin/serialize.ts`).
- Add `app/api/linkedin/publish/route.ts` (+ schema): Zod, session, live-connection check, atomic
  `claim_draft_for_publish`, `maxDuration = 60`.
- Add `markDraftPublished` and the editor `PublishControls` split button with a confirm dialog.

## Acceptance (binary, testable)

- [x] T-016-AC-1 Publish control appears only when LinkedIn can publish; otherwise hidden or pointing to Settings; publish is confirmed first (-> 221-AC-1..3).
- [x] T-016-AC-2 The route validates Zod + session + connection, serializes the post, enforces empty/3000-char limits, and uploads media (-> 221-AC-4..7).
- [x] T-016-AC-3 On success the draft becomes "published" with the live URL; double-publish is prevented; failures surface clear messages and stay retryable (-> 221-AC-8..10).
- [ ] T-016-AC-4 A real post (with media) actually appears on the connected member's profile (-> 221-AC-11; blocked on live LinkedIn app credentials + a connected account).

## On completion

- Folds into [`221-one-click-publish.md`](../features/221-one-click-publish.md) as 221-AC-1..10
  (221-AC-11 remains open; feature stays PARTIAL).
- Changelog: 2026-06-15 Wave 4 entry (one-click publish).

## Notes / open questions

- The created post URN is read from the `x-restli-id` header; a missing URN is treated as a failure
  to avoid recording a phantom success.
