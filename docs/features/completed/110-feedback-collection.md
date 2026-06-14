# 110 — Feedback Collection

> Status: SHIPPED · Area: Feedback · Last verified: 2026-06-14
>
> Copy this file to `NNN-slug.md` and fill it in. This folder holds **only built features**
> (SHIPPED or PARTIAL). Not-yet-built ideas live in [`../backlog/`](../../backlog/). A feature
> describes a user-facing **surface**; system internals live in
> [`../ARCHITECTURE.md`](../../ARCHITECTURE.md).

## What

- A Tally.so feedback form surfaced two ways: a floating action button fixed to the bottom-right of
  marketing pages, and an inline "Share Feedback" text link (used in the footer). Both open the same
  Tally popup with hidden fields recording the source and current page URL. The Tally embed script is
  loaded on the relevant layouts.

## Why

- Lets users report problems and ideas without leaving the page, with provenance metadata so the team
  knows where the feedback came from.

## Acceptance (binary, testable)

- [x] 110-AC-1 A floating feedback button is fixed to the bottom-right _(verified: `components/feedback/feedback-fab.tsx:30` `fixed right-6 bottom-6 z-50`)_
- [x] 110-AC-2 The FAB opens a Tally popup using the configured form id _(verified: `components/feedback/feedback-fab.tsx:9,19-24` reads `feedbackConfig.formId` and calls `window.Tally.openPopup`)_
- [x] 110-AC-3 An inline link surface also opens the same Tally form _(verified: `components/feedback/feedback-link.tsx:11-17` `Tally.openPopup`; mounted in `components/footer.tsx`)_
- [x] 110-AC-4 Submissions carry source + page URL hidden fields _(verified: `components/feedback/feedback-fab.tsx:20-23` `source: 'fab'`/`pageUrl`; `components/feedback/feedback-link.tsx:13-15` `source: 'footer'`/`pageUrl`)_
- [x] 110-AC-5 The Tally embed script is loaded _(verified: `components/feedback/tally-script.tsx:6` loads `tally.so/widgets/embed.js`; mounted in `app/(main)/layout.tsx:22` and `app/dashboard/layout.tsx:51`)_
- [x] 110-AC-6 Surfaces no-op safely when no form id is configured _(verified: `feedback-fab.tsx:11`, `feedback-link.tsx:8` both `return null` when `formId` is empty; `config/feedback.ts` defaults `formId` to `''`)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- FAB: `components/feedback/feedback-fab.tsx`; inline link: `components/feedback/feedback-link.tsx`.
- Tally loader: `components/feedback/tally-script.tsx`.
- Config: `config/feedback.ts` (`formId` from `NEXT_PUBLIC_TALLY_FORM_ID`, storage keys, post-copy prompt tuning).
- Mounts: `app/(main)/layout.tsx:22-23` (script + FAB), `app/dashboard/layout.tsx:51` (script), `components/footer.tsx` (inline link).
- Related post-copy feedback prompt: `hooks/use-feedback-after-copy.ts` (separate trigger reusing the same Tally form and cooldown config).

## Dependencies

- Tally.so external widget.
- PostHog (110-AC via FAB also fires `feedback_button_clicked`; see 112).

## Open questions / known gaps

- The FAB is mounted only on the `(main)` (marketing) layout, not on dashboard pages; the dashboard
  layout loads the Tally script but does not render the FAB. "Inline links across pages" in practice
  means the footer link plus the post-copy prompt, not a link on every page.
