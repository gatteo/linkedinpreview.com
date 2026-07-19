# 025 — Copy to Clipboard

> Status: SHIPPED · Area: Editor · Last verified: 2026-07-19

## What

- A "Copy Text" button (and an intercepted Ctrl/Cmd+C inside the editor) copies the post as LinkedIn-ready plain text, with formatting preserved via Unicode glyphs (bold, italic, underline, strikethrough) and list markers expanded. A success toast confirms the copy. A native copy of a genuine sub-range copies only that selection through the same Unicode pipeline; a selection that spans the whole document is treated as a full-post copy. The interceptor is bound to the editor node, so copying anywhere else on the page is left alone.

## Why

- LinkedIn's composer discards rich markup but keeps the literal characters. Copying Unicode-styled plain text is the only way to get bold/italic emphasis onto LinkedIn, so this is the core export path of the tool.

## Acceptance (binary, testable)

- [x] 025-AC-1 The "Copy Text" button writes the processed text to the clipboard _(verified: `components/tool/editor-panel.tsx:283-294,608-616`)_
- [x] 025-AC-2 The copied text is the Unicode-styled output, not raw markup, produced by `processNodes` + `toPlainText` _(verified: `components/tool/editor-panel.tsx:196-202`, `components/tool/utils.ts:210-228,296-335`)_
- [x] 025-AC-3 A success toast fires on a full-post copy _(verified: `components/tool/editor-panel.tsx:273-281`)_
- [x] 025-AC-4 A native copy of the whole document (Ctrl/Cmd+A then Ctrl/Cmd+C, or a drag covering the whole post) overrides the clipboard with the styled plain text and runs the full-copy side effects (toast, `notifyCopy`, `post_copied`, analyze) _(verified: whole-document detection `components/tool/editor-panel.tsx:235-244`; interceptor `:313-329`; side effects `:273-281`)_
- [x] 025-AC-5 Bullet and ordered lists are expanded to "• " and "N. " markers in the copied text _(verified: `components/tool/utils.ts:272-276`)_
- [x] 025-AC-6 A native copy of a genuine sub-range copies only the selected text, through the same Unicode pipeline _(verified: `components/tool/editor-panel.tsx:206-219` serializes `selection.content()`; branch at `:316-322`)_
- [x] 025-AC-7 A partial copy emits `post_partial_copied` and does not fire the success toast, the feedback prompt, or the analyze call _(verified: `components/tool/editor-panel.tsx:316-322` returns before the `onCopied` path at `:324-328`)_
- [x] 025-AC-8 The copy interception is scoped to the editor DOM node, so a copy elsewhere on the page keeps its own clipboard payload _(verified: `components/tool/editor-panel.tsx:300-333` binds the listener to `editor.view.dom`)_
- [x] 025-AC-9 An empty document does not clear the clipboard _(verified: `components/tool/editor-panel.tsx:324-326` returns without `preventDefault` when there is no text)_

## Implementation

- Copy handler and clipboard write: `components/tool/editor-panel.tsx:283-294`.
- Copy-event interceptor (editor-scoped) that clears HTML and forces text/plain: `components/tool/editor-panel.tsx:300-333`.
- Whole-document detection (`AllSelection`, ProseMirror `atStart`/`atEnd` bounds, and a serialized-text fallback): `components/tool/editor-panel.tsx:235-244`.
- Selection serialization, including cut-boundary handling and ordered-list `start` carry-over: `components/tool/editor-panel.tsx:79-115,206-219`.
- Output pipeline (mark to Unicode, list markers, paragraph spacing, sub-range mode): `components/tool/utils.ts:210-228,296-335`.

## Dependencies

- 020 Rich text editor (mark source).
- Feedback after copy hook (`hooks/use-feedback-after-copy`) is triggered on a full-post copy only.

## Open questions / known gaps

- A selection that starts mid-item inside a list carries the list marker: selecting "early" inside a bullet yields "• early", because the marker is emitted per list item by the serializer (`components/tool/utils.ts:272-276`).
- Only the outermost ordered list gets its `start` carried over (`components/tool/editor-panel.tsx:98-115`), so a nested ordered list renumbers from 1 on a partial copy.
- Nested lists are flattened onto the parent line by the serializer (`components/tool/utils.ts:278`), so depth is lost in the copied text.
