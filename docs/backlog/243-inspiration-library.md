# 243 — Inspiration Library (backlog)

> Status: PLANNED · Wave: 6 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A browsable library of curated, high-performing LinkedIn posts organized by format (storytelling, listicle, case study, etc.). Each entry shows the post content, a format label, and analysis of what makes it effective (hook analysis, structure breakdown). Users can use a post as a template to start a new draft.

## Why it is parked

- Wave 6 (Advanced & Scale) in [`../ROADMAP.md`](../ROADMAP.md) has not started. It also needs a decision on whether it lives as a dashboard page or a public SEO page, plus the editorial effort to curate the dataset.

## What would make it worth promoting

- Wave 6 being scheduled, a placement decision (dashboard vs public SEO page), and capacity to curate and maintain the example dataset.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `243-AC-K` IDs when the feature is built:

- Library shows curated high-performing posts.
- Posts are categorized by format.
- Each post includes analysis of what makes it effective.
- User can filter / browse by category.
- "Use as template" creates a new draft with the structure pre-filled.
- Library is regularly updated with new examples.

## Dependencies

- A curated static dataset (manually selected, anonymized or attributed).
- Post format labels (064) for categorization.
- If public, SEO infrastructure (006) for metadata.
