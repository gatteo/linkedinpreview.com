# Style Guide

> Single source of truth for the linkedinpreview.com design system.
> Inspired by dub.co's monochrome aesthetic, adapted with LinkedIn blue as the sole accent color.

---

## 1. Design Philosophy

**Monochrome + single accent.** The entire UI is built on a black/white/gray neutral palette. LinkedIn blue (`#0077B5`) is the only color. If something is not neutral, it is primary blue. There are no other brand colors, no gradients of multiple hues, no teal-to-purple combos.

**Whitespace is a feature.** Sections breathe with generous vertical padding (`py-20 md:py-28`). Content maxes out at 1080px. Paragraphs cap at 520-540px. The design trusts empty space over visual noise.

**Quiet confidence.** The aesthetic is minimal but not sterile. Subtle dot-grid backgrounds, soft shadows on hover, gentle scroll animations, and thin 1px borders create texture without distraction. Every decorative element must earn its place.

**SaaS sensibility.** The site should feel like a professional product, not a personal project. Patterns borrowed from dub.co (bordered columns, neutral-50 alternating sections, rounded-xl cards) signal trustworthiness and polish.

---

## 2. Color System

### CSS Variables (light mode)

All color variables use `oklch()` values defined in `styles/globals.css` within `@layer base`.

| Variable                 | OKLCH Value               | Hex Approx | Usage                               |
| ------------------------ | ------------------------- | ---------- | ----------------------------------- |
| `--background`           | `oklch(1 0 0)`            | `#ffffff`  | Page background                     |
| `--foreground`           | `oklch(0.145 0 0)`        | `#0a0a0a`  | Default text color                  |
| `--card`                 | `oklch(1 0 0)`            | `#ffffff`  | Card/component backgrounds          |
| `--card-foreground`      | `oklch(0.145 0 0)`        | `#0a0a0a`  | Text on cards                       |
| `--popover`              | `oklch(1 0 0)`            | `#ffffff`  | Popover/dropdown backgrounds        |
| `--popover-foreground`   | `oklch(0.145 0 0)`        | `#0a0a0a`  | Text in popovers                    |
| `--primary`              | `oklch(0.546 0.13 242.3)` | `#0077B5`  | LinkedIn blue accent                |
| `--primary-foreground`   | `oklch(0.985 0 0)`        | `#fafafa`  | Text on primary backgrounds         |
| `--secondary`            | `oklch(0.97 0 0)`         | `#f5f5f5`  | Secondary backgrounds               |
| `--secondary-foreground` | `oklch(0.205 0 0)`        | `#171717`  | Text on secondary backgrounds       |
| `--muted`                | `oklch(0.97 0 0)`         | `#f5f5f5`  | Muted/disabled backgrounds          |
| `--muted-foreground`     | `oklch(0.556 0 0)`        | `#737373`  | Muted text (captions, placeholders) |
| `--accent`               | `oklch(0.97 0 0)`         | `#f0f0f0`  | Accent backgrounds (hover states)   |
| `--accent-foreground`    | `oklch(0.205 0 0)`        | `#171717`  | Text on accent backgrounds          |
| `--destructive`          | `oklch(0.58 0.22 27)`     | `#ef4444`  | Error/destructive actions           |
| `--border`               | `oklch(0.922 0 0)`        | `#e5e5e5`  | All borders                         |
| `--input`                | `oklch(0.922 0 0)`        | `#e5e5e5`  | Input borders                       |
| `--ring`                 | `oklch(0.546 0.13 242.3)` | `#0077B5`  | Focus rings                         |
| `--radius`               | `0.625rem`                | `10px`     | Base border-radius                  |

### CSS Variables (dark mode `.dark`)

| Variable       | OKLCH Value                | Notes                              |
| -------------- | -------------------------- | ---------------------------------- |
| `--background` | `oklch(0.145 0 0)`         | Near-black                         |
| `--foreground` | `oklch(0.985 0 0)`         | Near-white                         |
| `--primary`    | `oklch(0.654 0.154 241.7)` | Brighter blue for dark backgrounds |
| `--border`     | `oklch(1 0 0 / 10%)`       | Subtle translucent borders         |

Dark mode is currently used only for the CTA section (`bg-neutral-950`), not as a site-wide theme toggle.

### Primary (LinkedIn Blue) Usage Rules

**DO use primary for:**

- CTA buttons (default `<Button>` variant)
- Focus rings on interactive elements
- Icon tints on feature cards (`text-primary`)
- Icon background tints (`bg-primary/10`)
- Accent text in headings (e.g., `<span className="text-primary">LinkedIn</span>`)
- Timeline/progress indicators (border-primary on step circles)
- Gradient blobs in dark sections (`bg-primary/20 blur-[120px]`)

**DO NOT use primary for:**

- Body text
- Backgrounds of entire sections
- Borders (use `border-border` instead)
- More than one word/phrase per heading
- Hover states on non-button elements (use neutral shifts instead)

### Neutral Scale Usage

| Tailwind Class     | Usage                                                     |
| ------------------ | --------------------------------------------------------- |
| `text-neutral-900` | Headings, bold labels, footer column titles               |
| `text-neutral-800` | Secondary emphasis in inline text                         |
| `text-neutral-700` | Nav links, strong body text, footer "Created by" link     |
| `text-neutral-600` | Default body text (used in dub.co reference), icon labels |
| `text-neutral-500` | Body text, descriptions, captions, metadata               |
| `text-neutral-400` | Subtle labels, step counters, muted icons, dark-mode body |
| `bg-neutral-950`   | Dark CTA section background                               |
| `bg-neutral-50`    | Alternating section backgrounds, code blocks, card insets |
| `bg-white`         | Cards, badges, header, footer                             |

---

## 3. Typography

### Font Families

| Token          | Font         | CSS Variable     | Usage                         |
| -------------- | ------------ | ---------------- | ----------------------------- |
| `font-heading` | Cal Sans     | `--font-heading` | All headings (h1-h4)          |
| `font-sans`    | Inter/system | `--font-sans`    | Body text, UI labels, buttons |

### Heading Sizes

| Context            | Classes                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Page title (h1)    | `font-heading text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl lg:text-6xl` |
| Section title (h2) | `font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl`             |
| Subsection (h3)    | `text-base font-semibold text-neutral-900`                                                |
| Footer column (h4) | `text-sm font-semibold text-neutral-900`                                                  |

### Body Text Sizes

| Context                          | Classes                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| Section description              | `text-lg leading-7 text-neutral-500`                            |
| Section description (responsive) | `text-lg leading-7 text-neutral-500 md:text-xl md:leading-8`    |
| Card body                        | `text-sm leading-relaxed text-neutral-500`                      |
| Caption/metadata                 | `text-xs font-medium text-neutral-400`                          |
| Step label                       | `text-xs font-medium uppercase tracking-wider text-neutral-400` |
| Footer links                     | `text-sm text-neutral-500`                                      |

### Rules

- **Always** use `tracking-tight` on headings.
- **Always** use `leading-7` on `text-lg` body text, `leading-relaxed` on `text-sm` body text.
- **Never** use more than 2 font weights in a single component (typically `font-bold` + `font-medium`, or `font-semibold` + regular).
- **Never** use `font-heading` for body text or UI elements (buttons, labels, nav items).
- Paragraph max-width: `max-w-[480px]` to `max-w-[540px]` for centered descriptions, `max-w-[520px]` for left-aligned.

---

## 4. Layout & Spacing

### Container

```
mx-auto max-w-content px-6
```

- `max-w-content` = `1080px` (defined in `styles/globals.css` via `@theme { --max-width-content }`)
- `px-6` = 24px horizontal padding on all breakpoints
- This pattern is used in every section. Do not deviate.

### Section Padding

```
py-20 md:py-28
```

- Every content section uses this exact vertical padding.
- The hero section uses `py-20 md:pt-28` (no bottom padding increase, since tool follows).

### Section Separation

Sections are separated by `border-t border-border` at the top of each `<section>`. This creates a clean horizontal rule between content blocks.

```tsx
<section className='border-t border-border'>
```

Exception: the hero section has no top border (it's the first section). The CTA section uses a curved visual transition instead of a border.

### The "Bordered Container" Pattern

Borrowed from dub.co. For hero-like sections, wrap content in `border-x border-border` (or use the `section-border` utility class) to create vertical column lines:

```tsx
<section className='dot-grid'>
    <div className='mx-auto max-w-content px-6 ...'>
```

Currently used on the hero. Use sparingly for visual emphasis.

### Grid Patterns

| Layout              | Classes                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| 3-column features   | `grid gap-4 sm:grid-cols-2 md:grid-cols-3`                                                                    |
| 3-column divided    | `grid gap-0 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 rounded-2xl border border-border` |
| 2-column split      | `grid gap-12 lg:grid-cols-2 lg:place-items-center`                                                            |
| 2-column asymmetric | `flex flex-col gap-16 md:flex-row` with `md:w-5/12` and `md:w-7/12`                                           |
| FAQ layout          | `flex flex-col gap-12 md:flex-row` with `md:w-1/3` and `md:w-2/3`                                             |
| Footer links        | `grid grid-cols-2 gap-8 sm:grid-cols-3`                                                                       |

### Responsive Breakpoints

Follow Tailwind defaults. The project primarily uses:

- `sm:` (640px) -- grid column adjustments
- `md:` (768px) -- layout shifts (stack to row), text size bumps
- `lg:` (1024px) -- rarely, for 2-column grids and hero text `lg:text-6xl`

Always design mobile-first. The base (no prefix) styles define the mobile layout.

---

## 5. Component Patterns

### Buttons

Use the shadcn `<Button>` component. Always add `rounded-lg` for consistency.

| Variant         | Usage                                                    |
| --------------- | -------------------------------------------------------- |
| `default`       | Primary CTA -- `bg-primary text-primary-foreground`      |
| `outline-solid` | Secondary actions -- `border border-input bg-background` |
| `ghost`         | Tertiary/subtle actions (e.g., "Show preview" toggle)    |
| `link`          | Inline text links                                        |

```tsx
<Button asChild className='rounded-lg px-5 py-2.5'>
    <Link href={Routes.Tool}>Get Started</Link>
</Button>

<Button variant='outline' asChild className='rounded-lg border-border bg-white px-5 py-2.5'>
    <Link href={Routes.AllFeatures}>Learn More</Link>
</Button>
```

In dark sections, invert the palette:

```tsx
{/* Primary button in dark section */}
<Button className='rounded-lg bg-white px-5 py-2.5 text-neutral-900 hover:bg-neutral-100'>

{/* Secondary button in dark section */}
<Button variant='outline' className='rounded-lg border-neutral-700 bg-neutral-800 px-5 py-2.5 text-white hover:bg-neutral-700 hover:text-white'>
```

### Cards

Standard card:

```tsx
<div className='rounded-xl border border-border bg-white p-6 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated'>
```

Card with icon:

```tsx
<Icon className='mb-4 size-8 rounded-lg bg-primary/10 p-1.5 text-primary' />
<h3 className='mb-2 text-base font-semibold text-neutral-900'>Title</h3>
<p className='text-sm leading-relaxed text-neutral-500'>Description</p>
```

### Badges / Chips

```tsx
<span className='border-border text-primary shadow-subtle inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium'>
    Completely Free
</span>
```

For neutral badges:

```tsx
<span className='border-border shadow-subtle inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900'>
    <Icons.github className='size-3.5' />
    View Source
</span>
```

### Icon Containers

Square icon badge (used for section introductions like open-source, embed):

```tsx
<div className='border-border shadow-subtle mb-6 flex size-12 items-center justify-center rounded-xl border bg-white'>
    <Icons.github className='size-6' />
</div>
```

### Links

Footer/nav links:

```tsx
<Link className='text-sm text-neutral-500 transition-colors hover:text-neutral-900' href={...}>
```

Social links:

```tsx
<Link className='text-neutral-500 transition-colors hover:text-neutral-900' href={...}>
```

---

## 6. Shadows

Defined in `styles/globals.css` via `@theme { --shadow-* }`. Always use these tokens, never raw `shadow-xs` / `shadow-md` / `shadow-lg`.

| Token              | Value                                                              | Usage                                           |
| ------------------ | ------------------------------------------------------------------ | ----------------------------------------------- |
| `shadow-subtle`    | `0 1px 2px rgba(0,0,0,0.05)`                                       | Cards at rest, badges, icon containers          |
| `shadow-elevated`  | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)`   | Cards on hover, embed previews, elevated panels |
| `shadow-prominent` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Modals, important floating elements             |
| `shadow-hero`      | `0 20px 20px rgba(0,0,0,0.09)`                                     | Hero showcase panel (e.g., video wrapper)       |

### Hover Shadow Pattern

Cards use a subtle lift on hover:

```
shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated
```

Or for more subtle hover without lift:

```
shadow-subtle transition-shadow hover:shadow-elevated
```

---

## 7. Animations

### AnimateIn Component

Import from `@/components/ui/animate-in`. Uses `framer-motion` (motion.dev v12) with `useInView`.

```tsx
import { AnimateIn, StaggerChildren, StaggerItem } from '@/components/ui/animate-in'
```

#### Variants

| `from` prop | Motion                  | Best for                            |
| ----------- | ----------------------- | ----------------------------------- |
| `bottom`    | Fade up 24px (default)  | Most content: headings, cards       |
| `left`      | Fade in from left 24px  | Left column in split layouts        |
| `right`     | Fade in from right 24px | Right column in split layouts       |
| `fade`      | Opacity only            | Subtle reveals, background elements |

#### Props

| Prop        | Type    | Default    | Notes                                |
| ----------- | ------- | ---------- | ------------------------------------ |
| `from`      | string  | `'bottom'` | Direction of entrance                |
| `delay`     | number  | `0`        | Seconds before animation starts      |
| `duration`  | number  | `0.5`      | Animation duration in seconds        |
| `once`      | boolean | `true`     | Only animate once on first scroll-in |
| `className` | string  | -          | Passed through to wrapper div        |

#### Stagger Pattern

For grids and lists, wrap items in `StaggerChildren` / `StaggerItem`:

```tsx
<StaggerChildren className='grid gap-4 sm:grid-cols-2 md:grid-cols-3'>
    {items.map((item) => (
        <StaggerItem key={item.title}>
            <div>...</div>
        </StaggerItem>
    ))}
</StaggerChildren>
```

Default `staggerDelay` is `0.08s` between children. `StaggerItem` animates up 16px with fade.

#### Sequential Delays

For hero-style sequences where elements appear one after another:

```tsx
<AnimateIn delay={0}>    {/* Badge */}
<AnimateIn delay={0.1}>  {/* Heading */}
<AnimateIn delay={0.2}>  {/* Description */}
<AnimateIn delay={0.3}>  {/* Social proof */}
<AnimateIn delay={0.4}>  {/* CTA buttons */}
```

Increment by `0.1s`. Never exceed `0.4s` total delay for a section.

### Easing

All animations use the custom ease `[0.16, 1, 0.3, 1]` -- a smooth deceleration curve. This is built into AnimateIn. Do not override it.

### Animation DOs

- Use `AnimateIn` for all scroll-triggered reveals.
- Use `StaggerChildren` for grids/lists of 3+ items.
- Use `from='left'` / `from='right'` in two-column split layouts to have content enter from its respective side.
- Keep animations snappy: 0.4-0.5s duration.
- Let `once: true` (default) keep things performant.

### Animation DON'Ts

- Do NOT animate every element. Animate the major content blocks (heading group, card grid, media), not every paragraph or icon individually.
- Do NOT use delays longer than 0.4s in sequential groups.
- Do NOT combine AnimateIn with CSS animation classes (like `animate-fade-up`). Pick one system.
- Do NOT animate navigation, footer, or other persistent UI.
- Do NOT use spring/bounce physics. The design is calm, not playful.
- Do NOT animate on route changes. Only on scroll-into-view.

---

## 8. Patterns & Backgrounds

### Dot Grid

```tsx
<section className='dot-grid'>
```

Defined in `globals.css`:

```css
.dot-grid {
    background-image: radial-gradient(circle, #d4d4d4 1px, transparent 1px);
    background-size: 24px 24px;
}
```

**Use for:** Hero section, media showcase wrappers (e.g., the video container in how-to-use).
**Do not use for:** Every section. Reserve for 1-2 high-impact areas per page.

### Alternating Section Backgrounds

Alternate between `bg-background` (default) and `bg-neutral-50` to create visual rhythm:

```
Hero         → dot-grid (no bg class needed)
Section A    → (default background)
Section B    → bg-neutral-50
Section C    → (default background)
Section D    → bg-neutral-50
...
CTA          → bg-neutral-950
```

### Dark CTA Section

The dark section uses a curved transition from light to dark:

```tsx
{/* Curved white-to-dark transition */}
<div className='relative h-16 bg-background'>
    <div
        className='absolute inset-x-0 bottom-0 h-16 bg-neutral-950'
        style={{
            borderTopLeftRadius: '50% 100%',
            borderTopRightRadius: '50% 100%',
        }}
    />
</div>

<div className='relative bg-neutral-950 py-20'>
    {/* Gradient accent blobs */}
    <div className='absolute left-0 top-0 size-64 rounded-full bg-primary/20 blur-[120px]' />
    <div className='absolute right-0 top-12 size-64 rounded-full bg-blue-400/10 blur-[120px]' />

    <div className='relative mx-auto max-w-content px-6 text-center'>
        {/* Dark section content */}
    </div>
</div>
```

Gradient blobs provide a subtle ambient glow. Keep them large (`size-64`), heavily blurred (`blur-[120px]`), and low opacity (`/10` to `/20`).

### Section Border Utility

```css
.section-border {
    @apply border-border border-x;
}
```

Adds vertical border lines on the left/right edges, creating a column effect like dub.co.

---

## 9. General DOs and DON'Ts

### DOs

- **Use design tokens.** `shadow-subtle` not `shadow-xs`. `border-border` not `border-gray-200`. `text-neutral-500` not `text-gray-500`.
- **Use `neutral-*` not `gray-*`.** The entire neutral scale uses Tailwind's `neutral` palette.
- **Use `border-border` for all borders.** This maps to the `--border` CSS variable and stays consistent.
- **Keep sections focused.** One message per section. One heading, one short description, one visual or grid.
- **Left-align section headings** in split layouts. Center-align only when the section itself is centered (e.g., features grid, open-source, embed).
- **Use AnimateIn for scroll reveals.** Every major content block should animate in on scroll.
- **Use `rounded-lg` on buttons, `rounded-xl` on cards, `rounded-2xl` on large containers.**
- **Use `transition-colors` on links and `transition-all duration-200` on cards.**
- **Cap description paragraph widths** at `max-w-[480px]` to `max-w-[540px]`.
- **Use the icon container pattern** (`size-12 rounded-xl border border-border bg-white shadow-subtle`) to introduce centered sections.

### DON'Ts

- **Don't use raw hex colors.** Always use CSS variable-based Tailwind classes (`text-primary`, `bg-background`, etc.). The one exception is `#d4d4d4` inside the dot-grid CSS pattern.
- **Don't use more than 2 font weights per component.** Typical combos: `font-bold` + `font-medium`, or `font-semibold` + normal weight.
- **Don't skip heading hierarchy.** h1 -> h2 -> h3. Never jump from h1 to h3 on a page.
- **Don't mix border-radius inconsistently.** Follow the scale: `rounded-lg` (buttons, small elements), `rounded-xl` (cards), `rounded-2xl` (large wrappers), `rounded-full` (badges, pills).
- **Don't add decorations that don't serve a purpose.** No random gradients, no colored backgrounds, no ornamental dividers.
- **Don't use colored backgrounds for sections.** Use `bg-neutral-50` for alternating, `bg-neutral-950` for dark CTA, and patterns (dot-grid) for emphasis. Never `bg-blue-50` or similar.
- **Don't use Tailwind's default shadow scale** (`shadow-xs`, `shadow-md`, `shadow-lg`). Use the custom tokens.
- **Don't put heavy animation on mobile.** AnimateIn is fine (it's lightweight), but avoid complex motion sequences or parallax.
- **Don't use `font-heading` (Cal Sans) on anything other than h1-h4 elements.**
- **Don't use colored text for body copy.** Body text is always `text-neutral-500` or `text-neutral-600`.
