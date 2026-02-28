import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { absoluteUrl } from '@/utils/urls'
import { IconArrowRight } from '@tabler/icons-react'

import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { getAllComparisons } from '@/lib/compare'
import { Button } from '@/components/ui/button'

const title = 'Compare LinkedIn Preview vs Alternatives'
const description =
    'See how LinkedIn Preview compares to Taplio, AuthoredUp, Supergrow, Typefully, Publer, and other LinkedIn tools. Free, no sign-up, and fully featured.'

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
            canonical: absoluteUrl(Routes.Compare),
        },
        openGraph: {
            ...previousOpenGraph,
            url: absoluteUrl(Routes.Compare),
            title,
            description,
            siteName: site.title,
        },
        twitter: {
            ...previousTwitter,
            title,
            description,
        },
    }
}

export default function Page() {
    const comparisons = getAllComparisons()

    return (
        <main>
            {/* Hero */}
            <section className='dot-grid'>
                <div className='max-w-content mx-auto flex flex-col items-center px-6 pt-20 pb-16 md:pt-28'>
                    <span className='border-border text-primary shadow-subtle mb-4 inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium'>
                        Comparisons
                    </span>
                    <h1 className='font-heading mb-5 text-center text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl'>
                        LinkedIn Preview vs <span className='text-primary'>Alternatives</span>
                    </h1>
                    <p className='mx-auto mb-8 max-w-[540px] text-center text-lg leading-7 text-neutral-500'>
                        See how LinkedIn Preview stacks up against popular LinkedIn tools. Spoiler: it is free, requires
                        no sign-up, and includes AI generation at no cost.
                    </p>
                    <Button asChild className='rounded-lg'>
                        <Link href={Routes.Tool}>Try LinkedIn Preview Free</Link>
                    </Button>
                </div>
            </section>

            {/* Comparison Cards */}
            <section className='border-border border-t'>
                <div className='max-w-content mx-auto px-6 py-16 md:py-24'>
                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {comparisons.map((comparison) => (
                            <Link
                                key={comparison.slug}
                                href={comparison.url}
                                className='group border-border shadow-subtle hover:shadow-elevated flex flex-col overflow-hidden rounded-xl border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5'>
                                <div className='mb-3 flex items-center gap-2'>
                                    <span className='bg-primary/10 text-primary rounded-md px-2.5 py-1 text-xs font-semibold'>
                                        vs
                                    </span>
                                    <h2 className='group-hover:text-primary text-lg font-semibold text-neutral-900 transition-colors'>
                                        {comparison.competitor}
                                    </h2>
                                </div>
                                <p className='mb-5 flex-1 text-sm leading-relaxed text-neutral-500'>
                                    {comparison.summary.slice(0, 140)}
                                    {comparison.summary.length > 140 && '...'}
                                </p>
                                <div className='text-primary flex items-center gap-1 text-sm font-medium'>
                                    Read comparison
                                    <IconArrowRight
                                        size={16}
                                        className='transition-transform group-hover:translate-x-0.5'
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}
