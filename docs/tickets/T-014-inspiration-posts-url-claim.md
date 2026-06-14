# T-014 — Reconcile the inspirational-posts "URL" claim with the text-paste reality

> Status: proposed
> Touches: [`../features/088-inspirational-posts.md`](../features/088-inspirational-posts.md) · Opened: 2026-06-14

## Goal

- Resolve the last open gap on feature 088 (088-AC-4): the card and spec claim the user pastes
  LinkedIn post URLs, but the input is a free-text textarea that accepts arbitrary post BODY text and
  nothing parses or validates URLs. Make the spec and the UI agree.

## Context

- Surfaced by [T-005](T-005-branding-aware-chat-and-inspiration.md), which closed 088-AC-5 (posts now
  feed the AI as style reference). 088-AC-4 is now the only remaining 088 gap and had no tracking
  ticket. The actual design - pasting post body text - is arguably the more useful input for style
  reference than a URL (no fetch/scrape needed, the text is the signal). So this is most likely a
  spec-wording correction, not a missing capability.
- See the 088 spec gap note and `components/dashboard/branding/inspiration-posts-section.tsx:31,48`.

## Plan

- Decide between two resolutions (recommend A):
    - A) Correct the 088 spec: reword the "What" section and 088-AC-4 to describe pasting post body
      text (the real, intended design), and update the card copy if it implies URLs. Recheck 088-AC-4
      against the corrected criterion and move 088 to SHIPPED.
    - B) Implement URL support: accept a LinkedIn post URL, validate it, and store/label it. Larger
      scope; only if product genuinely wants URL ingestion.

## Acceptance (binary, testable)

- [ ] T-014-AC-1 The 088 spec's description and 088-AC-4 match what the UI actually does (no false
      "URL" claim), with `file:line` evidence.
- [ ] T-014-AC-2 The card copy does not promise a capability the code lacks.

## On completion

- Fold into [`../features/088-inspirational-posts.md`](../features/088-inspirational-posts.md);
  recheck 088-AC-4 and move 088 to SHIPPED. Add a CHANGELOG line.

## Notes / open questions

- This is primarily a product-truth decision (A vs B). Default to A unless URL ingestion is wanted.
