# LIN-117 CHANGES addressed: navigation-save accounting

PR: https://github.com/gatteo/linkedinpreview.com/pull/104
Code head: 9af3c7f2f15b955fe738cb09ee7674a0ba4e5187
Ready preview: https://linkedinpreview-m4zvdmr48-gatteos.vercel.app
Deployment: dpl_3r3zAqKaibt8GdVjc7coDaVGbFm2
CI: https://github.com/gatteo/linkedinpreview.com/actions/runs/37378852879

Sentinel LIN-117 returned CHANGES on the earlier 823a7ae code / 2a93eef evidence head. Its offline actual-hook repro showed a persisted edit on unmount without meaningful-use accounting. The earlier evidence is historical, not approval.

## Correction

`hooks/use-current-draft.ts` routes debounce, explicit flush, draft-switch/load and unmount content saves through `persistContent` and confirmed outcome accounting. Unmount keeps the direct API call, avoiding state updates to the unmounted draft list. Each call captures meaningful intent before persistence resolves. Account/draft scoping and the stored used flag exclude hydration, failed saves and duplicate successes after save/copy. Draft-switch resets meaningful intent. No event, entitlement, pricing, offer, planning or blog-scope change.

## Executed checks

New regression matrix first failed on the old code: missing success/failure accounting for meaningful unmount/switch saves and asynchronous intent mutation. After correction, full Node suite passed 74/74 (including subtests), type-check, lint, clean/build and diff check returned exit 0. Lint retained 0 errors / 2 established TanStack warnings. Build generated 209 Contentlayer documents and 263/263 Next routes, with the established Contentlayer post-generation exit-code TypeError before successful Next completion. update-docs unavailable again; docs updated manually.

Regression tests use actual TypeScript hook with offline adapters and pending promises. They verify no event before persistence settles, successful/failed navigation saves, hydration exclusion, dedupe after saved edit or copy, different-draft exclusion, reset across switch, captured meaningful intent and account scope, plus existing import/return tests. No backend/provider/processor requests.

Code-head CI gates, Vercel and Vercel Preview Comments SUCCESS, GitHub completion 2026-10-05T21:55:26Z. Vercel metadata matches the exact code head. Any evidence-only head requires its own check disposition, not a new code preview.

## Focused exact-head preview

15/15 recorded checks passed in the final isolated desktop/400px run. Raw: [revision9af3-smoke.json](./revision9af3-smoke.json). Desktop screenshot: [revision9af3-desktop-import.png](./revision9af3-desktop-import.png). Mobile screenshot: [revision9af3-mobile-import.png](./revision9af3-mobile-import.png).

Synthetic fetch/WebSocket adapter installed in the same browser call as navigation; fixture presence asserted before interactions; CDP outbound blocks cover backend, API, ingestion, provider, Stripe and LinkedIn. Each completed run leaves about:blank. Free typing-to-preview and native clipboard readback passed; desktop intentional footer handoff and mobile direct intentional-import URL opened usable draft before planning. Hydration left used=false. Editing then navigating to Posts saved current text and changed used=true before the 2000ms debounce: first patch 245.4ms desktop, 520.8ms mobile. Dashboard and blog rendered; final desktop/mobile window/unhandled error arrays empty. DOM handler activation and browser editing commands were used, not manual physical-pointer acceptance. Mobile opens the existing sidebar to navigate. Clipboard was not mocked.

Harness-only retries: first blog assertion wrongly expected literal Blog in the H1; actual H1 is Tips & guides to write great LinkedIn posts. A finally-block workspace variable was undefined, so the next call immediately restored about:blank; outbound blocks remained installed. Initial mobile navigation tried an unmounted sidebar anchor and failed; corrected by opening the existing mobile sidebar before activating the Posts link. These attempts are not final acceptance counts. No live backend/provider/payment request was needed or made in this correction run. The earlier reported containment incident remains Atlas-owned and is not erased by this isolated evidence.

This is focused verification of the reviewed correction, not repetition of all earlier media/planning browser coverage. Offline import/precedence/return regressions remain green. Synthetic saves prove client accounting/rendering, not production auth, database durability, telemetry delivery or processor settlement. Sentinel independently reviews the new exact head.

Scope: LIN-115 article adapter remains backlog and separate. PR #96 monthly-first and PR #103 prospective lifetime terms remain separate. Atlas retains terms, real LIN-87 health, release clocks, containment disposition and merge authority. No merge, production launch, config change, user-data cleanup, purchase, provider probe or LinkedIn action.

Rollback before merge: close PR #104. After an Atlas squash merge: git revert <actual-Atlas-squash-sha> through review, preserving drafts, payments and entitlement history. Do not execute the placeholder.
