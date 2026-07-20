# Onboarding funnel monitoring - the autonomous loop

> How the self-improving onboarding loop is wired: what runs, when, with what data
> access, and where humans stay in charge. Event/data definitions live in
> [onboarding-funnel.md](onboarding-funnel.md).

## The loop

```
instrumentation (client + server events, Supabase views)
      │
      ▼
daily funnel-health  ──alert email (only YELLOW/RED)──►  the maintainer's inbox
daily funnel-audit   ──ranked hypotheses──────────────►  GitHub issues (label: funnel)
      │              └─draft PR (qualifying bugs only)─►  GitHub PRs (never merged)
      ▼                                                        │
funnel-experiment: brief → flag-gated PR → human merge+launch → babysit → ship/revert PR
      │
      ▼
docs/experiments/log.md (institutional memory, read by the next audit)
```

Agents analyze, propose, and draft; a human merges every PR, launches every
experiment, and owns pricing/claims. Honesty invariants are never an experiment
surface (see `.claude/skills/funnel-experiment/SKILL.md`).

**When the audit may open a PR.** The default is still propose-don't-implement. A
draft PR is allowed only for a finding whose root cause is pinned to specific code,
that is a correctness bug (not a copy/UX hypothesis, which belongs in an experiment),
that is an S-effort contained diff, and that passes `pnpm type-check` and `pnpm lint`.
Max 2 per run, always `--draft`, never merged by the agent. Full bar in
`.claude/skills/funnel-audit/SKILL.md` ("Opening fix PRs").

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

| Label                               | Schedule    | Runs                                               |
| ----------------------------------- | ----------- | -------------------------------------------------- |
| `com.linkedinpreview.funnel-health` | daily 08:17 | health check + experiment babysit when one is live |
| `com.linkedinpreview.funnel-audit`  | daily 08:47 | deep audit over a rolling 7-day window             |

The audit runs daily but keeps a **7-day analysis window**: at current volume a single
day has too few users per cell to split by segment, and same-day health is
funnel-health's job. Consecutive runs therefore overlap by 6 days and will re-derive
the same findings - the skill requires checking existing `funnel` issues and commenting
rather than filing duplicates.

Plists: `~/Library/LaunchAgents/com.linkedinpreview.funnel-*.plist`. They point at
this checkout's `scripts/funnel-routine.sh` - **update the path if the repo moves**
(e.g. after the overhaul branch merges and the worktree is deleted). Manage with:

```bash
launchctl bootout gui/$(id -u)/com.linkedinpreview.funnel-health   # pause
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.linkedinpreview.funnel-health.plist  # resume
launchctl kickstart gui/$(id -u)/com.linkedinpreview.funnel-health # run now
```

Runner output: `.claude/funnel-reports/runs.log`; launchd stderr: `/tmp/com.linkedinpreview.funnel-*.log`
(usually empty - the runner redirects everything into `runs.log`, so judge a run by
that file, not by the `/tmp` logs).
The runner grants the headless session a broad tool allowlist (including Bash) -
the skills constrain behavior to read-only analysis plus reports/issues/emails.

## Email delivery (himalaya)

Routines send with the `himalaya` CLI over SMTP (`~/.config/himalaya/config.toml`,
account `default`). The convention lives in `.claude/skills/funnel-data/SKILL.md`.

Do **not** use the Gmail MCP: its only write tool creates a draft, so every report
silently accumulated unsent in the drafts folder - which is why the routines looked
like they had never run despite firing on schedule.

Headless runs cannot answer permission prompts, so writes under `.claude/` are
pre-allowed in `.claude/settings.local.json` (`funnel-reports/**` and
`funnel-data/references/baselines.md`). Without those the baselines update fails
silently mid-run and the report's numbers never become the next run's baseline.

## One-time setup checklist

- [ ] Authenticate the PostHog MCP connector once in an interactive session
      (`/funnel-health` dry run) so headless runs inherit the tokens.
- [ ] Verify email delivery: `himalaya message send --account default` (see above).
- [ ] Toggle Session replay ON in the PostHog project (inputs are masked by config).
- [ ] Create the `funnel` label in the GitHub repo (`gh label create funnel`).
- [ ] After real traffic exists, run one interactive audit to seed
      `.claude/skills/funnel-data/references/baselines.md`.

## Manual invocation

Any session can run the routines on demand: "run the funnel health check" /
"run the funnel audit" / "check on the live experiment" - the skills trigger from
those phrasings. The runner script works by hand too: `scripts/funnel-routine.sh health`.
