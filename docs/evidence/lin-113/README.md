# LIN-113 current-head verification

PR: https://github.com/gatteo/linkedinpreview.com/pull/96
Branch: feat/exp9-monthly-first-offer
Code SHA: ee07aa02ef2cb03ad9ac54f0539db51221c451ea
Fresh main: 8856f3ff46827087228a36e0252e4a89a1ddba2a
Integration merge: 58edd6e (normal merge, no force-push)
Ready code deployment: dpl_F4YeUxzF1zYcEtAKNEnQW6r9Cjcv
Preview: https://linkedinpreview-mj4nqp1f4-gatteos.vercel.app

## Actual execution

Node 22.23.1. All Node tests 46/46, zero failures. Type-check, lint, clean and build returned exit 0.
Lint retains two existing TanStack warnings and zero errors. Build generated 263/263 routes; the established Contentlayer
post-generation ERR_INVALID_ARG_TYPE remains before successful Next build. Raw tests/build logs are in this directory.
GitHub code-head gates, Vercel and Vercel Preview Comments all passed. The preview metadata reports READY at the exact code SHA.

Browser adapter asserts installation before actions and intercepts Supabase/API/checkout/ingestion requests. Explicit CDP
network blocks provide an additional layer for backend/payment/provider/publishing domains. Auth and persistence are
synthetic, not live integrations. No card entry, provider probe, real checkout Session or payment was performed.

19/19 final browser checks pass in smoke.json. Desktop/mobile monthly order and selection, lifetime alternative, existing
prices/proof/urgency, both-plan contained checkout payloads, failure/free fallback, no horizontal overflow, persisted clock/
enrollment/source through reload, home tool typing to preview, real pointer Copy Text toast plus original Clipboard API
exact readback, and blog rendering passed. Dashboard itself loaded under the asserted synthetic auth adapter before paywall
jump. Six screenshots are committed alongside these results. Current preview still has main's pre-#103 guarantee copy,
explicitly NOT claimed as current prospective policy or production clearance.

Smoke scaffolding initially failed to write its JSON due to an undefined Python workspace variable, after successful
assertions. The final run uses a fixed evidence path. One early pointer copy click used coordinates during smooth scroll
and missed the button; after stabilized instant scroll the actual click/toast/Clipboard API exact readback passed. These
are documented harness failures, not fabricated copy passes or hidden product changes.

## Prospective #103 integration

PR #103 remains OPEN at 793dc9d72001be4563e3dff0400fd055ba7e558d on the verified read.
A detached worktree inside Forge's own clone merged #103 with --no-commit, without a code conflict. It is unpushed and NOT
part of #96. Actual terms/component tests and all Node tests passed 53/53 after adapting the policy test harness to the
new inner MonthlyOffer component. Raw prospective-tests.log and the exact prospective-policy-tests.patch are preserved.
The production policy/app diff was not silently inserted into the experiment. See docs/monthly-first-release.md for
exact integration order and separate #104 attribution overlap resolution. No prospective build or deployed-policy smoke
is claimed; those remain required after Atlas actually merges #103 and Forge integrates fresh main into #96.

## Measurement and release gates

Eligibility is stored/captured before MonthlyOffer mounts. Billing failures remain unknown, known paid stays guardrail.
Release SHA and original dashboard first touch survive enrollment/reload/checkout metadata. Processor event/session/
subscription IDs plus paid status/livemode are retained, but completion events explicitly require processor reconciliation.
Sentinel LIN-112 must match a positive live first paid invoice and prior-recurring history before counting NEW accounts.
No paid result or historical join is fabricated. Storage/cross-device/account/telemetry loss remains an attribution limit.

EXP-9 revision 2 is the sole primary conversion test; draft-first is separate activation work. Overlapping seven-day
purchase windows are confounded, cohort purchases never summed. Registered day14 reach/activation, first200/five-start
business hurdle, day30 enrollment/zero-start decision and day37 final maturity remain unchanged.

Sentinel independent current-head technical review is requested, but current #96 is NOT authorized to merge. Outstanding:
Atlas merges independently accepted #103, Forge integrates actual main and refreshes policy checks/preview/review, Sentinel
clears real LIN-87 health, Atlas alone merges original LIN-61. No artificial seven-day draft-first waiting gate is introduced.
PR #104 and its Sentinel review LIN-117 remain preserved. No production config/data/Stripe mutation or external contact.

Rollback before merge: close #96. After Atlas merge: revert the actual isolated squash SHA through review, preserving
customer/payment records and attribution history. No placeholder revert is executed. New purchases $0; provider cost unknown.
