# 111 — Article Helpfulness Widget

> Status: SHIPPED · Area: Feedback · Last verified: 2026-06-14
>
> Copy this file to `NNN-slug.md` and fill it in. This folder holds **only built features**
> (SHIPPED or PARTIAL). Not-yet-built ideas live in [`../backlog/`](../../backlog/). A feature
> describes a user-facing **surface**; system internals live in
> [`../ARCHITECTURE.md`](../../ARCHITECTURE.md).

## What

- A "Was &lt;title&gt; helpful?" widget rendered near the end of each blog post. The reader clicks Yes or
  No (thumbs up/down). The vote is remembered per-article in localStorage so the widget shows a thank-you
  state on return, a PostHog event is captured, and the Tally feedback popup opens pre-tagged with the
  vote.

## Why

- Captures lightweight per-article sentiment and routes interested readers into deeper feedback, helping
  prioritize content improvements.

## Acceptance (binary, testable)

- [x] 111-AC-1 Widget renders on blog post pages with the post title _(verified: `app/(main)/blog/[slug]/page.tsx:174` `<ArticleHelpfulness slug={slug} title={post.title} />`)_
- [x] 111-AC-2 Offers a Yes / No (thumbs up/down) choice _(verified: `components/feedback/article-helpfulness.tsx:52-63` two buttons with `ThumbsUp`/`ThumbsDown`)_
- [x] 111-AC-3 Vote is persisted per-article and shows a thank-you state on return _(verified: `components/feedback/article-helpfulness.tsx:9-22` localStorage key `fb_article_vote_<slug>`read on mount;`:46-47` renders "Thanks for your feedback!" when a vote exists)\_
- [x] 111-AC-4 A PostHog event captures the vote _(verified: `components/feedback/article-helpfulness.tsx:30-34` `posthog?.capture('article_helpful_voted', { article_slug, article_title, vote })`)_
- [x] 111-AC-5 Voting opens the Tally form tagged with the vote source _(verified: `components/feedback/article-helpfulness.tsx:36-41` `Tally.openPopup` with `source: 'article-<value>'`)_
- [x] 111-AC-6 Widget no-ops when no Tally form id is configured _(verified: `components/feedback/article-helpfulness.tsx:24` `if (!formId) return null`)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- Widget: `components/feedback/article-helpfulness.tsx`.
- Mount: `app/(main)/blog/[slug]/page.tsx:174`.
- Storage key prefix `fb_article_vote_`: `config/feedback.ts` (`storage.articleVotePrefix`).
- Depends on the Tally script (110) and PostHog (112).

## Dependencies

- 110 (shared Tally form), 112 (PostHog capture).
- 002 blog (host pages).

## Open questions / known gaps

- The vote is stored locally and emitted as a PostHog event; it is not written to a Supabase table, so
  aggregate helpfulness lives only in analytics.
