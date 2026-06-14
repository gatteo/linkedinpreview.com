# 041 — Audio/video post source (backlog)

> Status: PLANNED · Wave: 6 · Captured: 2026-06-14
>
> Parked / not-yet-built. Split out of feature 039 (AI post generation from file), which intentionally
> ships only document sources (PDF/DOCX/TXT/MD). When promoted, open a ticket and graduate this to a
> spec in [`../features/`](../features/) with verified acceptance criteria.

## What it is

- Let the user upload an audio or video file (e.g. MP3, MP4, WAV, WebM) in the creation wizard,
  transcribe it, and feed the transcript into the existing generation pipeline (hooks then post),
  exactly like the document and voice sources do today.

## Why it is parked

- Transcription needs a speech-to-text path (e.g. a Whisper-style model through the `gateway`
  pattern), larger upload limits, and cost/latency handling that the current document extractor does
  not have. It is a net-new capability, not a gap in 039. Until then, the file picker advertises it
  as "coming soon" (see [`../tickets/T-008-audio-video-file-source.md`](../tickets/T-008-audio-video-file-source.md)).

## What would make it worth promoting

- Demand signal from users wanting to turn recordings/webinars into posts; a chosen, budgeted
  transcription provider; resolved upload-size and rate-limit story.

## Sketched acceptance (not yet binary)

- Upload audio/video (MP3/MP4/WAV/WebM) up to an agreed size cap.
- Server-side transcription via the gateway; transcript fed into the generation pipeline.
- Rate limited and cost-guarded like the other AI sources.

## Dependencies

- 036 (content extraction pipeline), 031/035 (generation). Likely a transcription provider behind the
  server-side gateway. Related: 038 (voice input already uses the browser Web Speech API).
