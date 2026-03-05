# Feature 040: AI Post Generation from URL

## Goal

Let users paste a URL and have AI extract the article content and convert it into a LinkedIn post.

## Description

Users paste a URL in the new post creation wizard. The URL content is extracted using the existing `/api/extract` endpoint (036) via Readability, and the extracted text is passed to AI generation to produce a LinkedIn post. The user gets a formatted post summarizing or reacting to the source article.

## Acceptance Criteria

- [x] User can paste a URL in the new post wizard
- [x] Article content is extracted and converted to a LinkedIn post
- [x] Generated post opens in the editor for further editing
- [x] Invalid or inaccessible URLs show clear error messages
- [x] Rate limited under wizard quota

## Technical Notes

- Uses the existing `/api/extract` URL extraction (Readability + linkedom)
- Extracted text fed into `/api/generate` with `action: 'posts'` and branding context
- URL input field in the new post wizard modal
- AI prompt should instruct the model to create an original post inspired by the article, not just summarize
- Include source attribution guidance in the generated post
- Rate limit: counts as a wizard action (5/day)
