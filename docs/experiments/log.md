# Onboarding experiment log

> Append-only institutional memory. Every experiment launch and conclusion lands here
> with its numbers, so audits never re-propose settled questions. Managed by the
> `funnel-experiment` skill; humans merge every change.

Format per entry:

```
## <flag-key> - <one-line hypothesis>
- Issue: #NN · Branch: exp/<flag-key> · Launched: YYYY-MM-DD · Concluded: YYYY-MM-DD
- Primary metric: <metric> · Result: <ship|revert|aborted> (<numbers, sample sizes>)
- Learning: <one sentence>
```

---

## onb-modal-exit - a locked flow converts better than a dismissible one

- Issue: #55 · Branch: exp/onb-modal-exit · Launched: 2026-08-01 · Concluded: -
- Primary metric: paywall reach per exposed user (onb_paywall_view / flag exposure) · Result: -
- Guardrails: onb_flow_complete rate, purchase_completed (amount>0, directional), onb_step_view drop pattern, error rates
- Note: the same PR changes the editor-promise welcome title (features_header/features_card/showcase/tool_header; hero_editor is plan-framed since the hero CTA rename) to "View the full editor and complete an audit." for BOTH variants (entry-coherence, not part of the experiment) - resets the GH #42 verification window.

## onb-connect-answers-first - answers-first beats asking for account access first

- Issue: #63 · Branch: exp/onb-connect-answers-first (not created) · Launched: - · Concluded: -
- Primary metric: connect -> past-connect (`onb_step_view{fetching}` ∪ `{goal}`) per user exposed at connect · Result: -
- Guardrails: onb_flow_complete rate, purchase_completed (directional), **insights degraded / benchmark share at reveal** (fewer connections mechanically means weaker audits - the guardrail most likely to kill the variant), error rates
- Status: **QUEUED, deliberately not launched.** Blocked on onb-modal-exit concluding (~2026-08-10..08-12) because that experiment changes who reaches connect at all. Needs ~200/arm at connect = ~23 days at current volume, so it runs with a 28-day cap rather than the default 21.

---

## Flag inventory (not experiments - recorded so audits stop re-discovering them)

- **`onb-welcome-hero`** - registry entry with a `control` variant ONLY
  (`config/onboarding-experiments.ts`). It is deliberate plumbing: the welcome hero reads
  through `useObExperiment` so the wiring stays exercised. ~510 `$feature_flag_called`
  events per 14 days is expected and means nothing is being tested. Not an experiment;
  do not analyze it as one.
- **`hero-cta-copy`** - a multivariate flag that still exists in PostHog, read by
  `components/home/hero-cta.tsx` (`HeroCTA`). **That component is exported but mounted
  nowhere** (`config/entry-sources.ts:45` records the same fact for the `hero` entry
  source), so the flag decides nothing and records ~11 calls per 14 days of residual
  noise. It is a zombie, not a live landing-page test - earlier baselines describing it
  as "live" were wrong. Either delete the dead component and archive the flag, or mount
  it deliberately; leaving it as-is keeps producing a flag that looks like a running
  experiment in every flag listing.
