'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, FileText, Flame, Palette, Plus, Sparkles } from 'lucide-react'

import { Routes } from '@/config/routes'
import { cn } from '@/lib/utils'

import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'
import { FeatureItem, Section, SectionHead } from './_shared'

const VALUE_PROPS = [
    {
        icon: FileText,
        title: 'Save & organize drafts',
        body: 'Keep every post in one place, with draft, scheduled and published statuses, search and filters.',
    },
    {
        icon: Sparkles,
        title: 'Write faster with AI',
        body: 'Turn a rough idea into scroll-stopping hooks and full posts, then rewrite in your own voice.',
    },
    {
        icon: Calendar,
        title: 'Plan a content calendar',
        body: 'Schedule your posts and see your whole month at a glance so you never run dry.',
    },
    {
        icon: Flame,
        title: 'Build a posting streak',
        body: 'Stay consistent with a 6-month activity heatmap and a weekly streak that keeps you going.',
    },
]

const NAV_ITEMS = [
    { label: 'Posts', icon: FileText },
    { label: 'Calendar', icon: Calendar },
    { label: 'Strategy', icon: Flame },
    { label: 'Branding', icon: Palette },
]

const MOCK_POSTS = [
    { title: 'Q2 launch announcement', status: 'Published', tone: 'success' },
    { title: '3 lessons from our first hire', status: 'Scheduled', tone: 'info' },
    { title: 'Why we went open source', status: 'Draft', tone: 'warning' },
] as const

const TONE: Record<string, string> = {
    success: 'bg-success-soft text-success',
    info: 'bg-info-soft text-info',
    warning: 'bg-warning-soft text-[color:color-mix(in_oklch,var(--amber)_70%,black_25%)]',
}

function DashboardMockup() {
    const [activeNav, setActiveNav] = React.useState(0)
    const ref = React.useRef<HTMLDivElement>(null)
    const [live, setLive] = React.useState(false)

    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        const io = new IntersectionObserver((es) => es.forEach((e) => setLive(e.isIntersecting)), {
            rootMargin: '-60px',
        })
        io.observe(el)
        return () => io.disconnect()
    }, [])

    React.useEffect(() => {
        if (!live) return
        const id = setInterval(() => setActiveNav((i) => (i + 1) % NAV_ITEMS.length), 1800)
        return () => clearInterval(id)
    }, [live])

    return (
        <div
            ref={ref}
            className='dark bg-background text-foreground border-border relative overflow-hidden rounded-xl border shadow-[var(--shadow-prominent)]'>
            <div className='border-border flex items-center gap-1.5 border-b px-3.5 py-2.5'>
                <span className='bg-petrol-700 size-2.5 rounded-full' />
                <span className='bg-petrol-700 size-2.5 rounded-full' />
                <span className='bg-petrol-700 size-2.5 rounded-full' />
                <div className='bg-secondary text-muted-foreground ml-2 flex-1 rounded-md px-2.5 py-1 font-mono text-[10px]'>
                    linkedinpreview.com/dashboard
                </div>
            </div>
            <div className='flex'>
                <div className='border-border flex w-[150px] shrink-0 flex-col gap-0.5 border-r bg-[color:color-mix(in_oklch,var(--card)_50%,transparent)] p-2'>
                    {NAV_ITEMS.map((item, i) => {
                        const active = i === activeNav
                        const Icon = item.icon
                        return (
                            <div
                                key={item.label}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                                    active
                                        ? 'text-primary bg-[color:color-mix(in_oklch,var(--orange-500)_14%,transparent)]'
                                        : 'text-muted-foreground',
                                )}>
                                <Icon className='size-3.5' />
                                <span>{item.label}</span>
                            </div>
                        )
                    })}
                </div>
                <div className='min-w-0 flex-1 p-4'>
                    <div className='mb-3.5 flex items-center justify-between'>
                        <span className='text-sm font-semibold'>Posts</span>
                        <span className='bg-primary inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white'>
                            <Plus className='size-3' />
                            New post
                        </span>
                    </div>
                    <div className='flex flex-col gap-2'>
                        {MOCK_POSTS.map((post) => (
                            <div
                                key={post.title}
                                className='border-border bg-card flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5'>
                                <FileText className='text-muted-foreground size-3.5 shrink-0' />
                                <span className='min-w-0 flex-1 truncate text-[12.5px]'>{post.title}</span>
                                <span
                                    className={cn(
                                        'shrink-0 rounded-full px-2.5 py-[3px] text-[10px] font-medium',
                                        TONE[post.tone],
                                    )}>
                                    {post.status}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className='mt-4.5 flex items-center gap-2'>
                        <Flame className='size-3.5 text-[color:var(--amber)]' />
                        <span className='text-muted-foreground text-[11px] font-medium'>This week</span>
                        <div className='flex gap-1'>
                            {Array.from({ length: 7 }).map((_, i) => (
                                <span
                                    key={i}
                                    className='bg-primary size-[11px] rounded-[3px]'
                                    style={
                                        live ? { animation: `dashpulse 5s ${i * 0.18}s infinite` } : { opacity: 0.2 }
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function DashboardShowcase() {
    return (
        <Section id='dashboard' innerClassName='py-16'>
            <AnimateIn className='mb-9'>
                <SectionHead
                    eyebrow='The full workspace'
                    title='From one great post to a posting habit'
                    sub='The free tool previews a single post. The dashboard saves your drafts, writes alongside you, plans your calendar and tracks your streak - still free, still no sign-up.'
                />
            </AnimateIn>
            <div className='grid items-center gap-12 md:grid-cols-2'>
                <div className='flex flex-col gap-6.5'>
                    {VALUE_PROPS.map((p, i) => (
                        <AnimateIn key={p.title} delay={i * 0.06}>
                            <FeatureItem icon={p.icon} title={p.title} body={p.body} />
                        </AnimateIn>
                    ))}
                </div>
                <AnimateIn from='fade' delay={0.1}>
                    <DashboardMockup />
                </AnimateIn>
            </div>
            <AnimateIn className='mt-12 flex flex-col items-center gap-2.5 text-center'>
                <Button asChild size='lg' className='h-11'>
                    <Link href={Routes.DashboardEditor()}>
                        Open the full editor
                        <ArrowRight className='size-4' />
                    </Link>
                </Button>
                <p className='text-muted-foreground text-[12.5px]'>Free · No sign-up · Works right in your browser</p>
            </AnimateIn>
        </Section>
    )
}
