# 026 — Draft Sharing via URL

> Status: SHIPPED · Area: Editor · Last verified: 2026-06-14

## What

- A Share button encodes the current draft into a compact, shareable link with no backend. The draft JSON is compressed and base64url-encoded into a `?draft=` query parameter; opening that link rehydrates the editor (or the feed preview) with the same content. A share dialog offers copy plus social share buttons.

## Why

- Authors want to send a draft to a colleague for review without an account or server. Encoding the whole draft into the URL makes sharing instant and stateless.

## Acceptance (binary, testable)

- [x] 026-AC-1 Encoding pipeline is JSON to `deflate-raw` compression to base64url (no padding, `+`→`-`, `/`→`_`) _(verified: `lib/draft-url.ts:7-24`)_
- [x] 026-AC-2 Decoding reverses base64url to `deflate-raw` decompression to JSON _(verified: `lib/draft-url.ts:26-47`)_
- [x] 026-AC-3 The Share action builds a URL with the encoded draft in `?draft=` _(verified: `components/tool/tool.tsx:111-118`)_
- [x] 026-AC-4 On load, a `?draft=` param is decoded and takes priority over the localStorage draft _(verified: `components/tool/tool.tsx:73-92`)_
- [x] 026-AC-5 A share dialog presents the link with a copy button and social share targets _(verified: `components/tool/share-dialog.tsx:50-101`)_
- [x] 026-AC-6 No backend is involved; encode/decode run entirely in the browser via `CompressionStream`/`DecompressionStream` _(verified: `lib/draft-url.ts:12,36`)_

## Implementation

- Encode/decode helpers: `lib/draft-url.ts:7-47`.
- Share URL construction: `components/tool/tool.tsx:111-118`.
- Draft load priority (URL over localStorage): `components/tool/tool.tsx:73-92`.
- Share dialog UI: `components/tool/share-dialog.tsx:28-105`.

## Dependencies

- 023 Realistic feed preview (`/preview?draft=`).
- 028 Homepage tool variant and 027 embed reuse the same encode pipeline.

## Open questions / known gaps

- Media attachments (024) are not encoded into the draft URL, so a shared link carries text/formatting only.
