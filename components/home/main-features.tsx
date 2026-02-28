'use client'

import { Icon, Icons } from '../icon'
import { AnimateIn, StaggerChildren, StaggerItem } from '../ui/animate-in'

const Features = [
    {
        icon: 'formatting',
        title: 'Advanced Formatting',
        body: 'Make your posts stand out with rich text formatting — bold, italic, underline, lists, and more.',
    },
    {
        icon: 'preview',
        title: 'Real-Time Preview',
        body: 'See exactly how your post will look on mobile, tablet, and desktop before you publish.',
    },
    {
        icon: 'dollar',
        title: 'Completely Free',
        body: 'Full functionality with no fees, no sign-up — perfect for professionals and companies of all sizes.',
    },
]

export function MainFeatures() {
    return (
        <section id='main-features' className='border-t border-border'>
            <div className='px-6 py-20 md:py-28'>
                {/* Left-aligned header */}
                <AnimateIn className='mb-12'>
                    <h2 className='font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
                        The key features of this tool
                    </h2>
                    <p className='mt-3 max-w-[500px] text-lg text-neutral-500'>
                        From intuitive formatting to real-time preview — everything you need to create perfect LinkedIn
                        posts.
                    </p>
                </AnimateIn>

                <StaggerChildren className='grid gap-0 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
                    {Features.map((feature) => (
                        <StaggerItem key={feature.title}>
                            <div className='group relative p-8 transition-colors hover:bg-neutral-50/50'>
                                <Icon
                                    name={feature.icon as keyof typeof Icons}
                                    className='mb-4 size-8 text-primary'
                                    aria-hidden='true'
                                />
                                <h3 className='mb-2 text-base font-semibold text-neutral-900'>{feature.title}</h3>
                                <p className='text-sm leading-relaxed text-neutral-500'>{feature.body}</p>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerChildren>
            </div>
        </section>
    )
}
