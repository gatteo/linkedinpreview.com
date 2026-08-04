# Architecture

## High-Level Overview

Monolithic Next.js 16.1 App Router application deployed as a single Vercel project. Three main areas:

1. **The Tool** - A fully client-side TipTap rich text editor with live LinkedIn post preview. Available on the homepage (`/`) and as an embeddable variant (`/embed`). No server-side state - all draft persistence is handled client-side or via Supabase.
2. **The Blog** - SEO-optimized MDX articles processed at build time via Contentlayer. Server components render content statically.
3. **The Dashboard** - Posts management (`/dashboard`), editor (`/dashboard/editor`), content calendar (`/dashboard/calendar`), branding settings (`/dashboard/branding`), content strategy (`/dashboard/strategy`), and user settings (`/dashboard/settings`). Backed by Supabase via anonymous auth - no signup required. Wave 4 adds optional LinkedIn publishing/scheduling on top of the anonymous session (see Integrations).

Server components fetch data where possible. Client components handle editor interactivity. Auth is anonymous Supabase sessions (signInAnonymously) - users get a persistent identity without ever seeing a login screen.

## Data Models

### Draft

| Field             | Type        | Constraints                            | Description                               |
| ----------------- | ----------- | -------------------------------------- | ----------------------------------------- |
| id                | text        | PK                                     | UUID, generated client-side               |
| user_id           | uuid        | FK auth.users, NOT NULL                | Owner (anonymous user)                    |
| title             | text        | nullable                               | Auto-extracted from first line of content |
| content           | jsonb       | nullable                               | TipTap editor JSON document               |
| media             | jsonb       | nullable                               | Image/video data (base64 or URL)          |
| status            | text        | CHECK draft/scheduled/published/failed | Post lifecycle status                     |
| label             | text        | nullable                               | Content format label (e.g. "Case Study")  |
| word_count        | integer     | nullable                               | Computed from content                     |
| char_count        | integer     | nullable                               | Computed from content                     |
| scheduled_at      | timestamptz | nullable                               | When to auto-publish (Wave 4)             |
| published_at      | timestamptz | nullable                               | When the post went live (Wave 4)          |
| linkedin_post_urn | text        | nullable                               | URN of the created LinkedIn post (Wave 4) |
| linkedin_post_url | text        | nullable                               | Public URL of the LinkedIn post (Wave 4)  |
| publish_error     | text        | nullable                               | Last publish failure message (Wave 4)     |
| publish_attempts  | integer     | NOT NULL, default 0                    | Cron retry counter (Wave 4)               |
| publish_lock_at   | timestamptz | nullable                               | Claim lock for atomic publishing (Wave 4) |
| created_at        | timestamptz | NOT NULL, default now()                | Creation timestamp                        |
| updated_at        | timestamptz | NOT NULL, default now()                | Last modification                         |

**Relationships:** A Draft belongs to one User (via user_id FK to auth.users).

The Wave 4 columns above are added in `supabase/migrations/010_post_scheduling.sql`; the `failed`
status, the `idx_drafts_due` index, and the `claim_due_linkedin_posts` (service-role) and
`claim_draft_for_publish` (authenticated) RPCs that gate atomic, idempotent publishing live there too.

### Branding

| Field      | Type        | Constraints             | Description                  |
| ---------- | ----------- | ----------------------- | ---------------------------- |
| user_id    | uuid        | PK, FK auth.users       | One branding record per user |
| data       | jsonb       | NOT NULL                | All branding fields as JSON  |
| updated_at | timestamptz | NOT NULL, default now() | Last modification            |

The `data` jsonb contains: profile (avatarUrl, name, headline), positioning (statement), role, expertise (topics array), writingStyle (language, sentenceLength, postLength, emojiFrequency), footer (enabled, text), knowledgeBase (notes), dosDonts (dos[], donts[]), inspiration (posts[], creators[]), meta (onboardedAt - ISO timestamp that gates the onboarding modal; see feature 068).

**Relationships:** One-to-one with User.

### AI Usage

| Field      | Type        | Constraints                                               | Description          |
| ---------- | ----------- | --------------------------------------------------------- | -------------------- |
| id         | uuid        | PK, default gen_random_uuid()                             | Usage record ID      |
| user_id    | uuid        | FK auth.users, NOT NULL                                   | Who used the feature |
| action     | text        | CHECK (generation/refinement/analysis/wizard/quickAction) | Which AI feature     |
| created_at | timestamptz | NOT NULL, default now()                                   | When used            |

**Relationships:** Many AI Usage records per User.

### Strategy

| Field      | Type        | Constraints             | Description                  |
| ---------- | ----------- | ----------------------- | ---------------------------- |
| user_id    | uuid        | PK, FK auth.users       | One strategy record per user |
| data       | jsonb       | NOT NULL                | All strategy fields as JSON  |
| updated_at | timestamptz | NOT NULL, default now() | Last modification            |

The `data` jsonb contains: goals (array), audience (description), postsPerWeek (number), formatMix (record of format to percentage), positioning (AI-generated statement).

**Relationships:** One-to-one with User.

### LinkedIn Connection

| Field        | Type        | Constraints             | Description                                        |
| ------------ | ----------- | ----------------------- | -------------------------------------------------- |
| user_id      | uuid        | PK, FK auth.users       | One LinkedIn connection per user                   |
| linkedin_sub | text        | NOT NULL                | LinkedIn person id (URN is `urn:li:person:{sub}`)  |
| name         | text        | nullable                | Cached member display name                         |
| picture_url  | text        | nullable                | Cached member avatar URL                           |
| scope        | text        | nullable                | Granted OAuth scopes                               |
| access_token | text        | nullable                | AES-256-GCM ciphertext; `null` once disconnected   |
| expires_at   | timestamptz | NOT NULL                | Token expiry (~60 days; no refresh for self-serve) |
| created_at   | timestamptz | NOT NULL, default now() | Creation timestamp                                 |
| updated_at   | timestamptz | NOT NULL, default now() | Last modification                                  |

Table + RLS in `supabase/migrations/009_linkedin_connections.sql`; migration `011_linkedin_login.sql`
makes `linkedin_sub` **unique** and `access_token` **nullable**. The `access_token` is encrypted at
rest (`lib/linkedin/crypto.ts`, key `LINKEDIN_TOKEN_ENC_KEY`) before it ever reaches the database, so
a leaked row is useless without the server-only key. RLS keys every CRUD policy on
`auth.uid() = user_id`; the cron publisher reads across users via the service-role key, which bypasses
RLS.

**LinkedIn as login.** Because LinkedIn doubles as the login (the app has no password/login screen),
`linkedin_sub` is the stable identity and is unique — one LinkedIn identity owns at most one account.
"Connected for publishing" means **a row exists AND `access_token IS NOT NULL`**; Disconnect clears the
token but keeps the row so the `linkedin_sub → account` mapping survives for future logins. The
account-resolution lookup (`findUserIdByLinkedInSub`) runs on the service-role client because RLS hides
other users' rows.

**Relationships:** One-to-one with User.

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

| Method | Path                      | Description                                                                                      | Auth                              | Request Body                                         | Response                                                                             |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| POST   | /api/chat                 | Multi-turn AI chat for post editing                                                              | Anon session                      | `{ messages: Message[] }`                            | SSE stream (UIMessageStreamResponse)                                                 |
| POST   | /api/generate             | Generate or transform content                                                                    | Anon session                      | `{ action, content, tone?, format?, withBranding? }` | Structured JSON (hooks, posts, text)                                                 |
| POST   | /api/suggestions          | Get 3 refinement suggestions                                                                     | Anon session                      | `{ content: string }`                                | `{ suggestions: Suggestion[] }`                                                      |
| POST   | /api/analyze              | Analyze post quality                                                                             | Anon session                      | `{ content, metrics }`                               | `{ score, scores, classification, suggestions }`                                     |
| POST   | /api/extract              | Extract text from URL or file                                                                    | Anon session                      | URL: `{ url: string }`, File: `FormData`             | `{ text: string, title?: string }`                                                   |
| POST   | /api/strategy/positioning | Generate AI positioning statement                                                                | Anon session                      | `{ role, expertise, audience, goals }`               | `{ positioning: string }`                                                            |
| POST   | /api/strategy/formats     | AI format mix recommendations                                                                    | Anon session                      | `{ role, goals, expertise }`                         | `{ formats: FormatRecommendation[] }`                                                |
| POST   | /api/ideas                | Generate weekly AI post ideas                                                                    | Anon session                      | `{ strategy, branding, recentDrafts }`               | `{ ideas: PostIdea[] }`                                                              |
| GET    | /api/linkedin/auth        | Start LinkedIn OAuth (sets CSRF state cookie; `?from=onboarding` marks the return page)          | Anon session                      | `?from=onboarding` (optional)                        | 302 redirect to LinkedIn consent                                                     |
| GET    | /api/linkedin/callback    | OAuth callback: token exchange, then resolve account (attach / reconnect / login-switch / block) | Session                           | `?code&state` (query)                                | 302 to Settings, or to `/dashboard` for onboarding-origin statuses (`?linkedin=...`) |
| POST   | /api/linkedin/switch      | Complete a pending login-switch (signed cookie); optional draft merge                            | Session + switch cookie           | `{ merge: boolean }`                                 | `{ ok: true }`                                                                       |
| GET    | /api/linkedin/status      | Integration + connection status                                                                  | Session                           | -                                                    | `{ configured, connection }`                                                         |
| POST   | /api/linkedin/disconnect  | Clear the stored token (keeps the identity mapping)                                              | Session                           | -                                                    | `{ ok: true }`                                                                       |
| POST   | /api/linkedin/publish     | Publish a draft to LinkedIn now                                                                  | Session                           | `{ draftId }` (Zod)                                  | `{ ok, url, urn }`                                                                   |
| GET    | /auth/confirm             | Verify the email-confirmation link (anon → permanent account); optional same-origin `next`       | Session + token_hash              | `?token_hash&type[&next]` (query)                    | 302 redirect to Settings (`?email=...`), or to `next`                                |
| GET    | /api/cron/publish         | Vercel Cron: publish due scheduled posts                                                         | CRON_SECRET bearer (service-role) | -                                                    | `{ ok, processed, published, failed }`                                               |
| POST   | /api/billing/checkout     | Create an embedded Stripe Checkout session for a plan                                            | Anon session                      | `{ plan: 'monthly' \| 'lifetime' }` (Zod)            | `{ clientSecret }`                                                                   |
| POST   | /api/billing/webhook      | Stripe webhook: sync plan state into `billing` (service-role)                                    | Stripe signature                  | Stripe event payload                                 | `{ received: true }`; 400 on bad signature, 500 on handler error so Stripe retries   |
| POST   | /api/billing/portal       | Create a Stripe Customer Portal session (manage/cancel/invoices)                                 | Anon session + Stripe customer    | -                                                    | `{ url }`                                                                            |
| GET    | /api/featurebase/jwt      | Sign the Featurebase messenger identity JWT (HS256, `userId` = Supabase user id)                 | Anon session                      | -                                                    | `{ jwt }` (503 `NOT_CONFIGURED` when secret unset)                                   |

Generate actions: `hooks` (4 hook options), `posts` (2 full variants), `variation`, `shorten`, `lengthen`, `restyle`, `apply-suggestion`.

**LinkedIn / cron routes (Wave 4)**: `/api/linkedin/publish` validates its body with Zod, checks the
session, and requires a live (configured, connected, unexpired) connection; it claims the draft via
the `claim_draft_for_publish` RPC for idempotency and exports `maxDuration = 60`. `/api/cron/publish`
is authenticated by a `CRON_SECRET` bearer token (not a user session), uses the service-role admin
client (`lib/supabase/admin.ts`) to claim due posts via `claim_due_linkedin_posts`, is
reconciliation-based/idempotent, and exports `maxDuration = 60`. LinkedIn error codes live in
`config/linkedin.ts` (`LINKEDIN_NOT_CONFIGURED`, `LINKEDIN_NOT_CONNECTED`, `LINKEDIN_TOKEN_EXPIRED`,
`LINKEDIN_PUBLISH_FAILED`, `LINKEDIN_RATE_LIMITED`, plus the shared `AUTH_REQUIRED`/`INVALID_INPUT`).
These routes are not rate-limited via `check_and_record_usage` (they are not LLM endpoints).

**LinkedIn as login (callback resolution)**: `/api/linkedin/callback` resolves the OAuth-verified
`linkedin_sub` against existing accounts (`findUserIdByLinkedInSub`, service-role) and branches:
**attach** the connection + convert the anonymous user (email link via `/auth/confirm` + profile/
branding seeding in `lib/linkedin/identity-sync.ts`) when the identity is new; **reconnect** (refresh
token) when it already belongs to the current user; **login-switch** when it belongs to another account
and the current session is anonymous — refresh that account's token, then sign into it by minting a
magic-link server-side (`admin.generateLink` → `verifyOtp`, in `lib/linkedin/account-link.ts`); and
**block** (`?linkedin=linked-elsewhere`) when the current session is already a different saved account.
If the anonymous session has drafts, the switch is deferred to `/api/linkedin/switch` behind a
confirmation (optional draft merge); the `{from,to}` pair travels in a short-lived AES-GCM-encrypted
httpOnly cookie so the client only ever sends a `merge` boolean (identity is never client-supplied).

Rate limits (per user per day): generation: 1, refinement: 3, analysis: 20, wizard: 5, quickAction: 10. Enforced via Supabase RPC `check_and_record_usage` with row-level locking.

**Error format**: All API routes return errors as `{ error: string, code: string }` with the appropriate HTTP status code. Error codes are defined in `config/ai.ts` (`RATE_LIMITED`, `AUTH_REQUIRED`, `INVALID_INPUT`, `GENERATION_FAILED`). Routes export `maxDuration = 30` by default; publish/cron/import routes use 60, `/api/onboarding/enrich` uses 60 (its fast profile fetch waits up to 18s on Scrapingdog before a bounded 8s LLM call), and `/api/onboarding/insights` uses 120 because its LLM chain runs in `after()` past the 202 response (the client polls GET for the result). The enrich budgets are ordered `maxDuration 60s > client failsafe 45s > client fetch budget 40s`; changing one without the others reintroduces unattributable timeouts.

**Prompts**: All AI prompts (system and user) are centralized in `config/prompts.ts`. Route handlers import prompt constants/builders from there - no inline prompt strings in route files.

**Route file structure**: Each API route uses co-located files: `route.ts` (handler only), `route.schema.ts` (Zod schemas), and optionally `route.utils.ts` (utility functions). Route handlers contain no inline schemas or utility functions.

**PostHog proxy**: The `/ingest/*` path is not an API route - it is a Next.js rewrite in `next.config.mjs` that proxies requests to `eu.i.posthog.com`.

## Auth & Authorization

- **Auth method**: Supabase anonymous auth (`signInAnonymously`) by default - no signup screen, no passwords
- **Account conversion (optional)**: A guest converts to a permanent, cross-device account **without changing `user.id`** - either by binding an email (`supabase.auth.updateUser({ email })`, confirmed via `/auth/confirm`) or by connecting LinkedIn. The stable id keeps drafts, billing, and onboarding owned by the same user. Re-login is passwordless email OTP (`signInWithOtp` → `verifyOtp`); LinkedIn stays the secondary path. `AuthProvider` additionally exposes `user/email/pendingEmail/isAnonymous` and subscribes to `onAuthStateChange`; the sidebar footer account menu (`account-menu.tsx`) and the Settings **Account** card (`account-login-form.tsx`) surface identity + plan and gate logout on a durable identity (email or LinkedIn), so an identity-less guest sees "Save your account" instead of a data-losing sign-out. LinkedIn OAuth remains a custom access-token store (`linkedin_connections`), not a Supabase auth identity.
- **Session handling**: Supabase manages JWT in cookies, refreshed via `proxy.ts` on every request (Next.js 16 middleware replacement)
- **Roles**: None - all users are anonymous with equal access
- **Authorization rules**:
    - RLS policies ensure users can only CRUD their own rows in `drafts`, `branding`, `strategy`, `ai_usage`, `post_analyses`, and `linkedin_connections`
    - The cron publisher (`/api/cron/publish`) authenticates with a `CRON_SECRET` bearer and uses the service-role key (bypasses RLS) to read due posts and tokens across users; it is the only path that does so
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
│   │   ├── calendar/        # Content calendar (month/week) page
│   │   ├── branding/        # Branding settings page
│   │   ├── strategy/        # Content strategy wizard + dashboard page
│   │   └── settings/        # User settings page (incl. LinkedIn connection)
│   ├── api/
│   │   ├── chat/            # AI chat endpoint (streaming)
│   │   ├── generate/        # Content generation endpoint
│   │   ├── analyze/         # Post analysis endpoint
│   │   ├── extract/         # Content extraction from URL/file
│   │   ├── suggestions/     # Refinement suggestions endpoint
│   │   ├── strategy/
│   │   │   ├── positioning/ # AI positioning statement generation
│   │   │   └── formats/     # AI format mix recommendations
│   │   ├── ideas/           # Weekly AI post ideas generation
│   │   ├── linkedin/        # OAuth (auth/callback), status, disconnect, publish
│   │   └── cron/publish/    # Vercel Cron scheduled-post publisher
│   ├── embed/               # Embeddable tool variant (minimal layout)
│   └── preview/             # Feed preview page
├── components/
│   ├── dashboard/           # Dashboard shell, auth provider, sidebar, post list, LinkedIn + publish controls
│   │   ├── strategy/        # Content strategy wizard + dashboard UI components
│   │   └── calendar/        # Content calendar grid (month/week, drag-to-reschedule)
│   ├── tool/                # TipTap editor + LinkedIn preview panel
│   │   └── extensions/      # Custom TipTap marks (fontStyle: the four Unicode font styles)
│   ├── ui/                  # shadcn/ui primitives (Button, Dialog, Sheet, etc.)
│   ├── shadcn-demo/         # shadcn demo components (used by app/dash-example/)
│   ├── mdx/                 # MDX rendering components (headings, tables, code frame, embeds)
│   ├── feedback/            # Tally.so feedback FAB, article helpfulness
│   └── tracking/            # PostHog TrackClick wrapper for server components
├── config/                  # Static config (site metadata, routes, AI limits, prompts, feedback)
├── contents/                # MDX source files (blog posts, changelog, compare pages)
├── hooks/                   # Custom React hooks (drafts, branding, auth, clipboard, public-tool draft persistence, etc.)
├── lib/
│   ├── draft-media.ts       # IndexedDB handoff of an attached image/video from the editor to the /preview tab
│   ├── supabase/            # Server/client/admin Supabase instances + CRUD, migration
│   ├── linkedin/            # OAuth, token crypto, Posts API + media upload, connections, serialize, grapheme char-count + 3000 limit, public-profile fetch (fast onboarding tier) + rich-scrape (Bright Data async tier)
│   └── mdx/plugins/         # Remark and rehype plugins for MDX processing (heading slugs/TOC, Substack image cleanup). No syntax highlighter.
├── types/                   # Shared TypeScript type definitions
├── styles/                  # globals.css - Tailwind v4 theme via @theme + @plugin
├── supabase/migrations/     # Numbered SQL migration files
├── scripts/
│   └── vercel-build-gate.sh # Ignored Build Step: skips deploys whose diff cannot change output
├── public/                  # Static assets (images, fonts, og images)
├── proxy.ts                 # Session refresh on every request (replaces middleware.ts in Next 16)
├── env.mjs                  # Environment variable validation via @t3-oss/env-nextjs
├── contentlayer.config.ts   # MDX content pipeline configuration
├── vercel.json              # Vercel Cron schedules + `ignoreCommand` build gate
└── next.config.mjs          # Next.js config (rewrites for PostHog proxy, image domains)
```

## Integrations

| Service            | Integration Method                                                                | Trigger                                                                                           | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase           | @supabase/ssr client                                                              | Every dashboard page load, all API route handlers                                                 | Anonymous auth, RLS, RPC for rate limiting. Server client in API routes, browser client in hooks.                                                                                                                                                                                                                                                                                                                                                                                           |
| OpenAI             | @ai-sdk/openai via Vercel AI SDK v6                                               | POST to /api/\* AI routes                                                                         | Model configurable via LLM_MODEL env var, defaults to gpt-4o-mini                                                                                                                                                                                                                                                                                                                                                                                                                           |
| PostHog            | posthog-js SDK (client) + posthog-node (server)                                   | Client-side page views + custom events; server events from the onboarding routes + Stripe webhook | Reverse-proxied through /ingest to eu.i.posthog.com; server capture goes direct via `lib/analytics/server.ts` inside `after()`. Persons are identified with the Supabase user id (`AuthProvider`). Uninitialized/inert in dev. Event dictionary: `docs/analytics/onboarding-funnel.md`.                                                                                                                                                                                                     |
| Tally.so           | Script injection + window.Tally                                                   | After copy action (feedback FAB), article helpfulness                                             | Hidden fields: source, pageUrl, copyCount. Single form for all touchpoints.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Featurebase        | featurebase-js/react (`FeaturebaseProvider` in `components/featurebase-root.tsx`) | Dashboard layout mount only (portal-only; public pages, /embed, /preview never load it)           | Support messenger + feedback. Sidebar "Help & Feedback" opens it via `useFeaturebase().show`. Theme follows next-themes (`FeaturebaseThemeSync` polls for the messenger root, then `setTheme`). Identity: `FeaturebaseIdentity` fetches `/api/featurebase/jwt` once auth is ready; anonymous until `FEATUREBASE_JWT_SECRET` is set. `shutdown()` wired at data reset, debug clear-everything, and LinkedIn login-switch.                                                                    |
| Google Tag Manager | Script tag in root layout (`components/gtm.tsx`)                                  | After analytics consent only                                                                      | Measurement ID from NEXT_PUBLIC_GTM_MEASUREMENT_ID. Consent-gated: loads only when the cookie banner (`components/consent-banner.tsx`, state in `lib/consent.ts`) is accepted. PostHog boots cookieless (memory persistence, replay off) until accept, then upgrades at runtime (`hooks/use-consent.ts`). The banner defers rendering while any dialog is open (`hooks/use-modal-open.ts`, watches `body[data-scroll-locked]`) so it never paints over a full-screen modal like onboarding. |
| Contentlayer       | Build-time MDX processing                                                         | pnpm build / pnpm dev                                                                             | Runs as a separate step before next build for React 19 compatibility                                                                                                                                                                                                                                                                                                                                                                                                                        |
| LinkedIn           | OAuth 2.0 / OpenID Connect + REST Posts API (`Linkedin-Version` header)           | Connect from Settings; publish from editor; Vercel Cron for scheduled posts                       | Wave 4. Tokens encrypted at rest (AES-256-GCM). Self-serve apps get no refresh token (60-day token, member reconnects). Configured only when the LinkedIn env vars are set; not live-verified.                                                                                                                                                                                                                                                                                              |
| Vercel Cron        | Scheduled GET to `/api/cron/publish`                                              | `vercel.json` schedule (`* * * * *`)                                                              | Publishes due scheduled posts. Per-minute schedule requires Vercel Pro; Hobby cron runs once/day. Auth via `CRON_SECRET`.                                                                                                                                                                                                                                                                                                                                                                   |

## Build & Deploy

Every push builds on Vercel; merging to `main` builds the same commit a second time as production. Keeping a single build cheap is therefore worth roughly double.

**Build shape** (~16s locally end to end): `contentlayer build` compiles 207 MDX documents (~5s), then `next build` compiles and prerenders 260 routes (~11s). The two run as separate steps, separated by `;` not `&&`, so `next build` still runs if contentlayer exits non-zero - contentlayer 0.3.4 throws a harmless `ERR_INVALID_ARG_TYPE` from clipanion on exit after writing its output.

**MDX plugins are instantiated per document.** Unified calls each plugin factory once per file, so any expensive resource a plugin builds must be cached at _module_ scope, never in the factory closure. A closure-scoped Shiki highlighter cost ~3s x 207 documents - about 10.5 minutes of every Vercel build, against 12 seconds of actual `next build`. Syntax highlighting has since been removed entirely (the content set had one fenced block and no inline highlighting); fenced code renders as plain text inside `components/mdx/pre.tsx`, which supplies the frame, the copy button and the styling.

**Build gate.** `vercel.json` sets `ignoreCommand` to `scripts/vercel-build-gate.sh`, Vercel's Ignored Build Step. It exits 0 to skip a build and 1 to run one, and only skips when the diff touches nothing but `docs/`, `*.md`, `.github/`, `.husky/`, `.claude/`, `.agents/`, `.cursor/`, `LICENCE` and `.prettierignore`. Note `*.md` does not match `*.mdx`, so blog, changelog and compare content always builds. It diffs against `VERCEL_GIT_PREVIOUS_SHA` (the last successfully deployed commit, exposed only when an ignore step is configured) so a run of skipped commits cannot hide a change, and falls back to `HEAD^`. It fails open: an unusable diff base builds. `[deploy]` anywhere in the commit message forces a build.

## Environment Variables

| Variable                       | Description                                                                                                                                                                                                                                                                                                                              | Required                  | Example                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------- |
| NODE_ENV                       | Runtime environment                                                                                                                                                                                                                                                                                                                      | Yes                       | production                        |
| LLM_API_KEY                    | OpenAI API key for AI features                                                                                                                                                                                                                                                                                                           | Yes (server)              | sk-...                            |
| LLM_MODEL                      | OpenAI model name                                                                                                                                                                                                                                                                                                                        | No (default: gpt-4o-mini) | gpt-4o                            |
| LLM_ANALYSIS_MODEL             | Model for the one-shot onboarding analysis calls (profile inference, post insights) - low volume, quality-critical labeling                                                                                                                                                                                                              | No (default: gpt-5-mini)  | gpt-5-mini                        |
| NEXT_PUBLIC_GTM_MEASUREMENT_ID | Google Tag Manager ID                                                                                                                                                                                                                                                                                                                    | Yes (client)              | GTM-XXXXX                         |
| NEXT_PUBLIC_POSTHOG_KEY        | PostHog project key                                                                                                                                                                                                                                                                                                                      | Yes (client)              | phc\_...                          |
| NEXT_PUBLIC_SUPABASE_URL       | Supabase project URL                                                                                                                                                                                                                                                                                                                     | Yes (client)              | https://xxx.supabase.co           |
| NEXT_PUBLIC_SUPABASE_ANON_KEY  | Supabase anonymous key                                                                                                                                                                                                                                                                                                                   | Yes (client)              | eyJ...                            |
| LINKEDIN_CLIENT_ID             | LinkedIn app client id                                                                                                                                                                                                                                                                                                                   | No (server, Wave 4)       | 86abc...                          |
| LINKEDIN_CLIENT_SECRET         | LinkedIn app client secret                                                                                                                                                                                                                                                                                                               | No (server, Wave 4)       | WPL\_...                          |
| LINKEDIN_REDIRECT_URI          | OAuth redirect override (defaults to `${site.url}/api/linkedin/callback`)                                                                                                                                                                                                                                                                | No (server, Wave 4)       | https://.../api/linkedin/callback |
| LINKEDIN_TOKEN_ENC_KEY         | AES-256-GCM key for token encryption (64-char hex; `openssl rand -hex 32`)                                                                                                                                                                                                                                                               | No (server, Wave 4)       | a1b2c3...                         |
| LINKEDIN_SCRAPE_API_URL        | Scrape/residential-proxy API returning a target URL's raw HTML, used to fetch public profiles for onboarding enrichment from datacenter IPs. Unset = direct-request fallback. Called as `${URL}?url=<target>`.                                                                                                                           | No (server)               | https://scrape.example/get        |
| LINKEDIN_SCRAPE_API_KEY        | Optional Bearer token for `LINKEDIN_SCRAPE_API_URL`                                                                                                                                                                                                                                                                                      | No (server)               | (api key)                         |
| SCRAPINGDOG_API_KEY            | Scrapingdog LinkedIn profile API - the FAST onboarding enrichment tier (synchronous ~3-8s, feeds the Reassure profile card incl. location/languages/experience/awards). Unset = JSON-LD direct fetch fallback (works locally, usually blocked on Vercel).                                                                                | No (server)               | (api key)                         |
| BRIGHTDATA_API_KEY             | Bright Data RICH onboarding tier: two datasets triggered in parallel per session - "LinkedIn posts" (discover-by-profile-URL: full post text, dates, reactions/comments - the analysis corpus) and "LinkedIn People Profile" (identity, followers; corpus fallback via activity items). Async minutes-scale; polled via `enrich/status`. | No (server)               | (api key)                         |
| BRIGHTDATA_LINKEDIN_DATASET_ID | Override for the Bright Data dataset id (defaults to the LinkedIn People Profile dataset)                                                                                                                                                                                                                                                | No (server)               | gd_l1viktl72bvl7bjuj0             |
| CRON_SECRET                    | Bearer token the Vercel Cron publisher sends                                                                                                                                                                                                                                                                                             | No (server, Wave 4)       | (random secret)                   |
| SUPABASE_SERVICE_ROLE_KEY      | Service-role key, used only by the cron publisher (bypasses RLS)                                                                                                                                                                                                                                                                         | No (server, Wave 4)       | eyJ...                            |

The Wave 4 LinkedIn vars are all optional: when blank the publishing/scheduling features stay inert
and the UI presents them as "not configured" (mirrors the GTM/Tally pattern). The full setup steps
are in [STATUS.md](STATUS.md) "Wave 4 setup required before it works".

**Dev-only missing-env DX**: production keeps degrading gracefully (no toasts, no leaking of which
keys are set). In development only, using a feature whose keys are missing surfaces a toast naming the
exact vars to add to `.env`. Which vars a feature needs is derived from one place per feature -
`missingLinkedInEnv()` / `missingLinkedInAnalyticsEnv()` (`config/linkedin.ts`) and `missingStripeEnv()`
(`lib/stripe.ts`), which also back the `isXConfigured()` booleans. Server routes attach a dev-only
`missing: string[]` to their not-configured responses (or `&missingEnv=` on OAuth redirects) via
`lib/dev/missing-env.ts`; the client reads it and toasts via `lib/dev/report-missing-env.ts`. On dev
boot, `instrumentation.ts` -> `lib/dev/env-audit.ts` logs every disabled integration once.
| NEXT_PUBLIC_TALLY_FORM_ID | Tally.so form ID | No (client) | wMqOab |
