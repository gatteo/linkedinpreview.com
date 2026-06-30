import Link from 'next/link'
import {
    ArrowRight,
    ArrowUpRight,
    Bold,
    Calendar,
    Flame,
    Italic,
    Layers,
    List,
    ListOrdered,
    Monitor,
    Palette,
    Smartphone,
    Sparkles,
    Strikethrough,
    Tablet,
    Underline,
    Zap,
    type LucideIcon,
} from 'lucide-react'

import { Routes } from '@/config/routes'
import { cn } from '@/lib/utils'

import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'
import { Eyebrow, IconTile, Section, SectionHead } from './_shared'

type Feature = { icon: LucideIcon; title: string; body: string }

const FEATURES: Feature[] = [
    {
        icon: Smartphone,
        title: 'Preview on mobile',
        body: 'See how your post will look on mobile devices, ensuring optimal readability and impact.',
    },
    {
        icon: Monitor,
        title: 'Preview on desktop',
        body: 'Check your post on desktop to make sure it looks professional and engaging on larger screens.',
    },
    {
        icon: Tablet,
        title: 'Preview on tablet',
        body: 'Preview on tablets to ensure a visually appealing presentation across all device types.',
    },
    {
        icon: Bold,
        title: 'Bold formatting',
        body: 'Add bold formatting to emphasize key points and make important text stand out.',
    },
    {
        icon: Strikethrough,
        title: 'Strikethrough',
        body: 'Use strikethrough formatting to cross out text, adding a layer of clarity.',
    },
    {
        icon: Underline,
        title: 'Underline',
        body: "Use underline formatting to highlight important information and draw the reader's eye.",
    },
    {
        icon: Italic,
        title: 'Italic formatting',
        body: 'Add italics to emphasize quotes, technical terms, or to differentiate certain words.',
    },
    {
        icon: List,
        title: 'Bullet point list',
        body: 'Organize your information clearly with bullet points, making posts easier to read.',
    },
    {
        icon: ListOrdered,
        title: 'Numbered list',
        body: 'Use numbered lists to structure content logically and make complex information accessible.',
    },
]

const FULL_FEATURES: Feature[] = [
    { icon: Sparkles, title: 'AI writing & rewrites', body: 'Draft hooks and full posts, then rewrite in your voice.' },
    { icon: Calendar, title: 'Scheduling & calendar', body: 'Queue posts and plan your whole month ahead.' },
    { icon: Palette, title: 'Personalized branding', body: 'Save your profile, tone and colors for on-brand posts.' },
    { icon: Layers, title: 'Carousels & drafts', body: 'Build multi-slide carousels and keep every draft organized.' },
    { icon: Zap, title: 'Post scoring', body: 'Get a readability and engagement score before you publish.' },
    { icon: Flame, title: 'Streaks & analytics', body: 'Track your posting streak and see what actually lands.' },
]

function FeatureCell({ f, left, top }: { f: Feature; left: boolean; top: boolean }) {
    const Icon = f.icon
    return (
        <div className={cn('px-7 py-6.5', left && 'border-border md:border-l', top && 'border-border border-t')}>
            <IconTile icon={Icon} className='mb-4' />
            <h3 className='font-heading mb-1.5 text-[16.5px] font-semibold tracking-[-0.01em]'>{f.title}</h3>
            <p className='text-muted-foreground text-sm leading-relaxed'>{f.body}</p>
        </div>
    )
}

export function Features() {
    return (
        <Section id='all-features' innerClassName='scroll-mt-[var(--header-height)] pt-16 pb-7'>
            <AnimateIn className='mb-9'>
                <SectionHead
                    eyebrow='Everything you need'
                    title='All the features you need'
                    sub='From formatting options to real-time previews - everything you need to create perfect LinkedIn posts.'
                    action={
                        <Button asChild variant='outline'>
                            <Link href={Routes.DashboardEditor()}>
                                Open in full editor
                                <ArrowUpRight className='size-4' />
                            </Link>
                        </Button>
                    }
                />
            </AnimateIn>
            <AnimateIn>
                <div className='border-border -mx-7 border-t border-b'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3'>
                        {FEATURES.map((f, i) => (
                            <FeatureCell key={f.title} f={f} left={i % 3 !== 0} top={i >= 3} />
                        ))}
                    </div>
                </div>
            </AnimateIn>
            <AnimateIn delay={0.06}>
                <div className='border-border bg-secondary relative mt-7 overflow-hidden rounded-xl border shadow-[var(--shadow-subtle)]'>
                    <div className='dot-grid pointer-events-none absolute inset-0 opacity-40' />
                    <div className='relative flex flex-wrap items-end justify-between gap-6 p-6'>
                        <div>
                            <Eyebrow className='mb-2.5'>In the full editor</Eyebrow>
                            <h3 className='font-heading text-[clamp(22px,2.6vw,28px)] leading-[1.1] font-bold tracking-[-0.02em]'>
                                ...and even more in the full editor
                            </h3>
                            <p className='text-muted-foreground mt-2.5 max-w-[460px] text-[14.5px] leading-relaxed'>
                                The quick tool covers formatting and preview. The full editor adds everything you need
                                to post consistently - still free, still no sign-up.
                            </p>
                        </div>
                        <Button asChild size='lg' className='h-11'>
                            <Link href={Routes.DashboardEditor()}>
                                Open the full editor
                                <ArrowRight className='size-4' />
                            </Link>
                        </Button>
                    </div>
                    <div className='border-border relative grid grid-cols-1 border-t sm:grid-cols-2 md:grid-cols-3'>
                        {FULL_FEATURES.map((f, i) => {
                            const Icon = f.icon
                            return (
                                <div
                                    key={f.title}
                                    className={cn(
                                        'flex items-center gap-3.5 p-6',
                                        i % 3 !== 0 && 'md:border-border md:border-l',
                                        i >= 3 && 'md:border-border md:border-t',
                                    )}>
                                    <IconTile icon={Icon} size='sm' />
                                    <div className='min-w-0'>
                                        <div className='text-[14.5px] font-semibold tracking-[-0.01em]'>{f.title}</div>
                                        <div className='text-muted-foreground text-[12.5px]'>{f.body}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </AnimateIn>
        </Section>
    )
}
