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

- Issue: #55 · Branch: exp/onb-modal-exit · Launched: 2026-08-01 · Concluded: 2026-08-19 (decision read 2026-08-16; baked in via fix/funnel-55-conclude-onb-modal-exit)
- Primary metric: paywall reach per exposed user (onb_paywall_view / flag exposure) · Result: **ship locked** (locked 23.3% (47/202) vs control 7.6% (14/185), z=4.23; completion 13.4% vs 2.7%, z=3.80; ~2x the ~100/arm target)
- Guardrails: onb_flow_complete rate, purchase_completed (amount>0, directional), onb_step_view drop pattern, error rates
- Note: the same PR changes the editor-promise welcome title (features_header/features_card/showcase/tool_header; hero_editor is plan-framed since the hero CTA rename) to "View the full editor and complete an audit." for BOTH variants (entry-coherence, not part of the experiment) - resets the GH #42 verification window.
- Learning: the dismissible modal did not convert its exits into later returns - it simply lost them; the locked flow tripled paywall reach with no guardrail harm, so the exit affordance (and `onb_flow_dismissed`) is removed rather than re-tested. Two locked-arm dismissals observed during the run came from the `useObExperiment` control-fallback race, which the bake-in deletes. Ask the human to archive the PostHog flag after merge.

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
- **`hero-cta-copy`** - **RETIRED 2026-08-06.** A multivariate flag (id 145657, created
  2026-02-22, 100% rollout across four 25% variants) whose only reader was
  `components/home/hero-cta.tsx` (`HeroCTA`) - a component that was exported but mounted
  nowhere, so the flag decided nothing despite looking fully live in the flag list. It was
  never a landing-page test; earlier baselines describing it as "live" were wrong. The
  component is deleted, the `hero` entry source it emitted is removed from
  `config/entry-sources.ts`, and the flag is archived in PostHog (`active: false`,
  `archived: true`, last called 2026-08-04). Its variant copy ("Get Started", "Use Free
  Tool") predated the move to plan framing in 736c4fa, so a future hero test should be
  written fresh rather than revived from it.
