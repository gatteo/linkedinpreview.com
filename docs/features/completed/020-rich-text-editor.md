# 020 — Rich Text Editor

> Status: SHIPPED · Area: Editor · Last verified: 2026-06-14

## What

- A TipTap-based rich text editor where the user writes a LinkedIn post and applies formatting via a toolbar: bold, italic, strikethrough, underline, bullet list, ordered list, plus undo and redo. The formatting is converted to LinkedIn-compatible Unicode glyphs (for example mathematical bold/italic code points) so the styling survives a paste into LinkedIn, which strips real markup.

## Why

- LinkedIn's composer has no native text styling. Authors who want bold or italic emphasis must paste pre-styled Unicode. This editor gives a familiar WYSIWYG surface and produces the exact Unicode LinkedIn renders, so emphasis is preserved when copied across.

## Acceptance (binary, testable)

- [x] 020-AC-1 The editor is built on TipTap `StarterKit` plus the `Underline` extension _(verified: `components/tool/editor-panel.tsx:80-92`)_
- [x] 020-AC-2 Toolbar exposes bold, italic, strikethrough and underline toggles wired to TipTap commands _(verified: `components/tool/toolbar.tsx:31-87`)_
- [x] 020-AC-3 Toolbar exposes bullet list and ordered list toggles _(verified: `components/tool/toolbar.tsx:93-119`)_
- [x] 020-AC-4 Toolbar exposes undo and redo, disabled when the history stack is empty _(verified: `components/tool/toolbar.tsx:123-147`)_
- [x] 020-AC-5 Copy/output converts marks to Unicode glyphs (bold, italic, combined bold-italic, underline combining char, strikethrough combining char) _(verified: `components/tool/utils.ts:149-196`, `components/tool/utils.ts:31-90`)_
- [x] 020-AC-6 Active formatting buttons reflect the current selection state via `editor.isActive(...)` _(verified: `components/tool/toolbar.tsx:36,51,66,81,98,113`)_

## Implementation

- Editor instance and extensions: `components/tool/editor-panel.tsx:77-104`.
- Toolbar buttons and command chains: `components/tool/toolbar.tsx:16-150`.
- Unicode transform engine (DOUBLE/SCRIPT/CODE/FRAKTUR/BOLD/ITALIC transforms, combined bold-italic, underline/strikethrough appenders): `components/tool/utils.ts:31-196`.
- Mark mapping from TipTap mark types to transform keys: `components/tool/utils.ts:183-196`.

## Dependencies

- 025 Copy to clipboard consumes the Unicode output via `processNodes` / `toPlainText`.
- 021 Realtime preview renders the same processed content.

## Open questions / known gaps

- TipTap `StarterKit` also enables headings, blockquote, code block and horizontal rule by default, but no toolbar buttons expose them; they are only reachable via input rules or keyboard shortcuts.
