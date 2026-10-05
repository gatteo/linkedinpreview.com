# LIN-108 exact-code-head preview evidence

Current rereview evidence: [LIN-117 navigation-save correction](./revision9af3-review.md), code head 9af3c7f2f15b955fe738cb09ee7674a0ba4e5187 at https://linkedinpreview-m4zvdmr48-gatteos.vercel.app. The 823a7ae evidence below is historical: Sentinel returned CHANGES for navigation-save meaningful-use accounting. No head is approved until Sentinel independently reviews the correction.

PR: https://github.com/gatteo/linkedinpreview.com/pull/104
Branch: feat/lin-108-draft-first
Verified code head: 823a7ae070cb252015b8fd135f265344100f7268
Ready code preview: https://linkedinpreview-9chuq59mn-gatteos.vercel.app

## Executed release checks

54/54 Node tests passed, including executable public handoff, controller precedence, actual import hook, editor, checkout and webhook paths with explicit synthetic offline adapters. Added regression coverage confirms the pre-auth eligibility clock survives account binding and repeated handoff without resetting, meaningful edits require confirmed persistence, failed saves cannot count success, and Session/subscription/payment-intent metadata retain the bounded cohort and server-authenticated identity.

Type-check, lint, clean/build and git diff --check passed under Node 22. Lint retained 0 errors and 2 established TanStack warnings. Build generated 209 Contentlayer documents and 263/263 Next routes. Known Contentlayer post-generation exit-code TypeError remains before successful Next completion. update-docs was invoked but unavailable; documentation was updated manually.

Exact code-head GitHub CI gates passed: https://github.com/gatteo/linkedinpreview.com/actions/runs/37373419341. Vercel and Vercel Preview Comments passed. Any later evidence-only commit requires its own check disposition before merge; do not confuse code-head CI with evidence-head checks.

## Final-code-head browser acceptance

20/20 recorded checks passed on the exact code preview. Raw results: [final823a7-smoke.json](./final823a7-smoke.json). These checks used explicit synthetic fetch/WebSocket adapters, asserted fixture presence before interactions, and left the browser at about:blank afterward. Editor text insertion used the browser editing command and clipboard buttons were activated through their DOM handlers. Clipboard verification read the native browser Clipboard API with focus and permissions granted; clipboard was not mocked.

Desktop: free typing updated preview and native copy succeeded. Intentional footer handoff carried synthetic text and generated PNG, rendered usable text/media before a planning modal, persisted an edited draft through the synthetic storage adapter, recorded saved-use state only after save success, copied successfully, reloaded without planning and retained media/text. Existing higher-AI-limits Pro action opened the relevant existing dialog, preserved $11.99 monthly/$39.99 lifetime and current offer hierarchy, and did not create checkout.

400px mobile: edited text and media remained in Preview; no page-level horizontal overflow; Editor/Preview remount retained latest text; native copy and reload retained the draft and deferral. Optional planning explicitly opened and resumed after reload. Blog and dashboard routes rendered. No window/unhandled-rejection errors were observed in the final dashboard and route checks.

Screenshots from the final isolated run:

- [Free tool](./final823a7-home.png)
- [Desktop imported draft](./final823a7-desktop-import.png)
- [Desktop saved edit](./final823a7-desktop-edit.png)
- [Existing Pro offer](./final823a7-pro.png)
- [Mobile preview with media](./final823a7-mobile-preview.png)
- [Mobile editor](./final823a7-mobile-editor.png)
- [Explicit optional planning](./final823a7-mobile-planning.png)

The pre-existing oversized dashboard header controls remain; mobile acceptance uses the editor's accessible Copy Text. OAuth/checkout success/cancel, saved planning, settings and completed/legacy precedence, malformed imports, missing media and failed creation are covered by executable actual-module Node tests, not live provider/processor calls. Synthetic adapters verify rendered/client behavior, not production auth, database durability, paid settlement, provider recovery or production health. Sentinel independently verifies these boundaries.

## Containment failure in an earlier final-head attempt

Before the final isolated run, a preload installed in an earlier browser tool call was absent after a later navigation. That attempt reached the shared backend and produced an unintended anonymous preview guest 4d7988e6-b31c-4c23-8bc5-60e8e8d944df and synthetic draft 2ea41cda-a7fc-480e-9801-0b7c00d608b7. These are the observed record IDs, not an exhaustive backend audit. This was immediately reported to Atlas on LIN-108 in comment 9f34f474-8550-4bf3-9b6b-bbaf2c243c46. No backend cleanup or customer-record modification was performed. Atlas owns test-record disposition and any further containment follow-up. No checkout, card entry, publish, schedule, connection or LinkedIn action was taken.

The screenshots linked above were overwritten with the later asserted-isolated run. Do not claim the entire wake made no backend writes. For reproduction, install preload in the SAME browser_exec as full navigation, assert fixture presence before every interaction, and leave no live preview page between calls. Browser clipboard additionally requires focus and permissions. A selector quoting error interrupted the first route assertion after all 18 editor checks passed; the two route checks were executed separately and appended to the raw artifact, producing the verified 20-check total.

## Earlier-head evidence

Other historical screenshots in this directory came from a8d23d7b4e5a367cd2d1151729eb36123741afcc at https://linkedinpreview-1bqqsax98-gatteos.vercel.app. They are not final-head clearance. The cc61ce5 preview was superseded by the contract corrections in 823a7ae.

## Scope and handoff

Latest board scope controls: article-entry adapter is separate LIN-115 backlog work; original formatter helper remains rejected. Neither is implemented here. Monthly-first PR #96 and lifetime-policy PR #103 remain separate; no offer redesign or price change. Apply accepted LIN-109 / EXP-9 revision 2 / EXP-10 registration with no artificial launch delay, explicit overlap/confounding and no summed cohort paid starts. Actual release SHAs/times, production health, unknown-billing resolution and processor-paid reconciliation remain release/scorecard gates, not preview claims.

Independent Sentinel review is mandatory; Atlas alone owns merge and production release. Rollback before merge: close PR #104. After any Atlas squash merge: git revert <Atlas-squash-sha> through review, retaining all drafts/payment evidence and existing entitlements. No production merge/config/migration change was performed.
