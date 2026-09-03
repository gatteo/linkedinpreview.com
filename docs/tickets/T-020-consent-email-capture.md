# T-020 - Consent-based post-copy email capture

> Status: done
> Touches: [232-consent-email-capture](../features/232-consent-email-capture.md) · Opened: 2026-09-03 · Closed: 2026-09-03

## Goal

- Add a completely optional email-capture surface only after a successful full-post copy. It creates a permissioned re-entry channel for later product updates and separately authorized abandoned-checkout recovery, while leaving copy success independent from authentication, persistence, and analytics.

## Context

- EXP-6 starts from 0 consented leads among 894 production-host unique post copiers in the prior seven days. Its sole leading metric is unique `lead_captured` divided by unique `post_copied`; the paid-revenue path is a later Stripe-confirmed recovery completion, not lead capture alone.

## Plan

- Add a small dismissible post-copy form with an initially unchecked explicit marketing-consent control.
- Add an authenticated, strict same-origin server route with rate limiting, server-owned identity and consent audit fields, and no email delivery.
- Add an additive, RLS-protected `leads` table with database-atomic normalized-email dedupe and no client policies.

## Acceptance (binary, testable)

- [x] T-020-AC-1 The capture surface is rendered only from the successful full-copy side-effect path, never from failed or partial copy. _(verified: `tests/email-capture-exp6.test.mjs`)_
- [x] T-020-AC-2 A valid submission requires explicit consent, a successful anonymous session, and durable server success before it emits the non-PII `lead_captured` event. _(verified: `tests/email-capture-exp6.test.mjs`)_
- [x] T-020-AC-3 The route derives the caller and consent audit fields server-side, while RLS and revoked client grants prohibit direct client access. _(verified: `tests/email-capture-exp6.test.mjs`)_
- [x] T-020-AC-4 The additive migration and route are live-verified without blocking the free tool. _(verified: live RLS/function grants; PR #85 Vercel/GitHub checks; production HTTP smoke on 2026-09-03)_

## On completion

- Fold the lasting acceptance criteria into feature 232, update the engineering changelog, and mark this ticket done.

## Notes / open questions

- No email, recovery URL, or campaign is authorized by EXP-6. Retain consented records on rollback rather than deleting user data.
