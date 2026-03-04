# Conventions

## Naming

### Files & Folders

- Components: kebab-case files (e.g., `editor-panel.tsx`, `auth-provider.tsx`)
- Utilities: kebab-case (e.g., `draft-url.ts`, `content-scoring.ts`)
- Routes/pages: kebab-case folders (e.g., `app/dashboard/editor/page.tsx`)
- Hooks: kebab-case with `use-` prefix (e.g., `use-drafts.ts`, `use-branding.ts`)
- Config: kebab-case (e.g., `config/site.ts`, `config/ai.ts`)
- Types: kebab-case (e.g., `types/blog.ts`)
- API route co-located files: `route.schema.ts` (Zod schemas), `route.utils.ts` (utility functions)
- No index.ts barrel files - import directly from the source file

### Variables & Functions

- Variables and functions: `camelCase` (e.g., `draftCount`, `parseBranding`)
- Module-level constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`, `SYSTEM_PROMPT`, `POST_FORMATS`)
- Event handlers: prefix with `handle` (e.g., `handleCopy`, `handleFileChange`, `handleSubmit`)
- Boolean variables: prefix with `is`, `has`, `should`, `can` (e.g., `isLoading`, `hasError`, `canEdit`)
- Component props types: suffix with `Props` (e.g., `EditorPanelProps`)

## Code Style

- **Imports**: Enforced by `@ianvs/prettier-plugin-sort-imports`. Order: react, next, third-party, then internal groups (`@/env`, `@/types`, `@/config`, `@/lib`, `@/hooks`, `@/components/ui`, `@/components`, `@/styles`, `@/app`), then relative. Blank line between external and internal groups.
- **Exports**: Named exports only. Default exports only for `page.tsx`, `layout.tsx`, and route handlers. Export types separately with `export type`.
- **Functions**: Arrow functions (`const fn = () => {}`) for utilities and handlers. Function declarations (`function Component()`) for React components.
- **Types**: Use `type` keyword for all type definitions (not `interface`). Inline simple prop types directly in function signature if 3 or fewer props.
- **Comments**: Only when logic is non-obvious. No JSDoc on internal functions. No chatty or referential comments. Structural section labels (e.g., `// -- State --`) are fine.
- **Formatting**: Prettier config - 4-space indent, no semicolons, single quotes, jsxSingleQuote, 120 char width, bracketSameLine. Class sorting by `prettier-plugin-tailwindcss`.

## Component Patterns

Structure within each component file:

1. Imports
2. Type definitions
3. Component function
4. Helper functions below the component

- **Props**: Destructure in function signature. Required props first, optional last. Use `type Props = { ... }`.
- **State**: Local state with `useState`. No global state library. Shared state via React Context (AuthProvider pattern). URL state via `useSearchParams`.
- **Styling**: Tailwind classes directly on elements. Conditional classes via `cn()` from `lib/utils.ts`. Never CSS-in-JS. Never inline styles. Never CSS modules.
- **File structure**: One component per file. Co-locate sub-components in the same directory. Group by feature (`dashboard/`, `tool/`, `feedback/`).
- **No inline utilities**: Utility/helper functions (date formatting, color mapping, text extraction, data migration) belong in `lib/`, not in component files. Component files should only contain React components and component-specific display constants.
- **Server vs Client**: Server components by default. Add `'use client'` only for interactivity (event handlers, hooks, browser APIs). Keep `'use client'` boundaries as small as possible.
- **Static generation**: Use static site generation (SSG) everywhere possible. Pages without dynamic per-request data should be statically generated at build time. Use `generateStaticParams()` for dynamic routes (blog posts, compare pages). Only use server-side rendering when the page depends on request-time data (e.g. cookies, search params).
- **Shared components**: Reuse existing components before creating new ones. Extract shared UI patterns into `components/ui/` or feature-level shared components. Avoid duplicating similar layouts, cards, or interactive patterns across pages.
- **Dynamic imports**: Use `dynamic(() => import(...), { ssr: false })` for client-heavy components (TipTap editor). Never import SSR-false components in server components directly.

## State Management

- **Server state**: Server components fetch data directly from Supabase. No React Query or SWR.
- **Client state**: `useState` for local UI state. `useContext` for shared auth (`AuthProvider`). Custom hooks for domain logic (`use-drafts`, `use-branding`).
- **Form state**: Controlled components with `useState`. No form library currently.
- **URL state**: `useSearchParams` for editor draft selection. Wrap consumers in `<Suspense>`.
- **Persistence**: Supabase for all user data (drafts, branding, AI usage). No localStorage for data. localStorage only for UI preferences.

## API Route Conventions

Every API route handler follows the same structure:

```
1. Parse request body (try/catch around .json())
2. Validate with Zod (safeParse) - return 400 on failure
3. Authenticate via createClient() + getUser() - return 401 if no user
4. Check rate limit via check_and_record_usage RPC - return 429 if exceeded
5. Execute business logic (AI call, database query) in try/catch - return 500 on failure
6. Return success response via Response.json()
```

- **Response format**: Use `Response.json()` (native Web API), not `NextResponse.json()`.
- **Error format**: Return `{ error: string, code: string }` with appropriate HTTP status. Error codes are defined in `config/ai.ts` (e.g. `RATE_LIMITED`, `AUTH_REQUIRED`).
- **Validation**: Zod schemas for all request body validation. Return the Zod error message in the 400 response.
- **Streaming**: For streaming responses (chat), use `streamText()` from Vercel AI SDK and return `result.toUIMessageStreamResponse()`.
- **Timeouts**: Export `maxDuration` for routes that may take longer than Vercel's default (e.g., `export const maxDuration = 30` for AI generation).
- **Rate limiting**: All AI endpoints must enforce rate limits via Supabase RPC `check_and_record_usage`. Rate limits defined in `config/ai.ts`.

## Error Handling

- **Client errors**: Toast notifications via Sonner for user-facing errors. `console.error` for debugging. Parse API errors with `parseAIError()` on client.
- **Validation**: Zod schemas for API request validation. `@t3-oss/env-nextjs` for environment variables. No client-side form validation library.
- **Graceful degradation**: AI features fail open in development (999 remaining). PostHog is uninitialized in dev - always use optional chaining: `posthog?.capture()` (never `posthog.capture()`).
- **Loading states**: Use skeleton screens for content loading. Use spinner for action buttons. Every async operation must show a loading indicator.
- **Error states**: Add `error.tsx` in route segments that have async data fetching. At minimum, the root `app/error.tsx` must exist as a catch-all.

## Performance

- **Memoization**: Don't memoize by default. Use `useCallback` only in components that pass callbacks to expensive child components or use them in dependency arrays. Use `useMemo` only for expensive computations. Never use `React.memo` unless profiling shows a real problem.
- **Images**: Always use `next/image`. Set `priority` on above-the-fold / LCP images. Provide `sizes` for responsive images (e.g., `sizes='(max-width: 768px) 100vw, 768px'`). Don't set `loading='lazy'` explicitly - it's the default. Use `placeholder='blur'` only with static imports.
- **Bundle size**: Keep public pages lean - no heavy client-side JS. Use `dynamic(() => import(...), { ssr: false })` for large client components. Prefer lightweight libraries. Avoid importing full icon sets or utility libraries.
- **Environment variables**: Always access through `env.mjs` (validated by `@t3-oss/env-nextjs`), never read `process.env` directly.

## Accessibility

- Add `aria-label` to all icon-only buttons (e.g., `<Button size='icon' aria-label='Close'>`)
- Add `aria-hidden='true'` to decorative icons and images that don't convey meaning
- Use semantic HTML elements (`nav`, `main`, `section`, `article`, `aside`, `header`, `footer`)
- Ensure all interactive elements are keyboard accessible (focusable, operable with Enter/Space)
- Provide meaningful `alt` text for informational images. Use `alt=''` for purely decorative images
- Use `role` attributes when semantic HTML alone doesn't convey the UI pattern (e.g., `role='radiogroup'` for custom button groups)

## Git Conventions

- **Branch naming**: `feat/short-description`, `fix/short-description`, `chore/short-description`
- **Commit messages**: Conventional Commits format. Imperative mood. Examples: `feat: add carousel editor`, `fix: sidebar active state`, `chore: update dependencies`, `docs: add architecture doc`
- **PR conventions**: One feature per PR. Include description and test plan.

## Do / Don't

### Do

- Protect SEO at all times - never break existing URLs, always generate proper metadata, and keep Core Web Vitals healthy
- Add `generateMetadata()` to every new public page with title, description, Open Graph, and canonical URL
- Use server components by default
- Use path aliases (`@/components`, `@/lib`, `@/hooks`)
- Use `cn()` for conditional Tailwind classes
- Use `next/image` for all images with appropriate `priority` and `sizes`
- Use `next/link` for all internal navigation
- Use semantic HTML elements and proper ARIA attributes
- Handle loading and error states for every async operation
- Use `data-[active=true]:` syntax for data attribute selectors in Tailwind v4
- Wrap `useSearchParams` consumers in `<Suspense>`
- Run `pnpm type-check` before pushing (build ignores TS errors)
- Use Sonner for toast notifications
- Use the Supabase client from `useAuth()` context in dashboard components
- Use static generation (SSG) for all pages that don't depend on request-time data
- Reuse existing shared components before creating new ones
- Return `{ error, code }` from all API error responses
- Access environment variables through `env.mjs`, never `process.env` directly

### Don't

- Don't use `any` type - use `unknown` if type is truly unknown
- Don't leave `console.log` in committed code
- Don't use inline styles or CSS-in-JS
- Don't install new packages without documenting rationale
- Don't use em dashes in copy/text - use single hyphens
- Don't add chatty or referential comments
- Don't use `interface` - use `type` for all type definitions
- Don't use barrel/index.ts files
- Don't use `data-active:` shorthand in Tailwind v4 (use `data-[active=true]:`)
- Don't use `data-checked:` for Radix Switch (use `data-[state=checked]:`)
- Don't add `ThemeProvider` outside of dashboard layout (homepage is light-only)
- Don't import TipTap `EditorPanel` in server components (it is SSR: false)
- Don't use `useEffect` for data fetching - use server components or hooks
- Don't hardcode colors - use CSS custom properties via Tailwind
- Don't add features, refactoring, or improvements beyond what was asked
- Don't break existing URLs or remove public pages without a redirect plan
- Don't ship public pages without metadata (title, description, OG tags)
- Don't add heavy client-side JS to public pages (hurts Core Web Vitals and SEO)
- Don't duplicate component patterns - extract shared UI into reusable components
- Don't use server-side rendering when static generation would work
- Don't wrap callbacks in `useCallback` or values in `useMemo` unless there is a concrete performance reason
- Don't use `NextResponse.json()` in API routes - use `Response.json()` (native Web API)
- Don't set `loading='lazy'` on `next/image` - it's the default
