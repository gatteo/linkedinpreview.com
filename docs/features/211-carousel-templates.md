# Feature 211: Carousel Templates

## Goal

Give users a head start with pre-designed carousel templates they can customize.

## Description

A library of 10+ pre-designed carousel templates covering common LinkedIn carousel types (tips list, step-by-step guide, comparison, data highlights, storytelling, etc.). Users pick a template, customize the content and colors, and export. Templates apply the user's branding automatically.

## Acceptance Criteria

- [ ] 10+ templates available covering different carousel types
- [ ] Template picker with thumbnails and categories
- [ ] Selecting a template populates the carousel editor with pre-filled slides
- [ ] User's branding is auto-applied to the template
- [ ] All template content is editable after selection

## Technical Notes

- Template data stored as static config (not database)
- Each template: `{ id, name, category, thumbnail, slides: SlideTemplate[] }`
- Template picker UI: grid of template thumbnails with category filter
- On selection, populate the carousel editor (210) with the template's slide structure
- User's branding colors/fonts applied as defaults, overridable per carousel
- Templates should be designed to look professional with minimal customization
