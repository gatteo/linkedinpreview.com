# 112 — PostHog Analytics

> Status: SHIPPED · Area: Feedback · Last verified: 2026-07-19

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
- [x] 112-AC-3 Toolbar/editor actions, copies, and AI usage emit events _(verified: copies `components/tool/editor-panel.tsx:277` `post_copied`; toolbar `components/tool/toolbar.tsx:68` `formatting_applied`; AI `components/ai-chat/ai-generate-sheet.tsx:73` `ai_generation_completed`)_
- [x] 112-AC-4 Event names use snake*case *(verified: representative names `feedback_button_clicked` `feedback-fab.tsx:14`, `article_helpful_voted` `article-helpfulness.tsx:30`, `ai_generation_started` `ai-generate-sheet.tsx:134`; a grep for capitalized event identifiers returns no matches)\_
- [x] 112-AC-5 A reusable click-tracking wrapper exists _(verified: `components/tracking/track-click.tsx:6-19` `TrackClick` calls `posthog.capture(event, properties)`)_
- [x] 112-AC-6 Page views are tracked _(verified: `components/tracking/posthog-page-view.tsx:11-23` fires a deliberate snake_case `page_viewed` event in a `useEffect` keyed on `[pathname, searchParams]`; mounted app-wide in the root layout `app/layout.tsx:57-59` inside a `<Suspense fallback={null}>` boundary)_
- [x] 112-AC-7 A copy of part of the post is distinguishable from a copy of the whole post _(verified: `components/tool/editor-panel.tsx:320` emits `post_partial_copied` with `content_length`, on the branch that does not reach `post_copied` at `:277`)_
- [x] 112-AC-8 An undone clear is measurable separately from the clear itself _(verified: `components/tool/editor-panel.tsx:429` `post_cleared` with `had_media` and `char_count`; `:425` `post_clear_undone` with `had_media`, fired from the toast's Undo action)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note, and
> the feature's status drops to PARTIAL.

## Implementation

- Init: `instrumentation-client.ts` (production-only, `/ingest` host, `capture_exceptions: true`).
- Exception noise filter: `instrumentation-client.ts` passes a `before_send` hook that drops `$exception` events which are not ours - a value denylist (`ResizeObserver loop`, `Script error.`, the Outlook SafeLinks `Object Not Found Matching Id` crawler probe, `CustomEvent captured as exception`) plus any exception whose stack frames are all `<anonymous>` or from a non-first-party origin (`chrome-extension:`/`moz-extension:` and anything not served from `linkedinpreview.com` or the current host). Frameless throws and bundler-internal frames are kept.
- Error boundaries: `app/global-error.tsx` (root layout failures) and `app/(main)/error.tsx` (public pages) report the error to PostHog and offer a hard reload, which refetches the current build manifest and recovers a stale-deploy chunk mismatch.
- Proxy rewrites: `next.config.mjs:25-38` plus `skipTrailingSlashRedirect`.
- Reusable wrapper: `components/tracking/track-click.tsx`.
- App-wide pageviews: `components/tracking/posthog-page-view.tsx` emits `page_viewed` on every route change (deps `[pathname, searchParams]`), mounted in `app/layout.tsx` inside a `<Suspense>` boundary so public pages stay statically prerendered.
- Tool editor events: `post_copied` (full post), `post_partial_copied` (a sub-range copy, no toast or
  analyze call), `post_cleared` and `post_clear_undone`, `media_added` / `media_removed`, all in
  `components/tool/editor-panel.tsx`. Tool events are a separate surface from the onboarding funnel
  dictionary in `docs/analytics/onboarding-funnel.md`.
- Event emitters (sample): `components/tool/editor-panel.tsx`, `components/tool/toolbar.tsx`, `components/tool/preview/preview-header.tsx`, `components/tool/share-dialog.tsx`, `components/ai-chat/ai-generate-sheet.tsx`, `components/dashboard/analyze/analyze-panel.tsx`, `components/blog/*`, `components/feedback/*`, `lib/post-analytics.ts`.

## Dependencies

- `posthog-js` package; env `NEXT_PUBLIC_POSTHOG_KEY`.
- Surfaces feedback events from 110 and 111.

## Open questions / known gaps

- App-wide pageviews now emit a deliberate `page_viewed` event per route change (T-013); the codebase
  does not rely on PostHog's `$pageview` autocapture for this signal.
- `ui_host` points at `eu.posthog.com`; deployment is EU-region.
