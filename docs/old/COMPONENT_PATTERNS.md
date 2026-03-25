# Component Patterns

> Reusable component recipes with code snippets.
> Copy these patterns when building new sections or pages.

---

## Section Wrapper

Every content section follows the same structural pattern. The `<section>` tag defines the background and border; the inner `<div>` constrains the width and provides padding.

```tsx
<section className='border-border border-t'>
    <div className='max-w-content mx-auto px-6 py-20 md:py-28'>{/* Section content */}</div>
</section>
```

**Alternating background variant:**

```tsx
<section className='border-border border-t bg-neutral-50'>
    <div className='max-w-content mx-auto px-6 py-20 md:py-28'>{/* Section content */}</div>
</section>
```

**With dot-grid background (hero-style):**

```tsx
<section className='dot-grid'>
    <div className='max-w-content mx-auto px-6 py-20 md:pt-28'>{/* Section content */}</div>
</section>
```

---

## Section Header -- Centered

Used above grids or centered content blocks (features, open-source, embed).

```tsx
import { AnimateIn } from '@/components/ui/animate-in'

;<AnimateIn className='mx-auto mb-16 max-w-2xl text-center'>
    <h2 className='font-heading mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
        Section title here
    </h2>
    <p className='text-lg leading-7 text-neutral-500'>
        A brief description of what this section covers. Keep it to 1-2 sentences.
    </p>
</AnimateIn>
```

**With icon introduction** (for standalone/CTA-style centered sections):

```tsx
<div className='flex flex-col items-center text-center'>
    <div className='border-border shadow-subtle mb-6 flex size-12 items-center justify-center rounded-xl border bg-white'>
        <SomeIcon className='size-6 text-neutral-600' />
    </div>
    <h2 className='font-heading mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
        Section title here
    </h2>
    <p className='mx-auto mb-8 max-w-[520px] text-lg leading-7 text-neutral-500'>Description text.</p>
    {/* CTA or content below */}
</div>
```

---

## Section Header -- Left-Aligned (Split Layout)

Used in two-column sections where heading sits on the left and content on the right (FAQ, how-to-use).

```tsx
<div className='flex flex-col gap-12 md:flex-row'>
    {/* Left heading */}
    <div className='md:w-1/3'>
        <h2 className='font-heading mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
            Section title here
        </h2>
        <p className='text-lg leading-7 text-neutral-500'>Brief description.</p>
    </div>

    {/* Right content */}
    <div className='md:w-2/3'>{/* Accordion, grid, or other content */}</div>
</div>
```

---

## Feature Card

Standard card used in feature grids. Wraps in `StaggerChildren` / `StaggerItem` for animation.

```tsx
import { StaggerChildren, StaggerItem } from '@/components/ui/animate-in'
import { Icon, Icons } from '@/components/icon'

;<StaggerChildren className='grid gap-4 sm:grid-cols-2 md:grid-cols-3'>
    {features.map((feature) => (
        <StaggerItem key={feature.title}>
            <div className='border-border shadow-subtle hover:shadow-elevated rounded-xl border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5'>
                <Icon
                    name={feature.icon as keyof typeof Icons}
                    className='bg-primary/10 text-primary mb-4 size-8 rounded-lg p-1.5'
                    aria-hidden='true'
                />
                <h3 className='mb-2 text-base font-semibold text-neutral-900'>{feature.title}</h3>
                <p className='text-sm leading-relaxed text-neutral-500'>{feature.body}</p>
            </div>
        </StaggerItem>
    ))}
</StaggerChildren>
```

---

## Feature Card -- Divided Row

Three features in a single bordered container with dividers between them. No hover lift.

```tsx
<StaggerChildren className='divide-border border-border shadow-subtle grid gap-0 divide-y overflow-hidden rounded-2xl border bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
    {features.map((feature) => (
        <StaggerItem key={feature.title}>
            <div className='group relative p-8 transition-colors hover:bg-neutral-50/50'>
                <Icon
                    name={feature.icon as keyof typeof Icons}
                    className='text-primary mb-4 size-8'
                    aria-hidden='true'
                />
                <h3 className='mb-2 text-base font-semibold text-neutral-900'>{feature.title}</h3>
                <p className='text-sm leading-relaxed text-neutral-500'>{feature.body}</p>
            </div>
        </StaggerItem>
    ))}
</StaggerChildren>
```

---

## Reason / Benefit Card (Horizontal Layout)

Card with icon on the left and text on the right, used for benefits/reasons lists.

```tsx
<StaggerChildren className='flex flex-col gap-4'>
    {reasons.map(({ icon, title, description }) => (
        <StaggerItem key={title}>
            <div className='border-border shadow-subtle hover:shadow-elevated rounded-xl border bg-white p-6 transition-shadow'>
                <div className='flex items-start gap-4'>
                    <div className='bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg'>
                        {icon} {/* e.g., <Icons.checkCircle className='size-5 text-primary' /> */}
                    </div>
                    <div>
                        <h3 className='mb-1 text-base font-semibold text-neutral-900'>{title}</h3>
                        <p className='text-sm leading-relaxed text-neutral-500'>{description}</p>
                    </div>
                </div>
            </div>
        </StaggerItem>
    ))}
</StaggerChildren>
```

---

## Hero Section

The top-of-page hero with badge, heading, description, social proof, and CTA.

```tsx
import { AnimateIn } from '@/components/ui/animate-in'

;<section className='dot-grid'>
    <div className='max-w-content mx-auto flex flex-col items-center px-6 py-20 md:pt-28'>
        {/* Announcement badge */}
        <AnimateIn delay={0}>
            <span className='border-border text-primary shadow-subtle inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium'>
                Badge Text
            </span>
        </AnimateIn>

        {/* Headline */}
        <AnimateIn delay={0.1}>
            <h1 className='font-heading mb-5 text-center text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl lg:text-6xl'>
                Main headline with <span className='text-primary'>accent</span> word
            </h1>
        </AnimateIn>

        {/* Description */}
        <AnimateIn delay={0.2}>
            <p className='mx-auto mb-8 max-w-[540px] text-center text-lg leading-7 text-neutral-500 md:text-xl md:leading-8'>
                A concise description of what the product does.
            </p>
        </AnimateIn>

        {/* Social proof (optional) */}
        <AnimateIn delay={0.3}>
            <div className='mb-8 flex items-center gap-1'>
                <span className='pr-2 text-sm font-medium text-neutral-500'>4.9/5</span>
                {/* Star icons */}
                <span className='pl-2 text-sm font-medium text-neutral-500'>from X reviews</span>
            </div>
        </AnimateIn>

        {/* CTA buttons */}
        <AnimateIn delay={0.4}>
            <div className='flex items-center gap-3'>
                <Button asChild className='rounded-lg px-5 py-2.5'>
                    <Link href='/tool'>Primary CTA</Link>
                </Button>
                <Button variant='outline' asChild className='border-border rounded-lg bg-white px-5 py-2.5'>
                    <Link href='#features'>Secondary CTA</Link>
                </Button>
            </div>
        </AnimateIn>
    </div>
</section>
```

---

## CTA Section -- Dark

Full-width dark section with curved top transition, gradient blobs, and inverted colors.

```tsx
<section className='relative overflow-hidden'>
    {/* Curved white-to-dark transition */}
    <div className='bg-background relative h-16'>
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
        <div className='bg-primary/20 absolute top-0 left-0 size-64 rounded-full blur-[120px]' />
        <div className='absolute top-12 right-0 size-64 rounded-full bg-blue-400/10 blur-[120px]' />

        <div className='max-w-content relative mx-auto px-6 text-center'>
            <h2 className='font-heading mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl'>
                Compelling headline
            </h2>
            <p className='mx-auto mb-8 max-w-[480px] text-lg leading-7 text-neutral-400'>
                Supporting text for the call to action.
            </p>

            <div className='flex items-center justify-center gap-3'>
                <Button asChild className='rounded-lg bg-white px-5 py-2.5 text-neutral-900 hover:bg-neutral-100'>
                    <Link href='/tool'>Primary CTA</Link>
                </Button>
                <Button
                    asChild
                    variant='outline'
                    className='rounded-lg border-neutral-700 bg-neutral-800 px-5 py-2.5 text-white hover:bg-neutral-700 hover:text-white'>
                    <Link href='/blog'>Secondary CTA</Link>
                </Button>
            </div>
        </div>
    </div>
</section>
```

---

## CTA Section -- Light (Centered)

For lighter CTA blocks (e.g., open-source, embed) that stay on white/neutral-50 backgrounds.

```tsx
<section className='border-border border-t bg-neutral-50'>
    <div className='max-w-content mx-auto px-6 py-20 md:py-28'>
        <div className='flex flex-col items-center text-center'>
            <div className='border-border shadow-subtle mb-6 flex size-12 items-center justify-center rounded-xl border bg-white'>
                <SomeIcon className='size-6' />
            </div>
            <h2 className='font-heading mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
                Call to action heading
            </h2>
            <p className='mx-auto mb-8 max-w-[520px] text-lg leading-7 text-neutral-500'>Supporting description.</p>
            <Button asChild className='rounded-lg'>
                <Link href='/destination'>Action Label</Link>
            </Button>
        </div>
    </div>
</section>
```

---

## Badge / Chip

Pill-shaped badge used near headings for labels or announcements.

**Accent badge (primary text):**

```tsx
<span className='border-border text-primary shadow-subtle inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium'>
    Label Text
</span>
```

**Neutral badge (with icon):**

```tsx
<span className='border-border shadow-subtle inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900'>
    <SomeIcon className='size-3.5' />
    Label Text
</span>
```

**Announcement badge (dub.co-style compound badge):**

```tsx
<a
    href='#'
    className='border-border mb-6 flex items-center gap-2 rounded-full border bg-white px-1 py-1 pl-4 text-sm text-neutral-600 transition-colors hover:border-neutral-300'>
    <span>Announcement text</span>
    <span className='border-border flex items-center gap-1 rounded-full border bg-white px-3 py-0.5 text-sm font-medium text-neutral-800'>
        Read more <ArrowUpRight className='h-3 w-3' />
    </span>
</a>
```

---

## FAQ / Accordion

Uses shadcn `Accordion` in a two-column layout with heading on the left.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

;<section className='border-border border-t'>
    <div className='max-w-content mx-auto px-6 py-20 md:py-28'>
        <div className='flex flex-col gap-12 md:flex-row'>
            {/* Left heading */}
            <div className='md:w-1/3'>
                <h2 className='font-heading mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
                    Frequently asked questions
                </h2>
                <p className='text-lg leading-7 text-neutral-500'>Brief intro text.</p>
            </div>

            {/* Right accordion */}
            <div className='md:w-2/3'>
                <Accordion type='multiple'>
                    {faqs.map((faq) => (
                        <AccordionItem key={faq.question} value={faq.question} className='border-border'>
                            <AccordionTrigger className='gap-4 text-start text-base font-medium text-neutral-900 hover:no-underline'>
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className='text-sm leading-relaxed text-neutral-500'>
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    </div>
</section>
```

---

## Stat / Metric Display

For displaying key numbers or social proof. Uses the rating pattern from the hero.

**Inline star rating:**

```tsx
<div className='flex items-center gap-1'>
    <span className='pr-2 text-sm font-medium text-neutral-500'>4.9/5</span>
    <Icons.star className='size-4 fill-amber-400 text-amber-400' />
    <Icons.star className='size-4 fill-amber-400 text-amber-400' />
    <Icons.star className='size-4 fill-amber-400 text-amber-400' />
    <Icons.star className='size-4 fill-amber-400 text-amber-400' />
    <Icons.star className='size-4 fill-amber-400 text-amber-400' />
    <span className='pl-2 text-sm font-medium text-neutral-500'>from 3,342 reviews</span>
</div>
```

**Stat grid pattern** (for a row of key metrics):

```tsx
<div className='grid grid-cols-2 gap-8 sm:grid-cols-4'>
    {stats.map((stat) => (
        <div key={stat.label} className='text-center'>
            <div className='font-heading text-3xl font-bold tracking-tight text-neutral-900'>{stat.value}</div>
            <div className='mt-1 text-sm text-neutral-500'>{stat.label}</div>
        </div>
    ))}
</div>
```

---

## Social Proof / Testimonial

**Testimonial card:**

```tsx
<div className='border-border shadow-subtle rounded-xl border bg-white p-6'>
    <p className='mb-4 text-sm leading-relaxed text-neutral-600'>&ldquo;Testimonial quote text goes here.&rdquo;</p>
    <div className='flex items-center gap-3'>
        <div className='size-10 rounded-full bg-neutral-100' /> {/* Avatar placeholder */}
        <div>
            <div className='text-sm font-semibold text-neutral-900'>Name</div>
            <div className='text-xs text-neutral-500'>Title, Company</div>
        </div>
    </div>
</div>
```

**Logo row (trust strip):**

```tsx
<div className='flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale'>
    {logos.map((logo) => (
        <img key={logo.alt} src={logo.src} alt={logo.alt} className='h-6' />
    ))}
</div>
```

---

## Timeline / Steps

Vertical timeline with left border, used in the how-to-use section.

```tsx
<div className='border-border relative border-l pl-8'>
    {steps.map((step, index) => (
        <div key={step.title} className='relative pb-10 last:pb-0'>
            {/* Circle indicator */}
            <div
                className='border-primary absolute flex size-[10px] items-center justify-center rounded-full border-2 bg-white'
                style={{ left: 'calc(-2rem - 5px)' }}
            />
            <span className='mb-1 block text-xs font-medium tracking-wider text-neutral-400 uppercase'>
                Step {index + 1}
            </span>
            <h3 className='mb-1 text-base font-semibold text-neutral-900'>{step.title}</h3>
            <p className='text-sm leading-relaxed text-neutral-500'>{step.description}</p>
        </div>
    ))}
</div>
```

---

## Two-Column Split with Media

Left text + right media, used for showcasing a feature or the tool itself.

```tsx
import { AnimateIn } from '@/components/ui/animate-in'

;<div className='flex flex-col gap-16 md:flex-row'>
    {/* Left text */}
    <AnimateIn from='left' className='md:w-5/12'>
        <h2 className='font-heading mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
            Section heading
        </h2>
        <p className='mb-10 text-lg leading-7 text-neutral-500'>Description paragraph.</p>
        {/* Optional: timeline, list, or CTA */}
    </AnimateIn>

    {/* Right media */}
    <AnimateIn from='right' className='flex items-center md:w-7/12'>
        <div className='dot-grid border-border shadow-hero w-full overflow-hidden rounded-2xl border bg-neutral-50'>
            <div className='p-4'>
                {/* Image, video, or interactive element */}
                <div className='border-border shadow-elevated w-full rounded-xl border'>{/* Content */}</div>
            </div>
        </div>
    </AnimateIn>
</div>
```

---

## Code Block

Used for embed snippets or code examples.

```tsx
<div className='border-border relative overflow-hidden rounded-xl border bg-neutral-50'>
    <pre className='overflow-x-auto p-4 text-sm text-neutral-700'>
        <code>{codeString}</code>
    </pre>
    <Button variant='outline' size='sm' className='absolute top-3 right-3 rounded-lg bg-white' onClick={handleCopy}>
        {copied ? <Check className='mr-1.5 size-3.5' /> : <Icons.copy className='mr-1.5 size-3.5' />}
        {copied ? 'Copied' : 'Copy'}
    </Button>
</div>
```

---

## Header

Fixed header with backdrop blur, logo left, nav center, CTAs right.

```tsx
<header className='border-border fixed inset-x-0 top-0 z-40 border-b bg-white/80 backdrop-blur-2xl'>
    <div className='max-w-content mx-auto flex h-[60px] items-center justify-between px-6'>
        <div className='flex items-center gap-8'>
            <Logo />
            <Navbar />
        </div>
        <div className='flex items-center gap-3'>
            <Button asChild size='sm' variant='outline' className='hidden rounded-lg md:flex'>
                <Link href='/blog'>Blog</Link>
            </Button>
            <Button asChild size='sm' className='hidden rounded-lg md:flex'>
                <Link href='/tool'>Get Started</Link>
            </Button>
            <MobileNav /> {/* Visible on mobile only */}
        </div>
    </div>
</header>
```

Key details:

- Height: `h-[60px]`
- Background: `bg-white/80 backdrop-blur-2xl` (translucent)
- Z-index: `z-40`
- Main content needs `pt-[60px]` to clear the fixed header

---

## Footer

Standard footer with logo/description left, link columns right, bottom bar with credits.

```tsx
<footer className='border-border border-t bg-white'>
    <div className='max-w-content mx-auto px-6 py-16'>
        <div className='flex flex-col gap-12 md:flex-row md:justify-between'>
            {/* Logo & description */}
            <div className='max-w-[280px]'>
                <div className='flex items-center gap-2'>
                    <Logo className='size-7' />
                    <span className='text-lg font-bold text-neutral-900'>Brand Name</span>
                </div>
                <p className='mt-3 text-sm leading-relaxed text-neutral-500'>Short description.</p>
                <div className='mt-6 flex items-center gap-4'>
                    {/* Social icons: text-neutral-500 hover:text-neutral-900 */}
                </div>
            </div>

            {/* Link columns */}
            <div className='grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3 md:max-w-[520px]'>
                <div>
                    <h4 className='mb-4 text-sm font-semibold text-neutral-900'>Column Title</h4>
                    <ul className='space-y-2.5'>
                        <li>
                            <Link
                                className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                href='/'>
                                Link Label
                            </Link>
                        </li>
                    </ul>
                </div>
                {/* More columns... */}
            </div>
        </div>

        {/* Bottom bar */}
        <div className='border-border mt-16 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row'>
            <p className='text-sm text-neutral-500'>
                Created by{' '}
                <Link className='font-medium text-neutral-700 transition-colors hover:text-neutral-900' href='/'>
                    Name
                </Link>
            </p>
            <p className='text-sm text-neutral-500'>&copy; {new Date().getFullYear()} Brand Name</p>
        </div>
    </div>
</footer>
```
