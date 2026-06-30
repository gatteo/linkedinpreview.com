# Tickets — work in flight

This folder holds **active, scoped work**: a single change someone is doing now or next. A ticket
is the unit between "an idea in [`../backlog/`](../backlog/)" and "merged + folded into a feature
spec in [`../features/`](../features/)".

## Conventions

- **Filename**: `T-NNN-slug.md` (zero-padded, monotonically increasing; never reuse a number).
- **Status** (frontmatter): `proposed` → `in-progress` → `in-review` → `done` (or `blocked`,
  `dropped`). Set `in-progress` before starting.
- **One ticket = one shippable change.** If it needs sub-parts, split into multiple tickets.
- **Acceptance IDs**: `T-NNN-AC-K`, stable for the life of the ticket.

## Lifecycle

1. Promote from backlog (or open fresh) using [`TEMPLATE.md`](TEMPLATE.md).
2. Work it; keep status current; pass the [code-quality review gate](../process/development-workflow.md).
3. When done, **fold** its lasting acceptance criteria into the relevant feature spec (reissued as
   `NNN-AC-K` there), add a [`../CHANGELOG.md`](../CHANGELOG.md) line, and mark the ticket `done`.
   Tickets are ephemeral; the durable spec lives in [`../features/`](../features/).

## Relationship to the rest of the docs

- A ticket references the feature it changes; it never _redefines_ the spec, it proposes a delta.
- Long-term scope lives in [`../ROADMAP.md`](../ROADMAP.md) and [`../backlog/`](../backlog/), not
  in tickets.

## Index

Honesty gaps found in the 2026-06-14 documentation fact-check, ordered by leverage. Each closes a
PARTIAL feature surfaced in [`../STATUS.md`](../STATUS.md).

- [`T-001-wire-label-picker-in-editor.md`](T-001-wire-label-picker-in-editor.md) — render the
  built-but-dead `LabelPicker` in the editor (feature 064) — `proposed`.
- [`T-002-branding-profile-in-post-preview.md`](T-002-branding-profile-in-post-preview.md) — show
  the user's own name/headline/avatar in the preview instead of the hard-coded author (features
  080, 021) — `proposed`.
- [`T-003-reachable-post-statuses.md`](T-003-reachable-post-statuses.md) — let the user actually
  set `scheduled`/`published` (feature 063) — `proposed`.
- [`T-004-idea-create-post-prefill.md`](T-004-idea-create-post-prefill.md) — make "Create Post"
  from a weekly idea pre-fill a draft and add dismiss (feature 202) — `proposed`.
- [`T-005-branding-aware-chat-and-inspiration.md`](T-005-branding-aware-chat-and-inspiration.md) —
  extend branding context to chat + analyze and wire inspiration fields into AI (features 037, 081,
  088, 089) — `proposed`.
- [`T-006-changelog-month-year-grouping.md`](T-006-changelog-month-year-grouping.md) — group
  changelog entries by month/year (feature 004) — `proposed`.
- [`T-007-align-preview-toggle-with-spec.md`](T-007-align-preview-toggle-with-spec.md) — reconcile
  the in-editor preview toggle with its spec; kept the 3-way switch, retired the binary/iPhone-frame
  ACs (feature 022) — `done`.
- [`T-008-audio-video-file-source.md`](T-008-audio-video-file-source.md) — show audio/video as
  "coming soon" in the file picker; real capability moved to backlog 041 (feature 039) — `proposed`.
- [`T-009-url-generation-prompt-quality.md`](T-009-url-generation-prompt-quality.md) — original +
  attributed URL-to-post generation (feature 040) — `proposed`.
- [`T-010-word-count-in-core-editor.md`](T-010-word-count-in-core-editor.md) — show word count in
  the core editor (feature 052) — `proposed`.
- [`T-011-enforce-footer-and-dos-donts.md`](T-011-enforce-footer-and-dos-donts.md) — deterministic
  footer append + dos/donts as hard constraints (features 085, 087) — `proposed`.
- [`T-012-multi-month-heatmap-and-streak.md`](T-012-multi-month-heatmap-and-streak.md) — 3-6 month
  heatmap + streak on the strategy dashboard (feature 201) — `proposed`.
- [`T-013-explicit-pageview-tracking.md`](T-013-explicit-pageview-tracking.md) — deliberate
  page-view tracking (feature 112) — `proposed`.

Wave 4 (LinkedIn Scheduling & Publishing) build tickets, opened 2026-06-15, `in-review` (their open
ACs are blocked on live LinkedIn verification, not code):

- [`T-015-linkedin-oauth.md`](T-015-linkedin-oauth.md) - LinkedIn OAuth connection (feature 220) - `in-review`.
- [`T-016-one-click-publish.md`](T-016-one-click-publish.md) - one-click publish to LinkedIn (feature 221) - `in-review`.
- [`T-017-post-scheduling.md`](T-017-post-scheduling.md) - post scheduling + cron publisher (feature 222) - `in-review`.
- [`T-018-content-calendar.md`](T-018-content-calendar.md) - content calendar (feature 223) - `in-review`.
- [`T-019-best-time-to-post.md`](T-019-best-time-to-post.md) - best time to post, phase 1 (feature 224) - `in-review`.

(T-014 closed the inspirational-posts spec reconciliation; see [`../CHANGELOG.md`](../CHANGELOG.md).)
