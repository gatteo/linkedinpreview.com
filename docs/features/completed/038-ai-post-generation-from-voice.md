# 038 — AI Post Generation from Voice

> Status: SHIPPED · Area: AI · Last verified: 2026-06-14

## What

- In the creation wizard the user can pick a "voice" source, speak into the browser, and watch their words transcribe live. The transcript is fed into the standard generation pipeline (hooks then full post variants) and the chosen variant opens in the editor.

## Why

- Talking is faster than typing for capturing a raw idea. Voice lowers the barrier to starting a post from a thought you already have in your head.

## Acceptance (binary, testable)

- [x] 038-AC-1 User can start voice input from the wizard's source picker _(verified: `components/dashboard/creation-wizard/creation-wizard.tsx:222-224`)_
- [x] 038-AC-2 Transcription uses the browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with continuous mode and interim results shown live _(verified: `components/dashboard/creation-wizard/voice-input.tsx:16-49,99-103`)_
- [x] 038-AC-3 The transcript is submitted into the generation pipeline (hooks, then posts) _(verified: `components/dashboard/creation-wizard/voice-input.tsx:109`, `creation-wizard.tsx:135-138`)_
- [x] 038-AC-4 The generated/selected post opens in the editor _(verified: `components/dashboard/creation-wizard/creation-wizard.tsx:167-176`)_
- [x] 038-AC-5 Unsupported browsers show a graceful fallback message _(verified: `components/dashboard/creation-wizard/voice-input.tsx:62-77`)_
- [x] 038-AC-6 Recognition errors stop recording gracefully _(verified: `components/dashboard/creation-wizard/voice-input.tsx:43-44`)_
- [x] 038-AC-7 Generation is rate limited under the `wizard` quota (5/day) _(verified: `app/api/generate/route.ts:40`, `config/ai.ts:5`)_

## Implementation

- Voice UI: `components/dashboard/creation-wizard/voice-input.tsx`.
- Wizard wiring: `components/dashboard/creation-wizard/creation-wizard.tsx:222-224,135-138`.
- Generation: shared `/api/generate` pipeline (see 031/035).

## Dependencies

- 031 (post generation), 035 (hooks), 037 (branding context).

## Open questions / known gaps

- Prior doc claimed the transcript is fed directly into `/api/generate` with `action: 'posts'`; in reality it goes through the normal wizard flow (hooks first, then posts). Corrected.
- Prior doc claimed "Works on desktop and mobile browsers"; the Web Speech API is not universally supported (notably absent or unreliable on several mobile browsers), and the code only provides a fallback message rather than mobile coverage. Cannot verify mobile support.
- Prior doc claimed the recording uses the "Web Audio API"; it uses the Web Speech API. Corrected.
- Microphone-permission-denied is handled via the generic `onerror` handler (stops recording) but there is no specific denied-permission message.
