'use client'

import { cn } from '@/lib/utils'

import { AnimateIn } from '../ui/animate-in'

const Steps = [
    {
        title: 'Write or Paste your Content',
        description: 'Start by typing or pasting your text into our editor. This is where you craft your post.',
    },
    {
        title: 'Make It Look Good',
        description:
            'Use our easy tools to add style to your post. You can make words bold, italic, or add lists to organize your points better.',
    },
    {
        title: 'Check How It Looks',
        description:
            'See how your post will look on phones, tablets, and computers. Pay special attention to where LinkedIn truncates with "see more" to ensure your hook is visible.',
    },
    {
        title: 'Copy and Publish!',
        description:
            'When everything looks good, click the "copy text" button. Then go to LinkedIn, paste your post, and share it with confidence!',
    },
]

export function HowToUse() {
    return (
        <section id='how-it-works' className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                <AnimateIn className='mb-6 px-6'>
                    <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>How it works</p>
                    <h2 className='font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl'>
                        How to Use <span className='text-primary'>LinkedIn Preview </span>
                        Tool
                    </h2>
                    <p className='mt-3 text-base text-neutral-500'>
                        Just follow these simple steps to make your LinkedIn post look great
                    </p>
                </AnimateIn>

                {/* Blueprint grid - wide dashes */}
                <AnimateIn>
                    <div className='dash-top grid lg:grid-cols-[2fr_3fr]'>
                        {/* Left: step rows */}
                        <div className='dash-bottom-mobile'>
                            {Steps.map((step, index) => (
                                <div key={step.title} className={cn('p-6', index < Steps.length - 1 && 'dash-bottom')}>
                                    <span className='text-primary/70 mb-1 block text-xs font-semibold tracking-wider uppercase'>
                                        Step {index + 1}
                                    </span>
                                    <h3 className='mb-1 text-base font-semibold text-neutral-900'>{step.title}</h3>
                                    <p className='text-sm leading-relaxed text-neutral-500'>{step.description}</p>
                                </div>
                            ))}
                        </div>

                        {/* Right: video with diagonal lines bg */}
                        <div className='dash-left relative flex items-center p-6'>
                            <div
                                className='pointer-events-none absolute inset-0 text-neutral-100'
                                style={{
                                    backgroundImage:
                                        'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
                                }}
                            />
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className='border-border shadow-elevated relative w-full rounded-xl border'>
                                <source src='/images/home/screen-rec.mov' />
                            </video>
                        </div>
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}
