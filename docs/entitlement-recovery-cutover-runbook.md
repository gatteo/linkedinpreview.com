# Entitlement recovery cutover runbook

## Scope and safety envelope

This is a preparation artifact for LIN-41. It authorizes no production action.

At branch creation, production `main` was `f7658fa83b4717ae82172f1c8afc3f21161b6310`, which reverted dormant entitlement-recovery commit `8bb98994e6a15e63b0f5f54cf6ccf2d7c8ed52c9` during the free-tool guardrail incident. This branch restores that production-inert core and adds only deterministic synthetic dry-run validation and this runbook. It does not wire a route, change a reader or webhook, apply a migration, seed evidence, import an entitlement, mutate billing data, add a secret, change Vercel configuration, deploy, or merge.

The cutover denominator is fixed for this runbook:

- 15 verified paid records with canonical positive paid live Checkout Sessions
- 1 grandfathered non-revenue lifetime exception, preserved only through legacy fallback
- 1 stale test-mode Pro flag, excluded from the immutable ledger and from paid-revenue truth

The cutover kill line is any missing immutable proof, duplicate identity, identity ambiguity, unexplained paid-to-free difference, stale-test import, former-owner regrant, or need for a destructive schema change.

No rollback in this runbook drops a table, deletes a row, rewrites an approval, erases a webhook event, or overwrites evidence. Additive schema and committed evidence remain in place.

## Dormant core trace

The core is intentionally disconnected:

| Concern                                    | Dormant implementation                                              | Live path that remains unchanged                                                  |
| ------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Immutable purchase and ownership ledger    | `supabase/migrations/032_entitlement_recovery.sql`                  | No production table exists until the migration is separately approved and applied |
| Historical approval and import             | `supabase/migrations/033_historical_entitlement_reconciliation.sql` | No run, approval, seal, or import is seeded                                       |
| Monotonic dual reader                      | `supabase/migrations/034_monotonic_dual_read_authorization.sql`     | `lib/supabase/billing.ts` still reads `public.billing` directly                   |
| Canonical Checkout ingestion               | `lib/billing/entitlement-ingress.ts`                                | `app/api/billing/webhook/route.ts` still performs the legacy billing upsert       |
| Webhook and subscription lifecycle handler | `lib/billing/webhook-handler.ts`                                    | The route does not import or call the dormant handler                             |
| Recovery claim seam                        | `lib/billing/recovery-claim-handler.ts`                             | No recovery route exists                                                          |
| Challenge evidence                         | `billing_recovery_challenges` in migration `032`                    | No server-owned challenge issuance function or verified-email route exists        |

The minimum remaining implementation before email recovery can be enabled is:

1. Add one additive migration after `034` with a service-role-only function that creates a short-lived verified recovery challenge from the authenticated user's confirmed Supabase email HMAC. The function must derive matching entitlement IDs server-side and must not accept a caller-selected owner or expose another buyer's identity.
2. Add a versioned, server-only email HMAC key and default-off write, reader, and recovery modes. No client bundle may receive the key.
3. Replace the legacy webhook route body with the tested handler only when ledger-write mode is enabled. It must call `record_stripe_entitlement` and `record_stripe_subscription_lifecycle`, preserve Stripe retry semantics, and add `checkout.session.async_payment_succeeded` to the Stripe endpoint event set.
4. Adapt `fetchBilling` to call a narrow authenticated dual-reader RPC. The adapter must return the complete `BillingData` shape without granting direct ledger-table access. Realtime may continue observing the derived `billing` projection.
5. Add the authenticated recovery route. It must obtain the target user and confirmed email from Supabase auth, compute the versioned HMAC server-side, issue the challenge through the service-only function, and call `claim_entitlement`. It must return generic unavailable responses and never reveal whether an arbitrary email purchased Pro.
6. Keep the ledger-only reader disconnected. The monotonic legacy fallback is required for the grandfathered lifetime exception and for rollback.

## Deterministic preparation dry run

Run only the committed synthetic cohort:

```sh
pnpm test:entitlement-cutover-dry-run
node --experimental-strip-types --test tests/entitlement-cutover-dry-run.test.mjs
```

Expected pass counters:

- source records: 17
- verified paid coverage: 15/15
- eligible imports: 15
- preserved grandfathered lifetime exceptions: 1
- excluded stale test rows: 1
- missing immutable proofs: 0
- duplicate grant candidates: 0
- stale-test imports: 0
- former-owner regrants: 0
- unexplained paid-to-free differences: 0
- identity ambiguities: 0

The fixture uses only synthetic record, owner, Checkout Session, and evidence identifiers. It contains no production user ID, Stripe ID, email, API response, secret-derived HMAC, or production manifest row. The negative tests force every kill counter independently.

## Staged production rollout

Every stage below requires a separate scoped issue and independent review. Complete the readback checks before proceeding. A pass at one stage is not approval for the next.

### Stage 0 - review and freeze

1. Confirm the current production SHA, deployed SHA, migration ceiling, Stripe webhook event list, and live authorization reader from fresh readbacks.
2. Confirm the complete non-PII reconciliation manifest still accounts for 15 verified paid records, 1 grandfathered lifetime exception, and 1 stale test row at one cutoff.
3. Confirm no immutable ledger table exists in production and no default-off cutover variable is enabled.
4. Run `pnpm test:entitlement`, `pnpm type-check`, `pnpm lint`, `pnpm clean`, and `pnpm build` on the exact candidate SHA.

STOP 0 - before migration

Stop unless Sentinel approves the exact code SHA, the complete manifest is independently approved, the free-tool incident is closed, and Atlas creates a migration-only issue. Any denominator drift, missing proof, duplicate, ambiguity, or destructive SQL requirement ends the rollout.

Rollback before migration: close the PR or revert the future merge commit. Production data is unchanged.

### Stage 1 - additive schema only

Under the separately approved migration-only issue:

1. Apply migrations `032`, `033`, `034`, and the future reviewed challenge-issuance migration in numeric order with `ON_ERROR_STOP=1`.
2. Insert no reconciliation run, approval, entitlement, assignment, challenge, or webhook event.
3. Read back table, function, trigger, unique-constraint, RLS, and privilege definitions.
4. Confirm `anon` and `authenticated` cannot read ledger tables or execute operator functions.
5. Confirm the live webhook and product reader still use only the legacy path.

STOP 1 - after schema and before evidence seed or import

Stop on any partial migration, missing trigger, privilege expansion, live-path change, or non-additive requirement. Do not seed around a failure.

Rollback: leave the additive schema in place and keep every live writer, reader, route, and flag on the legacy or off setting. Repair forward with a new additive migration. Never drop the new tables or functions.

### Stage 2 - seal the reviewed approval set

Use a restricted operator artifact that is outside source control and contains the independently approved production identities and digests.

1. Insert exactly one reconciliation run with `expected_paid_account_count = 17` and `expected_paid_checkout_session_count = 15`.
2. Insert exactly 17 immutable dispositions:
    - 15 `approved_import`
    - 1 `manual_exception` for the grandfathered non-revenue lifetime row
    - 1 `not_entitled` for the stale test-mode Pro row
3. Verify every approved import has one live, paid, positive-amount, allowlisted Checkout Session and one origin owner.
4. Verify the grandfathered row has no import identity and keeps legacy lifetime authorization.
5. Verify the stale test row has no import identity and is not counted as paid revenue. Do not alter its legacy row in this rollout.
6. Seal the run once with `seal_historical_entitlement_reconciliation` and read back the sealed approval-set digest.

STOP 2 - before import

Stop unless the sealed readback is 17 dispositions, 15 approved imports, 1 grandfathered manual exception, 1 stale-test exclusion, 15 unique Checkout Sessions, 17 unique owners, and zero changed digests. Stop if any matching ledger identity already has another current owner.

Rollback: do not consume approvals. Keep the sealed evidence immutable. Supersede only with a new reconciliation run and new approvals. Never update or delete the failed run.

### Stage 3 - historical import

1. Rehearse the import against an isolated disposable PostgreSQL database populated only with synthetic fixtures.
2. In production, call `import_approved_historical_entitlement` only for the 15 sealed `approved_import` Checkout Sessions.
3. Treat `historical_imported` and exact `historical_import_replayed` results as the only acceptable outcomes.
4. Read back 15 active immutable entitlements with exact identity equality to the sealed approvals.
5. Confirm the grandfathered and stale test rows produced zero ledger entitlements.
6. Run the monotonic comparison without changing the live reader. The 15 verified paid records and the grandfathered exception must still resolve paid; the stale test row is an explained exclusion and remains a separately gated cleanup.

STOP 3 - after import and before webhook or reader cutover

Stop on any failed import, replay mismatch, duplicate, owner mismatch, inactive/refunded/disputed collision, conversion-event emission, or unexplained paid-to-free result. Do not retry with altered evidence.

Rollback: keep the imported ledger and consumed approvals as evidence, keep the live webhook and reader on legacy, and investigate with a new additive observation or superseding approval. Never delete or rewrite the imported records.

### Stage 4 - production configuration with all modes off

The future wiring PR must validate these server-only variables, all defaulting safely when absent:

- `BILLING_EMAIL_HMAC_KEY`
- `BILLING_EMAIL_HMAC_KEY_VERSION`
- `ENTITLEMENT_LEDGER_WRITE_MODE=off|dual`
- `ENTITLEMENT_AUTHORIZATION_MODE=legacy|dual`
- `ENTITLEMENT_RECOVERY_ENABLED=false|true`

STOP 4 - before production config

Stop unless the wiring PR is merged, deployed with modes still `off`, `legacy`, and `false`, the HMAC key is stored only in encrypted production and preview configuration, and rollback ownership is named. This runbook does not authorize creating or changing these values.

After separate approval, add the HMAC key and version while keeping write mode `off`, authorization mode `legacy`, and recovery `false`. Read back only variable names and targets, never secret values.

Rollback: restore the previous encrypted configuration version or remove the new variables through the approved config path. Keep all cutover modes off. No data rollback is needed.

### Stage 5 - webhook dual write

1. Deploy the independently reviewed webhook-wiring PR with ledger write mode still `off`.
2. Add `checkout.session.async_payment_succeeded` to the Stripe webhook endpoint only after the handler is deployed.
3. Change only `ENTITLEMENT_LEDGER_WRITE_MODE` from `off` to `dual`.
4. Verify a valid new paid Checkout creates one immutable entitlement and the same derived `billing` projection, duplicate delivery creates no duplicate grant or conversion, and handler failures return 500 for Stripe retry.
5. Verify subscription updates and deletions change only the matching immutable subscription lifecycle and projection.

STOP 5 - before reader cutover

Stop on any webhook 5xx loop, identity conflict, projection mismatch, duplicate grant, duplicate conversion, or free-tool regression.

Rollback: set ledger write mode to `off` first, then revert the webhook-wiring commit if necessary. Keep all ledger and webhook evidence. The legacy webhook path remains the authoritative writer during rollback.

### Stage 6 - monotonic reader cutover

1. Deploy the independently reviewed reader adapter with `ENTITLEMENT_AUTHORIZATION_MODE=legacy`.
2. Run the production-host comparison for every cohort disposition without emitting identifiers.
3. Require 15/15 verified paid records paid, the grandfathered lifetime exception paid through legacy fallback, zero stale-test ledger grants, zero duplicates, zero former-owner regrants, and zero unexplained paid-to-free differences.
4. Change only `ENTITLEMENT_AUTHORIZATION_MODE` from `legacy` to `dual`.
5. Smoke test the dashboard plan state, upgrade surface, settings, checkout return, and Realtime refresh. Smoke test the free editor, live preview, Copy Text, `/blog`, and `/dashboard`.

STOP 6 - before recovery route cutover

Stop on any mismatch, free plan shown to a protected record, stale-test ledger authorization, direct ledger-table exposure, or free-tool guardrail breach.

Rollback: set authorization mode to `legacy` first, then revert the reader adapter commit if needed. Keep webhook dual-write evidence intact unless Stage 5 also fails.

### Stage 7 - email recovery route

1. Deploy the independently reviewed challenge and recovery route with `ENTITLEMENT_RECOVERY_ENABLED=false`.
2. Verify confirmed-email proof, HMAC version matching, short expiry, one-time consumption, authenticated target binding, confirmed-owner manual-review block, generic errors, rate limits, and no account enumeration.
3. Verify synthetic recovery transfers one entitlement once, writes one append-only assignment, increments `owner_version` once, recomputes both projections, and cannot replay.
4. Change only `ENTITLEMENT_RECOVERY_ENABLED` from `false` to `true`.
5. Run one separately authorized end-to-end recovery verification and read back the exact immutable assignment and current owner.

Rollback: set recovery enabled to `false` first and revert the route commit. Do not reverse an ownership assignment by editing rows. Any mistaken transfer requires a new reviewed recovery assignment or manual support path that preserves the existing evidence.

## Post-cutover observation

For two completed days, Sentinel must watch:

- canonical recovery eligibility coverage: 15/15
- unexplained paid-to-free differences: 0
- duplicate grants: 0
- stale-test imports: 0
- former-owner regrants: 0
- webhook handler failures and retry backlog: 0 unresolved
- free-tool pageviews and `post_copied` against the registered seven-day baseline

Any entitlement kill counter above zero disables recovery first, restores the legacy reader, and disables ledger webhook writes as needed. Any free-tool guardrail breach follows the incident rule: revert first, investigate second.
