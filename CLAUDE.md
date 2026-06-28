# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (contentlayer + next dev with Turbopack)
pnpm build            # Production build (contentlayer build then next build)
pnpm clean            # Clear .next, .contentlayer, tsbuildinfo
pnpm lint             # ESLint (flat config)
pnpm lint:fix         # ESLint with auto-fix
pnpm type-check       # TypeScript check (tsc --noEmit)
pnpm format           # Prettier format all files
```

**Important**: Run `pnpm clean` before `pnpm build` if the dev server was previously running (clears stale `.contentlayer` cache). The build uses a semicolon (not `&&`) so `next build` runs even if contentlayer fails - this is intentional. `typescript.ignoreBuildErrors` is true in next.config, so always run `pnpm type-check` separately. No test runner is configured.

## Architecture

Next.js 16.1 App Router + React 19 + TypeScript (strict) + Tailwind CSS 4, deployed on Vercel.

Three main areas:

1. **The Tool** (`/`) - Client-side TipTap rich text editor with live LinkedIn post preview (also available at `/embed` and `/preview`)
2. **The Blog** (`/blog`) - SEO-optimized MDX articles via Contentlayer
3. **The Dashboard** (`/dashboard`) - Posts list, editor (`/dashboard/editor`), branding settings (Supabase-backed via anonymous auth, noindex)

### Route Structure

- `app/(main)/` - Route group for public pages (header + footer layout): home, blog, changelog, compare
- `app/dashboard/` - Dashboard with its own layout (sidebar inset variant, ThemeProvider, AuthProvider). Pages: posts (root), editor, branding, settings
- `app/api/` - AI endpoints: analyze, chat, suggestions, generate (Vercel AI SDK v6 + OpenAI)
- `app/embed/` - Minimal embeddable tool variant

### Key Directories

- `components/tool/` - Editor + preview panel (TipTap, dynamically imported with ssr:false)
- `components/dashboard/` - Dashboard-specific components
- `components/ui/` - shadcn/ui primitives
- `config/` - Static config (site, routes, authors, feedback, AI)
- `contents/` - MDX content (blog, changelog, compare pages)
- `hooks/` - Custom React hooks
- `lib/` - Utilities, Supabase clients, MDX plugins
- `types/` - TypeScript type definitions

## Tailwind CSS v4

No `tailwind.config.ts`. All config is in `styles/globals.css` via `@theme`, `@plugin`, `@custom-variant`. PostCSS uses `@tailwindcss/postcss`. Colors use oklch CSS variables. Primary = LinkedIn blue. Class sorting is handled by `prettier-plugin-tailwindcss` (not eslint - incompatible with v4).

## Proxy (Not Middleware)

Next.js 16 uses `proxy.ts` at project root (not `middleware.ts`). The exported function is `proxy` (not `middleware`). Currently handles Supabase session refresh.

## Contentlayer + React 19

`withContentlayer` was removed from next.config.mjs. Build runs `NODE_ENV=production contentlayer build` as a separate step before `next build`. A custom `useMDXComponent` in `components/mdx/mdx.tsx` patches `jsxDEV -> jsx` as a safety net. See `docs/ARCHITECTURE.md` for details.

## Code Style

- **Prettier**: 4-space indent, no semicolons, single quotes, `jsxSingleQuote`, 120 char width, `bracketSameLine`
- **Import order**: Enforced by `@ianvs/prettier-plugin-sort-imports` - react, next, third-party, then internal (`@/env`, `@/types`, `@/config`, `@/lib`, `@/hooks`, `@/components/ui`, `@/components`, `@/styles`, `@/app`), then relative
- **Path alias**: Always use `@/*` imports, never deep relative paths
- **CSS**: Tailwind only, no CSS-in-JS. Conditional classes via `cn()` from `lib/utils.ts`
- **Copy/text**: Never use em dash (-). Use single hyphen (-) instead
- **Comments**: No chatty/referential comments. Structural section labels are fine
- **ESLint**: Flat config (eslint.config.mjs). `unused-imports/no-unused-imports: error`. Global ignores must be first in the config array for directory traversal to be skipped
- **Pre-commit**: Husky + lint-staged runs eslint --fix and prettier on staged files

## Analytics (PostHog)

Initialized in `instrumentation-client.ts` (production only). Reverse-proxied through `/ingest` -> `eu.i.posthog.com`. PostHog is uninitialized in dev - all calls must use optional chaining: `posthog?.capture()`. Event names use `snake_case`. `TrackClick` wrapper at `components/tracking/track-click.tsx` enables tracking from server components.

## Dashboard Persistence (Supabase)

- **Auth**: Anonymous auth via `AuthProvider` (`components/dashboard/auth-provider.tsx`). Creates a Supabase anonymous session on first visit. All dashboard hooks use `useAuth()` for the client + userId.
- **Drafts**: Stored in `public.drafts` table with RLS. CRUD via `lib/supabase/drafts.ts`. Hook: `hooks/use-drafts.ts` (async mutations, optimistic updates).
- **Branding**: Single row per user in `public.branding` table. CRUD via `lib/supabase/branding.ts`. Hook: `hooks/use-branding.ts`.
- **Migration**: On first load, `AuthProvider` checks for old localStorage keys (`lp-drafts-manifest`, `lp-branding`) and migrates to Supabase, then sets `lp-migrated-to-supabase` flag.
- `use-current-draft.ts` uses `useSearchParams` - always wrap in `<Suspense>`
- **Schema migration**: `supabase/migrations/004_dashboard_data.sql`

## Environment Variables (validated by @t3-oss/env-nextjs in env.mjs)

Server: `NODE_ENV`, `LLM_API_KEY` (required), `LLM_MODEL` (optional, defaults to gpt-4o-mini)
Client: `NEXT_PUBLIC_GTM_MEASUREMENT_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (all required), `NEXT_PUBLIC_TALLY_FORM_ID` (optional)

## AI Integration (Vercel AI SDK v6)

`useCompletion` is from `@ai-sdk/react` (not `ai/react`). For text streaming use `streamProtocol: 'text'` + `result.toTextStreamResponse()`. Rate limits defined in `config/ai.ts`.

## Tailwind CSS v4 + shadcn Gotchas

- **Data attribute selectors**: TW v4 requires `data-[active=true]:` syntax (NOT `data-active:` shorthand) unless a `@custom-variant` is registered. Same for `data-[state=open]:`, `data-[state=checked]:`, etc.
- **Radix Switch**: Uses `data-[state=checked]:`/`data-[state=unchecked]:` (Radix sets `data-state`, NOT `data-checked`)
- **SelectTrigger height override**: Use `data-[size=default]:h-9` not just `h-9`. Tailwind Merge doesn't merge conditional vs unconditional selectors.
- **SidebarProvider `min-h-svh`**: Hardcoded in the component. Override with `!min-h-0 h-full` for viewport-constrained layouts.

## Dashboard UI Patterns

- **Page layout**: Every page follows `PageHeader` (title + actions) then scrollable content. No standalone description text between header and content.
- **Scroll containment**: Outer wrapper uses `h-svh` (not `min-h-svh`). `SidebarInset` has `overflow-hidden`. Each page's content area uses `overflow-y-auto`.
- **Forms**: Use `max-w-2xl` container. Half-width fields use `max-w-sm`. Card-level descriptions go in `CardDescription`.

## Content Guidelines

Before adding any blog post or compare page, read `docs/content-guidelines.md`. Key rule: **tool/transactional queries** (formatter, editor, generator, checker, viewer, simulator, preview, "free X") get a **dedicated tool page**, never a blog post (every blog attempt at these earned 0 search impressions). Blog posts are for informational/how-to intent only, must be distinct from existing posts, and must embed the tool with a `<CtaCard>` above the fold plus internal links.

## Documentation

Always invoke the `update-docs` skill before committing, creating PRs, or finishing a branch where code was written or modified. This keeps `docs/` in sync with the codebase automatically.

## Known Gotchas

- ThemeProvider (next-themes) is scoped to dashboard layout only - homepage is light-only
- TipTap `EditorPanel` is dynamically imported with `ssr: false` - never use in server components
- The tool component has two variants (`default` and `embed`) - changes must work in both
- `next.config.mjs` has `skipTrailingSlashRedirect: true` (required for PostHog proxy)
