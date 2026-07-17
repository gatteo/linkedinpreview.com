# 112 — PostHog Analytics

> Status: SHIPPED · Area: Feedback · Last verified: 2026-06-14

## What

- Client-side product analytics via posthog-js. PostHog initializes only in production and routes all
  traffic through a same-origin `/ingest` reverse proxy (rewritten to the EU PostHog endpoints).
  Throughout the app, user actions emit snake_case events: editor/toolbar actions, copies, AI usage,
  blog interactions, feedback clicks, and more. A reusable `TrackClick` wrapper lets any element emit a
  named event on click.

## Why

- Gives the team behavioral insight into how the tool is used while keeping the analytics endpoint
  first-party (ad-blocker resilient) and out of local/dev noise.

## Acceptance (binary, testable)

- [x] 112-AC-1 PostHog initializes only in production _(verified: `instrumentation-client.ts:3-9` guards `posthog.init` with `process.env.NODE_ENV === 'production'`)_
- [x] 112-AC-2 Events are reverse-proxied through `/ingest` _(verified: `instrumentation-client.ts:5` `api_host: '/ingest'`; `next.config.mjs:25-36` rewrites `/ingest/*` to `eu-assets.i.posthog.com` and `eu.i.posthog.com`)_
- [x] 112-AC-3 Toolbar/editor actions, copies, and AI usage emit events _(verified: copies `components/tool/editor-panel.tsx:145` `post_copied`; toolbar `components/tool/toolbar.tsx:22` `formatting_applied`; AI `components/ai-chat/ai-generate-sheet.tsx:56` `ai_generation_completed`)_
- [x] 112-AC-4 Event names use snake*case *(verified: representative names `feedback_button_clicked` `feedback-fab.tsx:14`, `article_helpful_voted` `article-helpfulness.tsx:30`, `ai_generation_started` `ai-generate-sheet.tsx:134`; a grep for capitalized event identifiers returns no matches)\_
- [x] 112-AC-5 A reusable click-tracking wrapper exists _(verified: `components/tracking/track-click.tsx:6-19` `TrackClick` calls `posthog.capture(event, properties)`)_
- [x] 112-AC-6 Page views are tracked _(verified: `components/tracking/posthog-page-view.tsx:11-23` fires a deliberate snake_case `page_viewed` event in a `useEffect` keyed on `[pathname, searchParams]`; mounted app-wide in the root layout `app/layout.tsx:57-59` inside a `<Suspense fallback={null}>` boundary)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note, and
> the feature's status drops to PARTIAL.

## Implementation

- Init: `instrumentation-client.ts` (production-only, `/ingest` host, `capture_exceptions: true`).
- Proxy rewrites: `next.config.mjs:25-38` plus `skipTrailingSlashRedirect`.
- Reusable wrapper: `components/tracking/track-click.tsx`.
- App-wide pageviews: `components/tracking/posthog-page-view.tsx` emits `page_viewed` on every route change (deps `[pathname, searchParams]`), mounted in `app/layout.tsx` inside a `<Suspense>` boundary so public pages stay statically prerendered.
- Event emitters (sample): `components/tool/editor-panel.tsx`, `components/tool/toolbar.tsx`, `components/tool/preview/preview-header.tsx`, `components/tool/share-dialog.tsx`, `components/ai-chat/ai-generate-sheet.tsx`, `components/dashboard/analyze/analyze-panel.tsx`, `components/blog/*`, `components/feedback/*`, `lib/post-analytics.ts`.

## Dependencies

- `posthog-js` package; env `NEXT_PUBLIC_POSTHOG_KEY`.
- Surfaces feedback events from 110 and 111.

## Open questions / known gaps

- App-wide pageviews now emit a deliberate `page_viewed` event per route change (T-013); the codebase
  does not rely on PostHog's `$pageview` autocapture for this signal.
- `ui_host` points at `eu.posthog.com`; deployment is EU-region.
