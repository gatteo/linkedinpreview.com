# 004 — Changelog

> Status: SHIPPED · Area: Public · Last verified: 2026-06-14

## What

- A changelog page at `/changelog` that lists product updates newest-first. Each entry shows a date (sticky alongside the entry on desktop), a title, an optional image, and MDX-rendered body content. Entries are authored as MDX files compiled through Contentlayer.

## Why

- Communicates ongoing product progress to users and prospects, building trust and signalling an actively maintained tool.

## Acceptance (binary, testable)

- [x] 004-AC-1 Changelog entries are sourced from MDX via Contentlayer (`Changelog` type, `changelog/**/*.mdx`) _(verified: `contentlayer.config.ts:68-84`; content in `contents/changelog/*.mdx`)_
- [x] 004-AC-2 The page lists entries sorted newest-first _(verified: `lib/changelog.ts:16-17` sort by date desc; rendered at `app/(main)/changelog/page.tsx:45,67`)_
- [x] 004-AC-3 Each entry renders its title and MDX body _(verified: `app/(main)/changelog/page.tsx:83-85,99`)_
- [x] 004-AC-4 Each entry shows a date that is sticky on desktop _(verified: `app/(main)/changelog/page.tsx:71-78` `md:sticky md:top-[...]`)_
- [x] 004-AC-5 Each entry optionally renders an image when present _(verified: `app/(main)/changelog/page.tsx:87-97`; `image` is an optional field in `contentlayer.config.ts:76`)_
- [x] 004-AC-6 Entries are grouped by month/year _(verified: `lib/changelog.ts:36-59` `groupEntriesByMonth` groups newest-first entries by UTC `YYYY-MM`; rendered under a per-group `h2` heading at `app/(main)/changelog/page.tsx:69-74`, groups and entries both newest-first)_

## Implementation

- Page (hero, entry list, sticky date column, optional image, MDX body): `app/(main)/changelog/page.tsx:44-108`.
- Local date formatter (UTC, "1 January 2026"): `app/(main)/changelog/page.tsx:40-42`.
- Data access and shape: `lib/changelog.ts:21-32`.
- Month/year grouping helper (UTC, newest-first): `lib/changelog.ts:36-59` (`groupEntriesByMonth`).
- MDX render: `components/mdx/mdx.tsx` (imported at `app/(main)/changelog/page.tsx:7`).
- Page metadata + canonical: `app/(main)/changelog/page.tsx:16-38`.

## Dependencies

- 006 — SEO infrastructure (changelog is included in the sitemap, `app/sitemap.ts:15`).

## Open questions / known gaps

- None. Month/year grouping shipped via `groupEntriesByMonth` (`lib/changelog.ts`); entries render under per-month `h2` headings while the page title remains the `h1` and the sticky per-entry date column is preserved within each group.
