# T-004 — Make "Create Post" from a weekly idea pre-fill a draft

> Status: proposed
> Touches: [`../features/202-weekly-ai-post-ideas.md`](../features/202-weekly-ai-post-ideas.md) · Opened: 2026-06-14

## Goal

- When the user clicks "Create Post" on a weekly AI idea, create a new draft pre-filled with the
  idea's hook (and label), instead of just navigating to an empty editor.

## Context

- `idea-card.tsx` "Create Post" only navigates to `/dashboard/editor` with no hook pre-fill and no
  draft creation, and the documented "dismiss idea" affordance does not exist. Feature 202 is
  PARTIAL because of these two gaps. The idea already carries topic, format label, and hook.

## Plan

- On "Create Post", create a draft seeded with the idea's hook and format label (reuse the
  creation-wizard's pre-fill path), then open it in the editor.
- Add a dismiss action that removes the idea from the current week's list.

## Acceptance (binary, testable)

- [ ] T-004-AC-1 "Create Post" creates a draft whose content starts from the idea's hook.
- [ ] T-004-AC-2 The new draft carries the idea's format label.
- [ ] T-004-AC-3 Dismissing an idea removes it from the list for the week.

## On completion

- Fold into [`../features/202-weekly-ai-post-ideas.md`](../features/202-weekly-ai-post-ideas.md);
  recheck ACs, move toward SHIPPED. Add a CHANGELOG line.

## Notes / open questions

- Decide whether dismissals persist (Supabase) or are session-local.
