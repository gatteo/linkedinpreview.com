import Link from 'next/link'

import { Routes } from '@/config/routes'

import { Icons } from '../icon'
import { Button } from '../ui/button'

const Reasons = [
    {
        title: 'Make Your Posts Easy to Read',
        description:
            'Good formatting helps organize your ideas clearly. It makes your posts simpler to follow and keeps your readers interested.',
        icon: <Icons.checkCircle className='size-5 text-primary' />,
    },
    {
        title: 'Make a Great First Impression',
        description:
            'People notice neat and tidy posts. Previewing lets you see how your post will look on different screens, ensuring it always looks its best.',
        icon: <Icons.thumsUp className='size-5 text-primary' />,
    },
    {
        title: 'Get More Likes and Comments',
        description:
            'Write posts that people want to interact with. Well formatted and attractive posts are more likely to be liked, commented on, and shared.',
        icon: <Icons.commentHeart className='size-5 text-primary' />,
    },
]

export function Reason() {
    return (
        <section id='reason' className='border-t border-border'>
            <div className='mx-auto max-w-content px-6 py-20 md:py-28'>
                <div className='grid gap-12 lg:grid-cols-2 lg:place-items-center'>
                    <div>
                        <h2 className='mb-4 font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
                            Why format and preview your LinkedIn posts?
                        </h2>
                        <p className='mb-8 max-w-[520px] text-lg leading-7 text-neutral-500'>
                            The appearance of posts on LinkedIn can significantly influence your professional reputation
                            and how much engagement your content receives.
                        </p>
                        <Button asChild className='rounded-lg'>
                            <Link href={Routes.Tool}>Get Started, It's Free</Link>
                        </Button>
                    </div>

                    <div className='flex flex-col gap-4'>
                        {Reasons.map(({ icon, title, description }) => (
                            <div
                                key={title}
                                className='rounded-xl border border-border bg-white p-6 shadow-subtle transition-shadow hover:shadow-elevated'>
                                <div className='flex items-start gap-4'>
                                    <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                                        {icon}
                                    </div>
                                    <div>
                                        <h3 className='mb-1 text-base font-semibold text-neutral-900'>{title}</h3>
                                        <p className='text-sm leading-relaxed text-neutral-500'>{description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
