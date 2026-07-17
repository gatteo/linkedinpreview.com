# 113 — Google Tag Manager

> Status: SHIPPED · Area: Feedback · Last verified: 2026-06-14
>
> Copy this file to `NNN-slug.md` and fill it in. This folder holds **only built features**
> (SHIPPED or PARTIAL). Not-yet-built ideas live in [`../backlog/`](../../backlog/). A feature
> describes a user-facing **surface**; system internals live in
> [`../ARCHITECTURE.md`](../../ARCHITECTURE.md).

## What

- The Google Tag Manager container is injected into the root layout so marketing/analytics tags managed
  in GTM load on every page in production. It includes both the standard async GTM script and the
  `<noscript>` iframe fallback, using the configured container id.

## Why

- Lets marketing manage third-party tags (conversion pixels, analytics) without code changes, while
  staying out of development builds.

## Acceptance (binary, testable)

- [x] 113-AC-1 The GTM container is mounted in the root layout _(verified: `app/layout.tsx:9,55` imports and renders `<GTM />` in `<body>`)_
- [x] 113-AC-2 GTM loads only in production _(verified: `components/gtm.tsx:8-10` returns null unless `process.env.NODE_ENV === 'production'`)_
- [x] 113-AC-3 Injects the async GTM script using the configured container id _(verified: `components/gtm.tsx:24-32` Script with `gtm.js?id=` and `NEXT_PUBLIC_GTM_MEASUREMENT_ID`)_
- [x] 113-AC-4 Provides the `<noscript>` iframe fallback _(verified: `components/gtm.tsx:14-22` `<noscript>` iframe to `googletagmanager.com/ns.html?id=...`)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- Component: `components/gtm.tsx`.
- Mount: `app/layout.tsx:9,55`.
- Env: `NEXT_PUBLIC_GTM_MEASUREMENT_ID` (via `env.mjs`).

## Dependencies

- Google Tag Manager external service.
- Independent of PostHog (112), which is a separate analytics path.

## Open questions / known gaps

- The env var is named `NEXT_PUBLIC_GTM_MEASUREMENT_ID`; GTM uses a container id (`GTM-XXXX`), not a
  "measurement id" (which is GA4 terminology). Naming is misleading but functional.
- If the container id is unset in production the script still renders with an empty id; there is no
  empty-id guard like the feedback components have.
