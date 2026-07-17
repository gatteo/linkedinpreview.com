# 009 — Post Structure Templates (backlog)

> Status: PLANNED · Wave: SEO parallel track · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A public SEO page at `/templates/structures` listing 15+ full post structure frameworks (AIDA, PAS, Listicle, Before/After, How-To, etc.). Each template shows the framework name, a structure breakdown, a full example post, and a "Try in editor" CTA. Statically generated.

## Why it is parked

- Part of the SEO parallel track in [`../ROADMAP.md`](../ROADMAP.md). It reuses the template-page layout from 007 and 008, so it is best sequenced after those and waits on the same go-decision.

## What would make it worth promoting

- A decision to invest in organic-search acquisition, ideally after 007 and 008 establish the shared template-page pattern.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `009-AC-K` IDs when the feature is built:

- Page renders 15+ post structure templates.
- Each template shows framework name, structure breakdown, and a full example.
- Each template has a "Try in editor" CTA.
- Page is statically generated.
- Full SEO metadata (title, description, OG, canonical, JSON-LD ItemList or HowTo).
- Reuses the shared layout and filter components from 007 and 008.

## Dependencies

- Hook template library (007) and CTA template library (008) for shared layout and filter components.
- Static config data file (`{ id, name, description, structure, example, category }`).
- SEO infrastructure (006) for metadata and sitemap conventions.
