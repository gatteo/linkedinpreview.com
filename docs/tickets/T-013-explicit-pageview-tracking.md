# T-013 — Explicit page-view tracking

> Status: proposed
> Touches: [`../features/112-posthog-analytics.md`](../features/112-posthog-analytics.md) · Opened: 2026-06-14

## Goal

- Track page views deliberately across routes (not just via autocapture defaults), satisfying
  112-AC-6.

## Context

- Only one manual pageview event exists (`feed-preview/preview-page-client.tsx:44`). There is no
  explicit per-route pageview instrumentation; `instrumentation-client.ts` sets no `capture_pageview`
  option. Feature 112 is PARTIAL.

## Plan

- Configure posthog-js pageview capture (App Router-aware) or add a route-change listener that fires
  a consistent `snake_case` pageview event. Keep production-only behavior.

## Acceptance (binary, testable)

- [ ] T-013-AC-1 Page views are captured on route changes app-wide (production).
- [ ] T-013-AC-2 The event name follows the `snake_case` convention used elsewhere.

## On completion

- Fold into [`../features/112-posthog-analytics.md`](../features/112-posthog-analytics.md); move to
  SHIPPED / `features/completed/` when ACs pass. Add a CHANGELOG line.
