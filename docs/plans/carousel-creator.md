# Carousel Creator - Build Plan & Architecture

> Status: BUILT (v1) · Wave 3 anchor (features 210/211/212) · Branch: `feat/dashboard-overhaul`
> Export fidelity (fonts/emoji via modern-screenshot, auto-fit settling) wants a real-browser smoke
> test before being marked fully verified.
> Grounded in deep competitive + tooling research (2026-06-19). This is the authoritative
> planning doc; acceptance criteria graduate to `../features/` once shipped.

## Locked decisions

| Concern          | Decision                                                                                                                                                                                                                                               | Why                                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editor rendering | Hand-rolled **DOM** editor (absolutely-positioned elements + CSS transforms; TipTap for text). Polotno-shaped serializable JSON schema.                                                                                                                | Text editing is the dominant carousel activity and canvas's worst weakness. TipTap is already installed → native rich text for free. Decks are small & fixed-size, so DOM perf is fine. Polotno ($899/mo) / tldraw ($6k/yr) are non-starters for a free product.  |
| Editor state     | **Scoped `useSyncExternalStore` store** provided via Context, selector subscriptions, built-in past/present/future undo/redo with gesture coalescing.                                                                                                  | Honors the repo's _"no global state library"_ rule while giving Zustand-like selector performance and clean undo. Avoids adding Zustand + zundo.                                                                                                                  |
| Export pipeline  | Client-side: **`modern-screenshot`** (scale 2) per slide → **`pdf-lib`** exact-px multi-page flattened PDF → **`fflate`** ZIP for PNGs. Puppeteer fallback only later, behind a flag.                                                                  | Tailwind v4 emits `oklch()` which crashes `html2canvas`; `modern-screenshot`'s foreignObject approach lets the real browser paint webfonts/emoji. Slide theme colors are **hex** (not oklch) for belt-and-suspenders fidelity. All browser-side = $0 Vercel cost. |
| Storage          | `CarouselDocument` JSON in existing `drafts.content` jsonb, discriminated by `kind:'carousel'`. Migration **013** adds `kind` column defaulting `'post'`.                                                                                              | Reuses the entire CRUD/duplicate/schedule/publish surface and sidebar/table UI with zero forking.                                                                                                                                                                 |
| Canvas           | **1080×1350 (4:5)** default; 1:1 + 16:9 toggles, locked one-ratio-per-deck; ~88px (8%) safe-margin guardrail; render/export at 2×.                                                                                                                     | Max mobile real estate; matches LinkedIn document best practice.                                                                                                                                                                                                  |
| Theme            | 3-tier design tokens (primitive → semantic → component), **hex** colors, light+dark per theme, two-font-slot Google Font pairings, LinkedIn-native + curated palettes. Elements reference tokens (`colorToken`, `fontFamilyToken`) resolved at render. | Re-theme an entire deck (or apply the brand kit) in one store edit; AI output is auto-on-brand.                                                                                                                                                                   |
| AI               | Reuse OpenAI + Vercel AI SDK `generateObject` route pattern (`app/api/generate`). New `/api/carousel/*` routes, branding-aware via `assembleBrandingContext`, rate-limited via `config/ai.ts`. Reuse `/api/extract` for URL/PDF.                       | Matches the proven auth + rate-limit + Zod-schema shape; minimizes risk.                                                                                                                                                                                          |
| LinkedIn output  | Organic **PDF document post** (1080×1350, flattened, fonts rasterized). **Download PDF is always the primary path.** Native API publish (`initializeUpload` → PUT → poll `AVAILABLE` → `/rest/posts`) is additive/best-effort.                         | The API "Carousels" type is sponsored-ads-only; document posts are the organic primitive and _are_ API-publishable. 60-day no-refresh token limit means publish can't be a hard dependency.                                                                       |
| Inline styles    | Permitted **only** in the slide renderer for per-element geometry (x/y/w/h/rotation) and resolved theme colors.                                                                                                                                        | Arbitrary canvas geometry can't be expressed as Tailwind classes - the textbook canvas exception. Editor chrome stays Tailwind-only.                                                                                                                              |

## New dependencies (justified vs the "don't add unjustified deps" rule)

- `modern-screenshot` - only foreignObject renderer that handles Tailwind v4 oklch + webfonts + emoji client-side.
- `pdf-lib` - pure-JS exact-px multi-page flattened PDF assembly, browser-side.
- `fflate` - 8 kB worker-threaded ZIP for the PNG bundle.

Everything else reuses installed packages: TipTap (rich text), `@dnd-kit/*` (slide reorder), `framer-motion`, `recharts` (data slides), `sharp` (image proxy), `@mozilla/readability`/`linkedom`/`pdf-parse`/`mammoth` (extraction), `zod`, `ai`+`@ai-sdk/openai`.

## Slide / element JSON schema (source of truth for editor, thumbnails, AI, export)

```ts
type CarouselDocument = {
  kind: 'carousel'; version: 1
  canvas: { ratio: '4:5' | '1:1' | '16:9'; width: number; height: number }
  themeId: string; themeOverrides?: Partial<ThemeTokens>
  brandChrome: { footer: boolean; pageNumbers: boolean; swipeCue: boolean; avatarUrl?: string; name?: string; handle?: string }
  slides: Slide[]
}
type Slide = { id: string; role: 'hook'|'body'|'cta'|'validator'; background: {...}; panoramaGroup?: string; elements: Element[] }
type Element = Text | Image | Shape | Icon  // each: id,type,x,y,width,height,rotation,opacity,zIndex,locked?,autoFit?
//   Text: html (TipTap JSON), fontFamilyToken, fontSize, fontWeight, lineHeight, align, colorToken
```

## AI feature set (prioritized)

1. **Carousel-from-input** (topic | pasted text | URL | PDF) → `generateObject` → themed, hook-first/CTA-last deck. The core flow.
2. **Per-slide actions** (rewrite | shorten | punch-up | regenerate) + conversational whole-deck chat edit.
3. **Hook generator** (5 tagged pattern variants) + **CTA generator**.

- Fast-follow: auto alt-text + caption/title (vision); auto-theming (vibe → palette + font pairing).

## Template list (12-16 typed slide-role sequences)

Big-Statement Hook · Numbered List · 3/4-part Framework · Step-by-Step How-To · Before/After · A-vs-B Comparison · Big-Number/Stat · Pull-Quote · Checklist · Myth-Buster · Data/Chart · Case Study · Mistakes-to-Avoid · Cheat-Sheet · Narrative · CTA close.

## Open-question resolutions (autonomous)

- **Free + rate-limited AI** (consistent with `config/ai.ts`); generous carousel limits.
- **Download PDF primary**; native document publish wired as additive best-effort (not blocking).
- **Aspect ratios:** 4:5 default + 1:1 + 16:9; switchable anytime - elements re-layout proportionally to the new canvas (non-destructive, no clipping).
- **No AI image generation in v1** (cost + free positioning) → uploads + icon set + gradient/color backgrounds; Unsplash later.
- **Soft guardrail warnings** (min font size, words/slide, slide count) so the canvas stays free.
- **Carousels share the drafts table** but get their own list surface at `/dashboard/carousel`.

## Build order

1. Foundation (compiles): deps, migration 013, `lib/carousel/{types,theme,factory,layout,store,serialize}.ts`.
2. Shared slide renderer + element components (used by editor **and** export).
3. Editor UI: canvas, transform overlay, slide rail, inspector, toolbar, top-level editor, load/save hook, route + page.
4. Templates (12-16), export pipeline, AI routes + prompts + schemas, brand kit (branding extension + UI), LinkedIn feed preview, template/theme pickers, AI dialogs.
5. Wire sidebar Carousel slot + creation wizard + docs.
6. Review (code-quality), type-check, lint, fix.
