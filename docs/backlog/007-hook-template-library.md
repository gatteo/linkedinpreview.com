# 007 — Hook Template Library (backlog)

> Status: PLANNED · Wave: SEO parallel track · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A public SEO page at `/templates/hooks` listing 50+ proven LinkedIn hook templates, categorized by type (question, statistic, bold statement, story opener, contrarian take, etc.). Each template shows the hook pattern, an example, and a "Try in editor" CTA. The page is statically generated for SEO performance.

## Why it is parked

- Part of the SEO parallel track in [`../ROADMAP.md`](../ROADMAP.md), which has no hard dependencies but is not yet sequenced against the shipped waves. Organic-traffic pages are deferred until there is bandwidth alongside core product work.

## What would make it worth promoting

- A decision to invest in organic-search acquisition, or demand signal that template content drives meaningful top-of-funnel traffic and editor activation.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `007-AC-K` IDs when the feature is built:

- Page renders 50+ hook templates organized by category.
- Users can filter / browse by category.
- Each template has a "Try in editor" CTA that opens the editor with the hook pre-filled.
- Page is statically generated (no client-side data fetching).
- Full SEO metadata (title, description, OG, canonical, JSON-LD ItemList).
- Page loads under 1s on mobile.
- Added to sitemap and main navigation.

## Dependencies

- Static page under `app/(main)/templates/hooks/` with template data as a static config file (`{ id, category, pattern, example, description }`).
- CTA links to `/?content=[encoded]` to pre-fill the homepage editor.
- SEO infrastructure (006) for metadata and sitemap conventions.
