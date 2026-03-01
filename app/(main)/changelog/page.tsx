import type { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
import { absoluteUrl } from '@/utils/urls'

import { Routes } from '@/config/routes'
import { getAllChangelogs } from '@/lib/changelog'
import Mdx from '@/components/mdx/mdx'

const title = 'Changelog'
const description = 'New features, improvements, and fixes - see what we have been building.'

type Props = {
    params: Record<string, never>
}

export async function generateMetadata(_: Props, parent: ResolvingMetadata): Promise<Metadata> {
    const previousOpenGraph = (await parent)?.openGraph ?? {}
    const previousTwitter = (await parent)?.twitter ?? {}

    return {
        title,
        description,
        alternates: {
            canonical: absoluteUrl(Routes.Changelog),
        },
        openGraph: {
            ...previousOpenGraph,
            url: absoluteUrl(Routes.Changelog),
            title,
            description,
        },
        twitter: {
            ...previousTwitter,
            title,
            description,
        },
    }
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default function ChangelogPage() {
    const entries = getAllChangelogs()

    return (
        <main>
            {/* Hero */}
            <section className='dot-grid'>
                <div className='max-w-content mx-auto flex flex-col items-center px-6 pt-20 pb-16 md:pt-28'>
                    <span className='border-border text-primary shadow-subtle mb-4 inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium'>
                        Product Updates
                    </span>
                    <h1 className='font-heading mb-5 text-center text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl'>
                        Changelog
                    </h1>
                    <p className='mx-auto max-w-[540px] text-center text-lg leading-7 text-neutral-500'>
                        New features, improvements, and fixes - see what we have been building.
                    </p>
                </div>
            </section>

            {/* Entries */}
            <section className='border-border border-t'>
                <div className='max-w-content mx-auto px-6 pb-24'>
                    {entries.map((entry) => (
                        <article key={entry.slug} className='border-border border-b'>
                            <div className='flex flex-col gap-6 py-12 md:flex-row md:gap-16'>
                                {/* Date - sticky on desktop */}
                                <div className='md:w-1/4 md:shrink-0'>
                                    <div className='md:sticky md:top-[calc(var(--header-height)+2rem)]'>
                                        <time
                                            dateTime={entry.date.toISOString()}
                                            className='text-sm font-medium text-neutral-500'>
                                            {formatDate(entry.date)}
                                        </time>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className='min-w-0 flex-1'>
                                    <h2 className='mb-4 text-2xl font-semibold tracking-tight text-neutral-900'>
                                        {entry.title}
                                    </h2>

                                    {entry.image && (
                                        <div className='border-border mb-6 overflow-hidden rounded-xl border'>
                                            <Image
                                                src={entry.image}
                                                alt={entry.title}
                                                width={1200}
                                                height={675}
                                                className='w-full object-cover'
                                            />
                                        </div>
                                    )}

                                    <Mdx code={entry.body.code} />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    )
}
