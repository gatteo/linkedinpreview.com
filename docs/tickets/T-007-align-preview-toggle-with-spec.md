# T-007 — Align the in-editor preview toggle with its spec

> Status: done · Touches: [`../features/completed/022-mobile-desktop-preview-toggle.md`](../features/completed/022-mobile-desktop-preview-toggle.md) · Opened: 2026-06-14 · Closed: 2026-06-14

## Goal

- Resolve the mismatch between feature 022's spec (binary desktop/mobile toggle + 375px iPhone frame)
  and the implementation (a 3-way mobile/tablet/desktop width switcher).

## Resolution (2026-06-14)

- **Decision: keep the 3-way fixed-width switcher; it is the intended design.** No code change.
- The two out-of-scope criteria were retired from feature 022 (former 022-AC-1 binary toggle, 022-AC-2
  375px iPhone frame); their IDs are not reused. Feature 022 is now SHIPPED and moved to
  [`../features/completed/022-mobile-desktop-preview-toggle.md`](../features/completed/022-mobile-desktop-preview-toggle.md).

## Acceptance (binary, testable)

- [x] T-007-AC-1 Feature 022's spec and the shipped behavior agree (no contradiction).
- [x] T-007-AC-2 The dropped criteria are removed from the spec, not left failing.

## On completion

- Done: 022 marked SHIPPED, spec relocated, CHANGELOG line added.
