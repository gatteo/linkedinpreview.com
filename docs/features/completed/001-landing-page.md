# 001 — Landing Page

> Status: SHIPPED · Area: Public · Last verified: 2026-06-14

## What

- The marketing home page at `/` presents the product in a single scroll: a hero, the live preview tool demo, a how-to-use guide, a reasons section, a features grid, an embed section, an FAQ, an open-source section, and a closing call to action. The page emits three JSON-LD blocks (Organization, WebSite, SoftwareApplication) for rich-result eligibility.

## Why

- This is the primary acquisition surface. It both demonstrates the tool in-page (lowering the barrier to first use) and gives search engines structured data describing the org, the site, and the free software application.

## Acceptance (binary, testable)

- [x] 001-AC-1 The home page renders Hero, Tool demo, and HowToUse sections _(verified: `app/(main)/page.tsx:80-84`)_
- [x] 001-AC-2 The home page renders OpenSource, Reason, Features, EmbedSection, FAQs, and CtaSection _(verified: `app/(main)/page.tsx:86-95`)_
- [x] 001-AC-3 An Organization JSON-LD block is emitted with name, url, logo, founder, and sameAs _(verified: `app/(main)/page.tsx:15-29,74-76`)_
- [x] 001-AC-4 A WebSite JSON-LD block is emitted referencing the Organization as publisher _(verified: `app/(main)/page.tsx:31-41,77`)_
- [x] 001-AC-5 A SoftwareApplication JSON-LD block is emitted with applicationCategory, free Offer, and featureList _(verified: `app/(main)/page.tsx:43-69,78`)_
- [x] 001-AC-6 All referenced section components exist as modules under `components/home/` (and the tool under `components/tool/`) _(verified: `components/home/hero.tsx`, `components/home/how-to-use.tsx`, `components/home/opensource.tsx`, `components/home/reason.tsx`, `components/home/features.tsx`, `components/home/embed-section.tsx`, `components/home/faqs.tsx`, `components/home/cta-section.tsx`, `components/tool/tool.tsx`)_

## Implementation

- Page composition and all three JSON-LD schemas: `app/(main)/page.tsx:14-98`.
- Schema typings via `schema-dts` (`Organization`, `WebSite`, `SoftwareApplication`): `app/(main)/page.tsx:1`.
- Shared site constants (url, title, description, logo) used to populate the schemas: `config/site.ts:10-16`.
- Section components: `components/home/*.tsx`; live tool demo: `components/tool/tool.tsx`.
- The page is wrapped by `app/(main)/layout.tsx` which adds Header, Footer, Toaster, Tally script, and feedback FAB.

## Dependencies

- 006 — SEO infrastructure (Organization is referenced by `@id` from Article and WebSite schemas elsewhere).
- Live editor/tool feature (the `Tool` demo embedded on the page).

## Open questions / known gaps

- The Organization schema `sameAs` Twitter handle is `mattegiardino` while the GitHub link points at `gatteo/linkedinpreview.com`; not a bug per se but worth confirming both URLs resolve.
- JSON-LD content is hardcoded in the page rather than centralized in `lib/schema.ts` (which only holds the HowTo helper), so future edits must touch the page directly.
