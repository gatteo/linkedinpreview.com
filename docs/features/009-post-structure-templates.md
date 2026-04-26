# Feature 009: Post Structure Templates

## Goal

Drive organic search traffic by providing a public library of full LinkedIn post frameworks with examples.

## Description

A public SEO page at `/templates/structures` listing 15+ full post structure frameworks (AIDA, PAS, Listicle, Before/After, How-To, etc.). Each template shows the framework name, structure breakdown, a full example post, and a CTA to open it in the editor. Statically generated.

## Acceptance Criteria

- [ ] Page renders 15+ post structure templates
- [ ] Each template shows framework name, structure breakdown, and full example
- [ ] Each template has a "Try in editor" CTA
- [ ] Page is statically generated
- [ ] Full SEO metadata (title, description, OG, canonical, JSON-LD)
- [ ] Shared layout components with other template libraries (007, 008)

## Technical Notes

- Statically generated page under `app/(main)/templates/structures/`
- Template data stored as a static config file
- Each template: `{ id, name, description, structure (step-by-step), example, category }`
- CTA links to the editor with the example pre-filled
- Must include `generateMetadata()` with full SEO metadata
- Add JSON-LD structured data (ItemList or HowTo schema)
- Reuse the same page layout and filter components as 007 and 008
