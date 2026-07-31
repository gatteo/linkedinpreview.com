// ---------------------------------------------------------------------------
// Flag-gated onboarding experiments (managed by the funnel-experiment skill).
//
// Each entry maps a PostHog feature-flag key to named variants of a copy/config
// slot. Steps resolve their variant via useObExperiment(flagKey), which falls
// back to `control` while flags load, in dev, and for unknown variants - so
// `control` MUST hold the current production values verbatim, and every variant
// must define every key control defines.
//
// Rules (see .claude/skills/funnel-experiment/SKILL.md):
// - Flag naming: onb-<step>-<what>.
// - Honesty invariants and pricing are never experiment surfaces.
// - When an experiment concludes, bake the winner into the component/config and
//   delete the entry - this registry only holds LIVE experiments.
// ---------------------------------------------------------------------------

export const OB_EXPERIMENTS = {
    // Permanent plumbing check: the welcome hero reads through the experiment
    // path with only a control variant, so the flag wiring is exercised (and
    // the "10x" claim is one registry entry away from its first real test).
    'onb-welcome-hero': {
        control: {
            headlinePre: 'Grow ',
            headlineHighlight: '10×',
            headlinePost: ' on LinkedIn in 90 days.',
            sub: 'I’ll audit your LinkedIn, learn your goals, and build a personalized strategy, all in about 3 minutes.',
        },
    },
} as const

export type ObExperimentKey = keyof typeof OB_EXPERIMENTS
