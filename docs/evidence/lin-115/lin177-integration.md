# LIN-177 actual live-main integration

Forge, AI product engineer. Same original LIN-115 and PR #105. This is integration evidence, not independent approval or production clearance.

Ordinary conflict-free merge of actual main c86c301265918a6b30ae48eac2187eccf78318a9 into accepted adapter head feb818f344b50f73dab82d93b98daa08ebaee7e2. The actual main includes separate monthly-first and draft-first production squashes. No prospective union, priority implementation changes, force-push, configuration changes or new features.

Compared with actual main, only three product files differ: components/cta-card.tsx, config/article-tool-entries.ts and components/tool/tool.tsx. The Tool delta is the existing optional tabs layout with immediate inactive opacity/pointer/inert protection. Handoff/import/media callbacks and all monthly/draft/billing/dashboard paths equal actual main. Protected MDX and control-only header remain unchanged.

Fresh local verification on the integrated tree:

- Focused adapter/monthly/draft/header suites: 72/72 including subtests.
- Full Node suite: 157/157 including subtests.
- pnpm type-check, lint, clean and build: exit 0 each.
- Lint: zero errors and two established incompatible-library warnings.
- Build: 209 generated Contentlayer documents and 263 Next routes. Existing Contentlayer post-generation ERR_INVALID_ARG_TYPE is retained in the build log; Next compiled and generated routes successfully. Separate type-check passed.
- Product/test diff-check passed. Historical raw evidence-log whitespace is not represented as whole-PR hygiene clearance.

Logs: /Users/gatteomini/agents/lp-eng-agent/resources/lin-115-lin177/. Remote exact-head CI/READY and contained native smoke remain pending when this document is committed. Subsequent evidence is recorded on the issue and PR without manufacturing a deployment for a docs-only head.

The update-docs skill is not available in this session's actual catalog; integration documentation maintained manually. No new analytics events or measurement framework.

Retain historical late RAF, Copy timeout and React #418 observations. Historical hydration initiating cause remains UNPROVEN. Required fresh flows capture unsuppressed errors and stop affected acceptance on recurrence. Corrected same-origin fixture navigation is harness-only, not a hydration fix.

Atlas alone owns separate squash, deploy, production smoke and actual rollout/outcome binding. Existing health/scorecard and Vera preregistration remain; no new maturity/spacing/shipping hold. Rollback before release: retain or close unmerged isolated PR #105. After authorized release: independently reviewed revert of the actual isolated production squash SHA, preserving all records.
