'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
    CalendarIcon,
    FileTextIcon,
    FlameIcon,
    PaletteIcon,
    PlusIcon,
    SparklesIcon,
    type LucideIcon,
} from 'lucide-react'

import { Routes } from '@/config/routes'
import { cn } from '@/lib/utils'

import { TrackClick } from '../tracking/track-click'
import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'

// ---------------------------------------------------------------------------
// Value props
// ---------------------------------------------------------------------------

const VALUE_PROPS: { icon: LucideIcon; title: string; body: string }[] = [
    {
        icon: FileTextIcon,
        title: 'Save & organize drafts',
        body: 'Keep every post in one place, with draft, scheduled and published statuses, search and filters.',
    },
    {
        icon: SparklesIcon,
        title: 'Write faster with AI',
        body: 'Turn a rough idea into scroll-stopping hooks and full posts, then rewrite in your own voice.',
    },
    {
        icon: CalendarIcon,
        title: 'Plan a content calendar',
        body: 'Schedule your posts and see your whole month at a glance so you never run dry.',
    },
    {
        icon: FlameIcon,
        title: 'Build a posting streak',
        body: 'Stay consistent with a 6-month activity heatmap and a weekly streak that keeps you going.',
    },
]

// ---------------------------------------------------------------------------
// Animated dashboard mockup
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
    { label: 'Posts', icon: FileTextIcon },
    { label: 'Calendar', icon: CalendarIcon },
    { label: 'Strategy', icon: FlameIcon },
    { label: 'Branding', icon: PaletteIcon },
]

const MOCK_POSTS = [
    { title: 'Q2 launch announcement', status: 'Published', tone: 'published' as const },
    { title: '3 lessons from our first hire', status: 'Scheduled', tone: 'scheduled' as const },
    { title: 'Why we went open source', status: 'Draft', tone: 'draft' as const },
]

// Mirrors the real dashboard status palette (see posts-table.tsx).
const STATUS_STYLES: Record<string, string> = {
    published: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    draft: 'bg-amber-100 text-amber-800',
}

function DashboardMockup() {
    const reduceMotion = useReducedMotion()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { margin: '-80px' })
    const animate = !reduceMotion && inView
    const [activeNav, setActiveNav] = React.useState(0)

    // Ambient: cycle the active sidebar item so the mock feels alive. Paused while
    // off-screen so it isn't burning animation frames on a backgrounded section.
    React.useEffect(() => {
        if (!animate) return
        const id = setInterval(() => setActiveNav((i) => (i + 1) % NAV_ITEMS.length), 1800)
        return () => clearInterval(id)
    }, [animate])

    return (
        <div
            ref={rootRef}
            className='border-border shadow-elevated relative overflow-hidden rounded-xl border bg-white'>
            {/* Browser chrome */}
            <div className='border-border flex items-center gap-1.5 border-b px-3 py-2.5'>
                <span className='size-2.5 rounded-full bg-neutral-200' />
                <span className='size-2.5 rounded-full bg-neutral-200' />
                <span className='size-2.5 rounded-full bg-neutral-200' />
                <div className='ml-2 flex-1 truncate rounded-md bg-neutral-100 px-2 py-1 text-[10px] text-neutral-400'>
                    linkedinpreview.com/dashboard
                </div>
            </div>

            <div className='flex'>
                {/* Sidebar */}
                <div className='hidden w-40 shrink-0 flex-col gap-0.5 border-r border-neutral-100 bg-neutral-50/60 p-2 sm:flex'>
                    {NAV_ITEMS.map((item, i) => {
                        const Icon = item.icon
                        const isActive = i === activeNav
                        return (
                            <div
                                key={item.label}
                                className={cn(
                                    'relative flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                                    isActive ? 'text-primary' : 'text-neutral-500',
                                )}>
                                {isActive && (
                                    <motion.div
                                        layoutId='dash-nav-highlight'
                                        className='bg-primary/10 absolute inset-0 rounded-md'
                                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                    />
                                )}
                                <Icon className='relative size-3.5' />
                                <span className='relative'>{item.label}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Main */}
                <div className='min-w-0 flex-1 p-3 sm:p-4'>
                    <div className='mb-3 flex items-center justify-between'>
                        <span className='text-sm font-semibold text-neutral-900'>Posts</span>
                        <span className='bg-primary inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-white'>
                            <PlusIcon className='size-3' />
                            New post
                        </span>
                    </div>

                    {/* Post rows */}
                    <div className='flex flex-col gap-1.5'>
                        {MOCK_POSTS.map((post, i) => (
                            <motion.div
                                key={post.title}
                                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.4, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                                className='border-border/70 flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2'>
                                <FileTextIcon className='size-3.5 shrink-0 text-neutral-300' />
                                <span className='min-w-0 flex-1 truncate text-xs text-neutral-700'>{post.title}</span>
                                <span
                                    className={cn(
                                        'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                                        STATUS_STYLES[post.tone],
                                    )}>
                                    {post.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Weekly streak */}
                    <div className='mt-4 flex items-center gap-2'>
                        <FlameIcon className='size-3.5 text-amber-500' />
                        <span className='text-[10px] font-medium text-neutral-500'>This week</span>
                        <div className='flex gap-1'>
                            {Array.from({ length: 7 }).map((_, i) => (
                                <motion.span
                                    key={i}
                                    className='bg-primary size-2.5 rounded-[3px]'
                                    initial={reduceMotion ? false : { opacity: 0.15 }}
                                    animate={animate ? { opacity: [0.15, 1, 1, 0.15] } : undefined}
                                    transition={{
                                        duration: 3.5,
                                        times: [0, 0.25, 0.85, 1],
                                        delay: i * 0.18,
                                        repeat: Infinity,
                                        repeatDelay: 1.5,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function DashboardShowcase() {
    return (
        <section id='dashboard' className='border-border scroll-mt-[var(--header-height)] border-t'>
            <div className='pt-20 md:pt-24'>
                <AnimateIn className='mb-10 px-6'>
                    <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>
                        The full workspace
                    </p>
                    <h2 className='font-heading max-w-2xl text-3xl font-bold tracking-tight text-balance text-neutral-900 sm:text-4xl md:text-5xl'>
                        From one great post to a posting habit
                    </h2>
                    <p className='mt-3 max-w-xl text-base text-neutral-500'>
                        The free tool previews a single post. The dashboard saves your drafts, writes alongside you,
                        plans your calendar and tracks your streak - still free, still no sign-up.
                    </p>
                </AnimateIn>

                <div className='dash-top grid items-center gap-10 px-6 py-10 lg:grid-cols-2 lg:gap-12'>
                    {/* Value props */}
                    <div className='flex flex-col gap-6'>
                        {VALUE_PROPS.map((prop, i) => {
                            const Icon = prop.icon
                            return (
                                <AnimateIn key={prop.title} delay={i * 0.08} from='left'>
                                    <div className='flex gap-4'>
                                        <Icon
                                            className='bg-primary/10 text-primary size-9 shrink-0 rounded-lg p-2'
                                            aria-hidden='true'
                                        />
                                        <div>
                                            <h3 className='mb-1 text-base font-semibold text-neutral-900'>
                                                {prop.title}
                                            </h3>
                                            <p className='text-sm leading-relaxed text-neutral-500'>{prop.body}</p>
                                        </div>
                                    </div>
                                </AnimateIn>
                            )
                        })}
                    </div>

                    {/* Animated mockup */}
                    <AnimateIn from='right' delay={0.1}>
                        <DashboardMockup />
                    </AnimateIn>
                </div>

                {/* CTA */}
                <AnimateIn className='flex flex-col items-center gap-3 px-6 pb-20 text-center md:pb-24'>
                    <TrackClick
                        event='cta_button_clicked'
                        properties={{ button_name: 'open_dashboard', source: 'dashboard_showcase' }}>
                        <Button asChild size='lg' className='rounded-lg'>
                            <Link href={Routes.Dashboard}>Open your dashboard</Link>
                        </Button>
                    </TrackClick>
                    <p className='text-muted-foreground text-xs'>Free · No sign-up · Works right in your browser</p>
                </AnimateIn>
            </div>
        </section>
    )
}
