# 003 — RSS Feed

> Status: SHIPPED · Area: Public · Last verified: 2026-06-14

## What

- A dynamically generated RSS feed served at `/rss.xml`. It lists every blog post (newest first) with title, link, publish date, description, and author, and returns XML with the correct `application/xml` content type. The feed is also advertised from the site metadata as an alternate type.

## Why

- Lets readers and aggregators subscribe to new blog content, and gives crawlers a machine-readable index of posts.

## Acceptance (binary, testable)

- [x] 003-AC-1 An RSS feed route is served at `/rss.xml` _(verified: `app/rss.xml/route.ts:8` GET handler)_
- [x] 003-AC-2 The feed includes all blog posts sorted newest-first _(verified: `app/rss.xml/route.ts:18-20` via `getAllBlogPosts` then sort by date desc)_
- [x] 003-AC-3 Each item carries title, absolute link, date, description, and author _(verified: `app/rss.xml/route.ts:22-30`)_
- [x] 003-AC-4 The response is returned as XML (`Content-Type: application/xml`) _(verified: `app/rss.xml/route.ts:32-36`)_
- [x] 003-AC-5 The feed is advertised from site metadata as an RSS alternate _(verified: `config/site.ts:110-115` `alternates.types['application/rss+xml']`)_

## Implementation

- Feed builder using the `rss` package, channel metadata, item mapping, and XML response: `app/rss.xml/route.ts:1-37`.
- Absolute URLs via `absoluteUrl`: `app/rss.xml/route.ts:2,24`.
- Post source: `lib/blog.ts:34-40` (`getAllBlogPosts`).

## Dependencies

- 002 — Blog (post data source).
- 006 — SEO infrastructure (alternate-type advertisement).

## Open questions / known gaps

- Channel metadata is generic/personal ("Matteo Giardino's Blog", `language: 'it-IT'`) and `feed_url` points at `/feed.xml` while the route is `/rss.xml` (`app/rss.xml/route.ts:9-16`). The feed still functions, but the self-referential `feed_url` is inconsistent with the actual path.
