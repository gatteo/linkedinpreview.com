# 221 — One-Click Publish (backlog)

> Status: PLANNED · Wave: 4 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A "Publish to LinkedIn" button in the editor that posts the current draft directly to the user's LinkedIn profile via the LinkedIn API. After publishing, the draft status updates to "published" with a link to the live post. Image and video attachments are included.

## Why it is parked

- Wave 4 (Scheduling & Publishing) in [`../ROADMAP.md`](../ROADMAP.md) has not started, and it depends on LinkedIn OAuth (220), which is not yet built.

## What would make it worth promoting

- LinkedIn OAuth (220) being shipped and API write access (`w_member_social`) confirmed.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `221-AC-K` IDs when the feature is built:

- "Publish to LinkedIn" button is visible in the editor when LinkedIn is connected.
- Button is hidden / disabled when LinkedIn is not connected.
- Post is published to the user's LinkedIn profile.
- Draft status updates to "published" after a successful publish.
- The LinkedIn post URL is stored and linked from the draft.
- Image / video attachments are included in the published post.
- Clear error messages for API failures, with a confirmation dialog before publishing.

## Dependencies

- LinkedIn OAuth (220) for the access token and write scope.
- Post statuses (063) and the dashboard editor (066) for status updates and the publish action.
- Server-side publish route plus LinkedIn media asset upload for attachments.
