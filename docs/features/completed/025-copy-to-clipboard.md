# 025 — Copy to Clipboard

> Status: SHIPPED · Area: Editor · Last verified: 2026-06-14

## What

- A "Copy Text" button (and an intercepted Ctrl/Cmd+C) copies the post as LinkedIn-ready plain text, with formatting preserved via Unicode glyphs (bold, italic, underline, strikethrough) and list markers expanded. A success toast confirms the copy.

## Why

- LinkedIn's composer discards rich markup but keeps the literal characters. Copying Unicode-styled plain text is the only way to get bold/italic emphasis onto LinkedIn, so this is the core export path of the tool.

## Acceptance (binary, testable)

- [x] 025-AC-1 The "Copy Text" button writes the processed text to the clipboard _(verified: `components/tool/editor-panel.tsx:151-162,356-361`)_
- [x] 025-AC-2 The copied text is the Unicode-styled output, not raw markup, produced by `processNodes` + `toPlainText` _(verified: `components/tool/editor-panel.tsx:106-112`, `components/tool/utils.ts:163-243`)_
- [x] 025-AC-3 A success toast fires on copy _(verified: `components/tool/editor-panel.tsx:141-149`)_
- [x] 025-AC-4 A native copy (Ctrl/Cmd+C) is intercepted and overrides the clipboard with the styled plain text _(verified: `components/tool/editor-panel.tsx:164-179`)_
- [x] 025-AC-5 Bullet and ordered lists are expanded to "• " and "N. " markers in the copied text _(verified: `components/tool/utils.ts:203-206`)_

## Implementation

- Copy handler and clipboard write: `components/tool/editor-panel.tsx:151-162`.
- Copy-event interceptor that clears HTML and forces text/plain: `components/tool/editor-panel.tsx:164-179`.
- Output pipeline (mark to Unicode, list markers, paragraph spacing): `components/tool/utils.ts:163-243`.

## Dependencies

- 020 Rich text editor (mark source).
- Feedback after copy hook (`hooks/use-feedback-after-copy`) is triggered on copy.

## Open questions / known gaps

- None observed.
