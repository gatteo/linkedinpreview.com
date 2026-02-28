'use client'

import { cn } from '@/lib/utils'

import { Icon, Icons } from '../icon'
import { AnimateIn } from '../ui/animate-in'

const AllFeatures = [
    {
        icon: 'mobile',
        title: 'Preview on Mobile',
        body: 'See how your LinkedIn Post will look on mobile devices, ensuring optimal readability and impact.',
    },
    {
        icon: 'desktop',
        title: 'Preview on Desktop',
        body: "Check your Linkedin Post's appearance on desktop to make sure it looks professional and engaging on larger screens.",
    },
    {
        icon: 'tablet',
        title: 'Preview on Tablet',
        body: 'Preview your LinkedIn Post on tablets to ensure a visually appealing presentation across all device types.',
    },
    {
        icon: 'bold',
        title: 'Bold Formatting',
        body: 'Add bold formatting to your Likedin Post to emphasize key points and make important text stand out.',
    },
    {
        icon: 'strikethrough',
        title: 'Strikethrough Formatting',
        body: 'Use strikethrough formatting on your LinkedIn Post to cross out text, adding a layer of clarity.',
    },
    {
        icon: 'underline',
        title: 'Underline Formatting',
        body: "You can use underline formatting to highlight important information and draw the reader's eye.",
    },
    {
        icon: 'italic',
        title: 'Italic Formatting',
        body: 'Add italics to your LinkedIn Post to emphasize quotes, technical terms, or to differentiate certain words and phrases.',
    },
    {
        icon: 'bulletList',
        title: 'Bullet Point List',
        body: 'Organize your Linkedin Post information clearly with bullet points, making your posts easier to read and more effective.',
    },
    {
        icon: 'numberedList',
        title: 'Numbered List',
        body: 'Use numbered lists to structure your Linkedin Post content logically, making complex information more accessible and understandable.',
    },
]

const row1 = AllFeatures.slice(0, 3)
const row2 = AllFeatures.slice(3, 6)
const row3 = AllFeatures.slice(6, 9)

function FeatureCell({ feature, showLeft }: { feature: (typeof AllFeatures)[number]; showLeft?: boolean }) {
    return (
        <div className={cn('relative p-6', showLeft && 'dash-left')}>
            <Icon
                name={feature.icon as keyof typeof Icons}
                className='bg-primary/10 text-primary mb-4 size-8 rounded-lg p-1.5'
                aria-hidden='true'
            />
            <h3 className='mb-2 text-base font-semibold text-neutral-900'>{feature.title}</h3>
            <p className='text-sm leading-relaxed text-neutral-500'>{feature.body}</p>
        </div>
    )
}

export function Features() {
    return (
        <section id='all-features' className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                <AnimateIn className='mb-6 px-6'>
                    <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>
                        Everything you need
                    </p>
                    <h2 className='font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl'>
                        All the Features you Need
                    </h2>
                    <p className='mt-3 max-w-lg text-base text-neutral-500'>
                        From formatting options to real-time previews, this tool has everything you need to create
                        perfect LinkedIn posts.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top'>
                        {/* Row 1 */}
                        <div className='dash-bottom grid sm:grid-cols-2 md:grid-cols-3'>
                            {row1.map((feature, i) => (
                                <FeatureCell key={feature.title} feature={feature} showLeft={i > 0} />
                            ))}
                        </div>
                        {/* Row 2 */}
                        <div className='dash-bottom grid sm:grid-cols-2 md:grid-cols-3'>
                            {row2.map((feature, i) => (
                                <FeatureCell key={feature.title} feature={feature} showLeft={i > 0} />
                            ))}
                        </div>
                        {/* Row 3 */}
                        <div className='grid sm:grid-cols-2 md:grid-cols-3'>
                            {row3.map((feature, i) => (
                                <FeatureCell key={feature.title} feature={feature} showLeft={i > 0} />
                            ))}
                        </div>
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}
