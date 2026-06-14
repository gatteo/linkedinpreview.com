# T-010 — Show word count in the core editor

> Status: proposed
> Touches: [`../features/052-character-and-word-count.md`](../features/052-character-and-word-count.md) · Opened: 2026-06-14

## Goal

- Display a word count alongside the character count in the core editor footer, satisfying 052-AC-2.

## Context

- The core editor footer renders character count only (`components/tool/editor-panel.tsx:284-289`).
  The combined char+word view exists only in the dashboard analyze panel. Feature 052 is PARTIAL.

## Plan

- Add a word count to the editor footer next to the character count, reusing the existing counting
  helper so the two surfaces agree.

## Acceptance (binary, testable)

- [ ] T-010-AC-1 The core editor footer shows a live word count.
- [ ] T-010-AC-2 The word count matches the dashboard panel's computation.

## On completion

- Fold into [`../features/052-character-and-word-count.md`](../features/052-character-and-word-count.md);
  check 052-AC-2, move to SHIPPED / `features/completed/`. Add a CHANGELOG line.
