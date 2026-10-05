# Imported-draft-first activation (LIN-108)

## Scope and precedence

Intentional free-tool imports from `tool_footer`, `tool_nudge` and `tool_header` open the dashboard editor first. The persistent footer retains a separate explicit planning action. Existing plan placements (`navbar`, `mobile_nav_cta`, `plan_section`, `footer`, `hero_editor`) and `planning=1` explicitly request planning.

The planning gate preserves completed users, settings/account-switch returns, saved OAuth resumes, hosted upgrade returns, saved planning progress and legacy backfill before applying the new deferral. Explicit planning overrides deferral. The controller snapshots arrival parameters before another return consumer or the import hook rewrites the URL. No onboarding completion flag is written for deferral.

The deferred choice and original entry source live in account-scoped browser storage (`lp-draft-first:<userId>`). They survive editor navigation, dashboard navigation and reload on that browser. This is a local preference, not a cross-device onboarding completion or entitlement. When browser storage is unavailable, an in-memory fallback covers SPA navigation; reload persistence cannot be guaranteed in that environment. Saved planning retains its existing resume behavior after the user chooses it.

## Draft safety

Imports create a separate draft rather than overwriting an existing one. The hook shares one import promise across overlapping loads. Invalid encoding/document shape and missing media fail before draft creation; the original free-tool draft stays available. Media travels through the existing bounded IndexedDB handoff and is included in the new draft's initial insert. Successful resolution removes only import/media parameters and retains intent/attribution/return parameters.

Nested list text is not treated as empty by cleanup. Failed loads remain protected from deletion. Mobile remounts seed from the current active draft's document, not stale initial text; switching drafts does not leak the previous draft or media.

The shared URL codec now consumes compression streams through `pipeThrough`, so malformed compressed input is caught by the decoder rather than also producing an unhandled writer rejection.

## After value and measurement

Only after the imported draft renders usable text does a nonblocking editor strip expose optional planning and the existing higher-AI-limits Pro action. Paid users do not receive that Pro action. The existing upgrade dialog is reused, with reason-specific text that does not pretend the user has exhausted their free quota. Plan hierarchy, prices and features are unchanged. Monthly-first PR #96 and lifetime-policy PR #103 remain separate changes.

`draft_first_eligible` is emitted in the free tool before encoding, media transfer, authentication or import success. Encoding/media/auth/import failures remain in the eligible denominator. It describes an intentional handoff attempt, not verified new/unpaid eligibility. Deduplicate by identified person/first eligible exposure for the primary account-conversion cohort and report returning/paid users separately. Subsequent attempts retain the first stored dashboard exposure and entry source. Anonymous-to-known identity uses the existing AuthProvider identification.

The imported draft success event, meaningful edit or successful editor/header whole-post Copy Text, Pro-action exposure, existing upgrade/offer/checkout events and processor-confirmed `purchase_completed` carry the activation version/exposure ID. Checkout validates and places attribution in Stripe session metadata, plus hosted return URLs. These fields are attribution only, not authorization or proof of a paid account. Existing webhook entitlement/retry semantics are unchanged.

Baseline: inspected main's new-user gate opens planning on imported arrivals. No historical paid-conversion rate or eligible denominator was measured by this implementation run. Vera owns preregistration and production cohort selection. Revenue hypothesis: delivering the user's existing draft before planning increases meaningful editor use and relevant Pro reach, leading to new processor-confirmed recurring accounts within seven days. Clicks, client success screens, renewals and lifetime cash are not recurring-account lift.

Before launch Atlas coordinates the separate monthly-first release and Vera records the fixed observation/attribution window. Use at least the operating directive's seven-day minimum and fully mature attribution; 200 eligible offer exposures/five recurring purchases are an initial business signal, not statistical power. After 14 days, decide on activation/reach if offer volume is insufficient. Concurrent releases or before/after results must be labeled confounded. No production experiment is launched by this PR.

Kill line: verified regression in free-tool copying, import/content/media persistence, checkout or entitlement causes immediate reviewed rollback. No new purchase, provider call, migration or deploy-config change is required. Main risks are import/return precedence and low offer reach. Rollback before merge is close the PR; after Atlas squash merge, revert that isolated squash SHA through review and retain all drafts, billing/payment evidence and additive metadata.

## Verification

Executable Node coverage loads actual TypeScript controller, hook, public handoff, checkout and webhook modules with explicit offline adapters. Fixtures are synthetic. This tests code paths without any production Supabase, Stripe, provider or LinkedIn request. Independent Sentinel review remains mandatory. Release evidence and browser-fixture limitations are recorded in `docs/evidence/lin-108/README.md` when the preview is ready.
