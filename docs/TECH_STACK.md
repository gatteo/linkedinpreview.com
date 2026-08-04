# Tech Stack

## Overview

Next.js 16.1 App Router monolith deployed on Vercel with Supabase backend for persistence and anonymous auth.

## Stack

| Category  | Technology              | Version | Rationale                                                      |
| --------- | ----------------------- | ------- | -------------------------------------------------------------- |
| Framework | Next.js                 | 16.1    | App Router, Turbopack, React Server Components                 |
| Language  | TypeScript              | 5.x     | Strict mode enabled                                            |
| Styling   | Tailwind CSS            | 4.x     | CSS-first config, oklch colors, @theme/@plugin/@custom-variant |
| Database  | Supabase (PostgreSQL)   | -       | Auth, storage, RLS policies                                    |
| Auth      | Supabase Anonymous Auth | -       | No signup required, transparent session creation               |
| Hosting   | Vercel                  | -       | Edge network, preview deploys, serverless functions            |
| Runtime   | React                   | 19.2    | Server components, concurrent features                         |

## Key Packages

| Package                               | Purpose                      | Why this one                                                                                                                                                                                                                      |
| ------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @tiptap/react + extensions            | Rich text editor             | Extensible, ProseMirror-based, markdown-like formatting                                                                                                                                                                           |
| emoji-mart + @emoji-mart/data         | Emoji picker in the toolbar  | Native code points (`set: 'native'`) paste cleanly into LinkedIn and need no sprite CDN. The ~1.4MB data file is dynamic-imported on first open, so it stays out of the initial bundle on the public SEO pages the tool mounts on |
| @ai-sdk/openai + @ai-sdk/react        | AI text generation/streaming | Vercel AI SDK v6 for streamText and generateObject                                                                                                                                                                                |
| @supabase/supabase-js + @supabase/ssr | Database client + SSR auth   | Server/client Supabase with cookie-based sessions                                                                                                                                                                                 |
| contentlayer                          | MDX blog pipeline            | Type-safe content processing for blog/changelog/compare                                                                                                                                                                           |
| @tanstack/react-table                 | Data tables                  | Headless table for posts list with sorting/filtering                                                                                                                                                                              |
| next-themes                           | Theme switching              | Dark mode for dashboard, light-only for public pages                                                                                                                                                                              |
| posthog-js                            | Analytics (client)           | Event tracking, reverse-proxied through /ingest                                                                                                                                                                                   |
| posthog-node                          | Analytics (server)           | Server events from onboarding routes + Stripe webhook                                                                                                                                                                             |
| @t3-oss/env-nextjs                    | Environment validation       | Type-safe env vars with Zod schemas                                                                                                                                                                                               |
| sonner                                | Toast notifications          | Lightweight, accessible toast system                                                                                                                                                                                              |
| clsx + tailwind-merge                 | Class utilities              | Conditional Tailwind classes via cn()                                                                                                                                                                                             |
| pako (via CompressionStream)          | Draft URL compression        | Share drafts via compressed URL params                                                                                                                                                                                            |
| featurebase-js                        | Support messenger            | React provider + hooks, portal-only mount                                                                                                                                                                                         |
| jose                                  | JWT signing                  | ESM-friendly HS256 for the Featurebase identity JWT                                                                                                                                                                               |

## Third-Party Services

| Service            | Purpose              | Integration method                                       |
| ------------------ | -------------------- | -------------------------------------------------------- |
| Supabase           | Auth + DB + RLS      | @supabase/ssr, anonymous sessions, RPC functions         |
| Vercel             | Hosting + serverless | Automatic deploys from GitHub, preview deploys           |
| OpenAI             | LLM for AI features  | Via @ai-sdk/openai, model configurable via LLM_MODEL env |
| PostHog            | Product analytics    | Client SDK, reverse-proxied via /ingest rewrites         |
| Tally.so           | Feedback forms       | Script injection, popup forms with hidden fields         |
| Featurebase        | Support messenger    | featurebase-js/react, dashboard-only, JWT identity       |
| Google Tag Manager | Marketing analytics  | GTM container loaded in root layout                      |

## Development Tools

| Tool                | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| ESLint 9            | Flat config with unused-imports/no-unused-imports: error     |
| Prettier            | 4-space indent, no semicolons, single quotes, jsxSingleQuote |
| Husky + lint-staged | Pre-commit: eslint --fix + prettier on staged files          |
| pnpm                | Package manager (v9.12.3)                                    |
| Turbopack           | Next.js dev server bundler                                   |

## Decision Log

- Tailwind CSS v4 over v3: CSS-first config eliminates tailwind.config.ts, native oklch colors, @theme directive
- Supabase anonymous auth over no auth: enables server-side rate limiting and data persistence without requiring user signup
- Contentlayer over next-mdx-remote: type-safe content at build time, computed fields, but requires a React 19 workaround (see ARCHITECTURE.md)
- TipTap over Lexical/Slate: mature ecosystem, extensive extension library, ProseMirror foundation
- Vercel AI SDK v6 over direct OpenAI SDK: unified streaming/generation API, framework integration, useCompletion/useChat hooks
- prettier-plugin-tailwindcss over eslint-plugin-tailwindcss: eslint plugin incompatible with TW v4
- No test runner configured: trade-off for speed, type-check + lint as quality gates
- No syntax highlighter (removed shiki + @shikijs/rehype + @shikijs/transformers): the content set is LinkedIn how-to writing, not code tutorials - 207 MDX documents held one fenced block and no inline highlighting. Shiki cost ~10.5 minutes of every Vercel build against 12 seconds of actual `next build`. Fenced code renders as plain text inside the existing `Pre` frame. Re-adding it means restoring the rehype plugins with a module-scoped highlighter (see ARCHITECTURE.md "Build & Deploy")
