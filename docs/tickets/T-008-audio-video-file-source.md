# T-008 — Show "coming soon" for audio/video file uploads

> Status: proposed · Touches: [`../features/completed/039-ai-post-generation-from-file.md`](../features/completed/039-ai-post-generation-from-file.md), [`../backlog/041-audio-video-post-source.md`](../backlog/041-audio-video-post-source.md) · Opened: 2026-06-14

## Goal

- In the creation-wizard file picker, advertise audio/video as a "coming soon" option (disabled),
  setting the expectation without implementing transcription.

## Context

- Audio/video as a post source was overclaimed in the old docs and is now a separate backlog feature
  ([041](../backlog/041-audio-video-post-source.md)). Feature 039 ships document sources only
  (PDF/DOCX/TXT/MD) and is SHIPPED. The decision (2026-06-14) is to surface audio/video as a clearly
  disabled "coming soon" affordance now, and build the real capability later via 041.

## Plan

- In `components/dashboard/creation-wizard/file-input.tsx` (and the source picker if relevant), add a
  disabled "Audio / video (coming soon)" affordance. Do not accept those file types; do not change
  the accepted set or the 5MB cap. Keep it accessible (disabled state, not a dead control).

## Acceptance (binary, testable)

- [ ] T-008-AC-1 The file picker shows an audio/video option clearly marked "coming soon" and
      disabled.
- [ ] T-008-AC-2 Selecting/dropping an audio/video file does not attempt extraction; accepted types
      are unchanged.

## On completion

- This is an enhancement, not a 039 gap (039 is already SHIPPED). Note the addition in
  [`../features/completed/039-ai-post-generation-from-file.md`](../features/completed/039-ai-post-generation-from-file.md)
  and add a CHANGELOG line. The real capability remains backlog
  [041](../backlog/041-audio-video-post-source.md).
