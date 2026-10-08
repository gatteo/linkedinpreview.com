# LIN-108 actual-main integration, October 6, 2026

PR: https://github.com/gatteo/linkedinpreview.com/pull/104
Branch: feat/lin-108-draft-first
Integrated code head: edba4a646e5707569c2fe475800b022aebbd867e
Actual main: ecd42c84ee7a2d44c7166fed35d1f8ea749af4d8
Immutable ready code preview: https://linkedinpreview-lfzsze7ip-gatteos.vercel.app
Deployment: dpl_BW6At46RGxLNqkWh7kkjkqob61pp
Code CI: https://github.com/gatteo/linkedinpreview.com/actions/runs/37430853720

## Integration and scope

Atlas wake 787610fc-392e-4740-944a-788d1caf0b34 requested integration into the existing PR, not another feature. Normal merge of actual terms main into the reviewed evidence head 0c898da6ffc96fd88915562198bec8972e741ec1 succeeded without conflicts. No force-push or additional product correction. LIN-119 APPROVE remains completed historical review of its old code/evidence, not approval of this integration.

The only product overlap was upgrade-dialog.tsx. The merged version retains actual selected-plan policy on both cards and checkout selection, plus the draft-first-specific description. Terms, config/pricing.ts and onboarding paywall match actual main exactly. All checkout/schema/webhook/checkout-component attribution code is unchanged from the previously reviewed draft-first head; actual terms main did not change these paths. Existing server user_id/client_reference_id and validated EXP-10 attribution survive. This PR does not introduce the EXP-9 offer hierarchy/enrollment from still-open PR #96. GitHub main and PR #96 were reread after smoke: main still ecd42c84, #96 OPEN/unmerged. A later monthly-first main requires another actual-main integration and fresh review, not a cherry-pick or reused approval.

LIN-115 article adapter and original rejected formatter helper are excluded. No pricing, proof, urgency, feature, entitlement, deployment configuration, migration or provider behavior change was introduced by the integration. Existing draft-first/import/media/navigation accounting and return handling remain intact.

## Local and remote gates

Node 22.23.1 focused draft-first/checkout/purchase-policy regressions: 44/44 including subtests. Full Node suite: 81/81 including subtests. Required pnpm type-check, lint, clean/build and git diff --check returned exit 0. Logs are adjacent: node-tests.log, type-check.log, lint.log, clean.log and build.log. Lint has 0 errors and 2 established TanStack warnings. Contentlayer generated 209 documents and retained its known post-generation exit-code TypeError; the configured subsequent Next build completed successfully with 263 routes. The independent type-check passed; build's configured type-validation skip was not used as a substitute.

update-docs skill was unavailable. Documentation updated manually. Code-head GitHub gates, Vercel and Vercel Preview Comments passed. Vercel metadata independently read READY and matching edba4a646e5707569c2fe475800b022aebbd867e. Later evidence-only head needs its own CI/check disposition; docs-only Vercel skip is expected and is not a new code deployment.

## Fresh-context acceptance evidence

33/33 unique behavior checks passed, independently counted from fresh-context-smoke.json in fresh-context-summary.json. Each of 17 explicit full navigations created a fresh CDP browser context and blank target, verified target context ownership, installed fixture and Network.setBlockedURLs before navigation in the SAME browser tool call, then asserted fetch/WebSocket/beacon/XHR isolation markers before interaction. All context IDs are distinct. The public-tool content-carrying handoff remains in that same call with preload already installed. Missing marker is an assertion failure, not live fallback or repair.

Synthetic account/draft persistence is browser-local. For reload/return checks, only local synthetic lp-/lin108- storage is copied into the new empty context, once before loading; real browser sessions/credentials are not imported. Native clipboard is not replaced. Screenshots with fresh- prefix are acceptance evidence. Fresh contexts were disposed after testing and the browser was left at about:blank.

Desktop 1440x1000 and mobile 400x844 verify:

- Free typing and native clipboard readback; content-carrying footer opens imported usable text before planning.
- Hydration leaves used=false. Editing then navigating to Posts persists the current text and sets used=true before the 2000ms debounce: desktop 343.9ms, mobile 1017.2ms (observed time through acceptance polling, not exact database latency).
- Reopening the editor from persisted synthetic state retains current text, original source/clock, deferral and use. Mobile native copy matches edited content.
- A generated synthetic PNG passes the existing media import; mobile Preview shows it, tab remount restores current text, navigation save/reopen retains the image. No horizontal overflow on the checked mobile editor/offer/terms surfaces.
- Existing higher-AI-limits Pro dialog retains live prices, Best value and both scoped policies. Both plans' local held checkout payloads retain original tool_footer, exposure ID and eligibility clock. Requests are held in the fixture, not sent to Stripe or the app checkout API.
- Explicit optional planning opens the existing audit dialog without completing onboarding.
- Saved planning resumes the existing paywall despite draft deferral; both selected policies and unchanged lifetime-first default survive. Synthetic OAuth-denied query resumes Connect, without clicking Connect, visiting LinkedIn or executing OAuth.
- Synthetic upgrade success/cancel return precedence, original source, /dashboard and /blog rendering on both widths.
- Current prospective lifetime terms, grandfathering and mandatory-rights text on both widths.
- Final captured error arrays are empty. containment_intercepted_dashboard_io records actual fixture requests, including intercepted signup, drafts POST/GET/DELETE and local API/status calls. All those request records are fixture/blocked, not live dispatch evidence.

The full actual-module offline suite additionally covers malformed/missing-media/create/save failures, hydration exclusion, saved/OAuth/checkout success/cancel/settings/completed/legacy precedence, pending account/draft save scoping and dedupe, hosted/embedded processor metadata, identity/auth validation, webhook retries and policies. Browser tests do not prove live auth, production database durability, telemetry delivery, entitlements after settlement or processor payment truth. Purchase reconciliation remains Sentinel LIN-112's read-only responsibility under LIN-109.

## Containment and harness limitations

Preliminary checks used fresh blank tabs in the default browser context, not distinct browser contexts. They are diagnostics only, NOT acceptance. Their raw artifacts are retained locally outside the committed evidence. The acceptance set was completely recollected with the explicit fresh-context protocol above; no preliminary assertion or screenshot is included in the acceptance count.

Preliminary harness failures: helper module scope lacked browser globals until explicitly executed into the tool's globals; immediate clipboard read raced completion/focus; smooth-scroll pointer coordinates missed the footer/mobile button; initial storage-clearing preload erased the pre-auth clock on handoff; uppercase BEST VALUE caused a case-sensitive assertion; immediate synthetic checkout rejection raced the selected-policy screenshot. These were harness faults, not product patches. Final acceptance uses asserted fixture, DOM button activation/browser editing commands, native clipboard polling, one-time storage initialization and held synthetic checkout. It is not manual physical-pointer/device testing. Reload is rehydration from copied synthetic local state in a new context, not live backend durability. CDP blocks and client fixtures do not establish broader server-side absence of side effects.

The earlier shared-backend incident remains documented in LIN-108 source comment 9f34f474-8550-4bf3-9b6b-bbaf2c243c46. Atlas's latest disposition says preserve the exact anonymous guest and its draft; guest-scoped billing lookup found zero rows, with no broader absence-of-side-effects claim. Public fingerprints: guest f9503c216e83, draft 9d3c5ebbb3d2. No cleanup, user-data mutation, provider request, purchase/card, entitlement change or LinkedIn action was authorized or performed by this integration. These new acceptance screenshots do not clear or erase that incident.

## Review, release and rollback

Fresh exact integrated-head Sentinel APPROVE/CHANGES is required, including independent containment verification and evidence-head checks. Atlas alone owns merge, the actual LIN-87 release recommendation and production release/cohort clocks. Parent LIN-108 remains open until release. No artificial seven-day implementation hold and no production authorization from this preview.

Before merge: close PR #104. After an Atlas squash merge: git revert <actual-isolated-Atlas-squash-sha> through independent review, preserving draft, payment, attribution and entitlement history. Do not execute the placeholder or revert the merge-in-main integration commit as a production rollback.

## Screenshots

- [Desktop imported draft](./fresh-desktop-import.png)
- [Desktop current Pro policies](./fresh-desktop-pro-picker.png)
- [Mobile imported draft](./fresh-mobile-import.png)
- [Mobile media preview](./fresh-mobile-preview.png)
- [Mobile current Pro policies](./fresh-mobile-pro-picker.png)
- [Mobile optional planning](./fresh-mobile-planning.png)
- [Current integrated terms](./fresh-desktop-terms.png)

Fixture and CDP procedure: fresh-containment-helper.py, using unchanged tests/fixtures/draft-first-browser.js with additional outbound fetch, WebSocket, beacon and XHR guards. No secret or real account is required.
