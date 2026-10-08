# LIN-164 same-PR correction evidence

## Scope

Atlas comment `90f54c6c-a771-402b-a2a2-87e3e02957c9` authorizes bounded preview correction on original LIN-115 / PR #105, not production. The prior Sentinel LIN-162 CHANGES at `72c91c54344049c89e1f09a900144c79969cf3a7` remain historical failed observations, not approval.

Only explicitly requested Tool `tabs` panels change. Inactive mounted wrappers receive opacity zero, pointer-event protection, `inert` and `aria-hidden`; inactive descendant Button transitions are disabled locally. No global Button edit, `display:none`, editor/panel remount, priority-release implementation bundle, MDX rewrite, new analytics framework, provider/auth/payment/configuration change or production action.

## Executed local checks

`pnpm type-check`, `pnpm lint`, `pnpm clean`, `pnpm build` all exited zero. Lint retains two existing warnings and zero errors. The build generated 209 Contentlayer documents and 263/263 routes; the established post-generation Contentlayer `ERR_INVALID_ARG_TYPE` still appears, so this is not an error-free-log claim. Final focused adapter tests passed 7/7, including both active tab states plus default/embed desktop/mobile preservation. Final full existing Node suite passed 86/86 including subtests. Test-seam expansion after the build changed only the test file, not built application inputs.

Local contained browser checks at 1440 and 390 pixels performed eight first-frame switches, sampled 9 to 70.60000002384186 ms after the click, before the inherited 150 ms transition settles. Every sampled inactive wrapper was opacity zero, inert, pointer-events none, non-hit-testable and still measured with nonzero width/height. All 15 inactive editor buttons were already visibility hidden with transition none. An inherited Preview author control sometimes explicitly reports visibility visible, but its ancestor is transparent/inert/non-hit-testable, so this is not reported as universal descendant visibility hidden.

Editor DOM identity, text, uploaded 24x24 synthetic PNG DOM identity, Preview text DOM identity and nonzero media measurements remained intact. Native clipboard write/readback succeeded at both widths. Unchanged-main home/embed typing, preview and native copy also succeeded under the same fixture. Fresh changed-head remote verification remains separate and is required after delivery.

## Hydration diagnosis: unresolved, not fixed or classified as inherited

Original context `C15F52A84A7F7543D0E3E92315A2C462` was the reviewed preview's `/blog/where-are-linkedin-drafts-saved` at width 390. It retained two identical React #418 messages but no stack, mismatch DOM or phase metadata. Preserve `resources/lin-115-lin161-72c91c5/browser-smoke.json` and `browser-contexts.json`; do not relabel that original failure as a pass.

Instrumented initial/post-activation error-stack and unsuppressed development console-mismatch capture ran with inspected immutable draft fixture `d2fcaa685f94b5bf7e2e401b9212ded6bb91513a` and the existing header fixture. Exact-original-route comparisons covered the old reviewed production preview with activation, actual unchanged-main `86011f3beb217cf5902a740a9b6cc5bd7033244a` development output without activation, and changed-adapter development output with activation. Both development servers used the same Webpack mode. These cases, plus draft-guide and unchanged-main home/embed controls, produced empty initial/post-activation error buckets, not reproduced stacks. Empty captures are negative observations, not proof of an inherited/fixture cause, an adapter fix or general absence of hydration risk.

The initial Turbopack development diagnostic had no usable client activation under strict mocked WebSocket containment and followed the native standalone fallback. It was retained as a harness limitation, not counted as a passing inline flow. A direct Next CLI started the isolated unchanged-main comparison after pnpm's dependency status wrapper failed there; no dependency, auth or deployment configuration was changed. The temporary comparison worktree used existing dependencies/generated content and an opaque link to the clone's existing environment file; credentials were not read, copied into evidence or modified.

Diagnosis must remain bounded. Forge retains ownership of obtaining an actual stack/mismatch and source attribution if the original observation recurs. Sentinel must not infer an inherited classification or approval from these non-reproductions. Competing upgrade-return dialogs remain separate PR #104 scope.

## Evidence and containment

Local evidence: `/Users/gatteomini/agents/lp-eng-agent/resources/lin-115-lin164/local/` (`browser-smoke.json`, `browser-contexts.json`, screenshots). Logs: `resources/lin-115-lin164-{type-check,lint,clean,build,focused-final,all-tests-final}.log`. Local failed harness assertions and original failed observations are retained separately from successful `local_v3` results.

Every new context installs inspected synthetic backend responses and outbound CDP URL blocks plus fetch/XHR/WebSocket/beacon guards before navigation. Guard assertions run in the same action call; native click/input/file-upload wrappers also reassert immediately before dispatch. Any missing guard stops the action. Only synthetic own-context auth/analyze responses were exercised, with no live backend/auth/provider/Stripe/telemetry/social dispatch or prior-customer cleanup. Development servers were stopped before clean/build.

## Release and rollback

Same unmerged PR #105 remains separate from #96 and #104. Restore original LIN-113/LIN-108 production dependencies and completed LIN-133/156/158/162 evidence at handoff. Atlas owns launch and the same October 8 LIN-87 08:20 Rome health / LIN-107 08:40 decision. Actual #96 first, separate #104 actual-monthly-main reconciliation/new acceptance, then #105 actual-new-main reconciliation/new acceptance. No extra approval, health day, flag, maturity framework or measurement clock is added.

Rollback before release: retain or close the isolated unmerged PR. After an authorized release: independently reviewed revert of the actual isolated squash, preserving records. Historical selected-article eligibility 563 / mature 419 / zero observed seven-day copy proxies and unknown paid yield remain historical evidence, not a lift forecast. No spend or contribution-cost claim.
