# Visitor writing help - LIN-237

Atlas's LIN-241 decision selects existing AI-volume writing help after voluntary demand following useful value. This is a separate potentially overlapping public addition, not a globally unenrolled experiment. It runs only in the default tool on `/`; dashboard, blog, preview and embed surfaces remain unchanged.

## Flow and eligibility

The existing successful-copy feedback timer, thresholds and cooldowns offer an optional inline categorical question in the same slot. Optional format discriminator separates personal/client/company organic posts from ad creative. Skip, dismiss and the existing Tally follow-up remain available. No post text, email or raw URL is sent in these events. Tally's existing form/schema is not modified.

Any visitor may initiate the existing public AI sheet. No auto-generated draft and no new AI endpoint/provider is added. A nonempty, non-refused accepted insertion records its current editor document only in memory. The current document must subsequently intersect the actual visible preview and be successfully copied. A stale/different/hidden preview, empty output, failed request, refusal, quota error, network error or clipboard failure cannot satisfy useful value. `RATE_LIMITED` is never used to select the offer.

After useful value, the generic `I want more AI writing help` opt-in starts a current authenticated-identity read and strict RLS billing read. A resolved own free row or resolved no-row account is compatible free. Any read error (including PGRST116), mismatched identity, invalid/null plan, paid/lifetime plan or provider-linked row suppresses purchase treatment. This does not prove globally never-paid status. Identity changes and cross-tab storage changes close the offer. Billing, identity and local exclusions are rechecked before Checkout, and the server independently checks current identity/free state before any provider call.

Known `lp-monthly-offer:*` account assignments, any `lp-draft-first:*` state and `lp-daily-test-enrollment-v1` suppress purchase treatment. Unreadable/corrupt exclusion or new flow state, failed writes and a receipt bound to another identity suppress it too. Old variants, keys, assignments and clocks are not rewritten. Local absence is explicitly `historical_overlap=unknown`, never absence proof. Lost storage, other devices, historical identities and browser telemetry gaps remain unknown.

Before price render, eligible opt-ins persist one `lp-visitor-writing-v1` receipt with authenticated user, UUID, first eligibility timestamp, release SHA and immutable version. There is no cohort rerandomization. Repeated opt-ins reuse the original clock. Checkout/render failures remain in this eligible denominator. Pre-value AI failures are recorded separately and are not post-useful-value eligible enrollments. This is not an AI-success-conditioned estimate for all tool visitors: it is the explicitly selected post-useful-value, more-help demand audience.

## Offer, paid truth and return

The offer presents existing $11.99/month Pro first, existing $39.99 lifetime alternative and existing monthly/lifetime purchase policy. Free editor, draft handoff, import/save/reuse, proof, homepage guarantees and all old offer variants remain intact. Existing hosted Checkout receives `source=visitor_job` and validated isolated `jobOffer` metadata; mixing old enrollment envelopes is rejected. Both success and cancel return to the existing public draft on `/#tool`. Success is not paid proof: the client reads billing for the stored identity; absent or failed webhook confirmation does not produce a paid claim. The existing webhook retains entitlement writes/retry behavior and adds only job attribution to processor-confirmed `purchase_completed`.

## Events

Public paid-return verification accepts only explicit `pro` or `lifetime`, not a non-free type cast. After billing resolves it rechecks authenticated identity and the unchanged validated receipt. Return-specific auth/storage watchers and effect cleanup invalidate stale work, including an identity/storage round trip or unmount. Invalid/null/missing/failed billing remains unverified and preserves the draft. This correction is isolated to the new public return; the shared reader and old return/cohort behavior are unchanged.

All branch events are snake_case and optional-chain PostHog capture. No customer/post/prompt/email content is captured.

| Event                                                                | Meaning                                                                                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `visitor_job_prompt_shown`                                           | Actual intersecting inline question                                                                                         |
| `visitor_job_prompt_answered`, `visitor_job_prompt_skipped`          | Categorical response or dismissal                                                                                           |
| `visitor_format_answered`, `visitor_format_skipped`                  | Optional format discriminator                                                                                               |
| `visitor_job_followup_opened`, `visitor_job_followup_shown`          | Existing optional Tally open request and actual open callback                                                               |
| `visitor_writing_started`                                            | Explicit AI sheet attempt, separate pre-value candidate ID                                                                  |
| `job_ai_failed`                                                      | Existing AI request error; no offer eligibility                                                                             |
| `job_ai_insert_accepted`                                             | Actual nonempty editor insertion                                                                                            |
| `job_preview_visible`                                                | Matching current inserted document visible in actual preview                                                                |
| `job_useful_copy`                                                    | Successful clipboard copy of that document after visible preview                                                            |
| `job_offer_suppressed`                                               | Unavailable billing/identity/storage/exclusion; no price render                                                             |
| `job_flow_eligible`                                                  | Verified compatible free plus useful value plus voluntary more-help, persisted before price render                          |
| `job_offer_seen`                                                     | Actual intersecting price panel, separate from eligibility                                                                  |
| `job_checkout_started`, `job_checkout_result`, `job_checkout_failed` | Original receipt retained for success/failure; opened URL is not a purchase                                                 |
| `job_identity_changed`, `job_storage_changed`                        | Invalidated purchase treatment                                                                                              |
| `job_checkout_return`                                                | Exact stored receipt matched to hosted success/cancel query                                                                 |
| `job_paid_return_verified`                                           | Own authenticated billing confirms paid after success return; not a new recurring revenue count                             |
| `purchase_completed`                                                 | Existing processor-confirmed event with additive `job_*` metadata; reconcile paid invoice/subscription/refund independently |

Receipt-bearing events and Checkout metadata use `job_enrollment_id`, `job_eligibility_at`, `job_flow_version=visitor_writing_v1`, `job_source=public_post_copy`, `job=writing_help`, `historical_overlap=unknown`, `billing_state_at_assignment=free`, `release_sha`. The early AI attempt ID is separate and is joined only within the same mounted useful-value session. Identification at eligible opt-in binds the Supabase identity without resetting its clock. The receipt does not impersonate EXP-9/10/11 attribution or authorize entitlements.

## Registration and release gates

Primary: first processor-reconciled new recurring purchase within 7 days / mature verified-free eligible opt-ins, after production/test/staff/paid/history exclusions. Baseline and compatible reachable sample remain unknown. Vera on LIN-238 must preregister reachable sample/window/kill line before release, not substitute the historical 363 repeat-copy proxy. Atlas must bind the actual production launch/squash SHA and exclusion windows. Report pre-value errors, reached price views, Checkout failures and historical-overlap UNKNOWN separately. Do not sum correlated old/new paid results.

Concrete reach limitation: `components/header/header-plan-cta.tsx` enrolls every current default-home visitor at min-width 768px, including safe controls, into `lp-daily-test-enrollment-v1`. That known enrollment is excluded here. Therefore a fresh normal desktop homepage visit cannot receive this new offer. The executable compatible slice is mobile home visitors without prior known desktop/monthly/draft enrollment, plus verified-free useful-value/more-help demand. Resizing a mobile visit to desktop creates the old header assignment and suppresses purchase. Do not delete that key, exempt its controls or treat synthetic controller-level free cases as whole-page desktop reach. Vera must use this narrower reach for registration; Atlas must choose explicitly if it is commercially insufficient. This implementation does not broaden the approved exclusion contract.

The UI's existing Pro allowance is 50 generations and 200 refinements per rolling 24 hours, source-bound to `config/ai.ts` and existing rate-limit code. Actual production function/entitlement limits and processor attribution remain release gates until authorized read-only verification binds them. Contained browser fixtures and offline provider doubles are not live allowance, AI, customer, purchase or revenue evidence.

Release requires full type-check/lint/clean/build, existing and new contracts, contained desktop/mobile preview including copy/preview/blog/dashboard/import/save/reuse, independent Sentinel exact-head review, Vera registration and Atlas merge plus production smoke. No new service, provider test, outreach, spend, rollout or production/customer mutation is authorized by these offline checks. Paid/import/save/reuse regressions preempt this branch. Implementation effort cap: one engineering day.

Rollback: disable only this new default-home flow or have Atlas/Sentinel review an isolated revert of the actual merged squash. Do not revert old monthly/draft/header experiments or claim historical attribution can be removed by code rollback.
