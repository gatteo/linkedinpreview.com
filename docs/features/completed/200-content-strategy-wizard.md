# 200 — Content Strategy Wizard

> Status: SHIPPED · Area: Strategy · Last verified: 2026-06-14
>
> Copy this file to `NNN-slug.md` and fill it in. This folder holds **only built features**
> (SHIPPED or PARTIAL). Not-yet-built ideas live in [`../backlog/`](../../backlog/). A feature
> describes a user-facing **surface**; system internals live in
> [`../ARCHITECTURE.md`](../../ARCHITECTURE.md).

## What

- A guided, multi-step dialog wizard that walks the user through defining their LinkedIn content
  strategy: primary role, goals, target audience, areas of expertise, posting frequency and
  schedule, a positioning statement, and preferred content formats. The wizard runs as a modal
  on the `/dashboard/strategy` page and can be launched both for first-time setup (empty state)
  and re-launched later via an "Edit Strategy" button. On finish it persists strategy data to the
  Supabase `strategy` table and writes role, expertise topics, and positioning back to branding.

## Why

- Captures structured intent so downstream AI features (weekly post ideas, generation) produce
  on-brand, relevant output instead of generic content. It turns scattered branding fields into a
  single deliberate strategy a user reviews and commits to.

## Acceptance (binary, testable)

- [x] 200-AC-1 Wizard is multi-step with a visible progress indicator _(verified: `components/dashboard/strategy/strategy-wizard.tsx:45` STEPS array, `:274-280` progress bar driven by `progressPct`)_
- [x] 200-AC-2 Wizard collects role, goals, audience, expertise, posting frequency/schedule, positioning, and formats _(verified: `components/dashboard/strategy/strategy-wizard.tsx:228-267` renders all seven step components)_
- [x] 200-AC-3 Strategy is persisted to the Supabase `strategy` table _(verified: `lib/supabase/strategy.ts:28-34` `upsertStrategy` upserts into `strategy`; `supabase/migrations/007_strategy.sql:2-7` table; called via `hooks/use-strategy.ts:42`)_
- [x] 200-AC-4 RLS restricts each user to their own strategy row _(verified: `supabase/migrations/007_strategy.sql:11-18` select/insert/update/delete policies keyed on `auth.uid() = user_id`)_
- [x] 200-AC-5 Strategy can be edited after initial setup _(verified: `components/dashboard/strategy/strategy-page.tsx:83-87` "Edit Strategy" button reopens the wizard; `:135-152` wizard re-initializes form from latest data on open)_
- [x] 200-AC-6 Wizard is reachable from the dashboard sidebar _(verified: `components/dashboard/dashboard-sidebar.tsx:177-181` "Content Strategy" link to `/dashboard/strategy`)_
- [x] 200-AC-7 The actual wizard has exactly 7 steps (role, goals, audience, expertise, frequency, positioning, formats) _(verified: `components/dashboard/strategy/strategy-wizard.tsx:31,45` seven-member `WizardStep` union and STEPS array)_

> Acceptance IDs are stable forever. A box is checked `[x]` **only** when verified against the code
> with a `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note.

## Implementation

- Wizard shell and step orchestration: `components/dashboard/strategy/strategy-wizard.tsx` (STEPS at `:45`, validation `isStepValid` at `:71`, completion `handleComplete` at `:175`).
- Step components: `components/dashboard/strategy/wizard-steps/{role,goals,audience,expertise,frequency,positioning,formats}-step.tsx`.
- Page host and empty/edit states: `components/dashboard/strategy/strategy-page.tsx`; route at `app/dashboard/strategy/page.tsx`.
- Persistence: `hooks/use-strategy.ts`, `lib/supabase/strategy.ts`, schema/types `lib/strategy.ts`, table `supabase/migrations/007_strategy.sql`.
- Branding write-back (role, expertise, positioning) on completion: `components/dashboard/strategy/strategy-wizard.tsx:186-190` plus `components/dashboard/strategy/strategy-page.tsx:44-50`.

## Dependencies

- Branding (role, expertise topics, positioning) is read on open and written on finish — see 037 branding-aware-ai and `hooks/use-branding.ts`.
- Feeds 202 (weekly AI post ideas) and 201 (strategy dashboard).
- Auth via `components/dashboard/auth-provider.tsx`.

## Open questions / known gaps

- The route `/dashboard/strategy` is hardcoded in the sidebar (`dashboard-sidebar.tsx:179`) and not registered in `config/routes.ts` (`Routes` object lacks a `DashboardStrategy` entry). This is a consistency gap, not a functional one; the page works.
- Documentation elsewhere (PRODUCT.md) describes the wizard as "role, goals, audience, expertise, frequency, formats" (6 facets) and omits the positioning step; the real wizard has 7 steps including a dedicated positioning step.
- Frequency step always validates as true (`strategy-wizard.tsx:81-82`), so a user can advance without explicitly confirming a schedule (defaults apply).
