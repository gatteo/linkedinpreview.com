# LIN-108 actual monthly-main integration, October 8

This is changed-head implementation and contained preview evidence, not independent approval or a production release. Historical LIN-158 APPROVE remains valid only for its historical head. LIN-115/#105 stays separate.

## Exact artifact

- PR: https://github.com/gatteo/linkedinpreview.com/pull/104
- Branch: `feat/lin-108-draft-first`
- Integrated application: `893ca52aeedca378e3b16b22f9b6f68e2c1cb61d`
- Actual monthly main: `f3e84221f1c6aa6574ef67e5197bde0b55050b63`, fetched again after preview verification and confirmed an ancestor of the application.
- Immutable READY preview: https://linkedinpreview-r9hvj17za-gatteos.vercel.app
- Deployment: `dpl_2DjcCvDNt79oWYjbFv9YKYNiyF47`, Vercel API readback matches the application SHA and branch, with no production target.
- Application CI: https://github.com/gatteo/linkedinpreview.com/actions/runs/37754692359, attempt 2 SUCCESS.
- This evidence folder is a subsequent docs-only commit. Its deployment disposition and CI must be read separately before merge.

## Narrow integration

Normal merge of live monthly main, no force-push. Resolved the five rehearsed attribution overlaps in checkout schema/route, webhook, onboarding analytics and checkout component. Monthly envelope remains generic `enrollment_id`, `cohort_id`, `eligibility_at`, `assigned_variant`, `assignment_version`, `offer_version`, `release_sha`, plus `monthly_entry_source`. Draft fields are separately scoped as `draft_*`. Preserve both opaque enrollment IDs and original clocks through Session, subscription/payment-intent metadata and purchase analytics. The draft source continues to own the imported-draft return path while monthly first touch remains distinct. Client attribution does not authorize billing identity or entitlements.

No offer redesign, price/proof/guarantee removal, migration, new variant, chronology rewrite, provider call or article adapter. Current monthly-first paywall and frozen header control come from real main. Existing upgrade-dialog hierarchy is preserved, not silently changed into a second offer treatment.

## Local verification

- Full actual-module suite: 150/150 including subtests, `tests.log`.
- Focused draft/header/monthly/policy suite: 66/66, `focused.log`.
- Required `pnpm type-check`, `pnpm lint`, `pnpm clean`, `pnpm build`: exit 0. Logs retained. Lint has 0 errors and the two established TanStack/React compiler warnings.
- Build generated 209 Contentlayer documents and 263 routes. The known Contentlayer post-generation `TypeError` precedes a successful Next build and is not concealed.
- First local suite failed three monthly mocks because the integrated route/component now imports draft-first helpers. Expanded those mocks, then reran both suites and all required gates. `tests-first.log` retained.
- First application CI build failed in Turbopack Google-font import resolution (`next/font/google queries have exactly one entry`). Same SHA rerun passed. No code/config/env override or bypass was introduced.
- Product/application diff-check against actual main passed. Historical evidence logs/retained raw patches have known whitespace findings; do not claim the complete historical docs diff is clean.
- Analytics dictionary updated manually. The requested `update-docs` skill was unavailable.

## Contained browser evidence

`summary.json` counts 35 completed unique behavior records, 35 fresh contexts, all 35 disposed, 35 empty-error context readbacks and 22 screenshots. `browser.json` and `contexts.json` preserve the raw assertions, intercepted fixture IO and 12 excluded diagnostics. Counts are computed from files, not a list inferred from screenshots.

Every full navigation starts in a fresh blank context. CDP outbound blocks and fixture preloads are installed in the SAME browser tool call as navigation. Before interaction, assert fixture marker, fetch, WebSocket, beacon and XHR isolation. Auth/database/status/provider/checkout responses are synthetic local fixtures; no live backend, auth, provider, Stripe, telemetry or LinkedIn dispatch. Held checkout fetches never resolve into a provider redirect. Screenshots are not live payment/production durability/telemetry proof.

Desktop 1440 and mobile 390 verify:

- Free input updates preview, and native clipboard text is read back. No mocked clipboard, JS copy, toast substitution or suppressed errors.
- Intentional content-carrying handoff preserves source, first exposure and eligibility time. Imported draft is usable before planning; hydration remains `used=false`.
- Confirmed early-navigation edit saves and marks meaningful use. Desktop 671.179 ms; mobile sidebar navigation 1385.699 ms, both before the 2-second debounce. Mobile media persists in the actual fixture row's Tiptap content/media schema and rehydrates after fresh remount.
- Current text, media and mobile Preview survive remount. Mobile page width equals 390, with no page-wide horizontal overflow.
- Optional planning remains discoverable; explicit resume and saved plan take precedence. Saved paywall renders live monthly-first primary action and creates a distinct monthly enrollment clock, without replacing draft identity/time.
- Synthetic OAuth-denied and checkout success/cancel return precedence, retaining original draft clock/source. A synthetic success dialog is NOT processor settlement or entitlement authorization.
- Existing relevant Pro action and both current selected policies/prices/proof. Eight held checkout payloads: both plans, both widths, both upgrade and onboarding surfaces. Every payload retains separate draft and monthly IDs/clocks; synthetic monthly first touch `navbar` remains distinct from draft `tool_footer`.
- `/blog` and `/dashboard` render on both widths. Mobile dashboard intentionally uses its Posts table, not the desktop View all posts link.

Excluded diagnostics are preserved, not product passes: DOM serialization depth; mistaken button/link/section selectors; mobile custom-tab selector; stale mobile clipboard coordinates before retargeting; hidden mobile sidebar; uppercase presentation versus textContent; incorrect fixture variable/flat-text readback; desktop-only dashboard expectation. Failed assertions were repeated against observed controls and storage. Historical React418 cause remains UNPROVEN, not declared fixed. No recurrence in this integrated run; stop-on-error diagnostics remained active.

Fixture persistence is carried to another fresh context by copying synthetic localStorage, not proof of live database durability. Native input uses CDP Input.insertText; visible click controls use trusted coordinate dispatch after target inspection. Module tests cover failure/hydration/dedupe/account scope/import/return guards and processor metadata; preview does not exercise live login or payments.

Browser helpers used: `/Users/gatteomini/agents/lp-eng-agent/resources/lin-108-oct08-browser.py` and the Oct. 7 helper it imports; repository fixtures `tests/fixtures/draft-first-browser.js` and `tests/fixtures/header-entry-browser.js`.

## Review and release boundary

Fresh Sentinel exact-integrated-head APPROVE/CHANGES is mandatory. Sentinel independently verifies both attribution envelopes, persistence/account scope, preview containment, both offer surfaces and final evidence-head CI/docs-only Vercel disposition. Atlas alone owns squash/production smoke/actual T_D and cohort binding. Parent LIN-108 stays open until real release.

Primary metric remains processor-confirmed NEW recurring product account within seven days / mature verified-unpaid pretreatment eligible. Failures stay in the denominator. Audience, draft baseline and yield remain unknown until release; overlap with monthly is confounded, not summed paid starts. Existing seven-day maturity, monthly first-200/five hurdle and day14/30/37 endpoints remain unchanged. No new spend, contribution cost unknown. Monthly telemetry chronology uncertainty is not rewritten.

Earlier unintended guest/draft incident objects remain preserved under Atlas disposition; no cleanup or broader absence-of-side-effects claim.

Rollback before merge: retain/close isolated PR #104. After actual Atlas squash release: independently reviewed `git revert <actual-isolated-production-squash-sha>`, preserving drafts, payments, cohorts and entitlements. Never execute a placeholder or use this integration/evidence SHA as a production rollback SHA.
