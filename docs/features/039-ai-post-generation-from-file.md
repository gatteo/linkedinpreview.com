# Feature 039: AI Post Generation from File

## Goal

Let users upload a document or media file and have AI extract content and generate a LinkedIn post from it.

## Description

Users upload a file (PDF, DOCX, TXT, MD, or audio/video) in the new post creation wizard. The content is extracted using the existing `/api/extract` endpoint (036) and then passed to AI generation to produce a LinkedIn post. Extends the current file extraction to support audio/video transcription.

## Acceptance Criteria

- [ ] User can upload supported file types from the new post wizard
- [ ] Document content is extracted and converted to a LinkedIn post
- [ ] Audio/video files are transcribed then converted to a post
- [ ] Generated post opens in the editor
- [ ] File size limits are enforced with clear error messages
- [ ] Unsupported file types show a descriptive error
- [ ] Rate limited under wizard quota

## Technical Notes

- Extends the existing `/api/extract` route to handle audio/video formats
- Supported formats: PDF, DOCX, TXT, MD (already in 036), plus MP3, MP4, WAV, WebM (new)
- Audio/video transcription via OpenAI Whisper API
- Max file size: 5MB for documents, 25MB for audio/video
- Extracted text fed into `/api/generate` with branding context
- File upload UI in the new post wizard modal
- Rate limit: counts as a wizard action (5/day)
