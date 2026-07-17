# Onboarding funnel monitoring - the autonomous loop

> How the self-improving onboarding loop is wired: what runs, when, with what data
> access, and where humans stay in charge. Event/data definitions live in
> [onboarding-funnel.md](onboarding-funnel.md).

## The loop

```
instrumentation (client + server events, Supabase views)
      │
      ▼
daily  funnel-health  ──alert email (only YELLOW/RED)──►  the maintainer's inbox
weekly funnel-audit   ──ranked hypotheses──────────────►  GitHub issues (label: funnel)
      │                                                        │
      ▼                                                        ▼
funnel-experiment: brief → flag-gated PR → human merge+launch → babysit → ship/revert PR
      │
      ▼
docs/experiments/log.md (institutional memory, read by the next audit)
```

Agents analyze, propose, and draft; a human merges every PR, launches every
experiment, and owns pricing/claims. Honesty invariants are never an experiment
surface (see `.claude/skills/funnel-experiment/SKILL.md`).

## Components

| Piece                        | Where                                                               |
| ---------------------------- | ------------------------------------------------------------------- |
| Skills (runbooks)            | `.claude/skills/funnel-{data,health,audit,experiment}/` (versioned) |
| Event dictionary             | `docs/analytics/onboarding-funnel.md`                               |
| Supabase views               | migration `023_onboarding_observability.sql` (service-role only)    |
| Server capture               | `lib/analytics/server.ts` (posthog-node, prod only)                 |
| Experiment surface           | `config/onboarding-experiments.ts` + `hooks/use-ob-experiment.ts`   |
| Experiment log               | `docs/experiments/log.md`                                           |
| Routine runner               | `scripts/funnel-routine.sh health\|audit`                           |
| Reports (local, unversioned) | `.claude/funnel-reports/`                                           |

## Schedules (local launchd agents)

| Label                               | Schedule      | Runs                                               |
| ----------------------------------- | ------------- | -------------------------------------------------- |
| `com.linkedinpreview.funnel-health` | daily 08:17   | health check + experiment babysit when one is live |
| `com.linkedinpreview.funnel-audit`  | Mondays 08:47 | weekly deep audit                                  |

Plists: `~/Library/LaunchAgents/com.linkedinpreview.funnel-*.plist`. They point at
this checkout's `scripts/funnel-routine.sh` - **update the path if the repo moves**
(e.g. after the overhaul branch merges and the worktree is deleted). Manage with:

```bash
launchctl bootout gui/$(id -u)/com.linkedinpreview.funnel-health   # pause
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.linkedinpreview.funnel-health.plist  # resume
launchctl kickstart gui/$(id -u)/com.linkedinpreview.funnel-health # run now
```

Runner output: `.claude/funnel-reports/runs.log`; launchd stderr: `/tmp/com.linkedinpreview.funnel-*.log`.
The runner grants the headless session a broad tool allowlist (including Bash) -
the skills constrain behavior to read-only analysis plus reports/issues/emails.

## One-time setup checklist

- [ ] Authenticate the PostHog and Gmail MCP connectors once in an interactive
      session (`/funnel-health` dry run) so headless runs inherit the tokens.
- [ ] Toggle Session replay ON in the PostHog project (inputs are masked by config).
- [ ] Create the `funnel` label in the GitHub repo (`gh label create funnel`).
- [ ] After real traffic exists, run one interactive audit to seed
      `.claude/skills/funnel-data/references/baselines.md`.

## Manual invocation

Any session can run the routines on demand: "run the funnel health check" /
"run the funnel audit" / "check on the live experiment" - the skills trigger from
those phrasings. The runner script works by hand too: `scripts/funnel-routine.sh health`.
