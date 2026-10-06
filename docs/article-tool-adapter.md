# Contextual article editor adapter

LIN-115 adds an exact pathname plus unique first-card-title allowlist in `config/article-tool-entries.ts`. `components/cta-card.tsx` uses it to present context-specific supporting copy and a primary label while preserving the original title, description, secondary CTA and working `UtmUrl` standalone destination.

Normal unmodified primary link activation opens one dynamically imported existing default Tool adjacent to that card. Keyboard Enter follows the same activation path. Modified or non-primary clicks preserve native navigation; server-rendered/no-JavaScript markup retains a real href. No Tool is mounted until intentional activation. Repeated activation does not close, remount or reset it. The optional Tool `layout='tabs'` reuses its existing persistent editor/preview tabs in the narrow article container, preventing clipped desktop controls. Default `layout='auto'` retains homepage/embed behavior. Editor/persistence/import implementations are unchanged. Nonmatching cards keep their existing behavior.

No protected MDX, blog metadata, homepage/formatter layout, pricing, proof, customer entitlement, auth, provider or billing implementation changes. Copy keeps its established successful clipboard event and optional background analysis semantics; this adapter does not create an automatic provider request. Existing contribution cost is unverified, not zero-assumed.

## Measurement and release boundary

Reuse production pageviews for eligible exact-path arrivals before treatment, `cta_card_clicked` once per activation and successful `post_copied`. Keep all failures/bounces in the denominator. Original card URL remains the fallback, so a click is not claimed as navigation. Existing content-carrying footer/nudge supplies `tool_footer`/`tool_nudge`; do not replace it with a new blog source. Article context is recoverable only through the existing event/person history, with unmatched attribution explicit.

The corrected Ink fixed-window historical denominator is 419 mature selected-page people, with zero observed ANY qualifying copies within seven days, not proof of zero use/demand. Processor-confirmed new recurring starts remain the business outcome; renewals/lifetime/unmatched payments are separate. No new primary paid experiment or analytics framework.

Atlas LIN-131 permits a separate preview after completed LIN-122/LIN-128 integration reviews while priority PRs #96/#104 await production health. It does not authorize their launch or this adapter's merge. Production still requires actual priority releases, current-main reconciliation, new exact-head Sentinel approval, genuine LIN-87 health, Vera registration and Atlas rollout/endpoint clocks. Historical source date checks are not launch clocks or treatment outcomes. Activation operational hurdle: first 100 mature eligible readers with at least three copier proxies; day14 reach decision, day28 enrollment/day35 maturity. Overlapping releases are confounded, not causal lift.

Implementation scope stays within 0.5-1 engineering day; attribution/check/independent-review allowance is separate estimated cross-agent effort, total 1.25-2 active days, not promised elapsed time. Reduce allowlist or return an exact blocker if implementation exceeds its bound. Priority-release corrections preempt this work.

## Verification

`node --test tests/article-tool-cta.test.mjs` exercises the actual CTA component under React with synthetic Tool/navigation/UI seams: exact match/exclusions, unique first placement, static href, modified clicks, keyboard-shaped activation, existing event fields, single mount and local edit retention over repeated activation/rerender. These are not proof of actual TipTap persistence, native keyboard input, production attribution or payment.

Actual-browser preview verification must install an asserted synthetic backend/API fixture and CDP outbound blocks in the same call before every navigation/action, including beacon/XHR/WebSocket containment. Missing markers mean STOP, never live fallback. Clipboard success uses the original browser Clipboard API; failures are synthetic and separated. No real auth/customer/processor/provider dispatch, no record cleanup. Preserve the previously identified guest/draft records.

Run full Node regressions and required `pnpm type-check && pnpm lint && pnpm clean && pnpm build`. The known Contentlayer post-generation exit-code TypeError is disclosed before the successful Next build. `update-docs` skill is unavailable in this profile, so this documentation is maintained manually.

Rollback before merge: close the adapter PR. After an authorized Atlas squash release, revert its actual isolated squash SHA through independent review, preserving routes and customer/payment/draft history. Never execute a placeholder or use a preview/integration commit as the production rollback SHA.
