# Architecture

## Overview

LinkedIn Post Preview is a Next.js 16 application deployed on Vercel. It consists of two main parts:

1. **The Tool** — A client-side rich text editor with a live LinkedIn post preview
2. **The Blog** — SEO-optimized MDX articles about LinkedIn best practices

## Tech Stack

| Layer               | Technology                                  |
| ------------------- | ------------------------------------------- |
| Framework           | Next.js 16 (App Router, Turbopack)          |
| Runtime             | React 19                                    |
| Language            | TypeScript (strict)                         |
| Styling             | Tailwind CSS 3, tailwindcss-animate         |
| UI Components       | shadcn/ui (Radix UI primitives)             |
| Rich Text Editor    | TipTap (StarterKit, Underline, Placeholder) |
| Blog/MDX            | Contentlayer 0.3.4 + next-contentlayer      |
| Syntax Highlighting | Shiki + @shikijs/rehype                     |
| Analytics           | Google Tag Manager, PostHog                 |
| Feedback            | Tally.so (popup SDK)                        |
| Env Validation      | @t3-oss/env-nextjs + Zod                    |
| Linting             | ESLint 9 (flat config), Prettier            |
| Git Hooks           | Husky + lint-staged                         |
| Animations          | Framer Motion                               |
| Deployment          | Vercel                                      |

## Directory Structure

```
.
├── app/                      # Next.js App Router
│   ├── page.tsx              # Home (landing + tool)
│   ├── layout.tsx            # Root layout (GTM, Tally, feedback FAB)
│   ├── blog/[slug]/          # Blog post pages (SSG)
│   ├── llms.txt/             # AI content discovery endpoint
│   ├── rss.xml/              # RSS feed (dynamic route)
│   ├── sitemap.ts            # Dynamic sitemap
│   └── robots.ts             # Robots.txt
├── components/
│   ├── tool/                 # Editor + preview panel
│   │   ├── editor-panel.tsx  # TipTap editor with copy/image actions
│   │   ├── toolbar.tsx       # Formatting toolbar
│   │   └── preview/          # LinkedIn preview (header, content, reactions, actions)
│   ├── blog/                 # Blog components (cards, share, search)
│   ├── feedback/             # Tally.so feedback components
│   ├── home/                 # Landing page sections
│   ├── mdx/                  # MDX rendering + custom components
│   ├── tracking/             # PostHog TrackClick wrapper
│   └── ui/                   # shadcn/ui primitives
├── config/                   # Static config (site, routes, blog authors, feedback)
├── contents/blog/            # MDX blog post files
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities, blog helpers, MDX plugins
├── types/                    # TypeScript type definitions
└── public/                   # Static assets (images, favicons)
```

## Build Pipeline

```
pnpm build
  → NODE_ENV=production contentlayer build   (compile MDX → .contentlayer/generated/)
  → next build                               (build Next.js app with Turbopack)
```

### Why Contentlayer Runs Separately

Contentlayer 0.3.4 has a compatibility issue with React 19. When `NODE_ENV` is not explicitly `production`, contentlayer's esbuild compiles MDX using React's dev JSX transform (`jsxDEV`). React 19's `jsxDEV` calls `getOwner()`, which doesn't exist on the production dispatcher, causing a `t.getOwner is not a function` crash during static page generation.

**The fix** has two parts:

1. Run `NODE_ENV=production contentlayer build` as a separate step before `next build` (ensures production JSX transform)
2. A custom `useMDXComponent` hook in `components/mdx/mdx.tsx` patches the runtime by mapping `jsxDEV → jsx` as a safety net

The `withContentlayer` Next.js plugin was removed because it re-runs contentlayer during `next build`, potentially overwriting the production output.

## Routing

| Route          | Type    | Description                                  |
| -------------- | ------- | -------------------------------------------- |
| `/`            | Static  | Landing page with tool, features, FAQ        |
| `/blog`        | Static  | Blog index with search                       |
| `/blog/[slug]` | SSG     | Individual blog posts (generateStaticParams) |
| `/llms.txt`    | Dynamic | AI-readable site content index               |
| `/rss.xml`     | Dynamic | RSS feed                                     |
| `/sitemap.xml` | Dynamic | XML sitemap                                  |
| `/robots.txt`  | Dynamic | Robots directives                            |

## Analytics & Tracking

### PostHog

Initialized via `instrumentation-client.ts` (Next.js 16 client instrumentation). Traffic is reverse-proxied through `/ingest` → `eu.i.posthog.com` to avoid ad blockers.

Tracked events:

- `post_copied` — user copies formatted text
- `image_added` / `image_removed` — image actions
- `formatting_applied` — toolbar formatting (bold, italic, etc.)
- `preview_size_changed` — mobile/tablet/desktop toggle
- `feedback_button_clicked` — feedback FAB click
- `article_helpful_voted` — blog helpfulness vote
- `blog_article_shared` — social share button click
- `blog_search_performed` — blog search (debounced)
- `blog_article_clicked` — blog post card click
- `github_link_clicked` — GitHub link click
- `cta_button_clicked` / `cta_card_clicked` — CTA interactions

### Google Tag Manager

Loaded via the `<GTM>` component in the root layout.

## Feedback System (Tally.so)

Four touchpoints, all using Tally.so popup forms:

1. **Post-Copy Rating** — popup after 2nd+ copy action (1.5s delay, session + 7-day cooldowns)
2. **Floating FAB** — fixed bottom-right button on all pages
3. **Article Helpfulness** — thumbs up/down on blog posts with per-slug localStorage cooldown
4. **Footer Link** — "Share Feedback" in the footer

Configuration is centralized in `config/feedback.ts`. The Tally SDK is loaded lazily via `next/script` in `components/feedback/tally-script.tsx`.

## Environment Variables

Validated at build time via `@t3-oss/env-nextjs` in `env.mjs`:

| Variable                                | Required | Purpose                  |
| --------------------------------------- | -------- | ------------------------ |
| `NEXT_PUBLIC_GTM_MEASUREMENT_ID`        | Yes      | Google Tag Manager       |
| `NEXT_PUBLIC_POSTHOG_KEY`               | Yes      | PostHog analytics        |
| `NEXT_PUBLIC_TALLY_POSTCOPY_FORM_ID`    | No       | Post-copy feedback form  |
| `NEXT_PUBLIC_TALLY_FEEDBACK_FORM_ID`    | No       | General feedback form    |
| `NEXT_PUBLIC_TALLY_HELPFULNESS_FORM_ID` | No       | Article helpfulness form |

## SEO

- JSON-LD schemas: Organization, WebSite, SoftwareApplication (home), Article + BreadcrumbList (blog posts), HowTo (tutorial posts)
- Open Graph and Twitter Card meta tags on all pages
- Canonical URLs
- Dynamic sitemap and RSS feed
- `llms.txt` for AI content discovery
