# Features

## LinkedIn Post Preview Tool

The main product — a free online tool at `/#tool` on the home page.

### Editor Panel (`components/tool/editor-panel.tsx`)

A TipTap-based rich text editor that lets users compose LinkedIn posts with formatting.

**Capabilities:**

- Bold, italic, underline, strikethrough text formatting
- Bullet point and numbered lists
- Undo / redo
- Image upload (max 5MB, any image type)
- Copy to clipboard with plain-text conversion (preserves Unicode formatting characters that LinkedIn supports)
- Placeholder text when empty

**Copy behavior:**

- Intercepts all `Ctrl+C` / `Cmd+C` events on the page
- Converts TipTap JSON to LinkedIn-compatible plain text via `processNodes()` and `toPlainText()` in `components/tool/utils.ts`
- Shows a toast notification on success
- Triggers the post-copy feedback popup (after 2nd copy, with cooldowns)
- Tracks `post_copied` event in PostHog

### Preview Panel (`components/tool/preview/`)

A pixel-accurate LinkedIn post preview that updates in real time as the user types.

**Components:**

- `preview-header.tsx` — "Post Preview" title + mobile/tablet/desktop size toggle
- `preview-size-context.tsx` — React context for screen size state
- `user-info.tsx` — Mock LinkedIn user profile (avatar, name, title, visibility icon)
- `content-section.tsx` — Renders processed text with 3-line clamp and "...more" expand button
- `reactions.tsx` — Static LinkedIn reaction icons and counts
- `action-buttons.tsx` — Static Like/Comment/Share/Send buttons

**Screen sizes:**

- Mobile: 320px
- Tablet: 480px
- Desktop: 555px

**Feedback link:** A "Bug or feature request? Let us know" link below the preview card opens the Tally.so feedback form.

### Text Processing Pipeline

1. User types in TipTap editor → produces TipTap JSON
2. `processNodes()` converts JSON nodes to an intermediate format with Unicode formatting:
    - Bold → Unicode Mathematical Bold characters
    - Italic → Unicode Mathematical Italic characters
    - Strikethrough → Unicode combining strikethrough
    - Underline → Unicode combining underline
    - Lists → bullet/number prefixes
3. `toPlainText()` flattens to a plain string
4. Preview panel receives the same JSON and renders it visually

## Landing Page

The home page (`app/page.tsx`) is a single-page layout with these sections:

| Section       | Component                | Description                          |
| ------------- | ------------------------ | ------------------------------------ |
| Hero          | `home/hero.tsx`          | Title, subtitle, rating, CTA buttons |
| Tool          | `tool/tool.tsx`          | The editor + preview side-by-side    |
| How to Use    | `home/how-to-use.tsx`    | Step-by-step usage guide             |
| Main Features | `home/main-features.tsx` | Key feature highlights               |
| Open Source   | `home/opensource.tsx`    | GitHub CTA                           |
| Reason        | `home/reason.tsx`        | Why use this tool                    |
| Features      | `home/features.tsx`      | Full feature grid                    |
| FAQs          | `home/faqs.tsx`          | Accordion FAQ section                |

JSON-LD schemas (Organization, WebSite, SoftwareApplication) are embedded for SEO.

## Blog

A content marketing blog with 12 articles about LinkedIn best practices.

### Content Pipeline

1. Authors write MDX files in `contents/blog/`
2. Contentlayer compiles MDX at build time → `.contentlayer/generated/`
3. `lib/blog.ts` provides helpers: `getLocalBlogPosts()`, `getLocalBlogPost(slug)`
4. Blog index page (`app/blog/page.tsx`) lists all posts with client-side search
5. Blog post pages (`app/blog/[slug]/page.tsx`) are statically generated via `generateStaticParams()`

### Blog Post Page Features

- MDX rendering with custom components (headings with anchor links, image zoom, code blocks, alerts, tables, link cards, CTA cards, video embeds)
- Table of contents
- Author info and publish/modified dates
- Social share buttons (Email, LinkedIn, Telegram, Twitter, WhatsApp)
- Related articles section
- Article helpfulness widget (thumbs up/down → Tally popup)
- JSON-LD Article + BreadcrumbList schemas
- HowTo schema for tutorial-style posts

### MDX Custom Components

Defined in `components/mdx/mdx.tsx`:

| Component                                 | Purpose                                    |
| ----------------------------------------- | ------------------------------------------ |
| `h2`–`h6`                                 | Headings with auto-generated anchor IDs    |
| `a`                                       | Styled article links                       |
| `Image`                                   | Next.js Image with zoom and caption        |
| `pre`                                     | Code blocks with Shiki syntax highlighting |
| `Alert`, `AlertTitle`, `AlertDescription` | Callout boxes                              |
| `Table`                                   | Responsive tables                          |
| `ItemGrid`                                | Grid layout for items                      |
| `Tree`                                    | File tree visualization                    |
| `Video`                                   | Video embeds                               |
| `LinkCard`                                | External link cards                        |
| `CtaCard`                                 | Call-to-action cards                       |

### Blog Post Frontmatter

```yaml
title: 'Post Title'
createdAt: '2024-01-15'
modifiedAt: '2024-01-20'
summary: 'Brief description'
image: '/images/blog/post-slug/cover.png'
authorId: 'matteo'
tags: ['linkedin', 'engagement']
```

## Feedback System

A single Tally.so form (star rating + optional comment) is reused across four touchpoints. Hidden fields (`source`, `pageUrl`, `copyCount`) identify where the feedback came from.

### 1. Post-Copy Rating

- **Trigger:** 1.5 seconds after a successful copy action
- **Conditions:** User's 2nd+ copy ever, content >= 50 chars, not shown this session, not dismissed in last 7 days
- **Hidden fields:** `source: "post-copy"`, `pageUrl`, `copyCount`
- **Hook:** `hooks/use-feedback-after-copy.ts`

### 2. Floating Feedback Button

- **Location:** Fixed `bottom-6 right-6` on all pages
- **Appearance:** Icon only on mobile, icon + "Feedback" label on larger screens
- **Hidden fields:** `source: "fab"`, `pageUrl`

### 3. Article Helpfulness

- **Location:** Below blog post content, above related articles
- **UX:** Thumbs up/down buttons. On click, records vote in localStorage (per-slug), then opens Tally popup for optional comment
- **If already voted:** Shows "Thanks for your feedback!" text
- **Hidden fields:** `source: "article-yes"` or `"article-no"`, `pageUrl`

### 4. Footer Link

- **Location:** "Share Feedback" in the footer's "Useful Links" column
- **Hidden fields:** `source: "footer"`, `pageUrl`

## Other Features

### RSS Feed (`app/rss.xml/route.ts`)

Dynamic RSS 2.0 feed of all blog posts.

### Sitemap (`app/sitemap.ts`)

Dynamic XML sitemap including all static pages and blog posts.

### llms.txt (`app/llms.txt/route.ts`)

AI-friendly content index following the llms.txt specification, listing all blog posts with summaries.

### Scroll Indicator (`components/scroll-indicator.tsx`)

A reading progress bar shown on blog post pages.
