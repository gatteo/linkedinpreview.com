# 027 — Embeddable Widget

> Status: SHIPPED · Area: Editor · Last verified: 2026-06-14

## What

- The editor is exposed as a minimal, self-contained widget at `/embed` for embedding in third-party pages via an iframe. It renders the same editor and preview in an `embed` variant (no site chrome), adds a "Powered by LinkedInPreview.com" footer, posts its height to the parent window for auto-resizing, and is marked noindex.

## Why

- Letting other sites embed the tool drives distribution and backlinks. A stripped, auto-resizing iframe keeps the host page clean while the "Powered by" link drives attribution traffic.

## Acceptance (binary, testable)

- [x] 027-AC-1 An `/embed` route renders the embeddable tool _(verified: `app/embed/page.tsx:10-12`)_
- [x] 027-AC-2 The embed page is noindex/nofollow _(verified: `app/embed/page.tsx:5-8`)_
- [x] 027-AC-3 The embed uses its own minimal layout (no main site header/footer) _(verified: `app/embed/layout.tsx:3-14`)_
- [x] 027-AC-4 The tool renders in `embed` variant (borderless, full-height, no dashboard prompt) _(verified: `components/embed/embed-tool.tsx:38`, `components/tool/tool.tsx:141-146,223,237-239`)_
- [x] 027-AC-5 The widget reports its height to the parent window for iframe auto-resize _(verified: `components/embed/embed-tool.tsx:11-25`)_
- [x] 027-AC-6 A "Powered by LinkedInPreview.com" attribution footer is shown _(verified: `components/embed/embed-tool.tsx:40-50`)_

## Implementation

- Embed route and metadata: `app/embed/page.tsx:5-12`.
- Embed layout: `app/embed/layout.tsx:3-14`.
- ResizeObserver postMessage and attribution: `components/embed/embed-tool.tsx:8-52`.
- Embed variant branching in the tool: `components/tool/tool.tsx:64,141-146,237-239`.

## Dependencies

- 020-026 (the editor/preview surface being embedded).

## Open questions / known gaps

- In `embed` variant the Share button is still rendered (`onShare` is passed), producing links pointing at the embed origin/pathname (`components/tool/tool.tsx:116`); behaviour when embedded cross-origin is not specified.
