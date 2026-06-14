# Backlog — planned & parked work

This folder holds **features whose wave has not started yet**: the planned waves (3-6) and the SEO
template track. It is the counterpart to [`../features/`](../features/), which holds the features of
sections already underway (Foundation + Waves 0-2), SHIPPED or PARTIAL.

**Placement rule:** a feature lives in `backlog/` until work on its wave begins; at that point it
graduates to `../features/`. See the rules block at the top of
[`../ROADMAP.md`](../ROADMAP.md). Every feature spec - here or in `features/` - appears in exactly
one section of the roadmap.

## Conventions

- **Filename**: `NNN-slug.md`, reusing the product feature ID (e.g. `210-carousel-creator.md`).
  IDs are stable across the backlog → ticket → feature lifecycle.
- **Status**: `PLANNED`. Entries may be vaguer than feature specs — acceptance criteria here are
  "sketched", not binary.
- **Wave**: each entry points at its wave in [`../ROADMAP.md`](../ROADMAP.md).

## Lifecycle

1. An idea lives here while it is on the roadmap but unbuilt.
2. When work starts, open a ticket in [`../tickets/`](../tickets/) (`T-NNN`) that references this
   entry and proposes a concrete, shippable delta.
3. When the work ships, **graduate** the entry: move it to [`../features/`](../features/) as a
   spec with stable `NNN-AC-K` acceptance criteria checked against the code (file it under
   [`../features/completed/`](../features/completed/) if every AC is met), add a
   [`../CHANGELOG.md`](../CHANGELOG.md) line, and update [`../STATUS.md`](../STATUS.md).

## Index

Grouped by wave (see [`../ROADMAP.md`](../ROADMAP.md)).

- **SEO parallel track** — [`007-hook-template-library.md`](007-hook-template-library.md),
  [`008-cta-template-library.md`](008-cta-template-library.md),
  [`009-post-structure-templates.md`](009-post-structure-templates.md)
- **Wave 3 — Carousel** — [`210-carousel-creator.md`](210-carousel-creator.md),
  [`211-carousel-templates.md`](211-carousel-templates.md),
  [`212-carousel-export.md`](212-carousel-export.md)
- **Wave 4 — Scheduling & Publishing** — [`220-linkedin-oauth.md`](220-linkedin-oauth.md),
  [`221-one-click-publish.md`](221-one-click-publish.md),
  [`222-post-scheduling.md`](222-post-scheduling.md),
  [`223-content-calendar.md`](223-content-calendar.md),
  [`224-best-time-to-post.md`](224-best-time-to-post.md)
- **Wave 5 — Analytics** — [`230-analytics-dashboard.md`](230-analytics-dashboard.md)
- **Wave 6 — Advanced & Scale** — [`041-audio-video-post-source.md`](041-audio-video-post-source.md),
  [`240-team-collaboration.md`](240-team-collaboration.md),
  [`241-chrome-extension.md`](241-chrome-extension.md),
  [`242-content-repurposing.md`](242-content-repurposing.md),
  [`243-inspiration-library.md`](243-inspiration-library.md),
  [`244-integrations.md`](244-integrations.md)
