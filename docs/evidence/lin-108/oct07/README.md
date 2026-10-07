# LIN-108 current-main integration and prospective monthly rehearsal

## Artifact and scope

- Existing PR: https://github.com/gatteo/linkedinpreview.com/pull/104
- Branch: `feat/lin-108-draft-first`
- Integrated application head: `14e3226c3cf127382734140893db43946c29fb6d`
- Actual main: `86011f3beb217cf5902a740a9b6cc5bd7033244a`
- Immutable ready preview: https://linkedinpreview-9n9vdduaa-gatteos.vercel.app
- Deployment: `dpl_6Sm4ocxPw7q2BwSALfHpug4r3Cco`, READY, exact application SHA, preview target (API target null, not production).
- Application CI: https://github.com/gatteo/linkedinpreview.com/actions/runs/37626191455, SUCCESS.

Normal same-PR merge, no force-push or new implementation PR. Actual main contributes four content commits and shared header/hook/config code. Shared application files are byte-identical to actual main. No new product feature edit beyond that integration. Three additional actual-module regressions cover independent EXP-11/EXP-10 IDs, first clocks, account scope and frozen header safe-control behavior. The dictionary retains both sections and explicitly documents independent stores. PR #96 remains unmerged and is NOT in #104. LIN-115/#105 remain separate.

Historical LIN-128 approval is retained for its older basis, not approval of this artifact. This artifact needs a fresh independent Sentinel exact-head review. Atlas retains the existing October 8 second completed-day LIN-87 recommendation, LIN-107 decision, monthly-first launch, actual-main reconciliation after that squash, production smoke and release clocks. No extra day, maturity hold, flag setup or strategy approval is introduced.

## Local gates

- Full Node suite: 119/119 including subtests; focused draft/import/checkout/header/hook suite: 53/53.
- Required `pnpm type-check`, `pnpm lint`, `pnpm clean`, `pnpm build`: exit 0.
- Lint: 0 errors, 2 established incompatible-library warnings.
- Build: 209 generated documents, 263 routes. Known Contentlayer post-generation `ERR_INVALID_ARG_TYPE` remains before successful Next completion; not concealed as a clean Contentlayer run.
- Application diff-check: exit 0. Inherited historical docs/evidence whitespace still produces exit 2, including the previously disclosed LIN-108 oct06 logs. Do not claim all historical evidence diff-check is green.
- `update-docs` was invoked and unavailable; dictionary updated manually.

## Preview retry

Initial exact-head deployment `dpl_B3GotM1oovW7tt3SDayz7eJNsiZv` failed with 16 Turbopack Google Playfair font import-query errors. Local build and GitHub CI passed. The source was not changed to work around it. Retained build events are `vercel-first-events.json`.

CLI redeploy failed at user lookup with HTTP 404 for the project-scoped token. REST rejected explicit `target=preview`; the documented API requires omission for preview. A same-commit REST redeploy with `withLatestCommit=false`, no project/env/build-config overrides, succeeded. Exact deployment readback confirmed READY and source SHA; GitHub Vercel status is now SUCCESS. No production deployment or deploy configuration change.

## Contained browser verification

`summary.json` is computed from append-only browser records and context records. It reports 28 unique completed behavior checks, 27 final context/error records, 5 excluded diagnostic contexts, all 32 recorded contexts closed, and 23 screenshots. All final error arrays are empty.

Every full test navigation begins in a fresh isolated about:blank context. Fixture and CDP blocks are installed in the same browser tool call before navigation; fetch/WebSocket/beacon/XHR markers are asserted before interaction. Backend, provider, Stripe, telemetry and LinkedIn routes remain blocked or handled by synthetic local adapters. Intercepted requests, including fixture auth and draft CRUD, are local simulations, not backend writes. Native clipboard is NOT mocked.

Verified at desktop 1440px and mobile 390px:

- Free typing updates rendered preview and native Copy Text clipboard readback is exact.
- Content-carrying free-tool handoff is intentional; its destination is intercepted, then opened in a fresh contained context with copied local and session fixture storage.
- Imported draft is usable before planning; hydration leaves used=false. Pre-auth clock/source survives binding and remains distinct from header enrollment.
- Meaningful edit persists when leaving for Posts before the 2-second debounce: 729.2ms desktop, 580.5ms mobile measured from navigation initiation. Fixture rows contain current content and used=true. Reload rehydrates it without mandatory planning.
- Mobile editor/preview tabs preserve content. Native IndexedDB synthetic PNG import, persisted fixture media and fresh-context remount display the image at both widths.
- Optional planning is discoverable. Saved paywall planning takes precedence; synthetic OAuth denial resumes Connect; synthetic upgrade checkout success/cancel overrides saved planning. These are rendered return-parameter tests, NOT live auth/OAuth/payment verification.
- Existing relevant Pro action remains higher AI limits, not a new entitlement. Both current prices, Best value and selected-plan policies are preserved. Four local held checkout payloads retain EXP-10 ID/clock/source; no processor dispatch occurs.
- `/blog` and `/dashboard` render.

Harness diagnostics excluded from totals: serializing a DOM node exceeded CDP depth; editor-center pointer hit another control, replaced with explicit editor focus plus native CDP input; card/p-only preview selector assumptions were corrected using rendered text; browser calls reset tab/viewport so recorded target switching is explicit; hidden mobile sidebar anchor/overlay clicking caused an excluded synthetic navigation attempt, replaced with direct sidebar activation then actual app link; CSS uppercase Best value assertion corrected. No product code changed for these harness repairs. Five incomplete contexts were disposed and explicitly tagged excluded.

Limits: local synthetic auth/storage/database/provider/checkout, copied fixture storage between fresh contexts, DOM activation for some navigation, and synthetic native IndexedDB media seeding. No production persistence, settled payment, telemetry ingestion, live account transition or absence-of-all-side-effects claim. Offline actual-module regressions cover failure/hydration/dedupe/account/navigation/return paths. Earlier incident records remain preserved under Atlas's disposition, with no cleanup.

## Bounded prospective PR #96 rehearsal, NOT actual main

Exact accepted monthly evidence head: `7ca054ff18d2d9babee8358c27c9af552c2d51e0`; application head `6b975c502bbc51f3e0be67b160894c7df4c66e62`. Temporary detached worktree started at integrated #104 `14e3226`, then attempted a no-commit merge of that exact #96 head. No commit or push from the prospective worktree.

Five concrete conflicts:

1. `app/api/billing/checkout/route.schema.ts`: independent draft and monthly attribution schemas.
2. `app/api/billing/checkout/route.ts`: metadata envelope and hosted return query params.
3. `app/api/billing/webhook/route.ts`: additive purchase attribution fields.
4. `components/dashboard/onboarding/ai.ts`: both envelope spreads and entry-source helper.
5. `components/dashboard/onboarding/steps/checkout.tsx`: both client envelopes and user-scoped monthly selection.

No merge conflicts in provider, billing read, paywall or imported-draft/controller/current-draft paths. Zero-byte `prospective-monthly-equality.diff` proves the accepted monthly provider/billing/monthly library and current header/hook/config survive byte-equivalently. Zero-byte `prospective-draft-equality.diff` proves draft-first/controller/navigation persistence survives unchanged.

A narrow local candidate union preserves both validated payloads and hosted activation/offer enrollment params; monthly generic metadata is accompanied by separately scoped `draft_*` metadata and both first clocks/sources, with server `user_id` and client reference unchanged. Actual client checkout and track functions were exercised. This is an informational rehearsal candidate, not an approved combined release contract or actual-main implementation. Independent acceptance of the real post-monthly integration must validate the final envelope against LIN-109/112 and reconcile both cohorts without summing purchases.

Focused prospective execution: 76/76 tests including subtests and type-check exit 0. Includes provider identity/read regressions, draft import/return/navigation tests, shared header storage, both hosted/embedded plans, and actual client checkout/event envelope tests. New rehearsal-only regression source is `prospective-tests.mjs.txt`; five-file candidate product patch is `prospective-only.patch`. Both are evidence under docs, NOT application code in #104. No full combined release build or browser clearance is claimed.

Initial prospective pnpm exec tried dependency verification in the linked worktree and aborted without TTY. Direct installed Node/Prettier/TypeScript tools exercised it without an install or package change. One new test had a wrong default-export SDK stub (75/76 first run); corrected the stub, final 76/76 passed. First-run log is retained.

## Commercial contract and rollback

Revenue path remains usable imported draft -> successful saved edit/copy -> existing relevant Pro action -> processor-confirmed NEW recurring account within seven days / mature verified-unpaid eligible accounts. Failures stay in the denominator; unknown billing remains explicit. Eligible draft audience and paid yield remain unmeasured, not forecast as lift. No new spend/purchase; contribution/build cost is unknown. Real production clocks/baseline remain unbound until Atlas's release. Fixed 14/30/37 endpoints and monthly first-200/five hurdle remain; overlaps are confounded and never summed.

Prelaunch undo: retain/close the unmerged isolated PR. After an actual Atlas squash release: independently reviewed revert of that actual isolated production squash SHA. Never execute an integration SHA or placeholder as a production rollback. Preserve customer drafts, payment evidence, cohorts and entitlements. No merge, main push, migration, price/config/user-data/provider/payment/contact/LinkedIn action in this integration.
