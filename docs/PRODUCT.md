# Product

> This is a living document. It tracks the current state of the product and is kept in sync with
> what is actually deployed. Every built feature links to its spec in [features/](features/) (with
> fact-checked acceptance criteria); every planned feature links to [backlog/](backlog/). The
> honest "what works vs what is partial" snapshot is [STATUS.md](STATUS.md). Last verified against
> the code on 2026-06-14.

## Vision

LinkedInPreview.com is the most powerful free LinkedIn content creation and preview tool. It helps anyone write, format, preview, and publish better LinkedIn posts - without a signup, paywall, or bloated workflow. The product is content-first: every feature either helps users create higher-quality posts or removes friction between an idea and a published post. The core editor stays free and login-free forever. Authentication is only introduced where it unlocks something impossible without it (e.g. LinkedIn API access for scheduling and publishing).

**Our primary traffic source is organic search on Google.** Every new feature must be built with SEO in mind - proper metadata, stable URLs, fast load times, and structured data. We never break existing URLs or degrade Core Web Vitals.

## Target Users

| User type                                                  | Goals                                                                                                          | Pain points                                                                                                        |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| LinkedIn content creator (freelancer, founder, consultant) | Write better posts, preview formatting before publishing, build a content library, maintain a consistent voice | LinkedIn's native editor has no preview, no draft history, no formatting feedback, and no AI assistance            |
| Social media manager / marketer                            | Manage multiple drafts, schedule posts, track performance, maintain brand consistency across clients           | No dedicated tool for LinkedIn-only workflows; existing tools are expensive and require LinkedIn login upfront     |
| Casual LinkedIn user                                       | Quick free tool to format and preview a post before copying it to LinkedIn                                     | Uncertainty about how a post will look once published; hard to format Unicode bold/italic without a dedicated tool |

## Features

Status key: **SHIPPED** = built and every acceptance criterion verified against the code ·
**PARTIAL** = built but at least one documented capability is missing (see the linked spec and
[STATUS.md](STATUS.md)) · **PLANNED** = on the roadmap, not built (lives in [backlog/](backlog/)).

### Public Website

| ID  | Feature                                                             | Status  |
| --- | ------------------------------------------------------------------- | ------- |
| 001 | [Landing page](features/completed/001-landing-page.md)              | SHIPPED |
| 002 | [Blog](features/completed/002-blog.md)                              | SHIPPED |
| 003 | [RSS feed](features/completed/003-rss-feed.md)                      | SHIPPED |
| 004 | [Changelog](features/004-changelog.md)                              | PARTIAL |
| 005 | [Compare pages](features/completed/005-compare-pages.md)            | SHIPPED |
| 006 | [SEO infrastructure](features/completed/006-seo-infrastructure.md)  | SHIPPED |
| 007 | [Hook template library](backlog/007-hook-template-library.md)       | PLANNED |
| 008 | [CTA template library](backlog/008-cta-template-library.md)         | PLANNED |
| 009 | [Post structure templates](backlog/009-post-structure-templates.md) | PLANNED |

### Editor (Core Tool)

| ID  | Feature                                                                        | Status  |
| --- | ------------------------------------------------------------------------------ | ------- |
| 020 | [Rich text editor](features/completed/020-rich-text-editor.md)                 | SHIPPED |
| 021 | [Real-time post preview](features/completed/021-realtime-post-preview.md)      | SHIPPED |
| 022 | [Preview size toggle](features/completed/022-mobile-desktop-preview-toggle.md) | SHIPPED |
| 023 | [Realistic feed preview](features/completed/023-realistic-feed-preview.md)     | SHIPPED |
| 024 | [Image and video upload](features/completed/024-image-and-video-upload.md)     | SHIPPED |
| 025 | [Copy to clipboard](features/completed/025-copy-to-clipboard.md)               | SHIPPED |
| 026 | [Draft sharing via URL](features/completed/026-draft-sharing-via-url.md)       | SHIPPED |
| 027 | [Embeddable widget](features/completed/027-embeddable-widget.md)               | SHIPPED |
| 028 | [Homepage tool variant](features/completed/028-homepage-tool-variant.md)       | SHIPPED |

### AI Features

| ID  | Feature                                                                                  | Status  |
| --- | ---------------------------------------------------------------------------------------- | ------- |
| 030 | [AI chat assistant](features/completed/030-ai-chat-assistant.md)                         | SHIPPED |
| 031 | [AI post generation](features/completed/031-ai-post-generation.md)                       | SHIPPED |
| 032 | [Quick AI actions](features/completed/032-quick-ai-actions.md)                           | SHIPPED |
| 033 | [AI post analysis](features/completed/033-ai-post-analysis.md)                           | SHIPPED |
| 034 | [AI suggestions](features/completed/034-ai-suggestions.md)                               | SHIPPED |
| 035 | [AI hook generation](features/completed/035-ai-hook-generation.md)                       | SHIPPED |
| 036 | [AI content extraction](features/completed/036-ai-content-extraction.md)                 | SHIPPED |
| 037 | [Branding-aware AI](features/037-branding-aware-ai.md)                                   | PARTIAL |
| 038 | [AI post generation from voice](features/completed/038-ai-post-generation-from-voice.md) | SHIPPED |
| 039 | [AI post generation from file](features/completed/039-ai-post-generation-from-file.md)   | SHIPPED |
| 040 | [AI post generation from URL](features/040-ai-post-generation-from-url.md)               | PARTIAL |

### Content Scoring (Client-side, dashboard analyze panel)

| ID  | Feature                                                                      | Status  |
| --- | ---------------------------------------------------------------------------- | ------- |
| 050 | [Readability score](features/completed/050-readability-score.md)             | SHIPPED |
| 051 | [Sentence flow analysis](features/completed/051-sentence-flow-analysis.md)   | SHIPPED |
| 052 | [Character and word count](features/052-character-and-word-count.md)         | PARTIAL |
| 053 | [Hashtag count](features/completed/053-hashtag-count.md)                     | SHIPPED |
| 054 | [Emoji count](features/completed/054-emoji-count.md)                         | SHIPPED |
| 055 | [Length status indicator](features/completed/055-length-status-indicator.md) | SHIPPED |
| 056 | [Line count](features/completed/056-line-count.md)                           | SHIPPED |

### Dashboard

| ID  | Feature                                                                        | Status  |
| --- | ------------------------------------------------------------------------------ | ------- |
| 060 | [Dashboard shell](features/completed/060-dashboard-shell.md)                   | SHIPPED |
| 061 | [Anonymous auth](features/completed/061-anonymous-auth.md)                     | SHIPPED |
| 062 | [Multi-draft management](features/completed/062-multi-draft-management.md)     | SHIPPED |
| 063 | [Post statuses](features/063-post-statuses.md)                                 | PARTIAL |
| 064 | [Post format labels](features/completed/064-post-format-labels.md)             | SHIPPED |
| 065 | [Posts list page](features/completed/065-posts-list-page.md)                   | SHIPPED |
| 066 | [Dashboard editor](features/completed/066-dashboard-editor.md)                 | SHIPPED |
| 067 | [New post creation wizard](features/completed/067-new-post-creation-wizard.md) | SHIPPED |
| 068 | [Tutorial dialog](features/completed/068-tutorial-dialog.md)                   | SHIPPED |
| 069 | [Dark mode](features/completed/069-dark-mode.md)                               | SHIPPED |

### Content Strategy

| ID  | Feature                                                                      | Status  |
| --- | ---------------------------------------------------------------------------- | ------- |
| 200 | [Content strategy wizard](features/completed/200-content-strategy-wizard.md) | SHIPPED |
| 201 | [Content strategy dashboard](features/201-content-strategy-dashboard.md)     | PARTIAL |
| 202 | [Weekly AI post ideas](features/202-weekly-ai-post-ideas.md)                 | PARTIAL |

### Branding & Personalization

| ID  | Feature                                                                          | Status  |
| --- | -------------------------------------------------------------------------------- | ------- |
| 080 | [Profile section](features/completed/080-profile-section.md)                     | SHIPPED |
| 081 | [Positioning statement](features/081-positioning-statement.md)                   | PARTIAL |
| 082 | [Role selection](features/completed/082-role-selection.md)                       | SHIPPED |
| 083 | [Areas of expertise](features/completed/083-areas-of-expertise.md)               | SHIPPED |
| 084 | [Writing style preferences](features/completed/084-writing-style-preferences.md) | SHIPPED |
| 085 | [Custom footer](features/085-custom-footer.md)                                   | PARTIAL |
| 086 | [Knowledge base](features/completed/086-knowledge-base.md)                       | SHIPPED |
| 087 | [Dos and donts](features/087-dos-and-donts.md)                                   | PARTIAL |
| 088 | [Inspirational posts](features/088-inspirational-posts.md)                       | PARTIAL |
| 089 | [Inspirational creators](features/089-inspirational-creators.md)                 | PARTIAL |
| 090 | [Auto-save indicator](features/completed/090-auto-save-indicator.md)             | SHIPPED |

### Settings

| ID  | Feature                                                    | Status  |
| --- | ---------------------------------------------------------- | ------- |
| 100 | [Theme selector](features/completed/100-theme-selector.md) | SHIPPED |
| 103 | [Reset all data](features/completed/103-reset-all-data.md) | SHIPPED |

### Feedback & Analytics

| ID  | Feature                                                              | Status  |
| --- | -------------------------------------------------------------------- | ------- |
| 110 | [Feedback collection](features/completed/110-feedback-collection.md) | SHIPPED |
| 111 | [Article helpfulness](features/completed/111-article-helpfulness.md) | SHIPPED |
| 112 | [PostHog analytics](features/112-posthog-analytics.md)               | PARTIAL |
| 113 | [Google Tag Manager](features/completed/113-google-tag-manager.md)   | SHIPPED |

### Planned (backlog)

| ID  | Feature                                                           | Wave |
| --- | ----------------------------------------------------------------- | ---- |
| 210 | [Carousel creator](backlog/210-carousel-creator.md)               | 3    |
| 211 | [Carousel templates](backlog/211-carousel-templates.md)           | 3    |
| 212 | [Carousel export](backlog/212-carousel-export.md)                 | 3    |
| 220 | [LinkedIn OAuth](backlog/220-linkedin-oauth.md)                   | 4    |
| 221 | [One-click publish](backlog/221-one-click-publish.md)             | 4    |
| 222 | [Post scheduling](backlog/222-post-scheduling.md)                 | 4    |
| 223 | [Content calendar](backlog/223-content-calendar.md)               | 4    |
| 224 | [Best time to post](backlog/224-best-time-to-post.md)             | 4    |
| 230 | [Analytics dashboard](backlog/230-analytics-dashboard.md)         | 5    |
| 240 | [Team collaboration](backlog/240-team-collaboration.md)           | 6    |
| 241 | [Chrome extension](backlog/241-chrome-extension.md)               | 6    |
| 242 | [Content repurposing](backlog/242-content-repurposing.md)         | 6    |
| 243 | [Inspiration library](backlog/243-inspiration-library.md)         | 6    |
| 244 | [Integrations](backlog/244-integrations.md)                       | 6    |
| 041 | [Audio/video post source](backlog/041-audio-video-post-source.md) | 6    |

## User Flows

### Flow: Quick Preview (homepage, no login)

1. User lands on the homepage.
2. User types or pastes text into the editor.
3. Preview panel updates in real time showing formatted LinkedIn post.
4. User switches between viewport widths in the preview.
5. User clicks "Copy" - formatted Unicode text is copied to clipboard.
6. User pastes directly into LinkedIn's native editor and publishes.

### Flow: AI-Assisted Post Creation (dashboard)

1. User opens the dashboard. Anonymous Supabase session is created silently on first visit.
2. User clicks "New Post" and chooses a creation method (blank, generate from notes, voice, file, or URL).
3. If AI generation: user enters a topic and selects a tone, then clicks Generate. Hooks then a post are produced.
4. User refines the post with quick AI actions or the chat assistant.
5. AI analysis fires on demand - quality scores are shown in the analysis panel.
6. User saves the draft. Status defaults to "draft".
7. User copies the formatted text and publishes on LinkedIn.

### Flow: Branding Setup

1. User navigates to the Branding page in the dashboard sidebar.
2. User fills in profile information (name, headline, avatar).
3. User sets positioning statement, role, expertise, and writing style preferences.
4. User adds knowledge base context and dos/donts.
5. Branding is saved automatically to Supabase.
6. On next AI generation (generate route + wizard), the wired branding fields are injected into the prompt.

### Flow: Draft Management

1. User opens the Posts page in the dashboard.
2. User views all drafts in a table sorted by last modified date.
3. User filters by status or format label.
4. User clicks a draft to open it in the editor.
5. User edits content, then saves. Changes are persisted to Supabase with 2s debounce.
6. User duplicates a draft to create a variation, or deletes one they no longer need.

### Flow: Blog Discovery (SEO)

1. User searches Google for a LinkedIn-related topic (e.g. "how to write a LinkedIn hook").
2. User lands on a blog post via organic search result.
3. User reads the article, sees "Was this helpful?" feedback widget.
4. User clicks CTA within the article to try the editor.
5. User is directed to the homepage or dashboard to start writing.

## Out of Scope

- Mobile native app (iOS or Android)
- Multi-platform posting (Twitter/X, Instagram, Facebook, etc.)
- Real-time collaboration (Google Docs style concurrent editing)
- CRM or contact management
- Paid tier or premium-only features - everything stays free
- Self-hosted or white-label version
- Email/password authentication - anonymous auth only until LinkedIn OAuth (Wave 4)

## Success Criteria

- Homepage editor loads and is interactive in under 1 second
- AI post generation completes in under 15 seconds end to end
- Content scoring panel updates in under 100ms (fully client-side, no network)
- Dashboard handles 50+ drafts without visible performance degradation
- Zero regression on the homepage editor when dashboard features are added
- Mobile dashboard is fully functional on 375px viewport width
- Draft sharing URL works without any backend dependency
- Blog posts rank on the first page of Google for target keywords
- Core Web Vitals pass Google's "good" thresholds (LCP < 2.5s, FID < 100ms, CLS < 0.1)
