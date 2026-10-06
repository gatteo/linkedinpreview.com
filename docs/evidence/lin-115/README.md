# LIN-115 preview verification pack

Code tested: `4eb36eaed0d77af192985d9d75f1e37147c5baa0`, branched from fresh `72a9e4cabf85c9fa417f46d892e50ab7da264c00` main. PR: https://github.com/gatteo/linkedinpreview.com/pull/105.

Ready code preview: https://linkedinpreview-butqkctem-gatteos.vercel.app (`dpl_3bxRvRvgBbze6PtaQXD1npK254PM`). Metadata independently read back as READY, staging/preview, exact code SHA. Production is not deployed or authorized.

## Results

- Focused component/layout tests: 7/7. Full Node suite: 51/51 including subtests. Type-check, lint, clean, build and diff-check exit 0. Lint has zero errors and two existing warnings. 209 Contentlayer documents and 263 Next routes. `tabs-verification.log` is the final code log; `verification.log` predates the narrow-layout fix.
- Python aggregation verifies 70 unique raw browser assertions, of which 68 are final-code assertions and two are initial-head diagnostics, not final passes.
- Eight complete article/width flows: all four exact first-card matches at 1440 and 390 pixels. Zero inline Tool or backend requests before activation; standalone UTM href retained; modified click not prevented by the app; native Enter at the recovered-draft card and pointer activation elsewhere; one Tool restores synthetic stored text; typing updates actual preview; tab/repeated-open keep the same editor and edited text; all eight native Clipboard API readbacks match. No horizontal page overflow; six screenshots capture desktop/mobile editor and preview.
- Two synthetic denied-clipboard paths preserve prior native clipboard contents and add no analysis attempt. They are distinct from eight native successes, not permission/policy claims about production browsers.
- Home tool at both widths: typing, preview, native clipboard pass. `/blog`, `/dashboard`, `/formatter` and unselected headline article render with no adapter activation. Existing main dashboard welcome overlay is retained, not suppressed or claimed draft-first.
- Two carried-import checks use the separately approved #104 preview, https://linkedinpreview-lfzsze7ip-gatteos.vercel.app, pinned fixture source `20b4de7529d63287d9101c33890bfb0007134a84`. Exact article draft survives decode; import clears from resolved URL; `from=tool_footer` persists; a real editor edit auto-saves to a synthetic draft PATCH and sets existing `lp-draft-first:` state `used=true`. This proves a cross-preview contract, NOT released-priority/current-main integration, production attribution, customer behavior or paid conversion. It does not merge/bundle #104 here.

## Containment and reproducibility

`browser-helper.py`, `article-smoke.py` and `baseline-smoke.py` run inside the browser tool with pre-imported helpers. Load helper first, then the case module. Host-specific clone/evidence paths and preview origins must be set to the reviewer's own environment. Helpers depend on the pinned #104 synthetic fixture, not live user state. They are browser-tool executable evidence, not standalone Python programs. Static LSP undefined-helper diagnostics therefore reflect injected globals, not an executed failure.

Each navigation creates a fresh disposable context, asserts its context ID, installs evaluated Page fixture and CDP outbound blocks BEFORE load, grants only preview clipboard permissions and asserts fixture/fetch/XHR/WebSocket/beacon markers in that SAME call. Every action reasserts markers and CDP blocks. `/api/*`, backend, processor/provider, analytics, feedback and LinkedIn dispatches are blocked or synthetic. Article footer navigation is held before dispatch and its actual encoded URL copied into a new contained #104 context. Fixture anonymous-signup/analyze attempts and draft PATCHes are NOT real writes. No existing customer/guest/draft records were touched, removed or claimed repaired. Native clipboard is not replaced for success; replacement is only the explicit negative test.

Harness failures are disclosed: DOM-by-value serialization errors, a tab-render wait race, an incorrect baseline heading/save-button assumption, and one CDP connection dropout. Corrected harnesses awaited actual panel visibility, used primitive JS return values, source-traced existing autosave/state keys and retried the connection under fresh containment. They are not product-success evidence. The initial actual product issue was clipped desktop controls, fixed with an optional `Tool layout='tabs'` reusing existing persistent tabs; homepage/embed defaults remain auto.

Two first-attempt Vercel builds failed in existing Playfair Display Turbopack font resolution (`Module not found` on `next/font/google/target.css`, failed `@vercel/turbopack-next/internal/font/google/font` resolution), despite passing local builds. Each exact code SHA succeeded on a preview-only same-SHA redeploy. CLI authentication was unavailable and REST initially rejected `target=preview`; documented `target=staging` was used. No deployment config, font implementation, env or production change. `gh pr checks` subsequently passed. Known local Contentlayer post-generation exit-code TypeError is retained in the logs, followed by successful Next build.

## Independent disposition

Sentinel must review the current head, recheck the smallest actual exact-head proof and issue an independent verdict. Later documentation/evidence-only head is code-equivalent only if a product-path diff proves it; do not claim prior-SHA tests are exact-head execution. Atlas alone merges.

Priority #96/#104 actual releases, actual-main reconciliation, current-head Sentinel approval, Vera preregistration and real LIN-87 health plus Atlas rollout/enrollment clocks remain PRODUCTION gates. Preview readiness is not launch permission; no paid counts or zero-cost provider assumptions. Fixed operational learning windows and failure denominators remain as in the revised issue/model. Preserve the former formatter hypothesis as superseded evidence, never revive it.

Rollback: close isolated PR before merge. After an authorized Atlas squash release, revert its actual isolated production squash SHA through review without removing routes or user/payment/draft history. No product rollback has been executed.
