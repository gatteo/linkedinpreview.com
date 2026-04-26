# Page Template Guide

> How to create a new page in the linkedinpreview.com project.
> Follow this guide to ensure every page matches the design system.

---

## File Structure

Pages live under `app/(main)/` using the Next.js App Router convention. The `(main)` route group wraps pages in the shared layout with header, footer, toaster, and feedback widget.

```
app/
  (main)/
    layout.tsx          ← shared layout (Header + Footer + Toaster)
    page.tsx            ← homepage
    blog/
      page.tsx          ← blog listing
      [slug]/
        page.tsx        ← individual blog post
    your-new-page/
      page.tsx          ← your new page goes here
```

### Creating a new page

1. Create the directory under `app/(main)/`:

    ```
    app/(main)/pricing/page.tsx
    ```

2. The page automatically inherits the `(main)` layout which provides:

    - `<Header />` -- fixed header with 60px height
    - `<main className='pt-[60px]'>` -- content offset for fixed header
    - `<Footer />`
    - `<Toaster />`
    - `<FeedbackFab />`

3. Your page component only needs to render sections:

```tsx
import { SectionOne } from '@/components/pricing/section-one'
import { SectionTwo } from '@/components/pricing/section-two'

// etc.

export default function PricingPage() {
    return (
        <>
            <SectionOne />
            <SectionTwo />
            {/* More sections */}
        </>
    )
}
```

---

## Layout Integration

The main layout (`app/(main)/layout.tsx`) handles all chrome. You do not need to:

- Import or render `<Header />` or `<Footer />`
- Add `pt-[60px]` (the layout's `<main>` already has this)
- Set up toast providers

Your page component receives the full viewport width. Each section inside your page is responsible for its own max-width constraint (`mx-auto max-w-content px-6`).

---

## Section Ordering Best Practices

### Typical page structure

```
1. Hero / page header     ← dot-grid or plain, establishes the page topic
2. Primary content         ← the main value of the page (tool, features, pricing table)
3. Supporting sections     ← 2-4 sections that build trust and provide detail
4. FAQ (if applicable)     ← address objections
5. CTA section             ← dark bg, final conversion push
```

### Rules for section ordering

- **Start with the hero or page header.** Every page needs a clear above-the-fold message.
- **Alternate section backgrounds** for visual rhythm: default bg -> `bg-neutral-50` -> default bg -> `bg-neutral-50` -> etc.
- **Separate every section** with `border-t border-border` on the `<section>` element. The first section (hero) does not have a top border.
- **End with the dark CTA section** if the page is marketing/conversion-focused. The CTA section uses a curved transition and has no `border-t`.
- **Place FAQ before the final CTA.** It answers last-minute objections right before the conversion prompt.
- **Limit to 6-10 sections per page.** If you need more, the page likely needs to be split.

### Section background cheat sheet

| Section position      | Background                |
| --------------------- | ------------------------- |
| Hero                  | `dot-grid` or default     |
| Odd content sections  | default (`bg-background`) |
| Even content sections | `bg-neutral-50`           |
| Final CTA             | `bg-neutral-950`          |
| Footer                | `bg-white` (in layout)    |

---

## Mobile-First Responsive Approach

All styles are written mobile-first. Base classes define the mobile layout; breakpoint prefixes enhance for larger screens.

### Breakpoint usage

| Prefix | Width  | Common usage                                          |
| ------ | ------ | ----------------------------------------------------- |
| (base) | 0+     | Single column, smaller text, stacked layouts          |
| `sm:`  | 640px  | Grid cols (2-col), badge side-by-side                 |
| `md:`  | 768px  | Row layouts (flex-row), larger text, show desktop nav |
| `lg:`  | 1024px | 2-col grids for large split layouts, hero `text-6xl`  |

### Common responsive patterns

**Text scaling:**

```tsx
className = 'text-4xl md:text-5xl lg:text-6xl' // h1
className = 'text-3xl sm:text-4xl' // h2
className = 'text-lg md:text-xl' // hero description
```

**Layout stacking:**

```tsx
// Stacked on mobile, side-by-side on tablet+
className = 'flex flex-col gap-12 md:flex-row'

// 1 col on mobile, 2 on sm, 3 on md
className = 'grid gap-4 sm:grid-cols-2 md:grid-cols-3'
```

**Show/hide:**

```tsx
// Desktop nav buttons, hidden on mobile
className = 'hidden md:flex'

// Mobile nav toggle, hidden on desktop
className = 'md:hidden'
```

**Section padding:**

```tsx
// Vertical padding increases on md
className = 'py-20 md:py-28'
```

### Mobile considerations

- Buttons should be full-width or at least large-tappable on mobile.
- Reduce grid columns: 3-col desktop -> 2-col tablet -> 1-col mobile.
- Hero text: `text-4xl` mobile -> `text-5xl` md -> `text-6xl` lg.
- Paragraph max-widths (`max-w-[540px]`) naturally constrain on desktop while allowing full width on mobile.

---

## Animation Integration

### Adding scroll animations to a new page

1. **Import AnimateIn components:**

    ```tsx
    import { AnimateIn, StaggerChildren, StaggerItem } from '@/components/ui/animate-in'
    ```

2. **Wrap section headers:**

    ```tsx
    <AnimateIn>
        <h2>...</h2>
        <p>...</p>
    </AnimateIn>
    ```

3. **Wrap content grids in StaggerChildren:**

    ```tsx
    <StaggerChildren className='grid ...'>
        {items.map((item) => (
            <StaggerItem key={item.id}>
                <Card />
            </StaggerItem>
        ))}
    </StaggerChildren>
    ```

4. **Use directional animations for split layouts:**

    ```tsx
    <AnimateIn from='left' className='md:w-5/12'>
        {/* Left column content */}
    </AnimateIn>
    <AnimateIn from='right' className='md:w-7/12'>
        {/* Right column content */}
    </AnimateIn>
    ```

5. **Use sequential delays only for hero/above-the-fold content:**
    ```tsx
    <AnimateIn delay={0}>    {/* First element */}
    <AnimateIn delay={0.1}>  {/* Second element */}
    <AnimateIn delay={0.2}>  {/* Third element */}
    ```

### What to animate

- Section headings and descriptions (wrap together in one `AnimateIn`)
- Card grids (`StaggerChildren`)
- Split layout columns (`from='left'` / `from='right'`)
- Hero elements (sequential delays)
- Media embeds and showcases

### What NOT to animate

- Header and footer (persistent UI)
- Individual paragraphs within a section
- Icons within cards (the card itself animates)
- Navigation elements
- Form inputs and controls

---

## Complete Page Example

Here is a full example of a new page with proper structure, animations, and responsive design.

```tsx
// app/(main)/pricing/page.tsx

import { CtaSection } from '@/components/home/cta-section' // reuse existing CTA

import { PricingFaq } from '@/components/pricing/pricing-faq'
import { PricingHero } from '@/components/pricing/pricing-hero'
import { PricingTable } from '@/components/pricing/pricing-table'

export default function PricingPage() {
    return (
        <>
            <PricingHero />
            <PricingTable />
            <PricingFaq />
            <CtaSection />
        </>
    )
}
```

```tsx
// components/pricing/pricing-hero.tsx

import { AnimateIn } from '@/components/ui/animate-in'

export function PricingHero() {
    return (
        <section className='dot-grid'>
            <div className='max-w-content mx-auto flex flex-col items-center px-6 py-20 md:pt-28'>
                <AnimateIn delay={0}>
                    <span className='border-border text-primary shadow-subtle mb-6 inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium'>
                        Pricing
                    </span>
                </AnimateIn>

                <AnimateIn delay={0.1}>
                    <h1 className='font-heading mb-5 text-center text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl lg:text-6xl'>
                        Simple, transparent pricing
                    </h1>
                </AnimateIn>

                <AnimateIn delay={0.2}>
                    <p className='mx-auto max-w-[540px] text-center text-lg leading-7 text-neutral-500 md:text-xl md:leading-8'>
                        No hidden fees. No credit card required. Start free and upgrade when you need more.
                    </p>
                </AnimateIn>
            </div>
        </section>
    )
}
```

```tsx
// components/pricing/pricing-table.tsx

import { StaggerChildren, StaggerItem } from '@/components/ui/animate-in'
import { Button } from '@/components/ui/button'

const plans = [
    { name: 'Free', price: '$0', features: ['Feature A', 'Feature B'] },
    { name: 'Pro', price: '$19', features: ['Everything in Free', 'Feature C', 'Feature D'] },
    { name: 'Team', price: '$49', features: ['Everything in Pro', 'Feature E', 'Feature F'] },
]

export function PricingTable() {
    return (
        <section className='border-border border-t'>
            <div className='max-w-content mx-auto px-6 py-20 md:py-28'>
                <StaggerChildren className='grid gap-4 sm:grid-cols-2 md:grid-cols-3'>
                    {plans.map((plan) => (
                        <StaggerItem key={plan.name}>
                            <div className='border-border shadow-subtle rounded-xl border bg-white p-6'>
                                <h3 className='mb-1 text-base font-semibold text-neutral-900'>{plan.name}</h3>
                                <div className='font-heading mb-4 text-3xl font-bold tracking-tight text-neutral-900'>
                                    {plan.price}
                                    <span className='text-base font-normal text-neutral-500'>/mo</span>
                                </div>
                                <ul className='mb-6 space-y-2'>
                                    {plan.features.map((f) => (
                                        <li key={f} className='text-sm text-neutral-500'>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild className='w-full rounded-lg'>
                                    <a href='#'>Get started</a>
                                </Button>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerChildren>
            </div>
        </section>
    )
}
```

---

## Checklist for New Pages

Before shipping a new page, verify:

- [ ] Page file is under `app/(main)/` (not `app/` root) so it gets the shared layout
- [ ] Every section uses `mx-auto max-w-content px-6` for width constraint
- [ ] Every section uses `py-20 md:py-28` for vertical padding
- [ ] Sections are separated by `border-t border-border`
- [ ] Section backgrounds alternate (`bg-background` / `bg-neutral-50`)
- [ ] Headings use `font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl`
- [ ] Body text uses `text-neutral-500` (not gray, not neutral-600)
- [ ] Primary color is used sparingly (buttons, icons, 1 accent word max per heading)
- [ ] Cards use `rounded-xl border border-border bg-white shadow-subtle`
- [ ] Shadows use custom tokens (`shadow-subtle`, `shadow-elevated`) not Tailwind defaults
- [ ] All major content blocks have `AnimateIn` or `StaggerChildren` scroll animations
- [ ] Hero/above-the-fold uses sequential `AnimateIn` delays (0, 0.1, 0.2, 0.3, 0.4)
- [ ] Layout is mobile-first with proper `md:` / `sm:` breakpoint handling
- [ ] No raw hex colors (use CSS variable classes)
- [ ] No `font-heading` on non-heading elements
- [ ] Buttons have `rounded-lg`
- [ ] Page ends with dark CTA or appropriate closing section
