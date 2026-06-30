# Development Workflow

> How a change goes from idea to merged. The point is a **quality gate that is always met**: no
> change is "done" until the gates below are green and the code-quality review returns SHIP.

## 1. The lifecycle of a change

1. **Pick the work.** It comes from [`../backlog/`](../backlog/) (a planned feature), a gap in
   [`../STATUS.md`](../STATUS.md), or a fresh need. Open a ticket in [`../tickets/`](../tickets/)
   using `TEMPLATE.md` (`T-NNN-slug.md`); set it `in-progress`.
2. **Build it** against the owning feature spec in [`../features/`](../features/) and its stable
   acceptance IDs (`NNN-AC-K`). Follow [`../CONVENTIONS.md`](../CONVENTIONS.md).
3. **Run the local gates** (section 2). They must pass.
4. **Run the review gate** (section 3). It must return **VERDICT: SHIP**; fix every P0 and P1.
5. **Update the docs** (section 4): check the ACs you actually satisfied (with `file:line`
   evidence), add a [`../CHANGELOG.md`](../CHANGELOG.md) line, and update
   [`../STATUS.md`](../STATUS.md) if "what works" changed.
6. **Fold and close.** Move the ticket's lasting acceptance criteria into the feature spec and
   mark the ticket `done`. Tickets are ephemeral; the durable spec lives in `features/`. When the
   change closes a feature's last open AC, **move its spec from `features/` into
   `features/completed/`** (SHIPPED).

## 2. Local gates (the same ones CI runs)

```bash
pnpm type-check   # tsc --noEmit
pnpm lint         # eslint .  (prettier rules included)
pnpm build        # contentlayer build + next build  (run when the change can affect the build)
```

CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) runs all three on every push to
`main` and every pull request. A green CI run is required to merge.

**Baseline note.** The tree may carry a small set of pre-existing type errors and a few
`@ts-expect-error`/`@ts-ignore` suppressions. Clearing them to a clean `type-check` is its own
ticket. Until then: never _add_ a new type error or suppression - that is a review blocker, not
part of the baseline.

## 3. The review gate (mandatory, before "done")

Every non-trivial change is reviewed by the **code-quality-reviewer** agent
([`.claude/agents/code-quality-reviewer.md`](../../.claude/agents/code-quality-reviewer.md))
against the working-tree diff. It is a brutally honest principal-engineer review that gates AI slop
and enforces this codebase's seams (no secret or LLM call outside server routes; Zod + auth + RLS

- rate limiting on every data route; SEO and a11y not regressed; no AC checked without `file:line`
  proof).

* The reviewer returns **VERDICT: SHIP** or **VERDICT: DO NOT SHIP** with defects graded
  **P0 / P1 / P2**.
* **DO NOT SHIP** if there is any P0 or any unaddressed P1.
* Fix all P0 and P1, then re-run the reviewer until it returns SHIP. P2 items are fixed when
  reasonable or logged.
* Relay the verdict honestly. Do not soften it, and do not weaken an acceptance criterion to make
  a review pass (that is itself a P0).

Doc and spec changes are in scope for the same gate: a spec that claims something the code does not
do is a defect.

## 4. Documentation discipline

- **Acceptance criteria are evidence-based.** In a feature spec, a box is `[x]` only with a
  `file:line` citation proving it. Anything unverified or contradicted stays `[ ]` with a gap note,
  and the feature's status is `PARTIAL`, not `SHIPPED`. See
  [`../features/000-TEMPLATE.md`](../features/000-TEMPLATE.md). SHIPPED specs live in
  [`../features/completed/`](../features/completed/); PARTIAL specs stay in `../features/`.
- **AC IDs are stable forever.** `NNN-AC-3` always means the same criterion. Tickets and commits
  reference these IDs.
- **CHANGELOG every meaningful change.** Add a dated line to [`../CHANGELOG.md`](../CHANGELOG.md).
- **STATUS is the snapshot.** Keep [`../STATUS.md`](../STATUS.md) honest about what works, what is
  partial, and what is next.

## 5. Standing rules the reviewer enforces

These come from [`../CONVENTIONS.md`](../CONVENTIONS.md) and
[`../_INDEX.md`](../_INDEX.md) Key Constraints, repeated here because they are the bar:

- **Seams.** LLM/provider calls and secrets only in server-side `app/api/*` route handlers;
  `LLM_API_KEY` is never `NEXT_PUBLIC_*` and never reaches the client. Every route validates its
  body with a Zod schema, checks the Supabase session, and enforces the rate limit via the
  `check_and_record_usage` RPC. New persistence tables ship with RLS.
- **SEO is the primary traffic source.** Never break an existing public URL or remove
  canonical/OG/JSON-LD metadata; keep Core Web Vitals healthy; dashboard and embed stay `noindex`.
- **Free and login-free core.** The homepage editor works with no auth; all user data uses
  Supabase anonymous auth.
- **Style.** TypeScript strict; Tailwind v4 only (config in `styles/globals.css`); kebab-case
  files, named exports; mobile-first to 375px; **no em dashes in copy** (single hyphens).
