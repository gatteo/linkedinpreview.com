# Product

> This is a living document. It tracks the current state of the product and will be updated as features are planned, built, and shipped. Keep it in sync with what is actually deployed.

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

Status key: **Live** = deployed and available, **Planned** = on the roadmap but not yet built.

### Public Website

| ID  | Feature                  | Description                                                                                                                                                                                                                           | Status  |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 001 | Landing page             | Hero section, tool demo, how-to-use guide, features grid, embed section, open-source section, reasons section, FAQ, CTA. Includes JSON-LD schemas (Organization, WebSite, SoftwareApplication).                                       | Live    |
| 002 | Blog                     | MDX-powered articles via Contentlayer. Blog listing with search/filter, individual post pages with MDX rendering, author info, related articles, reading time, scroll progress indicator.                                             | Live    |
| 003 | RSS feed                 | XML feed at `/rss.xml` with all blog posts (title, description, date, link, author).                                                                                                                                                  | Live    |
| 004 | Changelog                | Changelog page with sticky date sidebar, month/year grouping, entry titles, optional images, and MDX content per entry.                                                                                                               | Live    |
| 005 | Compare pages            | Comparison landing with competitor cards grid. Individual comparison pages (`/compare/[slug]`) with breadcrumbs, badges, MDX content, and scroll progress. Static generation.                                                         | Live    |
| 006 | SEO infrastructure       | Sitemap generation (`/sitemap.xml`), robots.txt, JSON-LD schemas (Organization, WebSite, SoftwareApplication, Article, BreadcrumbList, HowTo), Open Graph metadata per page, canonical URLs. Dashboard pages are `noindex, nofollow`. | Live    |
| 007 | Hook template library    | Public SEO page listing 50+ proven LinkedIn hook templates, categorized, with CTAs to open in editor.                                                                                                                                 | Planned |
| 008 | CTA template library     | Public SEO page listing 30+ proven LinkedIn CTA endings, categorized.                                                                                                                                                                 | Planned |
| 009 | Post structure templates | Public SEO page listing 15+ full post frameworks (AIDA, PAS, Listicle, etc.) with examples.                                                                                                                                           | Planned |

### Editor (Core Tool)

| ID  | Feature                       | Description                                                                                                                                                                                                                | Status |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 020 | Rich text editor              | TipTap-based editor with bold, italic, underline, strikethrough, bullet list, ordered list, undo/redo. Unicode output compatible with LinkedIn.                                                                            | Live   |
| 021 | Real-time post preview        | Live LinkedIn post preview that updates as you type. Shows profile avatar, name, headline, post content, and engagement bar.                                                                                               | Live   |
| 022 | Mobile/desktop preview toggle | Switch preview between desktop (full-width) and mobile (375px iPhone frame) viewports.                                                                                                                                     | Live   |
| 023 | Realistic feed preview        | Shows the user's post in context within a simulated LinkedIn feed alongside placeholder posts. Available in-editor and as a standalone page at `/preview` with `?draft=[encoded]` for shared drafts. Unique in the market. | Live   |
| 024 | Image and video upload        | Attach images (max 5MB) or videos (max 25MB) to the post preview. Stored client-side as base64 or URL.                                                                                                                     | Live   |
| 025 | Copy to clipboard             | Copies formatted Unicode text (bold, italic preserved) ready to paste into LinkedIn. Toast confirmation on copy.                                                                                                           | Live   |
| 026 | Draft sharing via URL         | Encodes the current draft into a compressed, shareable URL using deflate-raw + base64url. No backend required.                                                                                                             | Live   |
| 027 | Embeddable widget             | The editor available as a minimal embeddable iframe at `/embed` with its own layout. `noindex` for SEO.                                                                                                                    | Live   |
| 028 | Homepage tool variant         | The editor embedded directly on the homepage as a quick-start entry point for new visitors. Same TipTap editor + preview.                                                                                                  | Live   |

### AI Features

| ID  | Feature                       | Description                                                                                                                                                                                                      | Status  |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 030 | AI chat assistant             | Multi-turn conversational AI for iterative post editing. Streaming responses via Vercel AI SDK. Scoped strictly to LinkedIn content. Rate limit: 1 generation + 3 refinements/day.                               | Live    |
| 031 | AI post generation            | Generate posts from a topic and tone. Supports `hooks` (4 options), `posts` (2 full variants) actions. Streams output. Rate limit: 5 wizard actions/day.                                                         | Live    |
| 032 | Quick AI actions              | One-click transformations: `shorten`, `lengthen`, `variation`, `restyle`, `apply-suggestion`. Rate limit: 10/day.                                                                                                | Live    |
| 033 | AI post analysis              | Scores post quality (1-100) with sub-scores for hook, readability, CTA, engagement. Classifies sentiment, category, tone. Detects hook/CTA presence and quality. Stores results in Supabase. Rate limit: 20/day. | Live    |
| 034 | AI suggestions                | Generates 3 context-specific refinement suggestions (content, structure, tone, engagement). 4-8 words each, starting with a verb.                                                                                | Live    |
| 035 | AI hook generation            | Generates 4 personalized opening hooks with category and type tags. User picks the best one to apply. Regenerate option.                                                                                         | Live    |
| 036 | AI content extraction         | Extracts text from URLs (HTML via Readability), PDFs (pdf-parse), DOCX (mammoth), and TXT/MD files. Max 5MB input, 10KB output.                                                                                  | Live    |
| 037 | Branding-aware AI             | The `/api/generate` endpoint accepts branding context (positioning, expertise, writing style, knowledge base, dos/donts) to personalize output. Used by the creation wizard and dashboard editor.                | Live    |
| 038 | AI post generation from voice | Browser voice recording, transcription, AI conversion to post.                                                                                                                                                   | Planned |
| 039 | AI post generation from file  | Upload audio/video/document, extract content, AI generates post.                                                                                                                                                 | Planned |
| 040 | AI post generation from URL   | Paste URL, extract article content, AI converts to LinkedIn post format.                                                                                                                                         | Planned |

### Content Scoring (Client-side)

| ID  | Feature                  | Description                                                                                           | Status |
| --- | ------------------------ | ----------------------------------------------------------------------------------------------------- | ------ |
| 050 | Readability score        | Flesch-Kincaid grade level with label (Easy/Standard/Complex). Computed client-side under 100ms.      | Live   |
| 051 | Sentence flow analysis   | Sentence length distribution across 5 categories (tiny/short/medium/long/very long) with percentages. | Live   |
| 052 | Character and word count | Always-visible counts in the editor.                                                                  | Live   |
| 053 | Hashtag count            | Current count vs recommended 3-5.                                                                     | Live   |
| 054 | Emoji count              | Total emoji count in post.                                                                            | Live   |
| 055 | Length status indicator  | Flags posts as too short (<100 chars), optimal (100-3000), or too long (>3000).                       | Live   |
| 056 | Line count               | Total line count in post.                                                                             | Live   |

### Dashboard

| ID  | Feature                  | Description                                                                                                                                                                                                                                                  | Status |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 060 | Dashboard shell          | Sidebar navigation (shadcn SidebarProvider, inset variant, collapsible, Cmd+B toggle). Responsive: offcanvas on mobile. Max-width 1500px wrapper.                                                                                                            | Live   |
| 061 | Anonymous auth           | Supabase `signInAnonymously` on first dashboard visit. Transparent session creation with no visible signup. AuthProvider + AuthGate components.                                                                                                              | Live   |
| 062 | Multi-draft management   | Create, edit, duplicate, and delete drafts. Each draft has an auto-generated title (from first line), status, optional label, word/char counts, timestamps.                                                                                                  | Live   |
| 063 | Post statuses            | Three statuses: draft, scheduled, published. Status badges with color coding (amber/blue/green). Filter posts list by status.                                                                                                                                | Live   |
| 064 | Post format              | Tag posts with content format labels (9 POST_FORMATS: Personal Milestones, Mindset & Motivation, Career Before & After, Tool & Resource Insights, Case Studies, Actionable Guides, Culture Moments, Offer Highlight, Client Success Story). Filter by label. | Live   |
| 065 | Posts list page          | TanStack React Table with columns for title, format label, status badge, updated date (relative), and actions dropdown (edit, duplicate, delete). Search by title. Filter by status and format. Pagination. Empty state with "New Post" CTA.                 | Live   |
| 066 | Dashboard editor         | Full-featured editor page at `/dashboard/editor` with TipTap editor, live preview (desktop/mobile), AI actions panel, analysis panel. Auto-saves to Supabase with 2s debounce.                                                                               | Live   |
| 067 | New post creation wizard | Modal for creating new posts. Options: blank, generate from notes, generate from file, generate from URL. Routes to editor with pre-filled content.                                                                                                          | Live   |
| 068 | Tutorial dialog          | 4-slide onboarding tutorial on first visit (Welcome, Create Posts, Brand Your Voice, Analyze & Improve). Dismissed via localStorage `lp-tutorial-seen` flag.                                                                                                 | Live   |
| 069 | Dark mode                | Dashboard supports light/dark/system themes via next-themes. Scoped to dashboard only - homepage is always light. Theme selector in settings.                                                                                                                | Live   |

### Branding & Personalization

| ID  | Feature                   | Description                                                                                                                                                                       | Status |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 080 | Profile section           | Avatar upload (max 2MB with cropping), full name, headline. Shown in post preview.                                                                                                | Live   |
| 081 | Positioning statement     | Free-text statement ("I help [audience] achieve [outcome] by [method]"). Guides all AI generation.                                                                                | Live   |
| 082 | Role selection            | Single select: Founder/C-Level, Freelancer, Team Lead, Employee, Creator, Consultant, Agency.                                                                                     | Live   |
| 083 | Areas of expertise        | Tag-based topic input. Add/remove dynamically. Used to keep AI on-topic.                                                                                                          | Live   |
| 084 | Writing style preferences | Language (7 options with flags), sentence length (short/standard/long), post length (short/standard/long), emoji frequency (none/moderate/a lot). Fed into AI generation prompts. | Live   |
| 085 | Custom footer             | Toggle on/off. Free-text footer auto-appended to posts.                                                                                                                           | Live   |
| 086 | Knowledge base            | Text area for business context, audience info, product details. Used as AI generation context.                                                                                    | Live   |
| 087 | Dos and donts             | Two separate lists of rules. Injected into AI system prompts as hard constraints.                                                                                                 | Live   |
| 088 | Inspirational posts       | Paste LinkedIn post URLs for AI style reference. Line-clamped preview.                                                                                                            | Live   |
| 089 | Inspirational creators    | Name + optional LinkedIn URL. Used for AI style reference.                                                                                                                        | Live   |
| 090 | Auto-save indicator       | "All changes saved" with green checkmark. All branding persisted to Supabase automatically.                                                                                       | Live   |

### Settings

| ID  | Feature        | Description                                                     | Status  |
| --- | -------------- | --------------------------------------------------------------- | ------- |
| 100 | Theme selector | Light/dark/system with icon buttons. Persisted via next-themes. | Live    |
| 101 | Export data    | Download all posts, branding, and settings as JSON backup.      | Planned |
| 102 | Import data    | Restore from previously exported JSON backup.                   | Planned |

### Feedback & Analytics

| ID  | Feature             | Description                                                                                                                                                  | Status |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 110 | Feedback collection | Tally.so feedback form accessible via floating action button (bottom-right) and inline links across pages.                                                   | Live   |
| 111 | Article helpfulness | "Was this helpful?" widget on blog post pages.                                                                                                               | Live   |
| 112 | PostHog analytics   | Client-side event tracking (production only). Reverse-proxied through `/ingest`. Events: toolbar actions, copies, AI usage, page views. `snake_case` naming. | Live   |
| 113 | Google Tag Manager  | GTM container in root layout for marketing analytics.                                                                                                        | Live   |

### Future Features

| ID  | Feature                    | Description                                                                                                                                             | Status  |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 200 | Content strategy wizard    | Guided setup for role, goals, audience, expertise, posting frequency, format mix.                                                                       | Planned |
| 201 | Content strategy dashboard | Monthly progress tracking, activity targets, format targets, posting heatmap.                                                                           | Planned |
| 202 | Weekly AI post ideas       | AI generates content ideas based on strategy + branding.                                                                                                | Planned |
| 210 | Carousel creator           | Slide-based editor for LinkedIn carousel posts with real-time preview.                                                                                  | Planned |
| 211 | Carousel templates         | 10+ pre-designed carousel templates with style customization.                                                                                           | Planned |
| 212 | Carousel export            | Export as PDF, PNG, or ZIP.                                                                                                                             | Planned |
| 220 | LinkedIn OAuth             | Connect LinkedIn account for scheduling/publishing. OAuth 2.0 flow.                                                                                     | Planned |
| 221 | One-click publish          | Publish directly to LinkedIn from the editor.                                                                                                           | Planned |
| 222 | Post scheduling            | Schedule posts with date/time picker, timezone support.                                                                                                 | Planned |
| 223 | Content calendar           | Month/week views showing posts by status. Drag-and-drop rescheduling.                                                                                   | Planned |
| 224 | Best time to post          | AI-recommended posting times based on strategy and engagement data.                                                                                     | Planned |
| 230 | Analytics dashboard        | Post performance metrics (impressions, reactions, comments, shares), engagement trends, and content insights (top formats, best hooks, optimal length). | Planned |
| 240 | Team collaboration         | Shared workspace, multiple editors, approval workflows.                                                                                                 | Planned |
| 241 | Chrome extension           | Preview overlay on LinkedIn.com, quick formatting, save posts from feed.                                                                                | Planned |
| 242 | Content repurposing        | Convert posts to carousels, threads, newsletter sections.                                                                                               | Planned |
| 243 | Inspiration library        | Curated database of high-performing LinkedIn posts by format.                                                                                           | Planned |
| 244 | Integrations               | Notion, Slack, Zapier/Make.com webhooks.                                                                                                                | Planned |

## User Flows

### Flow: Quick Preview (homepage, no login)

1. User lands on the homepage.
2. User types or pastes text into the editor.
3. Preview panel updates in real time showing formatted LinkedIn post.
4. User switches between desktop and mobile viewport in the preview.
5. User clicks "Copy" - formatted Unicode text is copied to clipboard.
6. User pastes directly into LinkedIn's native editor and publishes.

### Flow: AI-Assisted Post Creation (dashboard)

1. User opens the dashboard. Anonymous Supabase session is created silently on first visit.
2. User clicks "New Post" and chooses a creation method (blank, generate from notes, or AI from topic).
3. If AI generation: user enters a topic and selects a tone, then clicks Generate. Post streams in.
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
6. On next AI generation, the branding context is injected into the system prompt.

### Flow: Draft Management

1. User opens the Posts page in the dashboard.
2. User views all drafts in a table sorted by last modified date.
3. User filters by status (draft, scheduled, published) or label.
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
