# Changelog

> Dated history of meaningful changes to the product and its docs. Newest first. Each shipped
> change adds a line here (see [process/development-workflow.md](process/development-workflow.md)).
> This is the engineering changelog; the user-facing changelog lives in the app at `/changelog`.

## 2026-06-14 — Closing PARTIAL feature gaps

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
