# 022 — Preview Size Toggle

> Status: SHIPPED · Area: Editor · Last verified: 2026-06-14

## What

- A size switcher above the preview card that re-flows the LinkedIn post card to different viewport widths so the author can check how the post looks across device sizes. The in-editor switcher offers three widths (mobile, tablet, desktop); the standalone feed preview page offers a two-way desktop/mobile toggle.

## Why

- A post that reads well on desktop can truncate awkwardly on a narrow mobile column. Letting the author switch widths surfaces line breaks and the "...more" cut at each size before publishing.

## Acceptance (binary, testable)

> Decision (2026-06-14): the 3-way fixed-width switcher is the intended design. The earlier
> binary-toggle and 375px-iPhone-frame criteria were dropped from scope (former 022-AC-1, 022-AC-2);
> their IDs are retired and not reused.

- [x] 022-AC-3 Switching size changes the rendered card width with a transition _(verified: `components/tool/preview/preview-panel.tsx:59`)_
- [x] 022-AC-4 The selected size is held in shared context and consumed by the card subcomponents (reactions/actions adapt at mobile) _(verified: `components/tool/preview/preview-size-context.tsx:13-28`, `components/tool/preview/reactions.tsx:9,22,30`, `components/tool/preview/action-buttons.tsx:9,12`)_
- [x] 022-AC-5 The standalone `/preview` feed page provides a desktop/mobile toggle that also syncs to the actual viewport width _(verified: `components/feed-preview/preview-page-client.tsx:19-41,85-108`)_

## Implementation

- In-editor size buttons and width map (mobile 320 / tablet 480 / desktop 555): `components/tool/preview/preview-panel.tsx:20-60`.
- Shared size context (default `desktop`): `components/tool/preview/preview-size-context.tsx:13-28`.
- Feed-preview desktop/mobile toggle: `components/feed-preview/preview-page-client.tsx:85-108`.

## Dependencies

- 021 Realtime preview (the card being resized).
- 023 Realistic feed preview (standalone toggle).

## Open questions / known gaps

- None. The 3-way fixed-width switcher (320/480/555 px, no device chrome) is the accepted design; the binary-toggle / iPhone-frame idea was dropped, not deferred.
