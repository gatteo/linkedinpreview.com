import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, LayoutGrid, Monitor, Smartphone } from 'lucide-react'

import { site } from '@/config/site'
import { Button } from '@/components/ui/button'
import { PreviewPageClient } from '@/components/feed-preview/preview-page-client'

const pageTitle = 'LinkedIn Feed Preview - See Your Post in a Real Feed'
const pageDescription =
    'Preview your LinkedIn post inside a realistic feed on desktop and mobile before you publish. See exactly how it looks next to other posts, including spacing, line breaks, and the see-more cutoff.'

export const metadata: Metadata = {
    title: { absolute: pageTitle },
    description: pageDescription,
    openGraph: {
        title: pageTitle,
        description: 'Preview your LinkedIn post inside a realistic feed on desktop and mobile before you publish.',
        url: `${site.url}/preview`,
    },
    alternates: {
        canonical: `${site.url}/preview`,
    },
}

type Props = {
    searchParams: Promise<{ draft?: string }>
}

const DIFFERENTIATORS = [
    {
        icon: LayoutGrid,
        title: 'In a real feed, not in isolation',
        body: 'The editor shows your post on its own. The feed preview drops it between other posts so you can judge whether your hook stands out while someone is scrolling.',
    },
    {
        icon: Monitor,
        title: 'Desktop and mobile widths',
        body: 'Line breaks and the "see more" truncation differ between desktop and mobile. Switch views to confirm your first lines land before the cutoff on both.',
    },
    {
        icon: Smartphone,
        title: 'Catch spacing and cutoffs early',
        body: 'See how spacing, emojis, lists, and link previews actually render in the feed, so nothing looks broken once it is live on LinkedIn.',
    },
]

export default async function PreviewPage({ searchParams }: Props) {
    const { draft } = await searchParams

    if (draft) {
        return <PreviewPageClient encodedDraft={draft} />
    }

    return (
        <div className='flex min-h-screen flex-col'>
            <header className='border-border border-b bg-white'>
                <div className='mx-auto flex h-14 max-w-[1128px] items-center px-4'>
                    <Link href='/' className='font-heading text-sm font-semibold tracking-tight text-neutral-900'>
                        LinkedIn Post Preview
                    </Link>
                </div>
            </header>

            <main className='mx-auto w-full max-w-3xl flex-1 px-6 py-16 text-center'>
                <span className='border-border text-primary shadow-subtle mb-4 inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium'>
                    Feed Preview
                </span>

                <h1 className='font-heading mb-4 text-4xl font-bold tracking-tight text-balance text-neutral-900 md:text-5xl'>
                    LinkedIn Feed Preview
                </h1>

                <p className='mx-auto mb-8 max-w-xl text-lg leading-7 text-neutral-500'>
                    See how your LinkedIn post looks inside a realistic feed, on desktop and mobile, before you hit
                    publish. Preview it next to other posts to check formatting, readability, and the see-more cutoff.
                </p>

                <div className='mb-16 flex flex-col items-center justify-center gap-3 sm:flex-row'>
                    <Button asChild size='lg'>
                        <Link href='/#tool'>
                            Write a post to preview
                            <ArrowRight className='size-4' />
                        </Link>
                    </Button>
                    <Button asChild variant='outline' size='lg'>
                        <Link href='/'>Free formatter and preview tool</Link>
                    </Button>
                </div>

                <div className='border-border bg-muted/30 rounded-2xl border p-8 text-left'>
                    <h2 className='font-heading mb-6 text-center text-2xl font-bold tracking-tight text-neutral-900'>
                        How the feed preview is different from the editor
                    </h2>
                    <div className='grid gap-6 sm:grid-cols-3'>
                        {DIFFERENTIATORS.map((item) => (
                            <div key={item.title}>
                                <div className='border-border text-primary shadow-subtle mb-3 inline-flex size-9 items-center justify-center rounded-lg border bg-white'>
                                    <item.icon className='size-4' />
                                </div>
                                <h3 className='mb-1.5 text-sm font-semibold text-neutral-900'>{item.title}</h3>
                                <p className='text-sm leading-6 text-neutral-500'>{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className='mt-10 text-sm text-neutral-500'>
                    To preview your own post, start in the{' '}
                    <Link href='/#tool' className='text-primary font-medium underline underline-offset-4'>
                        free editor
                    </Link>{' '}
                    and select "Feed preview".
                </p>
            </main>

            <footer className='border-border border-t bg-white py-4'>
                <div className='mx-auto max-w-[1128px] px-4 text-center'>
                    <Link href='/' className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'>
                        &copy; {new Date().getFullYear()} LinkedIn Post Preview
                    </Link>
                </div>
            </footer>
        </div>
    )
}
