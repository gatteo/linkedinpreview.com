# 002 — Blog

> Status: SHIPPED · Area: Public · Last verified: 2026-06-14

- A blog backed by MDX files compiled through Contentlayer. The listing page at `/blog` shows a search box that filters posts by title and a grid of post cards. Each post page at `/blog/[slug]` renders the MDX body, a header with author avatar/name, publish date and tags, related articles, share icons, an article-helpfulness widget, and a top-of-page scroll progress indicator. (Reading-time display was dropped from scope; it is not a requirement.)

## Why

- The blog drives organic search traffic for LinkedIn formatting how-tos and funnels readers into the tool. MDX lets the author write rich tutorial content with custom components.

## Acceptance (binary, testable)

- [x] 002-AC-1 Blog posts are sourced from MDX via Contentlayer (`BlogPost` document type, `blog/**/*.mdx`) _(verified: `contentlayer.config.ts:7-54`; content in `contents/blog/*.mdx`)_
- [x] 002-AC-2 The listing page renders a title-based search/filter over posts _(verified: `components/blog/filtered-posts.tsx:26,71-83`; wired in `app/(main)/blog/page.tsx:50-52`)_
- [x] 002-AC-3 A post page renders the MDX body for the post _(verified: `app/(main)/blog/[slug]/page.tsx:170`; `components/mdx-content.tsx:25` via `Mdx`)_
- [x] 002-AC-4 A post page shows author info (avatar + name) plus date and tags _(verified: `components/blog/post-header.tsx:32-55`)_
- [x] 002-AC-5 A post page shows related articles ranked by shared tags with recent-post fallback _(verified: `components/blog/related-articles.tsx:11-53`; rendered at `app/(main)/blog/[slug]/page.tsx:176`)_
- [x] 002-AC-6 A post page shows a scroll progress indicator _(verified: `components/scroll-indicator.tsx:5-16`; rendered at `app/(main)/blog/[slug]/page.tsx:178`)_

## Implementation

- Listing page + metadata + canonical: `app/(main)/blog/page.tsx:19-55`.
- Post page (metadata, OG/Twitter images, Article + Breadcrumb + optional HowTo JSON-LD, MDX render, footer, helpfulness, related, scroll indicator): `app/(main)/blog/[slug]/page.tsx`.
- Data access (sort by createdAt, map to preview shape): `lib/blog.ts:13-40`.
- Search/filter client component with URL sync and PostHog tracking: `components/blog/filtered-posts.tsx`.
- MDX rendering and TOC: `components/mdx-content.tsx`, `components/mdx/mdx.tsx`, `lib/blog.ts:42-50` (`getTOC`).
- Author records resolved as a computed nested field: `contentlayer.config.ts:49-53`, `config/blog.ts`.
- Static params for all posts: `app/(main)/blog/[slug]/page.tsx:24-29`.

## Dependencies

- 003 — RSS feed (consumes `getAllBlogPosts`).
- 006 — SEO infrastructure (Article + BreadcrumbList + HowTo JSON-LD live on post pages).

## Open questions / known gaps

- Search filters on title only; body/summary text is not matched (`components/blog/filtered-posts.tsx:26`). This is acceptable for now and not a blocking gap.
