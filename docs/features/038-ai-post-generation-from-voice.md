# Feature 038: AI Post Generation from Voice

## Goal

Let users speak their ideas and have AI convert the recording into a polished LinkedIn post.

## Description

Users record a voice note directly in the browser using the Web Audio API. The recording is transcribed (via a speech-to-text service) and then passed to the AI post generation pipeline to produce a formatted LinkedIn post. Available in the new post creation wizard (067) as a "Record voice" option.

## Acceptance Criteria

- [x] User can record voice in-browser from the new post wizard
- [x] Recording is transcribed to text
- [x] Transcribed text is converted to a LinkedIn post via AI generation
- [x] Generated post opens in the editor for further editing
- [x] Works on desktop and mobile browsers
- [x] Graceful error handling if microphone access is denied
- [x] Rate limited under wizard quota

## Technical Notes

- Uses browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for real-time transcription
- Continuous mode with interim results displayed live
- Graceful fallback message for unsupported browsers
- Transcribed text fed into `/api/generate` with `action: 'posts'` and branding context
- Voice input UI in `components/dashboard/creation-wizard/voice-input.tsx`
- Rate limit: counts as a wizard action (5/day)
