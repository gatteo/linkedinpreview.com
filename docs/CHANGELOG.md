# Changelog

> Dated history of meaningful changes to the product and its docs. Newest first. Each shipped
> change adds a line here (see [process/development-workflow.md](process/development-workflow.md)).
> This is the engineering changelog; the user-facing changelog lives in the app at `/changelog`.

## 2026-06-19 — Carousel creator (Wave 3, features 210-212)

- **Shipped the carousel creator at `/dashboard/carousel`** (sidebar "Carousel" is now live, not "Soon").
  A DOM-based slide/canvas editor for LinkedIn carousel (PDF document) posts: a slide rail
  (add / duplicate / delete / drag-reorder), a fixed-artboard canvas with selectable, draggable,
  resizable, rotatable elements (text via TipTap, image, shape, icon), alignment snapping, multi-select,
  keyboard nudge/delete/duplicate, and batched undo/redo. A contextual inspector edits the element,
  the slide background/role, and the deck theme/ratio/branding chrome.
- **Editor store.** A scoped `useSyncExternalStore` store (`lib/carousel/store.ts`, bound in
  `use-carousel-store.tsx`) with immutable updates and gesture-coalesced history - deliberately not a
  global state library, per conventions. Switching aspect ratio re-lays-out elements proportionally.
- **14 templates + 11 themes.** Typed slide-role template library (`lib/carousel/templates.ts`) and a
  3-tier design-token theme system with hex palettes (never the app's oklch vars, so export is
  fidelity-proof) and self-hosted Google Font pairings (`lib/carousel/{theme,fonts}.ts`).
- **AI generation.** `/api/carousel/generate` turns a topic, pasted text, or article URL (reusing
  `/api/extract`) into a themed, branding-aware deck; `/api/carousel/edit` powers per-slide
  rewrite / shorten / punch-up. Both mirror the existing `generateObject` route shape (auth, rate
  limit `carouselGenerate`, OpenAI provider) and treat user/branding content as inert reference data.
- **Export.** Client-side, watermark-free: each slide rasterized at 2x via `modern-screenshot`
  (foreignObject, so webfonts/emoji/gradients paint correctly), assembled into a flattened multi-page
  PDF with `pdf-lib`, or a ZIP of per-slide PNGs + the PDF via `fflate` (`lib/carousel/export.ts`,
  lazy-loaded). Download PDF is the primary path; native document publishing is a later best-effort add.
- **Persistence.** Carousels live in the existing `drafts` table, discriminated by a new `kind` column
  (migration 013, defaults `'post'`). `useDrafts` is now kind-scoped so carousels and text posts stay
  in separate surfaces while sharing one table and CRUD. New runtime deps: `modern-screenshot`,
  `pdf-lib`, `fflate`. Plan: [plans/carousel-creator.md](plans/carousel-creator.md).

## 2026-06-19 — Analytics dashboard (Wave 5, feature 230)

- **Shipped the Analytics dashboard at `/dashboard/analytics`** (sidebar "Analytics" is now live, not
  "Soon"). Headline KPI cards (published, impressions, engagements, avg engagement rate) with
  animated counters, 30-day deltas, and sparklines; an engagement-over-time chart (30 / 90 / all);
  a publishing-activity heatmap + streak and a draft -> scheduled -> published -> failed pipeline;
  content insights (top formats, length, best day); a golden-hour day x time grid; and a per-post
  performance table. New `components/dashboard/analytics/*`, pure aggregation in `lib/analytics/*`.
- **Layered metrics model (no LinkedIn API dependency to start).** New `post_metrics` table (migration 012) stores one engagement snapshot per published post. Members enter metrics by hand
  (`metrics-entry-dialog`) or import a LinkedIn CSV export (`lib/analytics/csv.ts`, matched to posts
  by stored URL). Null counts are treated as "unknown", never zero.
- **Content DNA correlation engine.** `lib/analytics/content-dna.ts` relates deterministic content
  features (media, length, hashtags, hook style, structure, format, posting day) to the member's own
  engagement and surfaces the strongest "drivers" (lift vs their baseline) once 4+ posts have metrics.
- **AI Insights coach.** `POST /api/analytics/insights` builds a server-side digest from the member's
  RLS-scoped data and generates grounded wins/opportunities/experiments + a next-post recommendation
  (`generateObject`, rate-limited 5/day via the new `insights` action, migration 013). Results are
  persisted per user (migration 014) so they show across devices. Day/time advice uses the client's
  timezone offset so it matches the dashboard.
- **LinkedIn auto-sync scaffold (inert).** `lib/linkedin/analytics.ts` + `app/api/cron/sync-analytics`
  pull `memberCreatorPostAnalytics` when `LINKEDIN_ANALYTICS_ENABLED` is set and the app holds the
  `r_member_postAnalytics` scope (LinkedIn Community Management API approval). Off by default; the
  dashboard runs on manual/CSV metrics until then. Spec: `docs/features/230-analytics-dashboard.md`.

## 2026-06-19 — Onboarding rebuild + dashboard UX foundations

- **Rebuilt onboarding from a placeholder into an interactive setup wizard (068).** The old 4-slide
  tutorial dialog (gray "video" placeholders, set no data) was replaced with a non-dismissable,
  animated 11-step flow: Welcome → Connect LinkedIn → Profile (with a live LinkedIn preview card) →
  Role → Goals → Audience → Expertise → Writing style → Cadence → an animated "Building your setup"
  payoff (calls `/api/strategy/{positioning,formats}` in parallel) → a "You're all set" reveal with
  on-brand confetti. Reuses the existing strategy `wizard-steps/*` and writes branding + strategy
  once at the end, so the happy path lands a fully-configured account. New
  `components/dashboard/onboarding/*` (controller, modal, steps, types, confetti).
- **Gate moved off the per-device localStorage flag.** Onboarding is now gated by
  `branding.meta.onboardedAt` (new `BrandingMeta` on the branding JSONB - no migration; merged in
  `lib/supabase/branding.ts`), so it is per-user and survives across devices. Pre-existing users
  (with a strategy or role) are silently backfilled so they are never re-prompted. The old
  `tutorial-dialog.tsx` + `lp-tutorial-seen` flag were removed.
- **LinkedIn redirect-resume.** Because OAuth navigates away, the LinkedIn step stashes wizard state
  in `localStorage` (`lp-onboarding-state`); the controller (mounted in the dashboard layout, which
  also wraps `/dashboard/settings` where the callback lands) rehydrates on return, prefills the
  synced profile, advances past the step, and cleans the URL.
- **UX foundations (from the dashboard polish plan).** Added `lib/motion.ts` (shared `EASE_OUT` +
  variants, `MotionConfig reducedMotion="user"`), a global 3D "clicky" treatment on the shadcn button
  (layered shadow, hover lift, active depress, reduced-motion safe), a reusable
  `components/dashboard/empty-state.tsx`, and a `currentColor`/`--primary` illustration set
  (`components/dashboard/illustrations/*`). Skeleton shimmer intentionally skipped (already exists).
  Confetti uses Framer Motion (no new dependency). [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) updated.
- **Verification level (honest).** `pnpm type-check`, `pnpm lint` (baseline; 2 pre-existing
  warnings), and `pnpm build` (all routes incl. `/dashboard`) pass. The end-to-end runtime flow is
  **not** yet live click-through tested and the change has **not** been through the code-quality
  review gate; feature 068's ACs are code-verified with `file:line` evidence. Tracked under the
  68 feature spec's known-gaps.

## 2026-06-17 — LinkedIn as login: account conversion, resolution & switching (PARTIAL)

- **Connect now establishes identity, not just a publish token (220).** On first connect the
  anonymous Supabase session is converted into a real, email-backed account: the LinkedIn email is
  linked (email-confirmation link handled by a new `app/auth/confirm/route.ts`), and the name/avatar
  seed the auth-user metadata and branding profile (empty-fill, never clobbering customisations).
  New `lib/linkedin/identity-sync.ts`.
- **LinkedIn doubles as login.** `app/api/linkedin/callback` now resolves the OAuth-verified
  `linkedin_sub` against existing accounts (`findUserIdByLinkedInSub`, service-role) and branches:
  attach (new identity) / reconnect (same account) / **login-switch** (identity owned by another
  account + anonymous session → sign into it) / **block** (current session is a different saved
  account). The switch mints the target account's session server-side
  (`admin.generateLink('magiclink')` → `verifyOtp`) in new `lib/linkedin/account-link.ts`. When the
  anonymous session has drafts, the switch is deferred to a new `app/api/linkedin/switch` route behind
  a "bring your drafts?" prompt (`MergePromptDialog`); the `{from,to}` pair travels in a short-lived
  AES-GCM-encrypted httpOnly cookie so the client only sends a `merge` boolean.
- **Disconnect keeps the identity mapping.** Migration `011_linkedin_login.sql` makes `linkedin_sub`
  unique and `access_token` nullable; Disconnect now clears the token but keeps the row (via
  `disconnectConnection`) so a passwordless user can always log back in. "Connected for publishing"
  means a row exists with a non-null token; publish + cron routes skip null-token rows.
- **Sidebar profile / connect CTA.** New `components/dashboard/sidebar-profile.tsx`: avatar+name when
  connected (links to Settings, with expiry/reconnect state), or a benefit-led one-click connect CTA
  when not — rendered in the sidebar footer.
- **Still PARTIAL.** Type-check, lint, and build pass; new behaviors are code-verified with `file:line`
  ACs (220-AC-12..17). The live returning-member sign-in path (220-AC-18) shares the Wave 4 gap: no
  live LinkedIn credentials. Requires `SUPABASE_SERVICE_ROLE_KEY` set and the Supabase email template
  pointed at `/auth/confirm` with confirmations enabled (see [STATUS.md](STATUS.md)).

## 2026-06-15 — Wave 4: LinkedIn Scheduling & Publishing (PARTIAL)

- **Built Wave 4 (features 220-224).** LinkedIn OAuth + encrypted token storage, one-click publish
  from the editor (text + image/video), timezone-aware scheduling with a Vercel Cron publisher, a
  month/week content calendar with drag-to-reschedule, and phase-1 best-time-to-post suggestions.
  New: `config/linkedin.ts`, `config/best-time.ts`, `lib/linkedin/*` (oauth, crypto, posts,
  connections, serialize), `lib/supabase/admin.ts`, `app/api/linkedin/*` and `app/api/cron/publish`,
  `app/dashboard/calendar` + `components/dashboard/calendar/content-calendar.tsx`,
  `components/dashboard/{linkedin-connection,publish-controls}.tsx`, `hooks/use-linkedin-status.ts`,
  migrations `009_linkedin_connections` (table + RLS) and `010_post_scheduling` (drafts scheduling
  columns, `failed` status, `idx_drafts_due`, `claim_due_linkedin_posts` / `claim_draft_for_publish`
  RPCs), and `vercel.json` (per-minute cron). Tokens are AES-256-GCM-encrypted at rest; the publish
  route is Zod + session + connection-gated with atomic claim-for-publish; the cron is
  CRON_SECRET-authed, service-role, idempotent, with retry/permanent-failure handling. The LinkedIn
  env vars are all optional, so the features stay inert and present as "not configured" until set.

- **Marked Wave 4 PARTIAL, not SHIPPED - honest about live verification.** Type-check, lint, and
  build pass and the code-quality review returned SHIP, but **no live LinkedIn app credentials are
  configured**, so OAuth consent + token exchange, real post creation, media upload, and cron
  delivery are not end-to-end verified against LinkedIn. Each spec checks only code/build-verifiable
  ACs with `file:line` evidence and leaves the live-verification AC open. Two architectural
  constraints are recorded: self-serve apps get no programmatic refresh token (60-day token, member
  must reconnect), and per-minute scheduling requires Vercel Pro (Hobby cron runs once/day).

- **Docs: graduated 220-224 from `backlog/` to `features/` (PARTIAL)**, opened tickets
  [T-015](tickets/T-015-linkedin-oauth.md)-[T-019](tickets/T-019-best-time-to-post.md) (in-review),
  set [ROADMAP.md](ROADMAP.md) Wave 4 to IN PROGRESS with the feature links repointed, added the
  Wave 4 PARTIAL gap + a "Wave 4 setup required before it works" section to [STATUS.md](STATUS.md),
  and extended [ARCHITECTURE.md](ARCHITECTURE.md) with the `linkedin_connections` model, the new
  Draft scheduling columns, the `/api/linkedin/*` + `/api/cron/publish` routes, the new env vars,
  and LinkedIn/Vercel Cron integration rows.

## 2026-06-14 — Deployment configured (release-ready)

- **Env + Supabase configured; build verified.** `.env` now carries the LLM and Supabase keys (and
  PostHog); the Supabase project + migrations `001`-`008` + anonymous auth are set up. `pnpm
type-check` is clean, `pnpm lint` is at baseline, and `pnpm build` prerenders all 48 routes. With
  every built feature SHIPPED, the branch is release-ready: no feature work and no configuration
  blockers remain. (GTM/Tally analytics keys are intentionally left blank; the build tolerates them
  empty and analytics stay inert until filled in.) See [STATUS.md](STATUS.md) "Deployment readiness".

## 2026-06-14 — Closing PARTIAL feature gaps

- **Reconciled the inspirational-posts spec with the built design (T-014).** Corrected 088-AC-4: the
  card invites pasting LinkedIn post body text (the direct style signal), not URLs, and the card copy
  already reflected that; there is intentionally no URL ingestion. Closes the last open AC; feature
  088 (Inspirational posts) is now SHIPPED, which completes Wave 0. With this, all 63 built features
  are SHIPPED and the Foundation and Waves 0, 1, and 2 are all COMPLETE.

- **Deliberate app-wide page-view tracking (T-013).** A `PostHogPageView` client component mounted in
  the root layout (inside a Suspense boundary so public-page static generation is preserved) fires a
  snake_case `page_viewed` event on every route change, replacing reliance on autocapture defaults.
  Closes 112-AC-6; feature 112 (PostHog analytics) is now SHIPPED, which completes the Foundation
  wave.

- **Strategy dashboard gains a 6-month activity heatmap + weekly streak (T-012).** The single-month
  calendar was replaced with a rolling 26-week GitHub-style contribution grid, and a weekly posting
  streak (consecutive weeks with a post, tolerant of an in-progress current week, DST-safe) is
  computed from draft history and displayed. Both derive from pure helpers in `lib/strategy-metrics.ts`.
  Closes 201-AC-3 and 201-AC-4; feature 201 (Content strategy dashboard) is now SHIPPED, which
  completes Wave 2 (Content Strategy).

- **Custom footer + dos/donts are now enforced, not just suggested (T-011).** When the footer is
  enabled it is appended deterministically server-side to AI-generated full posts (the `posts`
  action), with word count recomputed, instead of relying on the model to comply. Dos/donts are
  injected into the generation system prompt as hard constraints for every generate action (and
  still flow as voice context for chat). Closes 085-AC-5 and 087-AC-5; features 085 (Custom footer)
  and 087 (Dos and donts) are now SHIPPED.

- **Core editor footer now shows a live word count (T-010).** The public tool's editor footer shows
  word count next to character count, computed via a shared `countWords` helper in
  `lib/content-scoring.ts` so it always matches the dashboard analyze panel. Closes 052-AC-2; feature
  052 (Character and word count) is now SHIPPED, which completes Wave 1 (Smart Content Creation).

- **URL/source generation prompt now asks for an original, attributed take (T-009).** The shared
  `posts` generation prompt instructs the model to write an original post inspired by the source
  rather than summarizing it, and to credit external sources where appropriate (with no attribution
  for the author's own notes). Closes 040-AC-6 and 040-AC-7; feature 040 (AI post generation from
  URL) is now SHIPPED.

- **Creation-wizard file picker shows audio/video as "coming soon" (T-008).** A disabled, purely
  informational "Audio / video (coming soon)" affordance now sets expectations in the file picker;
  accepted types (PDF/DOCX/TXT/MD) and the 5MB cap are unchanged, and no transcription is
  implemented (the real capability remains backlog 041). Enhancement to the already-SHIPPED feature 039.

- **Changelog page groups entries by month/year (T-006).** `/changelog` now renders entries under
  newest-first month/year headings (a pure `groupEntriesByMonth` helper in `lib/changelog.ts`)
  instead of one flat list; the sticky date column and static prerendering/metadata are unchanged.
  Closes 004-AC-6; feature 004 (Changelog) is now SHIPPED.

- **Branding context now reaches chat, analyze, and uses inspiration (T-005).** The chat assistant
  and the analyze apply-suggestion call now receive the assembled branding context, and
  `assembleBrandingContext` now includes inspirational posts and creators as a delimited style
  reference (capped for prompt budget and clamped to 5000 chars), explicitly framed as untrusted
  reference data the model must not follow as instructions. Closes 037-AC-6/AC-7, 081-AC-5,
  088-AC-5, 089-AC-5. Features 037 (Branding-aware AI), 081 (Positioning statement), and 089
  (Inspirational creators) are now SHIPPED. Feature 088 (Inspirational posts) stays PARTIAL: its AI
  wiring is done, but the card's "paste a post URL" claim still does not match the free-text input
  (now tracked by T-014).

- **Post statuses are now user-settable (T-003).** The dashboard editor header has a status control
  (Draft / Scheduled / Published) next to the format label; the choice persists to the draft and the
  posts-list status filter reflects it. This is a manual status label only - it does not publish to
  LinkedIn (real publishing/scheduling remains Wave 4). Closes 063-AC-4; feature 063 (Post statuses)
  is now SHIPPED.

- **Weekly idea "Create Post" now seeds a draft + ideas are dismissable (T-004).** Clicking Create
  Post on a weekly AI idea creates a new draft pre-filled with the idea's hook and carrying its
  format label, then opens it in the editor (reusing the creation-wizard path); each idea card also
  has a dismiss control that removes the idea from the current week and persists via the strategy
  record. Closes 202-AC-4 and 202-AC-5; feature 202 (Weekly AI post ideas) is now SHIPPED.

- **Branding profile now drives the post preview + avatar cropping (T-002).** The dashboard editor
  preview shows the user's branding name, headline, and uploaded avatar (with a placeholder fallback
  for the logged-out homepage, embed, and chat preview), and the avatar upload now opens a square
  crop dialog (drag-to-reposition, zoom, keyboard-pannable) before saving. Closes 080-AC-2 and
  080-AC-5; feature 080 (Profile section) is now SHIPPED and the 021 preview author gap is resolved.

- **Wired the LabelPicker into the dashboard editor (T-001).** Users can now assign, change, or
  clear a draft's content-format label from the editor header; the selection persists to
  `drafts.label` and survives reload, and the chosen label shows in the posts list and matches the
  format filter. Closes 064-AC-6; feature 064 (Post format labels) is now SHIPPED.

## 2026-06-14 — Documentation overhaul + quality gate

- **Fact-checked every built feature against the code.** Created/standardized 63 feature specs in
  each feature spec, with stable `NNN-AC-K` acceptance criteria checked only against `file:line`
  evidence. SHIPPED specs live in [features/completed/](features/completed/); PARTIAL specs in
  [features/](features/). Result: 46 SHIPPED, 17 PARTIAL. The fact-check corrected several false
  "Live" claims, including: changelog month/year grouping (not implemented), the in-editor "iPhone
  frame" toggle (actually a 3-way width switcher), the post preview author (hard-coded, not from
  branding), post `scheduled`/`published` statuses (no UI to set them), weekly-idea "Create Post"
  (no hook pre-fill / draft), branding-aware chat and inspiration fields (stored but never sent to
  AI), and AI-from-file audio/video support (does not exist).
- **Organized features into [completed/](features/completed/) (SHIPPED) vs [features/](features/)
  (PARTIAL)** and gave every [ROADMAP](ROADMAP.md) wave table a single linked feature column plus a
  status column.
- **Blog (002): dropped reading-time from scope and marked it SHIPPED.** Reading-time display was
  never implemented and is no longer a requirement; title-only search remains a non-blocking known
  limitation.
- **038 (post from voice): reclassified PARTIAL -> SHIPPED.** All ACs pass; the unverifiable
  mobile/Web-Audio claims were already moved to known-gaps, so PARTIAL was a stale label.
- **ROADMAP per-wave breakdown.** Every wave table now lists each feature on its own row (no
  aggregated ranges), with a status column, and a "To complete this wave" checklist. Built waves are
  labeled by completion (e.g. "Wave 0 - IN PROGRESS, 16 of 23 SHIPPED") rather than COMPLETE while
  features remain PARTIAL.
- **Tickets for every PARTIAL.** Added T-006..T-013 (changelog grouping, preview-toggle alignment,
  audio/video source, URL prompt quality, word count, footer + dos/donts enforcement, multi-month
  heatmap + streak, page-view tracking) and extended T-002 (avatar cropping) and T-005 (analyze
  apply-suggestion) so every PARTIAL feature maps to a ticket.
- **Roadmap made comprehensive.** Added a "Foundation: Public Tool & Site" section (the pre-dashboard
  product: public site, core editor, feedback/analytics) and moved every previously-unlisted built
  feature into a section, so all 63 built + 18 backlog specs appear in exactly one roadmap section.
  Documented the placement rule: `features/` once a feature's wave has started, `backlog/` until then.
- **022 (preview size toggle): decision - keep the 3-way fixed-width switcher.** Retired the
  binary-toggle and 375px-iPhone-frame criteria (former 022-AC-1/AC-2); 022 is now SHIPPED. Closes
  T-007.
- **039 (post from file): audio/video moved to backlog.** Split audio/video transcription into new
  backlog feature [041](backlog/041-audio-video-post-source.md); 039 (PDF/DOCX/TXT/MD) is now
  SHIPPED. T-008 re-scoped to a "coming soon" affordance in the file picker.
- Counts after these decisions: **48 SHIPPED, 15 PARTIAL** (63 built); backlog now 18 features.
- **Adopted the luminars docs conventions.** Added [STATUS.md](STATUS.md) (the one-screen honest
  snapshot, folding the former `RELEASE_READINESS.md`), this changelog, [backlog/](backlog/) for
  planned work, and [tickets/](tickets/) for work in flight. Moved the 17 not-yet-built features
  (waves 3-6, SEO template libraries) into the backlog.
- **Opened gap tickets** T-001..T-005 in [tickets/](tickets/) for the highest-leverage honesty
  gaps, so the PARTIAL list is actionable.
- **Added the quality gate.** Ported the `code-quality-reviewer` agent
  ([.claude/agents/code-quality-reviewer.md](../.claude/agents/code-quality-reviewer.md)) adapted
  to this stack, a CI workflow ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) running
  type-check / lint / build, and the [process/development-workflow.md](process/development-workflow.md)
  mandatory-review process doc.
- Rewrote [PRODUCT.md](PRODUCT.md) so every feature row links to its spec and carries a verified
  status, and refreshed [\_INDEX.md](_INDEX.md).

## Earlier — product history (pre-overhaul, reconstructed from git)

- **Wave 2 — Content Strategy.** 7-step strategy wizard persisted to Supabase, strategy dashboard,
  and weekly AI post ideas (`/api/ideas`). Migrations `007_strategy`, `008_add_ideas_action`.
- **Wave 1 — Smart Content Creation.** AI generation from notes/voice/file/URL, hook suggestions,
  quick actions, content scoring panel, AI suggestions, branding-aware generation.
- **Wave 0 — Dashboard Foundation & Branding.** Sidebar app shell, Supabase anonymous auth with
  RLS, multi-draft management, branding page, settings, and the integration of the pre-existing AI
  chat/generation/analysis into the dashboard.
- **Pre-Wave 0 — the free tool.** Public site (landing, blog, changelog, compare, SEO infra) and
  the login-free TipTap editor with live LinkedIn preview, feed preview, copy-to-clipboard, and
  draft-sharing URLs.
