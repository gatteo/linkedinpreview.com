# 066 — Dashboard Editor

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-14

## What

- The editor at `/dashboard/editor` is the post workspace: a TipTap rich-text editor on the left
  with an AI actions bar, and a right panel that toggles between a live LinkedIn preview (with
  desktop/mobile views) and an analysis panel. Edits auto-save to Supabase with a 2-second debounce;
  media saves immediately. On mobile the panels collapse into Editor / Preview / Analyze tabs.

## Why

- It is where users actually write and refine a post, seeing exactly how it will look and getting
  AI help without leaving the page or manually saving.

## Acceptance (binary, testable)

- [x] 066-AC-1 The editor lives at `/dashboard/editor`. _(verified: `app/dashboard/editor/page.tsx` route; `Routes.DashboardEditor` in `config/routes.ts`)_
- [x] 066-AC-2 It uses a TipTap editor panel. _(verified: dynamic import of `EditorPanel` in `components/dashboard/dashboard-editor.tsx:26-29`, rendered at `:145-152`)_
- [x] 066-AC-3 A live preview panel is shown (with the desktop/mobile preview component). _(verified: `components/dashboard/dashboard-editor.tsx:161-167` rendering `PreviewPanel`)_
- [x] 066-AC-4 An AI actions panel is present. _(verified: `components/dashboard/dashboard-editor.tsx:153` `AIActions`)_
- [x] 066-AC-5 An analysis panel is available (right tab / mobile tab). _(verified: `components/dashboard/dashboard-editor.tsx:168-175` `AnalyzePanel`)_
- [x] 066-AC-6 Content auto-saves to Supabase with a 2-second debounce. _(verified: `hooks/use-current-draft.ts:12` `SAVE_DELAY_MS = 2000`, debounce at `:170-179`)_

## Implementation

- Page: `app/dashboard/editor/page.tsx`.
- Editor composition (panels, mobile tabs, copy text): `components/dashboard/dashboard-editor.tsx:74-271`.
- Draft load + debounced auto-save: `hooks/use-current-draft.ts:31-200`.
- Preview/analyze panels: `components/tool/preview/preview-panel`, `components/dashboard/analyze/analyze-panel`.

## Dependencies

- 020 Rich Text Editor, 021/022 Preview, 033 AI Post Analysis, 032 Quick AI Actions.
- 062 Multi-Draft Management (the draft being edited).

## Open questions / known gaps

- The desktop/mobile preview toggle is provided by the shared `PreviewPanel` (feature 022), not by the dashboard editor itself.
