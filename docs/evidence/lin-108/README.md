# LIN-108 preview evidence and remaining handoff

PR: https://github.com/gatteo/linkedinpreview.com/pull/104
Branch: feat/lin-108-draft-first
Current code head: cc61ce50f1248296c427cad1d97e8315ac396e43
Ready code preview: https://linkedinpreview-7hjb33bjw-gatteos.vercel.app

## Executed release checks

52/52 Node tests passed, including executable actual public handoff, controller, import hook, editor, checkout and webhook paths with explicit synthetic offline adapters. Final code type-check, lint, clean build passed under Node 22.23.1. Lint retained 0 errors and 2 established TanStack warnings. Build generated 209 Contentlayer documents and 263/263 Next routes. Known Contentlayer post-generation exit-code TypeError remains before successful Next completion.

The update-docs skill was invoked but unavailable; documentation was updated manually.

## Browser evidence, earlier code head only

Screenshots here were captured on ready earlier code head a8d23d7b4e5a367cd2d1151729eb36123741afcc at https://linkedinpreview-1bqqsax98-gatteos.vercel.app. They are not final-head clearance.

Desktop: free-tool typing propagated to preview. A real pointer Copy Text click returned the expected toast, and the native Clipboard API read back the exact synthetic text after browser permissions were granted. Intentional footer handoff created one synthetic fixture draft, resolved to its editor URL and showed usable text before any planning modal. Header copy succeeded. Reload retained draft text and deferral. The existing Pro dialog opened with imported-draft-specific reason text, unchanged prices/hierarchy and no checkout request.

400px mobile: draft text rendered without a planning modal or horizontal document overflow. Typed text survived Preview/Editor tab remount and reload. Optional planning opened and then resumed after reload. No browser error was observed on those dashboard checks. The pre-existing oversized header status/format controls put the header Copy Text outside the mobile viewport; the editor's own Copy Text is the accessible mobile path. The final code adds meaningful-use instrumentation to that existing path and initial media restoration, but those changes still require final-head browser exercise.

## Isolation and limits

Browser smoke used tests/fixtures/draft-first-browser.js injected before page scripts. Authentication, Supabase REST, product APIs, provider calls and checkout were intercepted with explicit synthetic adapters before dispatch. This verifies rendered application/client behavior, not real auth, database persistence, processor integration, provider recovery or production health. No LinkedIn connection, publish, scheduling or external LinkedIn action was taken. Tests never entered card details or created a live checkout.

## Remaining required work

The final preview is READY at cc61ce5, but its initial browser attempt encountered a not-yet-mounted editor after navigation. No final-head interaction passed or failed on product behavior from that attempt. Forge must wait for the actual editor, rerun desktop/mobile free copy and imported text/media/use/reload/optional planning/Pro offer checks, render /blog and /dashboard, attach final-head screenshots and confirm final GitHub gates before creating the independent Sentinel review child. Do not merge or launch on this evidence alone.

LIN-102 remains preserved in separate PR #103 with Sentinel LIN-106. Monthly-first PR #96 remains separate. Vera owns preregistration and Atlas coordinates release windows.

Rollback before merge: close PR #104. After any Atlas squash merge: git revert <Atlas-squash-sha> through review, retaining all drafts/payment evidence and existing entitlements.
