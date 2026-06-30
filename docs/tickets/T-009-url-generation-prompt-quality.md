# T-009 — Improve URL-to-post generation prompt (original, attributed)

> Status: done · Touches: [`../features/completed/040-ai-post-generation-from-url.md`](../features/completed/040-ai-post-generation-from-url.md) · Opened: 2026-06-14 · Closed: 2026-06-14

## Goal

- Make URL-sourced generation produce an original, inspired post (not a summary) and include source
  attribution guidance, satisfying 040-AC-6 and 040-AC-7.

## Context

- The `posts` prompt uses the extracted article text as raw source with no anti-summary or
  attribution instruction (`config/prompts.ts:177-185`). Feature 040 is PARTIAL on these two ACs.

## Plan

- Add explicit instructions to the URL/source generation prompt: write an original take inspired by
  the source (not a recap), and offer attribution guidance where appropriate.

## Acceptance (binary, testable)

- [x] T-009-AC-1 The generation prompt instructs an original, non-summary post for source material.
- [x] T-009-AC-2 The prompt provides source-attribution guidance.

## On completion

- Fold into [`../features/040-ai-post-generation-from-url.md`](../features/040-ai-post-generation-from-url.md);
  if all ACs pass, move to SHIPPED / `features/completed/`. Add a CHANGELOG line.
