# Monthly-first release reconciliation (LIN-113 / LIN-61)

## Scope

Existing PR #96, `feat/exp9-monthly-first-offer`, remains the offer release. Fresh main integrated without rewriting history.
Treatment is ONLY monthly default plus ordering of the existing $11.99 monthly and $39.99 lifetime choices. The extra
unshipped monthly badge is omitted by Atlas direction. All LIVE proof, testimonials, urgency, lifetime GoldenTicket,
guarantee, prices, free tool and entitlements remain. No strategy approval loop, outreach, provider probe or config change.

## Actual terms integration and identity-bound billing (October 6)

Atlas merged accepted terms PR #103 as `ecd42c84ee7a2d44c7166fed35d1f8ea749af4d8` on main.
Forge integrated that actual main into the existing #96 branch with normal merge
`68a4fb659d07f4c1694e162b51bbe0bdbfef9fc0`. Current selected-plan reassurance uses
`purchasePolicyCopy(selected)`, with main's terms, upgrade copy and prices retained. The formerly prospective
policy-test harness adaptation is now applied to the actual branch. Earlier prospective evidence remains historical.

Sentinel LIN-118 returned CHANGES for stale account billing during identity switch. Billing state now stores its
owning userId atomically with loading/resolution/data. On the very first render of a new or unready identity,
the context exposes pending/unresolved default state instead of the previous account's billing. Paywall enrollment
requires billingUserId to match current auth userId and a settled read. Own failed reads enroll unknown, never verified free.
Old request responses and removed-account Realtime callbacks cannot overwrite the current identity. Current Realtime
entitlement updates and refresh behavior remain. Valid original enrollment/eligibility clocks are not rewritten.

Actual-provider-plus-gate regressions cover free/monthly/lifetime account switches, initial pending/error, failed
new-account reads, rapid switches, stale success/error/Realtime callbacks, current Realtime and failed anonymous auth.
The matrix first reproduced seven failures before correction. Independent NEW exact-head review is required;
LIN-118 is not approval. Real LIN-87 health and Atlas-only LIN-61 merge remain separate gates.

## Historical prospective terms integration (October 5)

At implementation PR #103 remains open at `793dc9d72001be4563e3dff0400fd055ba7e558d`. Its code is
`49ae352de3699c32c7babd86ea3a2c651627bf0b`. This PR does NOT include its policy change. Exact order:

1. Sentinel independently accepts current #103 / LIN-106. Atlas alone merges #103 and records its actual squash SHA.
2. Forge checks out #96's existing branch, merges fresh `origin/main` without force-push, preserving monthly ordering,
   default selection, eligibility gate and all other live conversion elements.
3. Retain #103's `purchasePolicyCopy` import and `{purchasePolicyCopy(selected)}` in the selected-plan reassurance.
   Retain #103's existing reassurance icon. Keep its terms, upgrade-dialog scoped
   card/checkout copy and config helper verbatim. Do not restore blanket lifetime guarantee.
4. Adapt #103's component regression harness to invoke `MonthlyOffer({ enrollment })` rather than the eligibility wrapper,
   and mock `@/lib/monthly-offer` plus `@/components/dashboard/auth-provider`. The wrapper's ordering has its own test.
5. Rerun purchase-policy and monthly/checkout regressions, full required gates, ready preview, desktop/mobile both-plan
   smoke and exact-new-head Sentinel review. Prospective local integration is evidence only, not a production release.
6. Sentinel's real LIN-87 clearance is still required. Atlas alone merges through original LIN-61 and locks release time/SHA.

This October 5 prospective integration order is now superseded by the actual integration above. It did not authorize
production merge or current-head approval.

## Separate draft-first release

Preserve #104 at `0c898da6ffc96fd88915562198bec8972e741ec1`, code `9af3c7f2f15b955fe738cb09ee7674a0ba4e5187`.
Draft-first's corrected review is LIN-119, not silently merged here. It may ship as soon as independently ready;
no artificial seven-day wait. Shared files require deliberate integration after either release:

- Checkout schema keeps #104's flat exp10 fields AND #96's bounded optional `monthlyOffer` object. Never widen enum/UUID
  validation or remove authenticated user_id/client_reference_id. Both hosted/embedded and both plans remain.
- Checkout client keeps #104's draft fields and adds `monthlyOffer: monthlyCheckoutAttribution(userId)`.
- Metadata keeps exp10 exposure*id/activation_version and draft eligibility/cohort under explicit `draft*\*` keys when
  monthly exposure also exists. exp9 enrollment/cohort/clock remains its own record. Never overwrite an earlier eligibility
  clock or relabel all draft-first people as monthly-offer eligible. Retain original entry_source rather than billing_return.
- Analytics track preserves the draft envelope plus the monthly envelope, with an explicit overlap label and separate
  enrollment IDs/eligibility clocks. Webhook must preserve both metadata envelopes, event/session/subscription IDs and
  `requires_processor_reconciliation`; neither client success nor checkout completion means a new paid subscriber.
- Resolve overlapping new `tests/helpers/component-harness.mjs` by keeping the identical shared harness.
- New integrated head requires full gates, browser containment assertions and independent Sentinel review again.

## Denominator, paid truth and fixed decisions

Follow Vera source contract `reports/lin-109-release-contract-2026-10-05.md`, EXP-9 revision 2 and current Atlas decision.
`paid_conversion_eligible` is committed before the offer component mounts. One persisted assignment per account. Billing
reads resolve before assignment; failures remain unknown, paid/lifetime stays a separate guardrail. A failed render or
checkout stays in enrollment. Repeated views are not new enrollment. Preview/staff/test exclusions are fixed before
launch; filter production hosts on browser eligibility, not server payments. Enrollment is release-based 100% monthly_first,
not randomized. Historical before/after is descriptive/confounded, not causal lift.

Primary outcome: distinct NEW processor-confirmed recurring accounts paid within seven days of eligibility / distinct
verified unpaid eligibles with mature seven-day follow-up. Report enrollment=mature+immature, unknown billing separately,
rendered reach and failures. Fresh release baseline subscriber IDs/MRR must be locked by Atlas/Sentinel at actual launch.
Historical $35.97 / 3 active from source contract is dated October 5, not a fresh measurement in this implementation.

Processor reconciliation owned by Sentinel LIN-112:

1. Join enrollment/user identity to Session metadata/client_reference_id, then subscription and its FIRST settled positive
   live invoice/payment. Require payment status paid and positive amount, not just session completion or browser return.
2. Confirm no prior recurring account history before eligibility. Prior recurring reactivation/upgrade, renewal invoices
   (`subscription_cycle`), zero/test, lifetime cash and unmatched starts are separate, never NEW recurring truth.
3. Deduplicate event retries by session/subscription/account and earliest eligibility. Check invoice paid timestamp against
   that cohort's seven-day clock. No host filter on server payment events. Report unmatched cash/MRR, not a fabricated join.
4. Report monthly-only, draft-only, both releases and unmatched. Later draft-first exposure during monthly follow-up makes
   that seven-day purchase window overlap/confounded. The same start may appear in both diagnostic rates, but never sum
   cohort paid starts into company totals. Net new MRR is new recurring MRR minus churn; lifetime cash stays separate.
5. Preserve refunds/disputes/churn and customer/payment history. No production/payment mutation is authorized.

At day14 fewer than100 eligibles triggers Atlas reach decision; draft meaningful-use below half triggers activation decision.
First200 fully mature monthly eligibles, after at least seven observation days, fewer than5 new starts fails business hurdle.
At day30 stop extending enrollment if sample missing; zero mature starts fails paid signal. Day37 closes full attribution.
Sentinel/Atlas own those endpoints and enrollment stop action, not a new silent deploy timer in this PR. November4 company
10-new-recurring target with churn separate remains distinct from release-relative windows. Five purchases is a business
signal, not power/causal proof or an automatic winner.

## Limitations and containment

First dashboard surface touch is preserved through same-browser navigation, auth linking and checkout. Upstream marketing
source before dashboard entry is not captured. Cross-device/account merges, lost/denied storage, blocked analytics, unavailable
release SHA and deleted cookies can lose joins. Explicit unknown/unmatched reporting is required. Browser identity bridges
only observed pre-auth enrollment, not an invented cross-account customer merge. Client metadata is attribution, never
entitlement authorization or trustworthy proof of new-paid status. Webhook retains existing entitlement/retry behavior.

Browser smoke uses a synthetic adapter intercepting Supabase/API/ingestion/checkout before dispatch, plus explicit browser
network blocks on backend/payment/provider/publishing domains. Assert fixture installed after EACH navigation before actions.
No card entry, checkout Session creation, AI/provider request, publishing/scheduling/connect or LinkedIn action. This tests
rendered interaction and intended request payload, not live auth/Stripe processing. Processor parameters are exercised by
actual route code with explicit offline mocks, never presented as a real payment.

Rollback: close unmerged #96 before launch. After Atlas squash merge, revert its actual isolated squash SHA through review.
Never revert a placeholder SHA, delete customer records or reset attribution history. Immediate isolated rollback for verified
copy/draft/checkout/entitlement regression; LIN-87 weekday-adjusted free-tool checks retain the >20% policy trigger. Risks:
lifetime cash cannibalization, attribution loss, overlapping releases, billing-read errors. New purchases $0; provider cost
unknown, not zero. `update-docs` skill unavailable; documentation updated manually.
