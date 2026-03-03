# Architecture

## Overview

LinkedIn Post Preview is a Next.js 16 application deployed on Vercel. It consists of three main parts:

1. **The Tool** - A client-side rich text editor with a live LinkedIn post preview
2. **The Blog** - SEO-optimized MDX articles about LinkedIn best practices
3. **The Dashboard** - A full post management dashboard with Supabase-backed persistence

## Tech Stack

| Layer               | Technology                                  |
| ------------------- | ------------------------------------------- |
| Framework           | Next.js 16 (App Router, Turbopack)          |
| Runtime             | React 19                                    |
| Language            | TypeScript (strict)                         |
| Styling             | Tailwind CSS 4, tw-animate-css              |
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
| Database            | Supabase (PostgreSQL + Auth + RLS)          |
| AI                  | Vercel AI SDK v6 + OpenAI                   |
| Data Tables         | @tanstack/react-table                       |
| Deployment          | Vercel                                      |

## Directory Structure

```
.
├── app/
│   ├── (main)/               # Route group for public pages (header + footer layout)
│   │   ├── page.tsx          # Home (landing + tool)
│   │   ├── blog/[slug]/      # Blog post pages (SSG)
│   │   ├── changelog/        # Changelog page
│   │   └── compare/          # Competitor comparison pages
│   ├── dashboard/            # Dashboard (own layout: sidebar, ThemeProvider, AuthProvider)
│   │   ├── layout.tsx        # Sidebar inset layout + auth wrapper
│   │   ├── page.tsx          # Posts list (default landing)
│   │   ├── editor/           # TipTap editor with ?draft= param
│   │   ├── branding/         # Branding settings (avatar, name, headline, etc.)
│   │   └── settings/         # Appearance, export/import, danger zone
│   ├── api/                  # AI endpoints (analyze, chat, suggestions, generate, extract)
│   ├── embed/                # Minimal embeddable tool variant
│   ├── preview/              # Standalone preview page
│   ├── llms.txt/             # AI content discovery endpoint
│   ├── rss.xml/              # RSS feed (dynamic route)
│   ├── sitemap.ts            # Dynamic sitemap
│   └── robots.ts             # Robots.txt
├── components/
│   ├── tool/                 # Editor + preview panel (shared between homepage and dashboard)
│   │   ├── editor-panel.tsx  # TipTap editor with copy/image actions
│   │   ├── toolbar.tsx       # Formatting toolbar
│   │   ├── ai-actions.tsx    # Quick AI action buttons
│   │   └── preview/          # LinkedIn preview (header, content, reactions, actions)
│   ├── dashboard/            # Dashboard-specific components
│   │   ├── auth-provider.tsx # Anonymous Supabase auth context
│   │   ├── dashboard-sidebar.tsx  # Navigation sidebar with draft list
│   │   ├── dashboard-editor.tsx   # Editor page with resizable panels
│   │   ├── posts-table.tsx   # TanStack Table for draft management
│   │   ├── branding-form.tsx # Branding settings form
│   │   ├── settings-form.tsx # Settings (theme, export, reset)
│   │   ├── creation-wizard/  # Guided post creation flow
│   │   ├── analyze-panel.tsx # AI-powered post analysis
│   │   └── getting-started-checklist.tsx  # Onboarding checklist
│   ├── blog/                 # Blog components (cards, share, search)
│   ├── feedback/             # Tally.so feedback components
│   ├── home/                 # Landing page sections
│   ├── mdx/                  # MDX rendering + custom components
│   ├── tracking/             # PostHog TrackClick wrapper
│   └── ui/                   # shadcn/ui primitives
├── config/                   # Static config (site, routes, authors, feedback, AI)
├── contents/                 # MDX content (blog, changelog, compare pages)
├── hooks/                    # Custom React hooks
├── lib/
│   ├── supabase/             # Supabase clients + data layer (drafts, branding)
│   └── ...                   # Utilities, blog helpers, MDX plugins
├── supabase/migrations/      # SQL migrations (schema, RLS policies)
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

| Route                 | Type    | Description                                  |
| --------------------- | ------- | -------------------------------------------- |
| `/`                   | Static  | Landing page with tool, features, FAQ        |
| `/blog`               | Static  | Blog index with search                       |
| `/blog/[slug]`        | SSG     | Individual blog posts (generateStaticParams) |
| `/changelog`          | Static  | Product changelog                            |
| `/compare/[slug]`     | SSG     | Competitor comparison pages                  |
| `/embed`              | Static  | Embeddable tool variant                      |
| `/preview`            | Static  | Standalone preview page                      |
| `/dashboard`          | Client  | Posts list (default dashboard landing)       |
| `/dashboard/editor`   | Client  | TipTap editor (`?draft=` param)              |
| `/dashboard/branding` | Client  | Branding settings                            |
| `/dashboard/settings` | Client  | Appearance, export/import, danger zone       |
| `/api/analyze`        | API     | AI post analysis (scoring, suggestions)      |
| `/api/chat`           | API     | AI chat for post refinement                  |
| `/api/suggestions`    | API     | AI improvement suggestions                   |
| `/api/generate`       | API     | AI post generation                           |
| `/api/extract`        | API     | Content extraction from URLs                 |
| `/llms.txt`           | Dynamic | AI-readable site content index               |
| `/rss.xml`            | Dynamic | RSS feed                                     |
| `/sitemap.xml`        | Dynamic | XML sitemap                                  |
| `/robots.txt`         | Dynamic | Robots directives                            |

## Dashboard Architecture

The dashboard (`/dashboard`) is a standalone section with its own layout, sidebar navigation, and auth system. It does not share the main site's header/footer.

### Layout

```
┌─────────────────────────────────────────────────────┐
│                 max-w-[1500px] mx-auto              │
│ ┌──────────┐ ┌────────────────────────────────────┐ │
│ │          │ │  SidebarInset (rounded, shadow)     │ │
│ │ Sidebar  │ │ ┌──────────────────────────────────┐│ │
│ │ (inset)  │ │ │ PageHeader                       ││ │
│ │          │ │ ├──────────────────────────────────┤│ │
│ │ - Posts  │ │ │                                  ││ │
│ │ - Editor │ │ │ Scrollable content area          ││ │
│ │ - Brand  │ │ │                                  ││ │
│ │ - Sett.  │ │ │                                  ││ │
│ │          │ │ └──────────────────────────────────┘│ │
│ │ Drafts   │ └────────────────────────────────────┘ │
│ │ Checklist│                                        │
│ └──────────┘                                        │
└─────────────────────────────────────────────────────┘
```

- Uses shadcn sidebar `variant='inset'` for the boxed content look (rounded corners, shadow, margin)
- Entire layout constrained to viewport height (`h-svh`) - no page scrolling, only content area scrolls
- `SidebarProvider` overridden with `!min-h-0 h-full` to prevent its hardcoded `min-h-svh` from breaking the viewport constraint
- Centered on large screens with `max-w-[1500px]`
- `ThemeProvider` scoped to dashboard only (homepage is light-only)

### Auth

Anonymous Supabase auth via `AuthProvider` (`components/dashboard/auth-provider.tsx`):

- Creates an anonymous session on first visit (no sign-up required)
- Exposes `useAuth()` hook with `{ isReady, userId, supabase }`
- All dashboard hooks wait for `isReady` before making Supabase calls
- `AuthGate` component shows loading state until auth is ready

### Persistence (Supabase)

Two tables with row-level security (RLS):

**`public.drafts`** - User's post drafts

- Columns: `id`, `user_id`, `title`, `content` (TipTap JSON), `media` (image data), `label`, `status` (draft/scheduled/published), `word_count`, `char_count`, `created_at`, `updated_at`
- CRUD: `lib/supabase/drafts.ts` (`fetchDrafts`, `fetchDraft`, `createDraft`, `updateDraft`, `deleteDraft`, `duplicateDraft`)
- Hook: `hooks/use-drafts.ts` (async mutations, optimistic updates)

**`public.branding`** - Single row per user for branding settings

- Columns: `user_id`, `data` (JSONB), `updated_at`
- CRUD: `lib/supabase/branding.ts` (`fetchBranding`, `upsertBranding`)
- Hook: `hooks/use-branding.ts`

**localStorage migration**: On first dashboard load, `AuthProvider` checks for old localStorage keys (`lp-drafts-manifest`, `lp-branding`) and migrates data to Supabase, then sets `lp-migrated-to-supabase` flag.

### AI Integration

API routes in `app/api/` use Vercel AI SDK v6 + OpenAI:

| Endpoint           | Purpose                            | Rate Limit |
| ------------------ | ---------------------------------- | ---------- |
| `/api/analyze`     | Score post and provide suggestions | 20/day     |
| `/api/chat`        | Conversational post refinement     | 3/day      |
| `/api/suggestions` | Inline improvement suggestions     | 3/day      |
| `/api/generate`    | Full post generation from prompt   | 1/day      |
| `/api/extract`     | Extract content from URLs          | -          |

Rate limits are per anonymous user, configured in `config/ai.ts`.

## Analytics & Tracking

### PostHog

Initialized via `instrumentation-client.ts` (Next.js 16 client instrumentation). Traffic is reverse-proxied through `/ingest` → `eu.i.posthog.com` to avoid ad blockers.

Tracked events:

- `post_copied` - user copies formatted text
- `image_added` / `image_removed` - image actions
- `formatting_applied` - toolbar formatting (bold, italic, etc.)
- `preview_size_changed` - mobile/tablet/desktop toggle
- `feedback_button_clicked` - feedback FAB click
- `article_helpful_voted` - blog helpfulness vote
- `blog_article_shared` - social share button click
- `blog_search_performed` - blog search (debounced)
- `blog_article_clicked` - blog post card click
- `github_link_clicked` - GitHub link click
- `cta_button_clicked` / `cta_card_clicked` - CTA interactions

### Google Tag Manager

Loaded via the `<GTM>` component in the root layout.

## Feedback System (Tally.so)

A single Tally.so form (star rating + optional comment) is used across four touchpoints:

1. **Post-Copy Rating** - popup after 2nd+ copy action (1.5s delay, session + 7-day cooldowns)
2. **Floating FAB** - fixed bottom-right button on all pages
3. **Article Helpfulness** - thumbs up/down on blog posts with per-slug localStorage cooldown
4. **Footer Link** - "Share Feedback" in the footer

Each touchpoint passes hidden fields (`source`, `pageUrl`, `copyCount`) to identify context. Configuration is centralized in `config/feedback.ts`. The Tally SDK is loaded lazily via `next/script` in `components/feedback/tally-script.tsx`.

## Environment Variables

Validated at build time via `@t3-oss/env-nextjs` in `env.mjs`:

| Variable                         | Required | Purpose                 |
| -------------------------------- | -------- | ----------------------- |
| `NODE_ENV`                       | Yes      | Environment (server)    |
| `LLM_API_KEY`                    | Yes      | OpenAI API key (server) |
| `LLM_MODEL`                      | No       | Model override (server) |
| `NEXT_PUBLIC_GTM_MEASUREMENT_ID` | Yes      | Google Tag Manager      |
| `NEXT_PUBLIC_POSTHOG_KEY`        | Yes      | PostHog analytics       |
| `NEXT_PUBLIC_SUPABASE_URL`       | Yes      | Supabase project URL    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Yes      | Supabase anonymous key  |
| `NEXT_PUBLIC_TALLY_FORM_ID`      | No       | Tally.so feedback form  |

## SEO

- JSON-LD schemas: Organization, WebSite, SoftwareApplication (home), Article + BreadcrumbList (blog posts), HowTo (tutorial posts)
- Open Graph and Twitter Card meta tags on all pages
- Canonical URLs
- Dynamic sitemap and RSS feed
- `llms.txt` for AI content discovery
