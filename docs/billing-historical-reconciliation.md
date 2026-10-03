# Historical paid-entitlement reconciliation

## Status

**Design only. Do not apply migrations, insert approvals, import rows, switch a reader, wire a route, or change production data from this document.**

This design is a prerequisite for moving paid authorization from the mutable `public.billing` projection to the immutable entitlement ledger proposed in migration `027`. The existing `billing_legacy_monthly_import_approvals` bridge is deliberately limited to two monthly subscriptions and is not a reconciliation for the complete paid population.

## Revenue objective and decision gate

- **Metric:** number of currently paid accounts that remain authorized after a dual-read dry run: `legacy paid AND ledger/dual read paid` divided by `legacy paid accounts`.
- **Baseline:** at 2026-09-03 08:41 CEST, `public.billing` has 15 distinct paid accounts: 12 `stripe_lifetime` and 3 `stripe_monthly`; two monthly rows have a future `plan_renews_at`, one is past renewal. Stripe has 13 positive, paid, unrefunded charges and 13 matching completed paid Checkout Sessions since launch: 11 payment-mode at $39.99 and 2 subscription-mode at $11.99. Thirteen of the 15 paid billing accounts match a completed paid Checkout Session by app-owned `client_reference_id`; two do not.
- **Mechanism:** a frozen, human-reviewed identity record prevents cookie-loss recovery and future webhook replay from regranting a former owner or silently dropping a real buyer.
- **Revenue path:** preserves paid lifetime access and active monthly value, reducing refund, support, and churn risk. It is not a new-sales claim.
- **Minimum sample:** the complete frozen source population, not a statistical sample. Before any authorization cutover, the manifest must account for all 15 current paid accounts and every positive paid Checkout Session in the same cutoff.
- **Kill line:** stop the cutover if the manifest has any unexplained missing, extra, duplicate, identity-conflicted, or unresolved paid record. Keep the legacy access path for that record and investigate outside the import path.
- **Revenue guardrail:** no legacy paid account may become free because it is absent from, expired in, or rejected by the reconciliation process. A Stripe-confirmed refund, dispute, or canonical inactive subscription observation is the only route to revocation.
- **Cost and risk:** $0 direct cost. The principal risk is wrongly authorizing, revoking, or transferring access. The design therefore uses an approval manifest, append-only evidence, no automatic import, and a dual-read period.
- **Rollback:** before cutover, discard the unapplied migration and reconciliation WIP. After a future cutover, restore the prior consumer commit with `git revert <main-sha>` and retain the legacy projection as the access fallback until the discrepancy is resolved.

## 1. Define the complete source population

A reconciliation run uses an immutable `cutoff_at` and one named manifest. It must compare, without exposing emails or identifiers in source control:

1. every `public.billing` row that is currently `pro` or `lifetime` at `cutoff_at`;
2. every Stripe Checkout Session created since billing launch that is `status=complete`, `payment_status=paid`, and `amount_total > 0` at `cutoff_at`;
3. every Stripe subscription referenced by a paid billing row or completed subscription Checkout Session, with its canonical Stripe status and observation time;
4. Stripe refund and dispute evidence for each candidate payment/charge.

The run record must retain source-query versions, exact cutoff, aggregate expected counts by plan and disposition, and cryptographic digests of canonical Stripe responses. It must never commit raw Stripe IDs, user IDs, emails, API responses, or secret-derived email HMAC inputs to the repository.

A candidate is exactly one purchase entitlement, identified by its canonical Checkout Session. Monthly renewals are lifecycle observations of that entitlement, not independent historical entitlements. Each candidate receives exactly one disposition:

- `approved_import` - canonical paid Stripe identity and product-account mapping match.
- `already_ledgered` - identity already exists in the immutable ledger and every immutable field matches.
- `not_entitled` - canonical evidence proves a refund, dispute, unpaid checkout, wrong price, or inactive monthly status before the cutoff.
- `manual_exception` - evidence is incomplete, conflicted, or cannot safely map to one account.

The manifest is complete only if the sum of those dispositions equals both source populations after their defined relationship is documented. At the current baseline, the two paid `billing` accounts without a completed paid Checkout Session mapping must begin as `manual_exception`, not be guessed, automatically imported, or revoked.

## 2. Required reviewed evidence per candidate

### All candidates

The reviewer compares canonical Stripe retrievals, not client metadata alone, and records:

- Checkout Session ID, mode, status, payment status, positive amount, currency, creation timestamp, and allowlisted price-to-plan mapping.
- Payment Intent and Customer IDs where Stripe exposes them.
- app-owned `client_reference_id` and `metadata.user_id`, mapped to exactly one existing product account.
- Stripe response digest, legacy billing snapshot digest, reconciliation manifest digest, and source retrieval timestamp.
- a plan classification of `pro` or `lifetime`, the selected disposition, reviewer identity, review timestamp, and an exception reason if not imported.

### Lifetime candidates

A lifetime candidate also needs a completed paid one-time Checkout Session at the allowlisted lifetime price and canonical no-refund/no-dispute evidence as of the cutoff. It must not be inferred from a `public.billing` row alone.

### Monthly candidates

A monthly candidate also needs the initial paid subscription Checkout Session, Stripe Customer and Subscription IDs, allowlisted recurring monthly price and interval, and a canonical Stripe subscription status observed at the cutoff. The imported entitlement status and `subscription_lifecycle_observed_at` must derive from that Stripe status observation, not `reviewed_at` or the mutable `plan_renews_at` field.

## 3. Approval and audit model

Replace the fixed, two-row monthly bridge with a generic approval manifest that supports both plans and the real frozen candidate count. The implementation should be test-driven in a new additive migration only after this design is approved for implementation.

Each approval row must be append-only and contain:

- its immutable reconciliation-run manifest digest by foreign-keyed run membership, plus a deterministic approval-set digest captured by a one-time service-role seal before any import;
- canonical Checkout, Payment Intent, Customer, and Subscription identity fields where applicable;
- immutable account mapping and privacy-preserving checkout-email HMAC plus key version where available;
- plan, canonical status, Stripe status-observed timestamp, evidence digests, disposition, reviewer identity from a controlled operator identity, and review timestamp;
- expiration only for an unconsumed import authorization, never for the evidence record;
- one consume transition that records the immutable entitlement ID and import timestamp.

Corrections must be a new superseding approval decision linked to the prior one. They must never update or delete evidence, approvals, imported identity fields, entitlement assignments, or Stripe event records. The existing `stripe_webhook_events` table needs append-only database protection before it can be treated as an audit ledger.

Production execution requires a human operator to review the generated non-PII manifest, attest the exact expected counts and exceptions, and run a narrowly scoped, reviewed import. Application code must not create approvals. No ad hoc production SQL is permitted.

## 4. Safe execution sequence

1. Generate a read-only, non-PII reconciliation manifest at a frozen cutoff.
2. A human reviewer checks every candidate against canonical Stripe evidence and explicitly approves each disposition. Unmatched or ambiguous paid accounts remain paid through legacy `billing` and are marked `manual_exception`.
3. Insert only reviewed `approved_import` evidence through a controlled, additive, append-only path. Do not change a legacy `billing` row in this stage.
4. Import each approved record idempotently. Reconcile that the resulting immutable identity equals the approval evidence exactly. No import emits a new `purchase_completed` conversion event.
5. Run a dual-read report: legacy access versus ledger access per account, summarized without identifiers. It must report zero unexpected paid-to-free differences and account for all 15 baseline paid accounts.
6. Keep product authorization monotonic during the transition: paid if the reviewed ledger grants access **or** the legacy row grants paid access. Missing approval is not a revocation signal.
7. Only after a second human review of the zero-difference report may a separate, reversible consumer-cutover change be proposed. Retain dual-read observability and rollback to legacy authorization until a complete post-cutover window is clean.

## 5. Required test matrix before any production cutover

- Dry-run manifest has no missing, extra, duplicate, or conflicting candidate across the defined source population.
- Approved lifetime and monthly imports preserve every canonical immutable field and reject a collision with any mismatched field.
- Unknown, expired, duplicate, or manually excepted approval cannot import an entitlement.
- A canceled monthly subscription, refund, and dispute can only become inactive through canonical Stripe evidence, not lack of reconciliation coverage.
- Historical lifecycle timestamps before and after review are ordered correctly. An old cancellation cannot be suppressed by using review time as its status timestamp.
- Imports are replay-safe and concurrency-safe, including duplicate event, duplicate Checkout Session, and duplicate approval delivery.
- Approval, entitlement, assignment, and webhook event tables reject update/delete attempts except the single allowed consumption state change.
- Anonymous and authenticated application roles cannot create, read, mutate, seal, or execute import paths. Service-role execution is limited to the reviewed seal and importer.
- Dual-read authorization preserves paid access for approved records, ambiguous records, and a partial-import failure. The ledger-only reader remains disconnected until this test and the complete manifest pass.

## Open reconciliation decision

The observed population is currently inconsistent: 15 current paid `billing` rows versus 13 positive paid Stripe Checkout Sessions, with 13 account mappings. The first reconciliation run must identify the provenance of the two unmatched legacy paid records. Until then, they are protected as paid through the legacy projection and block a ledger-only cutover.
