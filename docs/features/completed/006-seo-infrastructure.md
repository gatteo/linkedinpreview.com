# 006 — SEO Infrastructure

> Status: SHIPPED · Area: Public · Last verified: 2026-06-14

## What

- Cross-cutting SEO plumbing for the public site: a dynamic sitemap at `/sitemap.xml` covering static pages, blog posts (with images), CMS pages, and comparisons; a robots policy at `/robots.txt`; per-page Open Graph and Twitter metadata with canonical URLs; JSON-LD schemas across page types (Organization, WebSite, SoftwareApplication on the home page; Article, BreadcrumbList, and conditional HowTo on blog posts; BreadcrumbList on compare pages); and noindex/nofollow on private surfaces (dashboard, embed).

## Why

- Maximizes organic discoverability and rich-result eligibility for the public marketing/content pages while keeping app and utility surfaces out of the index.

## Acceptance (binary, testable)

- [x] 006-AC-1 A sitemap is generated at `/sitemap.xml` including home, blog, changelog, preview, compare, CMS pages, blog posts (with images), and comparisons _(verified: `app/sitemap.ts:8-36`)_
- [x] 006-AC-2 A robots policy is generated with a sitemap reference and disallows for `/api/*`, `/embed`, `/404`, `/500` _(verified: `app/robots.ts:3-15`)_
- [x] 006-AC-3 Organization, WebSite, and SoftwareApplication JSON-LD are present on the home page _(verified: `app/(main)/page.tsx:15-78`)_
- [x] 006-AC-4 Article and BreadcrumbList JSON-LD are present on blog post pages, with conditional HowTo for tutorial posts _(verified: `app/(main)/blog/[slug]/page.tsx:93-150`; HowTo helper `lib/schema.ts:12-51`)_
- [x] 006-AC-5 BreadcrumbList JSON-LD is present on compare detail pages _(verified: `app/(main)/compare/[slug]/page.tsx:70-97`)_
- [x] 006-AC-6 Public pages set canonical URLs and per-page Open Graph metadata _(verified: blog `app/(main)/blog/[slug]/page.tsx:45-82`; compare `app/(main)/compare/[slug]/page.tsx:40-59`; changelog `app/(main)/changelog/page.tsx:23-37`; base OG `config/site.ts:41-117`)_
- [x] 006-AC-7 Dashboard and embed surfaces are marked noindex/nofollow _(verified: dashboard `app/dashboard/layout.tsx:13-17`; embed `app/embed/page.tsx:5-8`; robots also disallows `/embed` `app/robots.ts:9`)_

## Implementation

- Sitemap (async, merges static + CMS + blog + compare entries, image annotations, lastModified): `app/sitemap.ts`.
- Robots: `app/robots.ts`.
- Base/default metadata (OG, Twitter, robots index:true, canonical, RSS alternate, icons, manifest): `config/site.ts:18-117`; applied in `app/layout.tsx:24-31` with `metadataBase`.
- Home JSON-LD: `app/(main)/page.tsx:14-78`.
- HowTo schema generator (only for titles starting with "how to"): `lib/schema.ts`.
- Blog Article + Breadcrumb + HowTo JSON-LD and per-page metadata: `app/(main)/blog/[slug]/page.tsx`.
- Compare Breadcrumb JSON-LD and per-page metadata: `app/(main)/compare/[slug]/page.tsx`.
- Routes used by sitemap/canonicals: `config/routes.ts`.

## Dependencies

- 001 — Landing page (host of Organization/WebSite/SoftwareApplication schemas).
- 002 — Blog (Article/BreadcrumbList/HowTo).
- 005 — Compare pages (BreadcrumbList).

## Open questions / known gaps

- HowTo schema steps are hardcoded generic step titles in `lib/schema.ts:22-35` rather than extracted from the post content, so the structured data may not match the actual article body.
- RSS alternate in metadata points at `/rss.xml` (correct) but the feed's internal `feed_url` says `/feed.xml` (see 003); no functional impact on indexing.
- `/preview` is listed in the sitemap (`app/sitemap.ts:15`) but resolves into the dashboard-style app area; confirm it should be indexable.
