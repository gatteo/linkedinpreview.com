# NNN — Feature Name

> Status: SHIPPED | PARTIAL · Area: Public | Editor | AI | Scoring | Dashboard | Branding | Settings | Strategy | Feedback · Last verified: YYYY-MM-DD
>
> Copy this file to `NNN-slug.md` and fill it in. This folder holds **only built features**
> (SHIPPED or PARTIAL). Not-yet-built ideas live in [`../backlog/`](../backlog/). A feature
> describes a user-facing **surface**; system internals live in
> [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## What

- What the user sees and does. One paragraph.

## Why

- The user value. Why it earns its place.

## Acceptance (binary, testable)

- [ ] NNN-AC-1 ... _(verified: `path/to/file.ts:LINE`)_
- [ ] NNN-AC-2 ... _(gap: ... — see [STATUS.md](../STATUS.md))_

> Acceptance IDs are stable forever (`NNN-AC-3` is always `NNN-AC-3`). Tickets and commits
> reference them. A box is checked `[x]` **only** when verified against the code with a
> `file:line` citation. Anything unverified or contradicted stays `[ ]` with a gap note, and the
> feature's status drops to PARTIAL.

## Implementation

- Key files, routes, tables, and helpers that realize this feature, so the next engineer finds it
  fast. Use `path:line` references.

## Dependencies

- Links to related features and the relevant [`../ARCHITECTURE.md`](../ARCHITECTURE.md) sections.

## Open questions / known gaps

- ...
