# 232 - Consent-based post-copy email capture

> Status: ROLLED BACK · Area: Public | Editor · Last verified: 2026-10-03

## What

- EXP-6 originally showed a dismissible, optional consent form after a successful full-post copy. The experiment was rolled back after crossing its pre-committed kill line. The editor no longer renders the form, and `POST /api/leads` returns `410 Gone` before parsing, authentication, or persistence.
- Existing consented records and the additive database schema remain intact. No email is sent, and post copy behavior is unchanged.

## Why

- The free tool has organic traffic but no consented owned re-entry channel. EXP-6 tests whether a small post-copy opt-in can capture enough consented contacts to make a future, separately approved recovery or product-update revenue test economically viable.
- The test did not meet its pre-committed minimum, so the capture surface and new writes were stopped under LIN-9 rather than extending a low-yield experiment.

## Acceptance (binary, testable)

- [x] 232-AC-1 The post-copy editor no longer imports, renders, or triggers the capture surface, while `post_copied` and background analysis remain in the successful copy path. _(verified: `components/tool/editor-panel.tsx`; `tests/email-capture-exp6.test.mjs`)_
- [x] 232-AC-2 `POST /api/leads` returns `410 Gone` without parsing a request, authenticating a user, or calling Supabase. _(verified: `app/api/leads/route.ts`; `tests/email-capture-exp6.test.mjs`)_
- [x] 232-AC-3 Existing lead rows and database protections are retained without a destructive migration. _(verified: unchanged `supabase/migrations/031_leads.sql`; `tests/email-capture-exp6.test.mjs`)_
- [ ] 232-AC-4 The rollback is preview-smoke-tested through the deployment protocol.

## Implementation

- Full-copy behavior: `components/tool/editor-panel.tsx`.
- Disabled API handler: `app/api/leads/route.ts`.
- Retained historical UI and API contract: `components/tool/email-capture.tsx`, `app/api/leads/route.schema.ts`.
- Retained durable schema: `supabase/migrations/031_leads.sql`.

## Dependencies

- 025 Copy to Clipboard (`features/completed/025-copy-to-clipboard.md`).
- Supabase anonymous authentication and PostHog product analytics.
- EXP-6 in `resources/experiments.md` in the CEO workspace.

## Open questions / known gaps

- Do not send captured contacts any email until a separate experiment and permitted sending path are implemented.
- Roll back this rollback only by reverting its commit, which restores both the editor trigger and the persistence handler together.
