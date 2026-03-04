# Architecture

## High-Level Overview

Monolithic Next.js 16.1 App Router application deployed as a single Vercel project. Three main areas:

1. **The Tool** - A fully client-side TipTap rich text editor with live LinkedIn post preview. Available on the homepage (`/`) and as an embeddable variant (`/embed`). No server-side state - all draft persistence is handled client-side or via Supabase.
2. **The Blog** - SEO-optimized MDX articles processed at build time via Contentlayer. Server components render content statically.
3. **The Dashboard** - Posts management (`/dashboard`), editor (`/dashboard/editor`), branding settings (`/dashboard/branding`), and user settings (`/dashboard/settings`). Backed by Supabase via anonymous auth - no signup required.

Server components fetch data where possible. Client components handle editor interactivity. Auth is anonymous Supabase sessions (signInAnonymously) - users get a persistent identity without ever seeing a login screen.

## Data Models

### Draft

| Field      | Type        | Constraints                     | Description                               |
| ---------- | ----------- | ------------------------------- | ----------------------------------------- |
| id         | text        | PK                              | UUID, generated client-side               |
| user_id    | uuid        | FK auth.users, NOT NULL         | Owner (anonymous user)                    |
| title      | text        | nullable                        | Auto-extracted from first line of content |
| content    | jsonb       | nullable                        | TipTap editor JSON document               |
| media      | jsonb       | nullable                        | Image/video data (base64 or URL)          |
| status     | text        | CHECK draft/scheduled/published | Post lifecycle status                     |
| label      | text        | nullable                        | Content format label (e.g. "Case Study")  |
| word_count | integer     | nullable                        | Computed from content                     |
| char_count | integer     | nullable                        | Computed from content                     |
| created_at | timestamptz | NOT NULL, default now()         | Creation timestamp                        |
| updated_at | timestamptz | NOT NULL, default now()         | Last modification                         |

**Relationships:** A Draft belongs to one User (via user_id FK to auth.users).

### Branding

| Field      | Type        | Constraints             | Description                  |
| ---------- | ----------- | ----------------------- | ---------------------------- |
| user_id    | uuid        | PK, FK auth.users       | One branding record per user |
| data       | jsonb       | NOT NULL                | All branding fields as JSON  |
| updated_at | timestamptz | NOT NULL, default now() | Last modification            |

The `data` jsonb contains: profile (avatarUrl, name, headline), positioning (statement), role, expertise (topics array), writingStyle (language, sentenceLength, postLength, emojiFrequency), footer (enabled, text), knowledgeBase (notes), dosDonts (dos[], donts[]), inspiration (posts[], creators[]).

**Relationships:** One-to-one with User.

### AI Usage

| Field      | Type        | Constraints                                               | Description          |
| ---------- | ----------- | --------------------------------------------------------- | -------------------- |
| id         | uuid        | PK, default gen_random_uuid()                             | Usage record ID      |
| user_id    | uuid        | FK auth.users, NOT NULL                                   | Who used the feature |
| action     | text        | CHECK (generation/refinement/analysis/wizard/quickAction) | Which AI feature     |
| created_at | timestamptz | NOT NULL, default now()                                   | When used            |

**Relationships:** Many AI Usage records per User.

### Post Analysis

| Field             | Type        | Constraints   | Description                         |
| ----------------- | ----------- | ------------- | ----------------------------------- |
| id                | uuid        | PK            | Analysis record ID                  |
| user_id           | uuid        | FK auth.users | Who requested                       |
| post_text         | text        |               | Original post content               |
| content_length    | integer     |               | Input metric                        |
| line_count        | integer     |               | Input metric                        |
| hashtag_count     | integer     |               | Input metric                        |
| emoji_count       | integer     |               | Input metric                        |
| has_formatting    | boolean     |               | Input metric                        |
| has_image         | boolean     |               | Input metric                        |
| score             | integer     |               | Overall quality 1-100               |
| hook_score        | integer     |               | First-line impact                   |
| readability_score | integer     |               | Structure and clarity               |
| cta_score         | integer     |               | CTA effectiveness                   |
| engagement_score  | integer     |               | Predicted engagement 1-10           |
| topics            | text[]      |               | 1-3 topic tags                      |
| sentiment         | text        |               | positive/neutral/negative           |
| category          | text        |               | thought_leadership/storytelling/etc |
| tone              | text        |               | professional/casual/inspirational   |
| has_hook          | boolean     |               | Whether post has a hook             |
| has_cta           | boolean     |               | Whether post has a CTA              |
| hook_quality      | text        |               | weak/moderate/strong                |
| strengths         | text[]      |               | List of strengths                   |
| improvements      | text[]      |               | List of improvements                |
| created_at        | timestamptz |               | When analyzed                       |

**Relationships:** Many Post Analysis records per User.

## API Routes

| Method | Path             | Description                         | Auth         | Request Body                                         | Response                                         |
| ------ | ---------------- | ----------------------------------- | ------------ | ---------------------------------------------------- | ------------------------------------------------ |
| POST   | /api/chat        | Multi-turn AI chat for post editing | Anon session | `{ messages: Message[] }`                            | SSE stream (UIMessageStreamResponse)             |
| POST   | /api/generate    | Generate or transform content       | Anon session | `{ action, content, tone?, format?, withBranding? }` | Structured JSON (hooks, posts, text)             |
| POST   | /api/suggestions | Get 3 refinement suggestions        | Anon session | `{ content: string }`                                | `{ suggestions: Suggestion[] }`                  |
| POST   | /api/analyze     | Analyze post quality                | Anon session | `{ content, metrics }`                               | `{ score, scores, classification, suggestions }` |
| POST   | /api/extract     | Extract text from URL or file       | Anon session | URL: `{ url: string }`, File: `FormData`             | `{ text: string, title?: string }`               |

Generate actions: `hooks` (4 hook options), `posts` (2 full variants), `variation`, `shorten`, `lengthen`, `restyle`, `apply-suggestion`.

Rate limits (per user per day): generation: 1, refinement: 3, analysis: 20, wizard: 5, quickAction: 10. Enforced via Supabase RPC `check_and_record_usage` with row-level locking.

**Error format**: All API routes return errors as `{ error: string, code: string }` with the appropriate HTTP status code. Error codes are defined in `config/ai.ts` (`RATE_LIMITED`, `AUTH_REQUIRED`, `INVALID_INPUT`, `GENERATION_FAILED`). All routes export `maxDuration = 30`.

**Prompts**: All AI prompts (system and user) are centralized in `config/prompts.ts`. Route handlers import prompt constants/builders from there - no inline prompt strings in route files.

**Route file structure**: Each API route uses co-located files: `route.ts` (handler only), `route.schema.ts` (Zod schemas), and optionally `route.utils.ts` (utility functions). Route handlers contain no inline schemas or utility functions.

**PostHog proxy**: The `/ingest/*` path is not an API route - it is a Next.js rewrite in `next.config.mjs` that proxies requests to `eu.i.posthog.com`.

## Auth & Authorization

- **Auth method**: Supabase anonymous auth (`signInAnonymously`) - no signup, no email, no passwords
- **Session handling**: Supabase manages JWT in cookies, refreshed via `proxy.ts` on every request (Next.js 16 middleware replacement)
- **Roles**: None - all users are anonymous with equal access
- **Authorization rules**:
    - RLS policies ensure users can only CRUD their own rows in `drafts`, `branding`, `ai_usage`, and `post_analyses`
    - Rate limiting enforced via the `check_and_record_usage` Supabase RPC, which uses row-level locking to prevent concurrent abuse
    - No admin role exists - all management is done directly in Supabase Studio

## File & Folder Structure

```
project-root/
├── app/
│   ├── (main)/              # Public pages with header + footer layout
│   │   ├── page.tsx         # Homepage with the tool
│   │   ├── blog/            # Blog listing + [slug] article pages
│   │   ├── changelog/       # Changelog page
│   │   └── compare/         # Tool comparison pages
│   ├── dashboard/           # Dashboard with sidebar layout + AuthProvider
│   │   ├── page.tsx         # Posts list (tanstack table)
│   │   ├── editor/          # TipTap editor page
│   │   ├── branding/        # Branding settings page
│   │   └── settings/        # User settings page
│   ├── api/
│   │   ├── chat/            # AI chat endpoint (streaming)
│   │   ├── generate/        # Content generation endpoint
│   │   ├── analyze/         # Post analysis endpoint
│   │   ├── extract/         # Content extraction from URL/file
│   │   └── suggestions/     # Refinement suggestions endpoint
│   ├── embed/               # Embeddable tool variant (minimal layout)
│   └── preview/             # Feed preview page
├── components/
│   ├── dashboard/           # Dashboard shell, auth provider, sidebar, post list
│   ├── tool/                # TipTap editor + LinkedIn preview panel
│   ├── ui/                  # shadcn/ui primitives (Button, Dialog, Sheet, etc.)
│   ├── shadcn-demo/         # shadcn demo components (used by app/dash-example/)
│   ├── mdx/                 # MDX rendering + syntax highlighting components
│   ├── feedback/            # Tally.so feedback FAB, article helpfulness
│   └── tracking/            # PostHog TrackClick wrapper for server components
├── config/                  # Static config (site metadata, routes, AI limits, prompts, feedback)
├── contents/                # MDX source files (blog posts, changelog, compare pages)
├── hooks/                   # Custom React hooks (drafts, branding, auth, clipboard, etc.)
├── lib/
│   ├── supabase/            # Server/client Supabase instances + CRUD for drafts/branding
│   └── mdx/plugins/         # Remark and rehype plugins for MDX processing
├── types/                   # Shared TypeScript type definitions
├── styles/                  # globals.css - Tailwind v4 theme via @theme + @plugin
├── supabase/migrations/     # Numbered SQL migration files
├── public/                  # Static assets (images, fonts, og images)
├── proxy.ts                 # Session refresh on every request (replaces middleware.ts in Next 16)
├── env.mjs                  # Environment variable validation via @t3-oss/env-nextjs
├── contentlayer.config.ts   # MDX content pipeline configuration
└── next.config.mjs          # Next.js config (rewrites for PostHog proxy, image domains)
```

## Integrations

| Service            | Integration Method                  | Trigger                                               | Notes                                                                                             |
| ------------------ | ----------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Supabase           | @supabase/ssr client                | Every dashboard page load, all API route handlers     | Anonymous auth, RLS, RPC for rate limiting. Server client in API routes, browser client in hooks. |
| OpenAI             | @ai-sdk/openai via Vercel AI SDK v6 | POST to /api/\* AI routes                             | Model configurable via LLM_MODEL env var, defaults to gpt-4o-mini                                 |
| PostHog            | posthog-js SDK                      | Client-side page views + custom events                | Reverse-proxied through /ingest to eu.i.posthog.com. Uninitialized in dev.                        |
| Tally.so           | Script injection + window.Tally     | After copy action (feedback FAB), article helpfulness | Hidden fields: source, pageUrl, copyCount. Single form for all touchpoints.                       |
| Google Tag Manager | Script tag in root layout           | Page load                                             | Measurement ID from NEXT_PUBLIC_GTM_MEASUREMENT_ID                                                |
| Contentlayer       | Build-time MDX processing           | pnpm build / pnpm dev                                 | Runs as a separate step before next build for React 19 compatibility                              |

## Environment Variables

| Variable                       | Description                    | Required                  | Example                 |
| ------------------------------ | ------------------------------ | ------------------------- | ----------------------- |
| NODE_ENV                       | Runtime environment            | Yes                       | production              |
| LLM_API_KEY                    | OpenAI API key for AI features | Yes (server)              | sk-...                  |
| LLM_MODEL                      | OpenAI model name              | No (default: gpt-4o-mini) | gpt-4o                  |
| NEXT_PUBLIC_GTM_MEASUREMENT_ID | Google Tag Manager ID          | Yes (client)              | GTM-XXXXX               |
| NEXT_PUBLIC_POSTHOG_KEY        | PostHog project key            | Yes (client)              | phc\_...                |
| NEXT_PUBLIC_SUPABASE_URL       | Supabase project URL           | Yes (client)              | https://xxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY  | Supabase anonymous key         | Yes (client)              | eyJ...                  |
| NEXT_PUBLIC_TALLY_FORM_ID      | Tally.so form ID               | No (client)               | wMqOab                  |
