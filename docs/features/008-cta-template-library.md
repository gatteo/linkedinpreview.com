# Feature 008: CTA Template Library

## Goal

Drive organic search traffic by providing a public library of proven LinkedIn call-to-action endings.

## Description

A public SEO page at `/templates/ctas` listing 30+ proven LinkedIn CTA templates. Templates are categorized by intent (engagement, link click, follow, comment, share, etc.). Each template shows the CTA pattern, an example, and a CTA to open it in the editor. Statically generated.

## Acceptance Criteria

- [ ] Page renders 30+ CTA templates organized by category
- [ ] Users can filter/browse by category
- [ ] Each template has a "Try in editor" CTA
- [ ] Page is statically generated
- [ ] Full SEO metadata (title, description, OG, canonical, JSON-LD)
- [ ] Shared layout components with hook template library (007)

## Technical Notes

- Statically generated page under `app/(main)/templates/ctas/`
- Template data stored as a static config file
- Each template: `{ id, category, pattern, example, description }`
- CTA links to the editor with the template pre-filled
- Must include `generateMetadata()` with full SEO metadata
- Add JSON-LD structured data (ItemList schema)
- Reuse the same page layout and filter components as 007 (hook templates)
