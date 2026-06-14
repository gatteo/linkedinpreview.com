# 211 — Carousel Templates (backlog)

> Status: PLANNED · Wave: 3 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- A library of 10+ pre-designed carousel templates covering common LinkedIn carousel types (tips list, step-by-step guide, comparison, data highlights, storytelling, etc.). Users pick a template, customize the content and colors, and export. Templates apply the user's branding automatically.

## Why it is parked

- Wave 3 (Carousel & Visual Content) in [`../ROADMAP.md`](../ROADMAP.md) has not started, and this builds directly on the carousel creator (210), which is not yet built.

## What would make it worth promoting

- The carousel creator (210) being in progress or shipped, since templates populate that editor.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `211-AC-K` IDs when the feature is built:

- 10+ templates available covering different carousel types.
- Template picker with thumbnails and categories.
- Selecting a template populates the carousel editor with pre-filled slides.
- The user's branding is auto-applied to the template.
- All template content is editable after selection.

## Dependencies

- Carousel creator (210) - templates populate that editor.
- Branding settings (080-090) for default colors and fonts.
- Static template config data (`{ id, name, category, thumbnail, slides }`).
