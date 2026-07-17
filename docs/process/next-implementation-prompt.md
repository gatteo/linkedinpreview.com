# Coding-agent continuation prompt (coordinator)

> Paste the block below into a fresh coding agent to continue implementation. It is self-contained
> and points the agent at the durable docs (STATUS, tickets, the review gate). Keep it in sync as
> tickets close.

---

You are the **coordinator** for continued development of **LinkedInPreview.com** (Next.js 16 /
React 19 / TypeScript / Supabase / Tailwind v4). The documentation has just been fact-checked
against the code and is the source of truth. You do not have to do all the work yourself: you plan,
**delegate to a team of sub-agents**, integrate their results, and own the quality bar. Your job is
to close the open **PARTIAL** features, one ticket per change, to that bar.

## Start here (read first, in order)

1. `docs/STATUS.md` - what works, what is PARTIAL, and the "Recommended next" order.
2. `docs/ROADMAP.md` - the rules block at the top, and each wave's "To complete this wave" list.
3. `docs/process/development-workflow.md` - the mandatory workflow and quality gate. Follow it exactly.
4. `docs/CONVENTIONS.md` and `docs/_INDEX.md` Key Constraints - coding standards and non-negotiables
   (seams, SEO, no em dashes, Tailwind v4, anonymous auth, strict TS).

## How you operate as coordinator

- **Maintain a plan.** List the open tickets, their dependencies, and the order. Work in priority
  order: **T-001 -> T-002 -> T-004 -> T-003 -> T-005**, then T-006, T-008, T-009, T-010, T-011,
  T-012, T-013. (T-007 is already done.)
- **Delegate each ticket to an implementer sub-agent** with a tight brief: the ticket file, the
  feature spec(s) it Touches, the acceptance criteria, and the guardrails below. One sub-agent owns
  one ticket end to end.
- **Use a separate reviewer sub-agent for the gate**: the `code-quality-reviewer` agent
  (`.claude/agents/code-quality-reviewer.md`) reviews each implementer's diff. Never let an
  implementer pass its own work.
- **Parallelize independent tickets; serialize conflicting ones.** Tickets that touch the AI prompt
  assembly - **T-005, T-009, T-011** (all edit `config/prompts.ts` / `lib/ai-branding.ts`) - must
  run **sequentially** to avoid clobbering each other. Editor-area tickets (T-001, T-002) can run in
  parallel with prompt work but coordinate on shared files. When running implementers in parallel,
  give each its **own git worktree** so their edits do not collide; integrate one at a time.
- **You are accountable for integration**: merge each finished ticket, re-run the gates on the
  integrated tree, and resolve any conflict between two tickets yourself.

## The loop for every ticket

1. Read the ticket (`docs/tickets/T-NNN-*.md`) and the spec(s) it Touches. Set the ticket
   `in-progress`.
2. Hand the implementer sub-agent the brief. It implements the smallest change satisfying every
   `T-NNN-AC-*`, reusing existing helpers (`lib/`, `hooks/`, `components/ui/`, `config/`). Respect
   the seams: LLM calls and secrets only in `app/api/*`; every route keeps Zod + Supabase auth + the
   `check_and_record_usage` rate limit; new tables ship with RLS.
3. Run the local gates and make them pass: `pnpm type-check`, `pnpm lint`, and `pnpm build` when the
   change can affect the build. No new type errors or `@ts-ignore`/`@ts-expect-error`.
4. **Review gate**: the `code-quality-reviewer` sub-agent reviews the diff. Fix every P0 and P1 and
   re-review until **VERDICT: SHIP**. Do not weaken an AC to pass.
5. **Fold and document** (development-workflow.md §1, §4):
    - Check the satisfied ACs in the spec with `_(verified: \`file:line\`)\_` - only with real evidence.
    - When a feature's last open AC closes, set the spec `Status: SHIPPED` and move it from
      `docs/features/` into `docs/features/completed/` (fix `../` links to `../../`).
    - Update `docs/STATUS.md` (PARTIAL table + SHIPPED/PARTIAL counts), the `docs/ROADMAP.md` row +
      header count + "To complete this wave" list, the `docs/PRODUCT.md` status, and add a dated
      `docs/CHANGELOG.md` line. Set the ticket `done`.
6. Report the ticket outcome (what shipped, reviewer verdict, doc updates), then start the next.

## Ticket-specific notes

- **T-002** wires the branding profile into the post preview, the product's signature surface
  (`components/tool/preview/user-info.tsx` is currently hard-coded). Keep the logged-out
  homepage/embed tool working with a fallback identity. Includes avatar cropping (T-002-AC-4).
- **T-005** spans chat, the analyze apply-suggestion call, and the inspiration fields; keep prompt
  length in check and treat pasted inspiration as reference data, never as model instructions.
- **T-008** is UI-only: show audio/video in the file picker as a disabled "coming soon" affordance.
  Do not implement transcription - the real capability is backlog
  [`041`](../backlog/041-audio-video-post-source.md). Feature 039 is already SHIPPED.

## Guardrails (pass these to every sub-agent)

- Change only what the ticket scopes, unless needed
- If a ticket is wrong, stop and propose a split rather than forcing it.
- Keep copy free of em dashes (use single hyphens). Tailwind v4 only (config in `styles/globals.css`).
- Every claim of "done" must be backed by a passing gate and a SHIP verdict - report honestly if
  something failed.
