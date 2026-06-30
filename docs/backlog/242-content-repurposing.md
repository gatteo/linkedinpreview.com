# 242 — Content Repurposing (backlog)

> Status: PLANNED · Wave: 6 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- AI-powered conversion of existing LinkedIn posts into other content formats: carousels (using 210), Twitter / X threads, newsletter sections, or blog outlines. Users select a post and choose a target format, and the AI restructures the content while preserving the original.

## Why it is parked

- Wave 6 (Advanced & Scale) in [`../ROADMAP.md`](../ROADMAP.md) has not started, and the carousel target format depends on the carousel creator (210) from Wave 3.

## What would make it worth promoting

- Wave 6 being scheduled, plus the carousel creator (210) being available so carousel output has a destination.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `242-AC-K` IDs when the feature is built:

- User can select "Repurpose" from a post's actions.
- At least 3 target formats are available (carousel, thread, newsletter).
- AI converts the content to the selected format.
- Carousel output opens in the carousel editor.
- Other formats create new drafts.
- The original post is preserved (not modified).

## Dependencies

- Carousel creator (210) for carousel output.
- AI generation pipeline (031) extended with a repurpose action and target format.
- Branding-aware AI (037) for context and the quick-action rate limit.
