# Redacted historical paid-entitlement discrepancy report

**Read-only source snapshot:** 2026-09-03 12:37 UTC. No production data changed. This report contains no raw Stripe IDs, product user IDs, emails, API responses, or secret-derived values.

## Decision gate

- **Revenue objective:** preserve every currently paid account through a future dual-read authorization cutover, reducing entitlement-loss support, refund and churn risk.
- **Source population:** 15 paid `public.billing` accounts versus 13 completed, paid, positive-amount Stripe Checkout Sessions.
- **Result:** 13/15 paid accounts have exactly one app-reference-matched paid session; 2 require manual-exception protection. 0 paid sessions are unmatched to a current paid account.
- **Authorization status:** no human review or approval has occurred. This report is not approval evidence and confers no import or cutover authority.
- **Cutover rule:** this report does not authorize approval seeding, migration application, consumer switching or user-data changes. Even after human review resolves every unexpected difference, a separate human-approved manifest and change authorization are required. Manual exceptions remain authorized by the legacy path.
- **Rollback:** this is read-only. For future code cutover, revert the isolated consumer commit and retain dual-read legacy fallback.

## Aggregate evidence

- Paid accounts: 12 lifetime, 3 Pro.
- Completed paid Checkout Sessions: 11 payment-mode, 2 subscription-mode.
- Billing-linked subscription IDs: 3; canonical active status: 2; local Pro renewals: 2 future and 1 past or missing.
- Positive paid charge refunds observed: 0; Stripe disputes returned: 0.

## Per-account redacted reconciliation

| Record | Stable redacted fingerprint | Legacy plan | Legacy source   | Renewal state   | Paid-session match               | Session label | Required disposition                    |
| ------ | --------------------------- | ----------- | --------------- | --------------- | -------------------------------- | ------------- | --------------------------------------- |
| R01    | `cb139f5303bc`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S05           | human-review candidate - not approved   |
| R02    | `ab9c0de8f26c`              | pro         | stripe_monthly  | future          | stripe_matched                   | S13           | human-review candidate - not approved   |
| R03    | `6c6ade01edfb`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S06           | human-review candidate - not approved   |
| R04    | `9d92b110e113`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S01           | human-review candidate - not approved   |
| R05    | `0f74e980684b`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S04           | human-review candidate - not approved   |
| R06    | `9709ea07c316`              | lifetime    | stripe_lifetime | n/a             | manual_exception_no_paid_session | none          | manual_exception - retain legacy access |
| R07    | `e06c715d20b9`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S08           | human-review candidate - not approved   |
| R08    | `6c4f587ff666`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S07           | human-review candidate - not approved   |
| R09    | `d07be0a302a2`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S09           | human-review candidate - not approved   |
| R10    | `58872489c212`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S11           | human-review candidate - not approved   |
| R11    | `68eedc3d9f0b`              | pro         | stripe_monthly  | past_or_missing | manual_exception_no_paid_session | none          | manual_exception - retain legacy access |
| R12    | `1c550be0ed34`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S03           | human-review candidate - not approved   |
| R13    | `097408aa4dc9`              | pro         | stripe_monthly  | future          | stripe_matched                   | S10           | human-review candidate - not approved   |
| R14    | `c3b785dc8843`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S12           | human-review candidate - not approved   |
| R15    | `c45a8085ff37`              | lifetime    | stripe_lifetime | n/a             | stripe_matched                   | S02           | human-review candidate - not approved   |

## Human review checklist

- Review each Stripe-matched record against canonical Stripe Session, payment, customer and, for Pro, subscription status evidence in a restricted operator session. Do not use this source-controlled report as approval evidence.
- Assign an explicit disposition to all 15 records. The two unmatched paid accounts must stay `manual_exception` unless canonical provenance is established.
- Confirm no duplicate session-to-account mapping, plan mismatch, refund, dispute, inactive subscription or unpaid/wrong-price candidate before any approval seal.
- Generate a fresh snapshot at the same frozen cutoff immediately before a human-reviewed approval manifest. A zero-unexpected-difference dual-read report is required before any authorization consumer cutover.
