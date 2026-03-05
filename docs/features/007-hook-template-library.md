# Feature 007: Hook Template Library

## Goal

Drive organic search traffic by providing a public library of proven LinkedIn hook templates that users can browse and use directly in the editor.

## Description

A public SEO page at `/templates/hooks` listing 50+ proven LinkedIn hook templates. Templates are categorized by type (question, statistic, bold statement, story opener, contrarian take, etc.). Each template shows the hook pattern, an example, and a CTA to open it in the editor. The page is statically generated for SEO performance.

## Acceptance Criteria

- [ ] Page renders 50+ hook templates organized by category
- [ ] Users can filter/browse by category
- [ ] Each template has a "Try in editor" CTA that opens the editor with the hook pre-filled
- [ ] Page is statically generated (no client-side data fetching)
- [ ] Full SEO metadata (title, description, OG, canonical, JSON-LD)
- [ ] Page loads under 1s on mobile
- [ ] Added to sitemap and main navigation

## Technical Notes

- Statically generated page under `app/(main)/templates/hooks/`
- Template data stored as a static config file (not MDX, not database)
- Each template: `{ id, category, pattern, example, description }`
- Categories rendered as filterable tabs or sections
- CTA links to `/?content=[encoded]` to pre-fill the homepage editor
- Must include `generateMetadata()` with title, description, OG tags, and canonical URL
- Add JSON-LD structured data (ItemList schema)
- Add to sitemap
