'use client'

import { Icon, Icons } from '../icon'
import { AnimateIn, StaggerChildren, StaggerItem } from '../ui/animate-in'

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

export function Features() {
    return (
        <section id='all-features' className='border-t border-border bg-neutral-50'>
            <div className='mx-auto max-w-content px-6 py-20 md:py-28'>
                <AnimateIn className='mx-auto mb-16 max-w-2xl text-center'>
                    <h2 className='mb-4 font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
                        All the features you need
                    </h2>
                    <p className='text-lg leading-7 text-neutral-500'>
                        From formatting options to real-time previews, this tool has everything you need to create
                        perfect LinkedIn posts.
                    </p>
                </AnimateIn>

                <StaggerChildren className='grid gap-4 sm:grid-cols-2 md:grid-cols-3'>
                    {AllFeatures.map((feature) => (
                        <StaggerItem key={feature.title}>
                            <div className='rounded-xl border border-border bg-white p-6 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated'>
                                <Icon
                                    name={feature.icon as keyof typeof Icons}
                                    className='mb-4 size-8 rounded-lg bg-primary/10 p-1.5 text-primary'
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
