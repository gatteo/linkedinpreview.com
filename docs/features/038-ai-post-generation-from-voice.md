# Feature 038: AI Post Generation from Voice

## Goal

Let users speak their ideas and have AI convert the recording into a polished LinkedIn post.

## Description

Users record a voice note directly in the browser using the Web Audio API. The recording is transcribed (via a speech-to-text service) and then passed to the AI post generation pipeline to produce a formatted LinkedIn post. Available in the new post creation wizard (067) as a "Record voice" option.

## Acceptance Criteria

- [ ] User can record voice in-browser from the new post wizard
- [ ] Recording is transcribed to text
- [ ] Transcribed text is converted to a LinkedIn post via AI generation
- [ ] Generated post opens in the editor for further editing
- [ ] Works on desktop and mobile browsers
- [ ] Graceful error handling if microphone access is denied
- [ ] Rate limited under wizard quota

## Technical Notes

- Browser-side recording via MediaRecorder API (WebM/Opus format)
- Max recording length TBD (suggest 3-5 minutes)
- Transcription service: OpenAI Whisper API or browser SpeechRecognition API (evaluate cost/quality)
- Transcribed text fed into `/api/generate` with `action: 'posts'` and branding context
- New API route or extension of `/api/extract` for audio transcription
- Client component with record/stop/playback controls
- Rate limit: counts as a wizard action (5/day)
