# Features

## LinkedIn Post Preview Tool

The main product - a free online tool at `/#tool` on the home page.

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

- `preview-header.tsx` - "Post Preview" title + mobile/tablet/desktop size toggle
- `preview-size-context.tsx` - React context for screen size state
- `user-info.tsx` - Mock LinkedIn user profile (avatar, name, title, visibility icon)
- `content-section.tsx` - Renders processed text with 3-line clamp and "...more" expand button
- `reactions.tsx` - Static LinkedIn reaction icons and counts
- `action-buttons.tsx` - Static Like/Comment/Share/Send buttons

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

| Section     | Component             | Description                          |
| ----------- | --------------------- | ------------------------------------ |
| Hero        | `home/hero.tsx`       | Title, subtitle, rating, CTA buttons |
| Tool        | `tool/tool.tsx`       | The editor + preview side-by-side    |
| How to Use  | `home/how-to-use.tsx` | Step-by-step usage guide             |
| Reason      | `home/reason.tsx`     | Why use this tool                    |
| Features    | `home/features.tsx`   | Full feature grid                    |
| Open Source | `home/opensource.tsx` | GitHub CTA                           |
| FAQs        | `home/faqs.tsx`       | Accordion FAQ section                |

JSON-LD schemas (Organization, WebSite, SoftwareApplication) are embedded for SEO.

## LinkedIn Post Generator (`/linkedin-post-generator`)

A dedicated, indexable tool page that surfaces the existing AI generation engine inline and ungated (no modal, no signup wall).

- **`components/generator/generator-tool.tsx`** - an inline topic + tone form that streams a post from `/api/chat` via `useChat` (the same engine as the in-editor `AIGenerateSheet`). An invisible anonymous Supabase session is created via `useAnonymousAuth().ensureSession()` before generating, so the page stays no-signup.
- On completion the generated text is converted to a TipTap doc (`toTipTapParagraphs`) and passed to `<Tool injectedDoc={doc} />`, which renders it live in the preview. The page then smooth-scrolls to the preview.
- Renders a generator-specific FAQ plus `SoftwareApplication` and `FAQPage` JSON-LD, reuses the home How-To / Reason / Features / CTA sections, and links across to `/`, `/formatter`, and `/linkedin-link-preview` with distinct anchors so the tool pages do not cannibalize each other.

### Tool content injection (`injectedDoc`)

`Tool` accepts an optional `injectedDoc` prop, threaded down to `EditorPanel`. When it changes, an effect calls `editor.commands.setContent(injectedDoc, true)` and emits `onChange`, updating the live preview. `handleContentChange` in `tool.tsx` is memoized with `useCallback` so the effect does not enter an infinite render loop. Default `Tool` usage (home / formatter / embed / German page) passes no `injectedDoc`, so the URL `?draft` and localStorage behavior is unchanged.

### AI endpoint hardening (`lib/ai-guard.ts`, `lib/ip-rate-limit.ts`)

Because the generator makes `/api/chat` indexable and ungated, the AI routes are hardened:

- `assertSameOrigin(request)` rejects cross-origin POSTs (Origin/Referer host vs request host). Known gap: a client omitting both headers is allowed (documented in the file).
- `checkIpRateLimit(...)` is a best-effort in-memory per-IP backstop ahead of the per-user Supabase limit (resets per instance; a persistent store like Upstash is the production upgrade). `getClientIp` prefers the platform-trusted `x-vercel-forwarded-for`.
- `/api/suggestions` gained both an IP limit and a per-user `suggestions` daily cap (it previously had none); `/api/analyze` and `/api/chat` keep their per-user caps. The authoritative limit remains the per-user Supabase `check_and_record_usage` RPC (generation 1/day, unchanged).

## LinkedIn Link Preview (`/linkedin-link-preview`)

A net-new tool: paste a URL and see how its link card renders on LinkedIn (desktop + mobile, small left-thumbnail format) plus an Open Graph issue checklist with copy-paste fixes.

- **`app/api/link-preview/route.ts`** (Node runtime, dynamic) fetches the target's raw HTML like a crawler (no JS execution), parses Open Graph / Twitter meta, and returns the card data + issues.
- **SSRF defenses (`lib/link-preview/`)**: scheme allowlist; private/reserved IPv4 + IPv6 blocklist (incl. cloud metadata and IPv4-mapped IPv6); `resolveAndCheck` rejects hostnames that resolve to private IPs (DNS-rebinding mitigation, with a documented TOCTOU residual); manual redirects re-validated per hop; 8s fetch timeout + 5s DNS-lookup timeout; 2 MB streamed size cap; per-IP rate limit; safe error messages (no internal IP leakage). The meta parser is zero-dependency and strips comments in a single linear pass to avoid ReDoS.
- **Honest copy**: a third party cannot force-refresh LinkedIn's cached preview, so the UI and checklist link to LinkedIn's official Post Inspector instead.
- UI: `link-card.tsx` (desktop + mobile variants), `issue-checklist.tsx` (severity icon + copy-paste fix), `link-preview-tool.tsx` (URL input, loading/error/empty states).
- Supporting informational post: `contents/blog/how-to-fix-linkedin-link-previews.mdx` (embeds the tool above the fold).

## German Landing Page (`/linkedin-vorschau`)

A single scoped German landing page (a capped experiment, not site-wide i18n). It reuses the `<Tool/>` component with the tool UI kept in English and original German marketing copy around it: hero, "So funktioniert's", benefits, an honest note that Unicode bold/italic has no glyphs for the umlauts (a/o/u) or sz, a DSGVO / local-processing angle, and a German FAQ + CTA. Targets the clean-intent long-tails ("linkedin post vorschau", "linkedin beitrag vorschau", "linkedin post formatieren"). Ships German `FAQPage` + `SoftwareApplication` (`inLanguage: de-DE`) JSON-LD and declares reciprocal hreflang with the homepage via `Metadata.alternates.languages`. No next-intl or locale routing was added.

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
