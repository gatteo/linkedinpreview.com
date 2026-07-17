# 241 — Chrome Extension (backlog)

> Status: PLANNED · Wave: 6 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A Chrome extension that adds a preview overlay on LinkedIn.com. Users can format text with Unicode styles, see a live preview of their post, and save posts from their feed to the dashboard for inspiration. The popup gives quick access to the full editor, and the extension syncs with the user's Supabase account.

## Why it is parked

- Wave 6 (Advanced & Scale) in [`../ROADMAP.md`](../ROADMAP.md) has not started, and it depends on all previous waves. It is a separate distribution surface (Chrome Web Store) with its own build and review overhead.

## What would make it worth promoting

- Wave 6 being scheduled, plus demand signal that users want to compose / preview without leaving LinkedIn.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `241-AC-K` IDs when the feature is built:

- Extension installs from the Chrome Web Store.
- Preview overlay appears when composing a post on LinkedIn.
- A Unicode formatting toolbar is available in the overlay.
- Users can save posts from their feed to the dashboard.
- Extension syncs with the user's Supabase account.
- Popup provides quick access to the full editor.

## Dependencies

- The shared preview component from the web app (021) reused in the overlay.
- Anonymous auth (061) / Supabase session sharing for sync.
- Chrome Extension Manifest V3 content script and messaging plumbing.
