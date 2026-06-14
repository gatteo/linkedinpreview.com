# Roadmap

> The Foundation and Waves 0-2 shipped their core to production but still carry some PARTIAL
> features, so they are not labeled COMPLETE - each section lists exactly what is left under "To
> complete this wave". Per-feature truth (SHIPPED/PARTIAL with evidence) is in
> [features/](features/) and summarized in [STATUS.md](STATUS.md). Waves 3-6 and the SEO track are
> planned; each feature has a spec in [backlog/](backlog/). The feature matrix is in
> [PRODUCT.md](PRODUCT.md).
>
> **Rules this document holds itself to:**
>
> - A section is **COMPLETE** only when every feature in it is SHIPPED. Otherwise it is IN PROGRESS
>   (built sections) or PLANNED (not-yet-started sections).
> - **Every feature spec appears in exactly one section here** - no feature file exists outside the
>   roadmap. Built specs (Foundation, Waves 0-2) live in [features/](features/); planned specs
>   (Waves 3-6, SEO) live in [backlog/](backlog/).
> - **Placement rule (features/ vs backlog/):** a feature's spec lives in `features/` once work on
>   its section has started (Foundation + Waves 0-2). Within `features/`, SHIPPED specs go in
>   [features/completed/](features/completed/) and PARTIAL specs stay in `features/`. A feature whose
>   section has **not** started lives in [backlog/](backlog/). It graduates to `features/` only when
>   its wave begins.
> - Each feature has its own row (no aggregated ID ranges), and every open item maps to a ticket in
>   [tickets/](tickets/).

## Principles

- Foundation first (dashboard shell, auth, persistence), then content creation features, then platform features
- Each wave produces a deployable increment
- Later waves can be re-scoped without affecting earlier ones
- Core features stay free and login-free; login only for LinkedIn API features (Wave 4+)

---

## Foundation: Public Tool & Site - COMPLETE (19 of 19 SHIPPED)

### Goal

The original free, login-free product that predates the dashboard: the public marketing/SEO site, the core LinkedIn post editor and preview, and the feedback/analytics instrumentation. Still live; carries a few PARTIAL items.

### Features

| Feature                                                                              | Status  | Notes                                            |
| ------------------------------------------------------------------------------------ | ------- | ------------------------------------------------ |
| [001 - Landing page](features/completed/001-landing-page.md)                         | SHIPPED | Hero, demo, FAQ, JSON-LD schemas                 |
| [002 - Blog](features/completed/002-blog.md)                                         | SHIPPED | MDX via Contentlayer                             |
| [003 - RSS feed](features/completed/003-rss-feed.md)                                 | SHIPPED | `/rss.xml`                                       |
| [004 - Changelog](features/completed/004-changelog.md)                               | SHIPPED | Entries grouped by month/year                    |
| [005 - Compare pages](features/completed/005-compare-pages.md)                       | SHIPPED | `/compare/[slug]`, static                        |
| [006 - SEO infrastructure](features/completed/006-seo-infrastructure.md)             | SHIPPED | Sitemap, robots, JSON-LD, OG, canonicals         |
| [020 - Rich text editor](features/completed/020-rich-text-editor.md)                 | SHIPPED | TipTap; Unicode output                           |
| [021 - Real-time post preview](features/completed/021-realtime-post-preview.md)      | SHIPPED | Live LinkedIn preview                            |
| [022 - Preview size toggle](features/completed/022-mobile-desktop-preview-toggle.md) | SHIPPED | 3-way fixed-width switch (mobile/tablet/desktop) |
| [023 - Realistic feed preview](features/completed/023-realistic-feed-preview.md)     | SHIPPED | In-feed sim + `/preview`                         |
| [024 - Image and video upload](features/completed/024-image-and-video-upload.md)     | SHIPPED | 5MB image / 25MB video (in-memory)               |
| [025 - Copy to clipboard](features/completed/025-copy-to-clipboard.md)               | SHIPPED | Formatted Unicode + toast                        |
| [026 - Draft sharing via URL](features/completed/026-draft-sharing-via-url.md)       | SHIPPED | deflate-raw + base64url, no backend              |
| [027 - Embeddable widget](features/completed/027-embeddable-widget.md)               | SHIPPED | `/embed`, noindex                                |
| [028 - Homepage tool variant](features/completed/028-homepage-tool-variant.md)       | SHIPPED | Editor inline on the homepage                    |
| [110 - Feedback collection](features/completed/110-feedback-collection.md)           | SHIPPED | Tally FAB + inline links                         |
| [111 - Article helpfulness](features/completed/111-article-helpfulness.md)           | SHIPPED | "Was this helpful?" widget                       |
| [112 - PostHog analytics](features/completed/112-posthog-analytics.md)               | SHIPPED | Deliberate per-route `page_viewed` tracking      |
| [113 - Google Tag Manager](features/completed/113-google-tag-manager.md)             | SHIPPED | GTM container in root layout                     |

### To complete this wave

Done - every feature in this wave is SHIPPED.

### Dependencies

None - this is the original product the rest is built on.

---

## Wave 0: Dashboard Foundation & Branding - IN PROGRESS (27 of 28 SHIPPED, 1 PARTIAL)

### Goal

Transform from a single-page tool into a proper app with dashboard, multi-draft management, branding settings, and Supabase persistence.

### Features

| Feature                                                                                | Status  | Notes                                                   |
| -------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| [060 - App shell with sidebar navigation](features/completed/060-dashboard-shell.md)   | SHIPPED | shadcn SidebarProvider, inset variant                   |
| [061 - Supabase anonymous auth](features/completed/061-anonymous-auth.md)              | SHIPPED | Anonymous session on first visit, RLS-protected tables  |
| [062 - Multi-draft management](features/completed/062-multi-draft-management.md)       | SHIPPED | Create/edit/duplicate/delete                            |
| [063 - Post statuses](features/completed/063-post-statuses.md)                         | SHIPPED | Status picker in the editor; manual, not LinkedIn yet   |
| [064 - Draft labels](features/completed/064-post-format-labels.md)                     | SHIPPED | Label picker wired into the editor; persists to draft   |
| [065 - Posts list page](features/completed/065-posts-list-page.md)                     | SHIPPED | TanStack table, search/filter/paginate                  |
| [066 - Dashboard editor](features/completed/066-dashboard-editor.md)                   | SHIPPED | TipTap + preview + AI + 2s auto-save                    |
| [067 - New post creation wizard](features/completed/067-new-post-creation-wizard.md)   | SHIPPED | Blank / notes / file / URL / voice                      |
| [068 - Tutorial dialog](features/completed/068-tutorial-dialog.md)                     | SHIPPED | 4-slide onboarding                                      |
| [069 - Dark mode](features/completed/069-dark-mode.md)                                 | SHIPPED | Dashboard-scoped light/dark/system                      |
| [080 - Profile section](features/completed/080-profile-section.md)                     | SHIPPED | Avatar cropping; name/headline/avatar in post preview   |
| [081 - Positioning statement](features/completed/081-positioning-statement.md)         | SHIPPED | Reaches chat + analyze via branding context             |
| [082 - Role selection](features/completed/082-role-selection.md)                       | SHIPPED | Wired into AI generation                                |
| [083 - Areas of expertise](features/completed/083-areas-of-expertise.md)               | SHIPPED | Wired into AI generation                                |
| [084 - Writing style preferences](features/completed/084-writing-style-preferences.md) | SHIPPED | Language, sentence/post length, emoji                   |
| [085 - Custom footer](features/completed/085-custom-footer.md)                         | SHIPPED | Deterministically appended to generated posts           |
| [086 - Knowledge base](features/completed/086-knowledge-base.md)                       | SHIPPED | Wired into AI as additional context                     |
| [087 - Dos and donts](features/completed/087-dos-and-donts.md)                         | SHIPPED | Injected as system-prompt hard constraints              |
| [088 - Inspirational posts](features/088-inspirational-posts.md)                       | PARTIAL | Feeds AI now; card "URL" claim still inaccurate (T-014) |
| [089 - Inspirational creators](features/completed/089-inspirational-creators.md)       | SHIPPED | Sent to AI as style reference                           |
| [090 - Auto-save indicator](features/completed/090-auto-save-indicator.md)             | SHIPPED | "All changes saved" + auto-upsert                       |
| [100 - Theme selector](features/completed/100-theme-selector.md)                       | SHIPPED | Light/dark/system                                       |
| [103 - Reset all data](features/completed/103-reset-all-data.md)                       | SHIPPED | Danger-zone wipe with confirmation                      |
| [030 - AI chat assistant](features/completed/030-ai-chat-assistant.md)                 | SHIPPED | Streaming via Vercel AI SDK                             |
| [031 - AI post generation](features/completed/031-ai-post-generation.md)               | SHIPPED | Hooks + full post variants                              |
| [032 - Quick AI actions](features/completed/032-quick-ai-actions.md)                   | SHIPPED | Shorten/lengthen/variation/restyle                      |
| [033 - AI post analysis](features/completed/033-ai-post-analysis.md)                   | SHIPPED | Score + classification, stored                          |
| [034 - AI suggestions](features/completed/034-ai-suggestions.md)                       | SHIPPED | 3 refinement suggestions                                |

### To complete this wave

Every item below is a PARTIAL feature with a tracking ticket. The wave reaches COMPLETE when all are
SHIPPED.

- [088 - Inspirational posts](features/088-inspirational-posts.md) - [T-014](tickets/T-014-inspiration-posts-url-claim.md): reconcile the "post URL" claim with the text-paste UI (AI wiring already shipped via T-005).

### Dependencies

None - this was the first wave.

---

## Wave 1: Smart Content Creation - COMPLETE (13 of 13 SHIPPED)

### Goal

Make post creation intelligent with AI that knows your brand, suggests hooks, scores content in real-time, and can generate posts from any input type.

### Features

| Feature                                                                                        | Status  | Notes                                                 |
| ---------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------- |
| [038 - AI post generation from voice](features/completed/038-ai-post-generation-from-voice.md) | SHIPPED | Web Speech API transcription -> generation            |
| [039 - AI post generation from file](features/completed/039-ai-post-generation-from-file.md)   | SHIPPED | PDF/DOCX/TXT/MD; audio/video moved to backlog 041     |
| [040 - AI post generation from URL](features/completed/040-ai-post-generation-from-url.md)     | SHIPPED | Original-take + conditional source-attribution prompt |
| [035 - AI hook suggestions](features/completed/035-ai-hook-generation.md)                      | SHIPPED | 4 hooks via wizard + editor quick action              |
| [036 - AI content extraction](features/completed/036-ai-content-extraction.md)                 | SHIPPED | URL/PDF/DOCX/TXT/MD extraction                        |
| [037 - Branding-aware AI](features/completed/037-branding-aware-ai.md)                         | SHIPPED | Generate, wizard, editor actions, chat, and analyze   |
| [050 - Readability score](features/completed/050-readability-score.md)                         | SHIPPED | Flesch-Kincaid grade + label                          |
| [051 - Sentence flow analysis](features/completed/051-sentence-flow-analysis.md)               | SHIPPED | 5-bucket distribution                                 |
| [052 - Character and word count](features/completed/052-character-and-word-count.md)           | SHIPPED | Char + word count in the core editor footer           |
| [053 - Hashtag count](features/completed/053-hashtag-count.md)                                 | SHIPPED | Count vs 3-5 recommended                              |
| [054 - Emoji count](features/completed/054-emoji-count.md)                                     | SHIPPED | Total emoji count                                     |
| [055 - Length status indicator](features/completed/055-length-status-indicator.md)             | SHIPPED | Short / optimal / long                                |
| [056 - Line count](features/completed/056-line-count.md)                                       | SHIPPED | Line count                                            |

### To complete this wave

Done - every feature in this wave is SHIPPED.

### Dependencies

Wave 0.

---

## Wave 2: Content Strategy - COMPLETE (3 of 3 SHIPPED)

### Goal

Help users build and follow a LinkedIn content strategy with goals, audience, posting frequency, and format mix.

### Features

| Feature                                                                                  | Status  | Notes                                                    |
| ---------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------- |
| [200 - Content strategy wizard](features/completed/200-content-strategy-wizard.md)       | SHIPPED | 7-step wizard, persisted to Supabase                     |
| [201 - Content strategy dashboard](features/completed/201-content-strategy-dashboard.md) | SHIPPED | 6-month contribution heatmap + weekly streak             |
| [202 - Weekly AI-generated post ideas](features/completed/202-weekly-ai-post-ideas.md)   | SHIPPED | Create Post seeds a draft from the hook + label; dismiss |

### To complete this wave

Done - every feature in this wave is SHIPPED.

### Dependencies

Wave 0 (branding) + Wave 1 (post labels).

---

## Wave 3: Carousel & Visual Content

### Goal

Add a carousel/document creator for high-engagement visual LinkedIn content.

### Features

| Feature                                                        | Status  | Notes                                                  |
| -------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| [210 - Carousel slide editor](backlog/210-carousel-creator.md) | PLANNED | Real-time preview alongside post preview               |
| [211 - Carousel templates](backlog/211-carousel-templates.md)  | PLANNED | 10+ templates                                          |
| [210 - Design controls](backlog/210-carousel-creator.md)       | PLANNED | Colors, fonts, branding applied from branding settings |
| [212 - Export](backlog/212-carousel-export.md)                 | PLANNED | PDF / PNG / ZIP                                        |

### To complete this wave

Not started. Build each feature below and open a `T-NNN` ticket per feature at kickoff:

- [210 - Carousel slide editor](backlog/210-carousel-creator.md)
- [211 - Carousel templates](backlog/211-carousel-templates.md)
- [210 - Design controls](backlog/210-carousel-creator.md)
- [212 - Export](backlog/212-carousel-export.md)

### Dependencies

Wave 0 (dashboard exists). Can run in parallel with Wave 1 and Wave 2.

---

## Wave 4: Scheduling & Publishing

### Goal

Close the biggest feature gap - direct LinkedIn scheduling and publishing. This is where login becomes necessary.

### Features

| Feature                                                                     | Status  | Notes                                                           |
| --------------------------------------------------------------------------- | ------- | --------------------------------------------------------------- |
| [220 - LinkedIn OAuth integration](backlog/220-linkedin-oauth.md)           | PLANNED | Login required; replaces anonymous auth for scheduling features |
| [221 - One-click publish to LinkedIn](backlog/221-one-click-publish.md)     | PLANNED | Post directly from the editor                                   |
| [222 - Post scheduling](backlog/222-post-scheduling.md)                     | PLANNED | Timezone support                                                |
| [223 - Content calendar](backlog/223-content-calendar.md)                   | PLANNED | Month and week views                                            |
| [224 - Best time to post recommendations](backlog/224-best-time-to-post.md) | PLANNED | Based on LinkedIn engagement data                               |

### To complete this wave

Not started. Build each feature below and open a `T-NNN` ticket per feature at kickoff:

- [220 - LinkedIn OAuth integration](backlog/220-linkedin-oauth.md)
- [221 - One-click publish to LinkedIn](backlog/221-one-click-publish.md)
- [222 - Post scheduling](backlog/222-post-scheduling.md)
- [223 - Content calendar](backlog/223-content-calendar.md)
- [224 - Best time to post recommendations](backlog/224-best-time-to-post.md)

### Dependencies

Wave 0 + Wave 1. LinkedIn API approval must be applied for during Wave 2.

---

## Wave 5: Analytics & Insights

### Goal

Deep LinkedIn performance insights without expensive tools.

### Features

| Feature                                               | Status  | Notes                                                                                                            |
| ----------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| [230 - Analytics](backlog/230-analytics-dashboard.md) | PLANNED | Post performance, engagement trends, content insights (top formats, best hooks, optimal length), reach in editor |

### To complete this wave

Not started. Build each feature below and open a `T-NNN` ticket per feature at kickoff:

- [230 - Analytics](backlog/230-analytics-dashboard.md)

### Dependencies

Wave 4 (requires LinkedIn API access).

---

## Wave 6: Advanced & Scale

### Goal

Polish, extend, and prepare for growth beyond solo creators.

### Features

| Feature                                                                 | Status  | Notes                                                      |
| ----------------------------------------------------------------------- | ------- | ---------------------------------------------------------- |
| [041 - Audio/video post source](backlog/041-audio-video-post-source.md) | PLANNED | Transcribe audio/video into a post (split from 039)        |
| [240 - Team collaboration](backlog/240-team-collaboration.md)           | PLANNED | Shared drafts, comment/review workflow                     |
| [241 - Chrome extension](backlog/241-chrome-extension.md)               | PLANNED | Write and preview from anywhere                            |
| [242 - Content repurposing](backlog/242-content-repurposing.md)         | PLANNED | Turn a post into a carousel, thread, or newsletter section |
| [244 - Integrations](backlog/244-integrations.md)                       | PLANNED | Notion, Slack, Zapier                                      |
| [243 - Inspiration library](backlog/243-inspiration-library.md)         | PLANNED | Curated high-performing posts by format                    |

### To complete this wave

Not started. Build each feature below and open a `T-NNN` ticket per feature at kickoff:

- [041 - Audio/video post source](backlog/041-audio-video-post-source.md)
- [240 - Team collaboration](backlog/240-team-collaboration.md)
- [241 - Chrome extension](backlog/241-chrome-extension.md)
- [242 - Content repurposing](backlog/242-content-repurposing.md)
- [244 - Integrations](backlog/244-integrations.md)
- [243 - Inspiration library](backlog/243-inspiration-library.md)

### Dependencies

All previous waves.

---

## SEO Pages - Parallel Track

### Goal

Public-facing content pages for organic traffic. Can ship alongside any wave.

### Features

| Feature                                                                   | Status  | Notes                   |
| ------------------------------------------------------------------------- | ------- | ----------------------- |
| [007 - Hook template library](backlog/007-hook-template-library.md)       | PLANNED | `/templates/hooks`      |
| [008 - CTA template library](backlog/008-cta-template-library.md)         | PLANNED | `/templates/ctas`       |
| [009 - Post structure templates](backlog/009-post-structure-templates.md) | PLANNED | `/templates/structures` |

### To complete this track

Not started. Build each feature below and open a `T-NNN` ticket per feature at kickoff:

- [007 - Hook template library](backlog/007-hook-template-library.md)
- [008 - CTA template library](backlog/008-cta-template-library.md)
- [009 - Post structure templates](backlog/009-post-structure-templates.md)

### Dependencies

None.

---

## Backlog / Future

These are not specced (no spec file). They are parked ideas, revisited only if the trigger lands.

| Idea                                  | Status   | Why Deferred                                    | Revisit When                               |
| ------------------------------------- | -------- | ----------------------------------------------- | ------------------------------------------ |
| Mobile native app                     | DEFERRED | Web-first approach, no demand signal yet        | After Wave 5, if user requests justify it  |
| Multi-platform posting (X, Instagram) | DEFERRED | LinkedIn focus is the differentiator            | After Wave 5, based on user demand         |
| Paid tier / premium features          | DEFERRED | Free-first positioning is competitive advantage | Only if server costs require it            |
| Real-time collaboration               | DEFERRED | Complexity outweighs benefit for solo creators  | After team features (Wave 6) are validated |
| CRM / contact management              | DROPPED  | Out of product scope                            | Never - not our product                    |
