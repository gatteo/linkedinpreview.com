# Content Guidelines

Rules for adding content under `contents/`. These exist because a March-June 2026 bulk-publishing campaign added ~165 posts that earned **zero** search impressions, which both wasted effort and risks depressing site-wide quality signals (Google's scaled-content / helpful-content systems). Read this before writing a new blog post.

## Intent rule: tool queries get tool pages, not blog posts

Every blog post we published targeting a **tool / transactional** query earned 0 lifetime impressions. Writing an article for a query where the searcher wants a _tool_ does not work.

- **Informational / how-to intent** (`how to ...`, `what is ...`, `best practices`, `examples`) -> a **blog post** under `contents/blog/`.
- **Tool / transactional intent** (formatter, editor, generator, checker, viewer, simulator, analyzer, validator, maker, preview, "free X", "X tool") -> a **dedicated tool page** (a real route with the actual tool on it, e.g. `/`, `/formatter`). Never a blog post.

If you are unsure which bucket a keyword is in, search it: if the ranking results are tools/apps, it is tool intent.

## Checklist for every new blog post

A new post must pass all of these, or do not publish it:

1. **Informational intent**, not tool/transactional (see above).
2. **Distinct** from existing posts. Do not write a near-duplicate of a post we already have. Check `contents/blog/` first.
3. **Embeds the tool with a CTA.** Add a `<CtaCard>` high in the post (right after the intro, before the first `##`), pointing to `/#tool`. This is the single pattern proven to convert here (the strikethrough how-to converts ~39%).
4. **Internal links in and out.** Link to 2-3 related surviving posts and to the homepage/tool with descriptive anchors.

## What works (keep / expand this pattern)

Specific "how to format X on LinkedIn" guides with the tool embedded are the only blog format proven to earn impressions _and_ conversions. Examples to model:

- `linkedin-posts-text-formatting`
- `how-to-add-bold-text-to-linkedin-posts`
- `how-to-add-bullet-point-lists-to-linkedin-posts`
- `how-to-add-strikethrough-text-to-linkedin-posts` (converts ~39%)

## Do not recreate (confirmed failures)

These tool-intent topics were tried as blog posts and earned 0 impressions. Do not recreate them as posts; route the intent to a tool page instead:

`linkedin-post-formatter`, `best-linkedin-post-formatters`, `linkedin-post-format`, `free-linkedin-post-maker`, `best-free-linkedin-editor`, `best-linkedin-post-analyzer-tools`, `linkedin-post-simulator`, `linkedin-link-preview`, `can-you-preview-linkedin-post`, `linkedin-post-checker`, `linkedin-viewer`, `linkedin-post-analyzer`, `how-to-embed-linkedin-preview-tool-on-your-website`.

(The full machine-readable registry of zero-impression slugs lives in the SEO audit workspace and is the canonical "already tried" list. Do not re-add a slug that appears there.)

## Compare pages

Compare pages (`contents/compare/`) target "<competitor> alternative / free" intent. Lead the title and summary with our differentiator (100% free, no signup), include a comparison table with a visible "Price: Free" row, and put a tool CTA above the fold.
