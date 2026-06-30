# Design System - "Petrol & Vermilion" (v2)

The brand and UI system for LinkedInPreview. Source of truth for the design language lives in the Claude Design project `8a34497d-2fd8-4a60-bef6-8221565cac7d` ("New Linkedinpreview"), synced into the repo via the DesignSync MCP. The implemented tokens live in `styles/globals.css`; this document describes how to use them.

## Design Direction

A deep **petrol-teal "ink"** carries all structure (text, borders, the dark dashboard surface); a single **vermilion orange** is the spark accent reserved for CTAs, focus rings, highlights and the one warm subject in each brand illustration. The system is restrained, editorial and tactile - made characteristic by three signatures:

1. **Film grain** on key surfaces.
2. **Mono uppercase eyebrow labels** (Attio-style) above section headings.
3. A family of **grainy petrol/vermilion landscape illustrations** (one warm subject on a cool field) used as rounded "sticker" tiles.

LinkedIn blue is demoted to a functional `--info` tint and kept authentic only inside the LinkedIn post preview. "Free & open source" is a feature - state it plainly. Emoji appear only inside example post copy, never in product chrome. Never use em dashes in copy; use a single hyphen.

### Reference sites

- [Linear](https://linear.app) - soft glow, dark treatment, restraint
- [Attio](https://attio.com) - hairline/dashed rails, mono eyebrow labels, dot grid
- [Railway](https://railway.app) / [Dub](https://dub.co) - tactile cards, accent discipline

### Themes

- `:root` = **light** (airy `--paper` background) - marketing site, the editor/preview tool, auth.
- `.dark` = **dark** (petrol-950 surface) - the dashboard.

Both themes share the same semantic variable names, so every component adopts the active theme automatically; add a `.dark` ancestor to switch a subtree. `ThemeProvider` (next-themes) is scoped to the dashboard layout only - the homepage and public pages are light-only, but individual bands (the open-source section, the dashboard mockup) opt into `.dark` locally.

> **`@theme inline` (important):** `globals.css` uses `@theme inline` so color utilities reference `--background`/`--foreground`/etc. **directly**. With plain `@theme`, `--color-*` resolves once at `:root` and a nested `.dark` band would not re-theme. Keep it `inline`.

## Color

All colors are oklch CSS custom properties in `styles/globals.css`, exposed to Tailwind v4 via `@theme inline`. Use **semantic utilities** (`bg-primary`, `text-muted-foreground`, `border-border`) - never raw Tailwind palette colors (`text-neutral-500`, `bg-blue-100`) in product chrome.

### Structural ramps

| Ramp              | Tokens                                                                           | Role                                                                           |
| ----------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Petrol / ink      | `--petrol-50 … --petrol-950`                                                     | Structural color: text, borders, dark surfaces. `bg-petrol-*`, `text-petrol-*` |
| Vermilion / coral | `--orange-50 … --orange-700` (`--orange-500` = primary, `oklch(0.71 0.145 41)`)  | The single spark accent. `bg-orange-*`                                         |
| Warm surfaces     | `--paper` (light bg), `--cream` (warm band), `--canvas` (editor/preview surface) | -                                                                              |

### Semantic aliases

| Token                              | Light                      | Dark                          | Usage                                                     |
| ---------------------------------- | -------------------------- | ----------------------------- | --------------------------------------------------------- |
| `--background` / `--foreground`    | paper / petrol-950         | petrol-950 / petrol-50        | Page surface + text                                       |
| `--card` / `--card-foreground`     | white / ink                | petrol-900 / petrol-50        | Card surfaces (`bg-card`)                                 |
| `--primary`                        | vermilion (`--orange-500`) | vermilion                     | CTAs, focus rings, highlights (`bg-primary`, `ring-ring`) |
| `--secondary`                      | petrol-50                  | petrol-800                    | Quiet fills (`bg-secondary`)                              |
| `--muted-foreground`               | petrol-500                 | petrol-300                    | Helper / secondary text                                   |
| `--accent` / `--accent-foreground` | orange-50 / orange-700     | warm petrol wash / orange-100 | Warm accent washes, icon tiles                            |
| `--border` / `--border-strong`     | hairline / stronger        | translucent                   | Dividers; `--border-strong` for dashed rails              |
| `--destructive`                    | red                        | brighter red                  | Destructive actions                                       |

### Functional + status

- **`--info` / `--info-soft`** - the demoted LinkedIn blue, for functional/status only. **`--linkedin` (`#0a66c2`)** - authentic, post preview only.
- **Status (muted pastels):** `--green`/`--amber`/`--red` with `-soft` companions, surfaced as `--color-success`/`success-soft`, `--color-warning`/`warning-soft`, `--color-error`/`error-soft`, `--color-info`/`info-soft`. Use `bg-{status}-soft text-{status}` for badges/chips, `bg-{status}` for dots, `bg-{status}/15 text-{status}` for subtle delta pills. These are **theme-aware** (soft flips pale->deep in dark).
- **Chart ramp** (`--chart-1 … --chart-5` = petrol-800, petrol-500, petrol-300, orange-400, orange-600). Use `bg-[var(--chart-1)]`…`bg-[var(--chart-5)]` for categorical series instead of raw colors.
- **Glow tints** - `--glow-warm` / `--glow-cool` drive `.glow-warm` / `.glow-cool` radial blooms.

The canonical status/label mappings are centralized in **`lib/status-styles.ts`** (`POST_STATUS_BADGE`, `POST_STATUS_DOT`, `labelColor`) so posts table, calendar and badges stay identical. Reuse it; don't re-declare status colors inline.

## Typography

Loaded via `next/font` in `app/layout.tsx`:

| Family                  | Token                             | Role                                                   |
| ----------------------- | --------------------------------- | ------------------------------------------------------ |
| **Bricolage Grotesque** | `--font-heading` / `font-heading` | Display & section headings (tracked tight, `-0.025em`) |
| **Inter**               | `--font-inter` / `font-sans`      | Body & UI                                              |
| **JetBrains Mono**      | `--font-jetbrains` / `font-mono`  | Eyebrow labels & metadata                              |
| System UI stack         | `--font-system`                   | LinkedIn post preview only (to mimic LinkedIn)         |

Cal Sans (`--font-cal`) ships as an alternate display face; swap via `--font-heading` if desired (currently unused).

- **Headings**: always `font-heading` + `tracking-tight`. Display sizes use `clamp()` (e.g. hero `clamp(40px,6vw,62px)`, section heads `clamp(30px,4vw,42px)`).
- **Sentence case everywhere** (buttons, headings, nav). The only uppercase is the mono eyebrow.
- **The mono eyebrow** (the signature label): `font-mono text-xs font-medium tracking-label uppercase text-[color:var(--orange-600)]` (use `--orange-400` on a dark surface). On the homepage use the `Eyebrow` component from `components/home/_shared.tsx`.
- **Tracking tokens**: `--tracking-tight` (`-0.025em`, headings), `--tracking-label` (`0.12em`, eyebrows).

## Spacing & Layout

- **Base unit**: 4px grid (Tailwind default). Horizontal section padding is `px-7` (28px) - cells align to that gutter.
- **Widths**: `--max-width-content` 1200px (`.container`, `max-w-content`), prose 700px, narrow 576px, sidebar 240px, dashboard inner 1500px.
- **Radii**: controls 10px (`--radius`, `rounded-lg`), cards/tiles 12px (`--radius-xl`, `rounded-xl`), pills/avatars full. Prefer `rounded-xl` for app cards; avoid `rounded-2xl`.
- **Rail grid** (Attio-style): stacked sections share two continuous vertical hairlines (`border-x` on the centered container) while each section's top divider bleeds full-width. Implemented by the `Section` component (`components/home/_shared.tsx`). Internal panels are separated by hairline/dashed rules (`.dash-x/top/bottom/left`, `--border-strong`) and faint `.dot-grid`.

## Signature Effects (`styles/globals.css`)

| Effect                   | Class / token                                           | Notes                                                                              |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Film grain               | `.grain` (tune `--grain-opacity`)                       | `overlay` blend in light, `soft-light` in dark                                     |
| Soft glow                | `.glow-warm` / `.glow-cool`                             | Linear-style radial bloom behind hero elements                                     |
| Sticker illustration     | `.sticker` / `<IllustrationTile>`                       | Rounded, inset white ring + layered shadow + grain overlay, optional scrim caption |
| Animated gradient border | `.gradient-border` (`.gradient-border--white`)          | Slow conic sweep on key CTAs; pauses under reduced motion                          |
| Dashed / hairline rails  | `.dash-x` / `.dash-top` / `.dash-bottom` / `.dash-left` | 5px dash, 6px gap, `--border-strong`                                               |
| Dot grid                 | `.dot-grid`                                             | Faint engineering grid, 22px                                                       |
| Clicky button            | baked into `Button` cva (`--btn-rest/hover/active`)     | Resting layered shadow -> hover lift -> active depress; vermilion                  |
| Card                     | `--card-shadow`                                         | Inset hairline highlight + ring + soft layered drop (not a hard border)            |
| 3D logo                  | `.logo3d`                                               | Pressable dimensional app mark                                                     |
| Post-card shadow         | `--shadow-post`                                         | Matches the real LinkedIn preview                                                  |

Elevation scale: `--shadow-subtle`, `--shadow-elevated`, `--shadow-prominent`, `--shadow-hero` (all petrol-tinted).

## Components

shadcn/Radix primitives live in `components/ui/`; see CLAUDE.md for Tailwind v4 gotchas (data-attribute selectors, Select height, Switch state, Sidebar `min-h-svh`).

### Button

Variants: default (vermilion primary), secondary, outline, ghost, destructive, link. Sizes: xs/sm/default/lg/icon variants. The "clicky" 3D treatment (resting shadow, hover lift `-translate-y-px`, active depress `scale-[0.98]`, hairline top highlight) is global; `ghost`/`link` opt out of the lift. Translate/scale drop under reduced motion. Key CTAs wrap the button in `.gradient-border`.

### Card

12px radius, `--card-shadow` (inset highlight + ring + layered drop). Compose with `CardHeader/Title/Description/Content/Footer`.

### IllustrationTile (`components/home/illustration-tile.tsx`)

The signature sticker illustration: rounded, ringed, grain-topped image with optional mono-eyebrow + display-title scrim caption. Pull art from `public/images/illustrations/`.

### Alert / Badge / Dialog / Sidebar / Input / Select / Switch / Tabs / Table / Accordion / Popover / Tooltip / Toast (Sonner) / EmptyState

All tokenized. `Alert` `warning` variant uses the `warning` status tokens. `EmptyState` (`components/dashboard/empty-state.tsx`) pairs an illustration with headline + copy + actions.

### Homepage primitives (`components/home/_shared.tsx`)

- **`Section`** - rail-grid section frame (shared vertical hairlines, bleeding top divider).
- **`Eyebrow`** - the canonical mono eyebrow.
- **`SectionHead`** - eyebrow + display `h2` + sub + optional action.
- **`IconTile`** - the accent icon tile (`md` = size-10 / 10px radius, `sm` = size-8.5 / 9px) with the inset vermilion hairline ring. Single source of truth for feature icons.
- **`FeatureItem`** - horizontal accent-tile + heading + body row, shared across feature sections.

### PostPreviewCard / post preview

Authentic LinkedIn post preview (`components/tool/preview/*`, `components/feed-preview/*`, `components/dashboard/carousel/render/*`). **Intentionally exempt** from the design system: it keeps the system UI font, neutral grays, white card, and authentic LinkedIn blue (`--linkedin` / `#0a66c2`) to mimic the real feed. Do not "tokenize" these.

## Icons & Assets

- **Lucide React** (primary, 2px stroke) - 16px in buttons, 18-20px standalone. **Tabler** for brand/social glyphs. Custom LinkedIn glyphs (like/comment/repost/send, "in" mark) are hand-tuned inline SVGs in `components/icon.tsx`.
- Two-color, theme-aware: line work in `currentColor`, a single `--primary` accent. Never multicolor, never emoji-as-icon in chrome.
- Brand illustrations: `public/images/illustrations/` (grainy petrol/vermilion landscapes). `next/image` for all images.

## Motion

- House ease-out `--ease-out` `cubic-bezier(0.16,1,0.3,1)`; playful spring `--ease-spring` `cubic-bezier(0.34,1.56,0.64,1)`. Durations `--duration-fast/base/slow` (150/300/600ms).
- `lib/motion.ts` is the single source for Framer Motion (`EASE_OUT`, durations, `fadeUp`, `popIn`, `stagger*`, `slideStep`, `pressable`). Wrap motion roots in `<MotionConfig reducedMotion="user">`.
- Keyframes in `globals.css`: `fade-up`, `fade-in`, `slide-in-right`, `float`, `accordion-down/up`, `bounce-down`, `shine`, `text-shimmer`, `dashpulse`, `lp-spin` (gradient border). No elastic easing; no infinite decorative loops on content.

## Keeping it in sync

The design language is authored in the Claude Design project and synced with the DesignSync MCP + the `/design-sync` skill (incrementally, one component at a time). When the remote system changes, update `styles/globals.css` tokens first, then this doc, then propagate to consuming components. Run `pnpm type-check` and `pnpm lint` after token-touching changes, and visually verify dashboard status badges in both themes (the `-soft` tokens differ per theme).
