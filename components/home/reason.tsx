import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Heart, ThumbsUp } from 'lucide-react'

import { Routes } from '@/config/routes'

import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'
import { FeatureItem, Section, SectionHead } from './_shared'

const REASONS = [
    {
        icon: CheckCircle2,
        title: 'Make your posts easy to read',
        description:
            'Good formatting organizes your ideas clearly. It makes your posts simpler to follow and keeps readers interested.',
    },
    {
        icon: ThumbsUp,
        title: 'Make a great first impression',
        description:
            'People notice neat, tidy posts. Previewing lets you see how it looks on different screens, so it always looks its best.',
    },
    {
        icon: Heart,
        title: 'Get more likes and comments',
        description:
            'Write posts people want to interact with. Well-formatted, attractive posts get liked, commented on, and shared.',
    },
]

export function Reason() {
    return (
        <Section id='reason' innerClassName='pt-16'>
            <AnimateIn className='mb-9'>
                <SectionHead title='Why format and preview your LinkedIn posts?' />
            </AnimateIn>
            <AnimateIn>
                <div className='border-border -mx-7 grid border-t md:grid-cols-2'>
                    <div className='flex flex-col gap-5.5 p-7'>
                        <p className='text-muted-foreground text-[17px] leading-[1.62]'>
                            How posts appear on LinkedIn can significantly influence your professional reputation and
                            how much engagement your content receives. Rich text formatting lets you design posts that
                            stand out and truly resonate. And with real-time preview, you know your opening line looks
                            exactly right before going live - across any device.
                        </p>
                        <div>
                            <Button asChild>
                                <Link href={Routes.Tool}>
                                    Get started, it&apos;s free
                                    <ArrowRight className='size-4' />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className='border-border bg-secondary relative flex items-center overflow-hidden p-7 max-md:border-t md:border-l'>
                        <Image
                            src='/images/illustrations/valley-fog.jpg'
                            alt=''
                            fill
                            sizes='(max-width: 768px) 100vw, 50vw'
                            className='object-cover'
                        />
                        <span className='absolute inset-0 bg-gradient-to-br from-[oklch(0.97_0.006_220_/_0.66)] to-[oklch(0.94_0.012_222_/_0.46)]' />
                        <span
                            className='grain absolute inset-0'
                            style={{ '--grain-opacity': 0.18 } as React.CSSProperties}
                        />
                        <div className='bg-card relative w-full overflow-hidden rounded-xl shadow-[var(--card-shadow)]'>
                            {REASONS.map((r, i) => (
                                <div key={r.title} className={'px-5.5 py-5' + (i > 0 ? ' border-border border-t' : '')}>
                                    <FeatureItem icon={r.icon} title={r.title} body={r.description} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </AnimateIn>
        </Section>
    )
}
