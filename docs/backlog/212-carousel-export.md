# 212 — Carousel Export (backlog)

> Status: PLANNED · Wave: 3 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- Export of a completed carousel as PDF (LinkedIn's native document format), PNG (individual slide images), or ZIP (all slides as separate PNGs). The export renders each slide at the correct resolution for LinkedIn's document viewer.

## Why it is parked

- Wave 3 (Carousel & Visual Content) in [`../ROADMAP.md`](../ROADMAP.md) has not started. Export only makes sense once carousels can be created (210), so it follows that feature.

## What would make it worth promoting

- The carousel creator (210) being in progress or shipped, so there is carousel content to export.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `212-AC-K` IDs when the feature is built:

- User can export as PDF.
- User can export as PNG (individual slides).
- User can export as ZIP (all slides).
- Exported files are at the correct resolution for LinkedIn.
- Loading / progress indicator during export.
- Toast confirmation on successful export.

## Dependencies

- Carousel creator (210) - provides the slides to export.
- Export tooling: PDF (jsPDF / pdf-lib / Puppeteer), PNG (html2canvas / dom-to-image), ZIP (JSZip).
- Confirmation of current LinkedIn document dimensions (e.g. 1080x1080 or 1080x1350).
