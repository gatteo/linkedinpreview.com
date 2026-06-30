# 028 — Homepage Tool Variant

> Status: SHIPPED · Area: Editor · Last verified: 2026-06-14

## What

- The full editor and live preview are embedded directly on the homepage as a quick-start entry point, so visitors can start writing immediately without navigating away. It is the same TipTap editor and preview component used on the standalone tool, mounted in its `default` variant under a `#tool` anchor, and it adds an "Open full editor" prompt once the user has written content.

## Why

- Putting the working tool above the fold converts visitors immediately and demonstrates value before any signup. Reusing the same component avoids divergence between the landing demo and the real tool.

## Acceptance (binary, testable)

- [x] 028-AC-1 The homepage renders the `Tool` component inline _(verified: `app/(main)/page.tsx:12,82`)_
- [x] 028-AC-2 It is the same `Tool` used elsewhere, in `default` variant (not `embed`) _(verified: `app/(main)/page.tsx:82`, `components/tool/tool.tsx:64`)_
- [x] 028-AC-3 It mounts the same TipTap editor and live preview panels _(verified: `components/tool/tool.tsx:181-196`)_
- [x] 028-AC-4 The section carries a `#tool` anchor with header-offset scroll for deep links _(verified: `components/tool/tool.tsx:242-245`)_
- [x] 028-AC-5 In default variant a "Want to save and manage drafts? Open full editor" prompt appears once content exists _(verified: `components/tool/tool.tsx:223-233`)_

## Implementation

- Homepage composition (Hero, Tool, HowToUse): `app/(main)/page.tsx:80-84`.
- Tool default-variant section wrapper and `#tool` anchor: `components/tool/tool.tsx:241-248`.
- Dashboard hand-off ("Open full editor" encodes draft into `/dashboard/editor?import=`): `components/tool/tool.tsx:127-135,223-233`.

## Dependencies

- 020-026 (editor and preview).
- Dashboard editor (`/dashboard/editor`) receives the imported draft.

## Open questions / known gaps

- None observed.
