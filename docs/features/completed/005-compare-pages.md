# 005 — Compare Pages

> Status: SHIPPED · Area: Public · Last verified: 2026-06-14

## What

- A comparisons section. The landing page at `/compare` shows a hero plus a responsive grid of competitor cards (one per comparison), each linking to a detail page. Each detail page at `/compare/[slug]` shows breadcrumbs, a "Comparison" badge, the comparison title and summary, MDX body content, a BreadcrumbList JSON-LD block, and a scroll progress indicator. Detail pages are statically generated for every comparison.

## Why

- Captures high-intent "alternative to X" search traffic and converts comparison-shoppers by positioning the free tool against paid competitors.

## Acceptance (binary, testable)

- [x] 005-AC-1 Comparisons are sourced from MDX via Contentlayer (`Comparison` type, `compare/**/*.mdx`) _(verified: `contentlayer.config.ts:86-105`; content in `contents/compare/*.mdx`)_
- [x] 005-AC-2 The compare landing renders a grid of competitor cards linking to each detail page _(verified: `app/(main)/compare/page.tsx:71-95`)_
- [x] 005-AC-3 Detail pages render breadcrumbs _(verified: `app/(main)/compare/[slug]/page.tsx:99-105` via `components/breadcrumbs.tsx`)_
- [x] 005-AC-4 Detail pages render a badge/label and the MDX body _(verified: badge at `app/(main)/compare/[slug]/page.tsx:110-112`; MDX body via `Content` at `app/(main)/compare/[slug]/page.tsx:120-124`)_
- [x] 005-AC-5 Detail pages render a scroll progress indicator _(verified: `app/(main)/compare/[slug]/page.tsx:126` `<ScrollIndicator />`)_
- [x] 005-AC-6 Detail pages are statically generated for every comparison slug _(verified: `app/(main)/compare/[slug]/page.tsx:19-24` `generateStaticParams`)_
- [x] 005-AC-7 Detail pages emit a BreadcrumbList JSON-LD block _(verified: `app/(main)/compare/[slug]/page.tsx:70-93,97`)_

## Implementation

- Landing page (hero, CTA, card grid, summary truncation): `app/(main)/compare/page.tsx:44-100`.
- Detail page (static params, metadata + canonical + OG, breadcrumb schema, header/badge, MDX content, scroll indicator): `app/(main)/compare/[slug]/page.tsx`.
- Data access and shape (sort newest-first, map to `ComparisonEntry`): `lib/compare.ts:17-35`.
- Routes: `config/routes.ts:19-20` (`Compare`, `ComparePost`).

## Dependencies

- 002/004 — shares the MDX render pipeline (`components/mdx-content.tsx`, `components/mdx/mdx.tsx`) and `components/scroll-indicator.tsx`.
- 006 — SEO infrastructure (compare pages included in sitemap, `app/sitemap.ts:30-33`).

## Open questions / known gaps

- One comparison source file is a fixture (`contents/compare/testfeed.mdx`); confirm whether it should ship or be excluded from production.
- `competitorUrl` is captured in the schema and `ComparisonEntry` but is not rendered as an outbound link on either the landing cards or the detail header.
