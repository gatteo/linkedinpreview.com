# 040 — AI Post Generation from URL

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- In the creation wizard the user pastes a URL, the wizard extracts the article (Readability over fetched HTML) and shows the title and text, and on confirmation feeds the text into the generation pipeline (hooks then post variants). The chosen variant opens in the editor.

## Why

- Reacting to or distilling an article is one of the most common LinkedIn post patterns. Pasting a link is the lowest-effort way to turn external content into a draft.

## Acceptance (binary, testable)

- [x] 040-AC-1 User can paste a URL and trigger extraction from the wizard _(verified: `components/dashboard/creation-wizard/url-input.tsx:21-40,51-66`)_
- [x] 040-AC-2 Article content is extracted via Readability + linkedom and the title is shown _(verified: `app/api/extract/route.utils.ts:32-40`, `url-input.tsx:33-34,71`)_
- [x] 040-AC-3 Extracted text is fed into the generation pipeline and the selected post opens in the editor _(verified: `components/dashboard/creation-wizard/url-input.tsx:81`, `creation-wizard.tsx:135-138,167-176`)_
- [x] 040-AC-4 Invalid URLs are rejected by schema and extraction failures show a clear error _(verified: `app/api/extract/route.schema.ts:4`, `url-input.tsx:35-36`)_
- [x] 040-AC-5 Extraction is rate limited (quickAction 10/day) and generation under the wizard quota (5/day) _(verified: `app/api/extract/route.ts:24`, `app/api/generate/route.ts:40`)_
- [x] 040-AC-6 The prompt instructs the model to create an original post inspired by the article (not a summary) _(verified: `config/prompts.ts:187`)_
- [x] 040-AC-7 Generated post includes source attribution guidance _(verified: `config/prompts.ts:187`)_

## Implementation

- URL UI: `components/dashboard/creation-wizard/url-input.tsx`.
- Extraction: `app/api/extract/route.ts`, `route.utils.ts` (see 036).
- Generation: shared `/api/generate` pipeline (see 031/035).

## Dependencies

- 036 (URL extraction), 031/035 (generation), 037 (branding context).

## Open questions / known gaps

- T-009 added the anti-summary and source-attribution instructions to the shared `posts` prompt (`config/prompts.ts:187`); 040-AC-6 and 040-AC-7 now pass and the feature is SHIPPED. The attribution guidance is conditional (external sources only) so it does not misfire on personal notes; the anti-summary instruction is general to all source types since the `posts` prompt is shared (notes, files, voice, URLs).
- URL extraction has a 5s fetch timeout; slow sources fail with a 422 rather than a specific timeout message.
