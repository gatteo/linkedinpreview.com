# 232 - Consent-based post-copy email capture

> Status: PARTIAL · Area: Public | Editor · Last verified: 2026-09-03

## What

- After a successful full-post copy, the editor shows a dismissible, optional form for an email address and explicit product-update consent. A submission creates an anonymous account only when the visitor chooses to submit, writes a normalized, deduplicated lead with server-owned consent metadata, and then records a non-PII `lead_captured` event. The form does not send email or delay copying.

## Why

- The free tool has organic traffic but no consented owned re-entry channel. EXP-6 tests whether a small post-copy opt-in can capture enough consented contacts to make a future, separately approved recovery or product-update revenue test economically viable.

## Acceptance (binary, testable)

- [x] 232-AC-1 A capture surface appears only after successful full-post copy and can be dismissed. _(verified: `components/tool/editor-panel.tsx`; `tests/email-capture-exp6.test.mjs`)_
- [x] 232-AC-2 Submission requires a valid email, an explicit unchecked-by-default consent control, and an authenticated anonymous session. _(verified: `components/tool/email-capture.tsx`; `hooks/use-anonymous-auth.ts`; `tests/email-capture-exp6.test.mjs`)_
- [x] 232-AC-3 The server route validates input, uses server-derived caller and audit fields, and emits no email or PostHog PII. _(verified: `app/api/leads/route.ts`; `app/api/leads/route.schema.ts`; `tests/email-capture-exp6.test.mjs`)_
- [x] 232-AC-4 The database has atomic normalized-email dedupe and denies direct anonymous/authenticated client access. _(verified: `supabase/migrations/031_leads.sql`; `tests/email-capture-exp6.test.mjs`)_
- [ ] 232-AC-5 The complete surface is previewed and production-smoke-tested through the deployment protocol. _(gap: pending branch push, database migration and smoke test)_

## Implementation

- Full-copy trigger: `components/tool/editor-panel.tsx`.
- Optional capture UI: `components/tool/email-capture.tsx`.
- Anonymous-auth result: `hooks/use-anonymous-auth.ts`.
- API contract and handler: `app/api/leads/route.schema.ts`, `app/api/leads/route.ts`.
- Durable schema: `supabase/migrations/031_leads.sql`.

## Dependencies

- 025 Copy to Clipboard (`features/completed/025-copy-to-clipboard.md`).
- Supabase anonymous authentication and PostHog product analytics.
- EXP-6 in `resources/experiments.md` in the CEO workspace.

## Open questions / known gaps

- Do not send captured contacts any email until a separate experiment and permitted sending path are implemented.
- The feature remains PARTIAL until preview and production smoke tests verify the deployed route and free-copy behavior.
