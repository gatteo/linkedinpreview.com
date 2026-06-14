# 004 — Changelog

> Status: PARTIAL · Area: Public · Last verified: 2026-06-14

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
- [ ] 004-AC-6 Entries are grouped by month/year _(gap: entries are rendered as a flat newest-first list with a per-entry formatted date; there is no month/year grouping in `app/(main)/changelog/page.tsx:67-103` or `lib/changelog.ts` — claim is false)_

## Implementation

- Page (hero, entry list, sticky date column, optional image, MDX body): `app/(main)/changelog/page.tsx:44-108`.
- Local date formatter (UTC, "1 January 2026"): `app/(main)/changelog/page.tsx:40-42`.
- Data access and shape: `lib/changelog.ts:15-26`.
- MDX render: `components/mdx/mdx.tsx` (imported at `app/(main)/changelog/page.tsx:7`).
- Page metadata + canonical: `app/(main)/changelog/page.tsx:16-38`.

## Dependencies

- 006 — SEO infrastructure (changelog is included in the sitemap, `app/sitemap.ts:15`).

## Open questions / known gaps

- Month/year grouping is claimed but not implemented (004-AC-6). The layout is a single flat list; group headers would need to be added.
