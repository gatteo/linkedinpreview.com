# 008 — CTA Template Library (backlog)

> Status: PLANNED · Wave: SEO parallel track · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A public SEO page at `/templates/ctas` listing 30+ proven LinkedIn call-to-action endings, categorized by intent (engagement, link click, follow, comment, share, etc.). Each template shows the CTA pattern, an example, and a "Try in editor" CTA. Statically generated.

## Why it is parked

- Part of the SEO parallel track in [`../ROADMAP.md`](../ROADMAP.md). It shares layout and components with the hook template library (007) and is best built alongside it, so it waits on the same go-decision.

## What would make it worth promoting

- A decision to invest in organic-search acquisition, ideally bundled with 007 so the shared template-page components are built once.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `008-AC-K` IDs when the feature is built:

- Page renders 30+ CTA templates organized by category.
- Users can filter / browse by category.
- Each template has a "Try in editor" CTA.
- Page is statically generated.
- Full SEO metadata (title, description, OG, canonical, JSON-LD ItemList).
- Reuses the shared layout and filter components from 007.

## Dependencies

- Hook template library (007) for the shared page layout and filter components.
- Static config data file (`{ id, category, pattern, example, description }`).
- SEO infrastructure (006) for metadata and sitemap conventions.
