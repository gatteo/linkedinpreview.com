# 224 - Best Time to Post

> Status: PARTIAL · Area: Editor · Last verified: 2026-06-15
>
> Built feature (PARTIAL: open gaps). This folder holds **only built features** (SHIPPED or
> PARTIAL). Not-yet-built ideas live in [`../backlog/`](../backlog/). A feature describes a
> user-facing **surface**; system internals live in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## What

- Recommended posting times surfaced where a user schedules a post. The schedule dialog shows a
  short best-time summary plus a few one-tap suggested slots (soonest first, with the strongest
  slots marked), computed in the user's local timezone, and the content calendar hints the
  strongest posting days. This is the non-personalized phase 1: data-backed general LinkedIn
  guidance (weekday afternoons, Wed/Thu/Fri strongest). Phase 2 (personalizing from the member's
  own performance data) depends on Wave 5 analytics (230) and is not built.

## Why

- Nudges users toward higher-engagement times at the exact moment they schedule, without making
  them research best practices themselves.

## Acceptance (binary, testable)

- [x] 224-AC-1 Suggested posting times are shown when scheduling a post _(verified: `components/dashboard/publish-controls.tsx:76` `suggestNextSlots(new Date(), 3)`; rendered as one-tap chips `:263-283`)_
- [x] 224-AC-2 Suggestions are computed in the user's local timezone and prefer high-engagement windows, soonest first with the strongest marked _(verified: `config/best-time.ts:41-56` `suggestNextSlots` (local-time slots, sorted ascending) over `BEST_TIME_SLOTS` `:17-25` tiered best/good; "best" chips marked at `components/dashboard/publish-controls.tsx:274`)_
- [x] 224-AC-3 The strongest posting days are highlighted in the content calendar _(verified: `components/dashboard/calendar/content-calendar.tsx:49` `BEST_DAYS` from "best"-tier slots; day hint `:211-217`; summary in legend `:173`)_
- [x] 224-AC-4 A best-time summary is shown in the scheduling surface _(verified: `config/best-time.ts:27-28` `BEST_TIME_SUMMARY`; shown as the schedule dialog description `components/dashboard/publish-controls.tsx:250`)_
- [ ] 224-AC-5 Recommendations personalize using the member's own performance data (Phase 2) _(gap: not built - depends on Wave 5 analytics (230); phase 1 is intentionally general-guidance only - see [STATUS.md](../STATUS.md))_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- Recommender: `config/best-time.ts` (`BEST_TIME_SLOTS` `:17`, `BEST_TIME_SUMMARY` `:27`, `isPreferredTime` `:31`, `suggestNextSlots` `:41`).
- Schedule dialog suggestions: `components/dashboard/publish-controls.tsx:76`,`:263-283`.
- Calendar best-day hints: `components/dashboard/calendar/content-calendar.tsx:49`,`:211-217`.

## Dependencies

- Post scheduling (222) and content calendar (223) are the surfaces for the recommendations.
- Phase 2 depends on analytics (230) from Wave 5 for per-member performance data.

## Open questions / known gaps

- Phase 1 is non-personalized general guidance by design; phase 2 personalization (224-AC-5) is not
  built and waits on Wave 5 analytics (230).
- The phase-1 logic is pure and unit-verifiable, so it has no live-LinkedIn dependency. The broader
  Wave 4 live-verification gap (real LinkedIn app credentials + a connected account) applies to the
  publish/schedule surfaces these suggestions sit inside, not to the suggestions themselves. Tracked
  in [STATUS.md](../STATUS.md).
