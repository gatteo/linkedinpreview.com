# 210 — Carousel Creator (backlog)

> Status: PLANNED · Wave: 3 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A slide-based editor for creating LinkedIn carousel (document) posts. Users add / remove / reorder slides, edit text and layout per slide, and see a real-time preview of how the carousel will look on LinkedIn. Carousels are stored as drafts alongside regular posts, and the editor applies branding colors and fonts from the user's branding settings.

## Why it is parked

- Wave 3 (Carousel & Visual Content) in [`../ROADMAP.md`](../ROADMAP.md) has not started. It is the anchor feature for the wave and gates the two sibling features (211 templates, 212 export).

## What would make it worth promoting

- Wave 3 being scheduled, or demand signal that visual / document content is a priority for users.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `210-AC-K` IDs when the feature is built:

- User can create a new carousel from the dashboard.
- Slide editor supports adding, removing, and reordering slides.
- Each slide has editable text content and layout options.
- Real-time preview shows how the carousel looks on LinkedIn.
- Branding colors and fonts are applied from settings.
- Carousels are saved to Supabase as drafts.
- Mobile-responsive editor layout.

## Dependencies

- Wave 0 dashboard (060) for the host surface and drafts persistence.
- Branding settings (080-090) for colors and fonts.
- Slide data model and a canvas-rendering approach (e.g. html2canvas / dom-to-image) shared with export (212).
