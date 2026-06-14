# 039 — AI Post Generation from File

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- In the creation wizard the user can upload a document (PDF, DOCX, TXT, or MD), via click or drag-and-drop. The content is extracted (PDF/DOCX through `/api/extract`, TXT/MD read in the browser) and fed into the generation pipeline (hooks then post variants), with the chosen variant opening in the editor.

## Why

- People often want to turn an existing document (a report, a draft, notes) into a LinkedIn post. Uploading is faster than copy-pasting and handles binary formats the user cannot paste.

## Acceptance (binary, testable)

- [x] 039-AC-1 User can upload via click or drag-and-drop from the wizard _(verified: `components/dashboard/creation-wizard/file-input.tsx:61-66,76-110`)_
- [x] 039-AC-2 Accepted types are PDF, DOCX, TXT, MD; PDF/DOCX go through `/api/extract`, TXT/MD are read client-side _(verified: `components/dashboard/creation-wizard/file-input.tsx:11,35-45`, `app/api/extract/route.utils.ts:8,53-63`)_
- [x] 039-AC-3 Extracted content is fed into the generation pipeline and the selected post opens in the editor _(verified: `components/dashboard/creation-wizard/file-input.tsx:128`, `creation-wizard.tsx:135-138,167-176`)_
- [x] 039-AC-4 File size is limited to 5MB with a clear error message _(verified: `components/dashboard/creation-wizard/file-input.tsx:12,26-29`, `app/api/extract/route.utils.ts:7,44`)_
- [x] 039-AC-5 Extraction failures show a descriptive error toast _(verified: `components/dashboard/creation-wizard/file-input.tsx:46-48`)_
- [x] 039-AC-6 Extraction is rate limited (quickAction 10/day) and generation under the wizard quota (5/day) _(verified: `app/api/extract/route.ts:24`, `app/api/generate/route.ts:40`)_

> Decision (2026-06-14): audio/video as a source is **out of scope for this feature** and moved to
> the backlog as [`041 - audio/video post source`](../../backlog/041-audio-video-post-source.md). The
> former 039-AC-7 is retired (ID not reused). The file picker should show audio/video as "coming
> soon" - tracked by [T-008](../../tickets/T-008-audio-video-file-source.md).

## Implementation

- File UI: `components/dashboard/creation-wizard/file-input.tsx`.
- Extraction: `app/api/extract/route.ts`, `route.utils.ts` (see 036).
- Wizard wiring + generation: `components/dashboard/creation-wizard/creation-wizard.tsx`.

## Dependencies

- 036 (extraction), 031/035 (generation), 037 (branding context).

## Open questions / known gaps

- Audio/video support (MP3, MP4, WAV, WebM, transcription) is not built and is now a separate backlog feature ([041](../../backlog/041-audio-video-post-source.md)); the file picker now shows a disabled "Audio / video (coming soon)" affordance (T-008) while the real capability remains tracked in 041. The affordance is purely informational - the accept filter and 5MB cap are unchanged. The size cap is 5MB for all supported types.
- TXT/MD are read entirely client-side (`FileReader`), so they never pass through the server-side 10,000-char truncation; only PDF/DOCX are truncated.
