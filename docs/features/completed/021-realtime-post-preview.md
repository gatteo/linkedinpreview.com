# 021 — Realtime Post Preview

> Status: SHIPPED · Area: Editor · Last verified: 2026-06-14

## What

- A live LinkedIn post card that updates as the user types in the editor. It shows an author avatar, name, headline, and timestamp, the rendered post content (with Unicode formatting and highlighted hashtags), and an engagement bar with reaction counts plus Like/Comment/Repost/Send action buttons.

## Why

- Authors want to see how their post will actually look on LinkedIn, including the "...more" truncation point and hashtag styling, before publishing. A real-time mirror removes guesswork about formatting and length.

## Acceptance (binary, testable)

- [x] 021-AC-1 Editor `onUpdate` pushes the latest JSON to parent state on every keystroke, feeding the preview _(verified: `components/tool/editor-panel.tsx:101-103`, `components/tool/tool.tsx:103-105`)_
- [x] 021-AC-2 Preview renders an avatar, author name, headline, and timestamp _(verified: `components/tool/preview/user-info.tsx:12-31`)_
- [x] 021-AC-3 Post content is rendered from the live editor JSON, with the LinkedIn "...more" 3-line truncation _(verified: `components/tool/preview/content-section.tsx:31-85`)_
- [x] 021-AC-4 Hashtags are styled in LinkedIn blue inside the rendered content _(verified: `components/tool/preview/content-section.tsx:12-24`)_
- [x] 021-AC-5 An engagement bar shows reaction counts and Like/Comment/Repost/Send buttons _(verified: `components/tool/preview/reactions.tsx:11-36`, `components/tool/preview/action-buttons.tsx:11-28`)_

## Implementation

- Card assembly (user info, content, media, reactions, actions): `components/tool/preview/post-card.tsx:17-57`.
- Content rendering and truncation: `components/tool/preview/content-section.tsx:26-86`.
- State flow editor to preview: `components/tool/tool.tsx:64-105,178-220`.

## Dependencies

- 020 Rich text editor (source of JSON).
- 022 Preview size toggle (controls card width).
- 024 Image and video upload (media slot in the card).

## Open questions / known gaps

- Author identity (name "Matteo Giardino", headline "Founder @ devv.it", avatar) is hard-coded in `user-info.tsx`; it is not yet driven by branding settings in the core tool.
