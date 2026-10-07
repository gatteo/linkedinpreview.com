# LIN-115 current-main integration, October 7

Scope: normal non-force merge of actual main `86011f3beb217cf5902a740a9b6cc5bd7033244a` into the existing PR #105 branch, preserving its four-article adapter. Atlas LIN-160 authorizes integration/preflight only. Production sequencing and health gates are unchanged.

No conflict or application edit was required. Shared header/hook/config/enrollment blobs and protected MDX equal current main. The adapter changes only its original allowlist/CTA and optional narrow-column Tool tabs layout. No priority implementation is bundled.

Local commands exited zero: focused adapter/header/shared-hook suite (42 pass), full current-main plus adapter suite (86 pass), pnpm type-check, lint, clean and build. Lint: zero errors, two established TanStack incompatible-library warnings. Contentlayer generated 209 documents, emitted known post-generation ERR_INVALID_ARG_TYPE, then Next successfully generated 263/263 routes. Raw logs retained here.

The first focused command mistakenly included nonexistent `tests/draft-import.test.mjs`. Node ignored that unmatched argument; 42 real adapter/header/hook tests ran. The corrected existing-only invocation is in `focused-corrected.log`. No import regression suite is claimed from that command. Draft/import integration tests belong to the separately accepted #104 head and the prospective local rehearsal.

Preview, prospective local rehearsal, contained browser evidence and independent changed-head review are recorded subsequently. These are not production approval or treatment/paid outcomes. Atlas alone owns actual priority squashes, current-main re-reconciliation, launch and real cohort clocks. Historical reach remains 563 selected eligible / 419 mature / zero observed seven-day ANY-copy, not proof of zero demand or forecast.

Rollback before merge: retain/close isolated unmerged #105. After authorized Atlas release: independently reviewed revert of actual isolated production squash SHA, preserving records. Never revert an integration/evidence SHA as a production rollback.
