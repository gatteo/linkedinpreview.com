# 036 — AI Content Extraction

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- Extracts readable plain text from external sources so it can seed post generation. Supports article URLs (Mozilla Readability over fetched HTML), PDF (pdf-parse), DOCX (mammoth), and TXT/MD (decoded directly). Returns `{ text, title? }`. Used by the creation wizard's URL and file inputs.

## Why

- Most posts start from something the user already has (an article, a report, notes). Reliable extraction removes copy-paste friction and feeds clean text into the generation pipeline.

## Acceptance (binary, testable)

- [x] 036-AC-1 URL extraction fetches the page and parses the main article with Readability + linkedom _(verified: `app/api/extract/route.utils.ts:1-2,32-40`)_
- [x] 036-AC-2 PDF files are parsed with pdf-parse, DOCX with mammoth, and TXT/MD decoded as text _(verified: `app/api/extract/route.utils.ts:53-63`)_
- [x] 036-AC-3 Allowed file extensions are .pdf, .docx, .txt, .md; others throw an unsupported-type error _(verified: `app/api/extract/route.utils.ts:8,46-47`)_
- [x] 036-AC-4 Input file size is capped at 5MB and rejected above that _(verified: `app/api/extract/route.utils.ts:7,44`, client `components/dashboard/creation-wizard/file-input.tsx:12,26-29`)_
- [x] 036-AC-5 Extracted text output is truncated to 10,000 chars _(verified: `app/api/extract/route.utils.ts:6,10-12`)_
- [x] 036-AC-6 Counts against the `quickAction` rate limit (10/day); unauthenticated requests return 401 _(verified: `app/api/extract/route.ts:24,15-21`)_
- [x] 036-AC-7 URL fetch has a 5s abort timeout and extraction failures return 422 `EXTRACTION_FAILED` _(verified: `app/api/extract/route.utils.ts:20-30`, `app/api/extract/route.ts:53-58,80-82`)_

## Implementation

- Route: `app/api/extract/route.ts` (handles both multipart file upload and JSON URL body).
- Extraction logic: `app/api/extract/route.utils.ts`.
- URL body schema: `app/api/extract/route.schema.ts`.
- Clients: `components/dashboard/creation-wizard/url-input.tsx`, `file-input.tsx` (TXT/MD are read client-side, others sent to the route).

## Dependencies

- 039 (file-sourced generation), 040 (URL-sourced generation), 031/035 (downstream generation).

## Open questions / known gaps

- The doc title says "10KB output" but the cap is 10,000 characters, not 10 kilobytes; for multibyte content these differ. The implemented limit is `MAX_TEXT_LENGTH = 10_000` chars.
- The extract endpoint reuses the `quickAction` bucket rather than a dedicated extraction limit, so extractions and editor quick actions compete for the same 10/day.
