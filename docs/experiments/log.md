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
