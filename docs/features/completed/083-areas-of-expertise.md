# 083 — Areas of Expertise

> Status: SHIPPED · Area: Branding · Last verified: 2026-06-14

## What

- A tag-style input on the Branding page where the user types a topic and adds
  it (via the Add button or Enter). Each added topic appears as a removable row.
  The topic list persists and is passed to AI generation as part of the
  assembled branding context.

## Why

- Telling the AI which topics the user writes about keeps generated posts on
  subject and within the user's domain.

## Acceptance (binary, testable)

- [x] 083-AC-1 A topic can be added via button or Enter key. _(verified: `components/dashboard/branding/expertise-section.tsx:48` Enter handler, `:51-58` Add button)_
- [x] 083-AC-2 Each topic can be removed individually. _(verified: `components/dashboard/branding/expertise-section.tsx:23-26,38`)_
- [x] 083-AC-3 Topics persist to `branding.expertise.topics`. _(verified: `components/dashboard/branding/expertise-section.tsx:19`, schema at `lib/branding.ts:29-32`)_
- [x] 083-AC-4 Empty or whitespace-only topics are not added. _(verified: `components/dashboard/branding/expertise-section.tsx:17-18`)_
- [x] 083-AC-5 Topics are included in the AI branding context. _(verified: `lib/ai-branding.ts:23-26` pushes `Expertise: ...` joined by comma)_

## Implementation

- UI: `components/dashboard/branding/expertise-section.tsx`
- Schema `BrandingExpertise`: `lib/branding.ts:29-32`
- AI bridge: `lib/ai-branding.ts:23-26`

## Dependencies

- 037 branding-aware AI.
- 200 content strategy wizard (reuses expertise topics for idea generation).

## Open questions / known gaps

- The control is a typed-input-plus-row list rather than inline chips, but it is
  functionally a dynamic add/remove tag list as claimed.
