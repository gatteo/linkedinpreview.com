# Onboarding settings read contract

Branding and strategy reads distinguish a successful missing row (`PGRST116`) from transport, auth and other read failures. Successful missing reads retain the existing defaults and new-user planning behavior.

Both hooks expose `loadFailed` and scope read readiness to the current authenticated user and Supabase client. A pending identity/client transition is loading immediately, before fetch effects resolve. Cancelled reads cannot replace the next account's data or emit stale read-error toasts. Normal subsequent loading clears failure on success; no automatic retry loop is introduced.

The onboarding controller waits for both successful reads before automatic decisions, explicit planning, resume or legacy backfill. It resets the account's decision on user changes and does not render planning on unresolved reads. Initial auth bootstrap preserves the arrival snapshot captured before another consumer strips return parameters; leaving a known account resets it. Persistence callbacks are gated by the same readiness. Unknown settings cannot be merged with defaults and upserted by hook mutations; failed-load mutations retain the existing load-error toast. Branding's optimistic save indicator is not shown for rejected mutations.

This gate does not block independent editor, import, draft save, preview or copy. Draft-first intent remains in the original URL until the existing importer handles it. Successful loaded decisions retain the existing completed, legacy, optional planning, OAuth and checkout-return precedence. No billing, entitlement, pricing, cohort clock or provider behavior changes.

Verification: `node --test tests/onboarding-read-failure.test.mjs tests/draft-first.test.mjs`. The new tests connect the actual hooks, fetch helpers and controller through the existing actual-module adapter with synthetic Supabase boundaries. Remote preview verification must separately exercise real React at desktop/mobile widths with contained synthetic reads/writes. Neither test boundary represents real backend/customer/provider recovery.
