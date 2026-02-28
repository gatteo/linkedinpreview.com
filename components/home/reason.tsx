'use client'

import Link from 'next/link'

import { Routes } from '@/config/routes'

import { Icons } from '../icon'
import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'

const Reasons = [
    {
        title: 'Make Your Posts Easy to Read',
        description:
            'Good formatting helps organize your ideas clearly. It makes your posts simpler to follow and keeps your readers interested.',
        icon: <Icons.checkCircle className='text-primary size-5' />,
    },
    {
        title: 'Make a Great First Impression',
        description:
            'People notice neat and tidy posts. Previewing lets you see how your post will look on different screens, ensuring it always looks its best.',
        icon: <Icons.thumsUp className='text-primary size-5' />,
    },
    {
        title: 'Get More Likes and Comments',
        description:
            'Write posts that people want to interact with. Well formatted and attractive posts are more likely to be liked, commented on, and shared.',
        icon: <Icons.commentHeart className='text-primary size-5' />,
    },
]

export function Reason() {
    return (
        <section id='reason' className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                {/* Header */}
                <AnimateIn className='mb-6 px-6 text-center max-lg:text-left'>
                    <h2 className='font-heading text-3xl font-bold tracking-tight text-balance text-neutral-900 sm:text-4xl md:text-5xl'>
                        Why <span className='text-primary'>Format</span> and{' '}
                        <span className='text-primary'>Preview</span> Your LinkedIn Posts?
                    </h2>
                </AnimateIn>

                {/* Blueprint grid */}
                <AnimateIn>
                    <div className='dash-top grid lg:grid-cols-[2fr_3fr]'>
                        {/* Left: copy */}
                        <div className='dash-bottom-mobile space-y-6 p-6'>
                            <p className='text-lg leading-relaxed text-neutral-500 lg:max-w-lg'>
                                The appearance of posts on LinkedIn can significantly influence your professional
                                reputation and how much engagement your content receives. Rich text formatting enables
                                you to design posts that not only stand out but also truly resonate with your audience.
                                Also, with real-time preview you are sure your linkedin post content and opening line
                                look exactly what you expect before going live, across any device.
                            </p>

                            <Button asChild size='default' className='rounded-lg'>
                                <Link href={Routes.Tool}>Get Started, It&apos;s Free</Link>
                            </Button>
                        </div>

                        {/* Right: reason cards with diagonal lines bg */}
                        <div className='dash-left relative flex items-center p-6'>
                            <div
                                className='pointer-events-none absolute inset-0 text-neutral-100'
                                style={{
                                    backgroundImage:
                                        'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
                                }}
                            />
                            <div className='divide-border relative w-full divide-y overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm'>
                                {Reasons.map(({ icon, title, description }) => (
                                    <div key={title} className='flex items-start gap-4 p-6'>
                                        <div className='bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg'>
                                            {icon}
                                        </div>
                                        <div>
                                            <h3 className='mb-1 text-base font-semibold text-neutral-900'>{title}</h3>
                                            <p className='text-sm leading-relaxed text-neutral-500'>{description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}
