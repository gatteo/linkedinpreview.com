# Exact-preview correction after LIN-132 CHANGES

Sentinel comment `6c32feb0-27a7-4a23-af93-ebb8739913c9` rejected the canceled documentation-head preview. Independent code/check/behavior results remain historical evidence, not an APPROVE or exact-head runtime pass.

Head `9610738ebdb0cfddd0578d2f542e1f00ca55f1c6` and its canceled previews are preserved unchanged. No history rewrite or metadata spoofing can make those previews READY.

The repository explicitly supports a preview build request through `[deploy]` in the real commit message, documented in `CLAUDE.md` Build Cost and implemented in `scripts/vercel-build-gate.sh` lines 29-37. Executing that unchanged gate with the marker returned its expected BUILD exit code 1. This documentation correction uses that supported opt-in on the existing feature branch, producing a new immutable review head. It does not disable the gate or edit deployment configuration, fonts, environment, reviewed priority PRs or application code. It is a preview build request, not production approval.

The new immutable head must have an independently read READY deployment with matching SHA and contained desktop/mobile smoke before re-requesting independent Sentinel review. A successful GitHub Vercel status alone is insufficient. If the supported build request fails, record the actual blocker; do not bypass checks or claim the old code preview satisfies the new head.

Evidence hygiene clarification from Sentinel: product-path diff checks pass, but whole-PR diff checking reports nonblocking whitespace in the two raw historical verification logs. Those logs are preserved as raw evidence; historical unstaged diff-check success is not a claim that the entire PR log diff is whitespace-free. Static React seam warnings and the known Contentlayer post-generation error remain disclosed.

All prior production gates, source/cohort/paid contracts, provider-cost uncertainty, failure denominators and rollback remain unchanged. Atlas alone merges after actual priority releases/current-main reconciliation, current-head independent approval, real health and registered clocks. No real auth/customer/provider/payment writes or LinkedIn action.
