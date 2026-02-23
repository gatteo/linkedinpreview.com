import Link from 'next/link'

import { ExternalLinks } from '@/config/urls'

import { Icons } from '../icon'
import { TrackClick } from '../tracking/track-click'
import { Button } from '../ui/button'

export function OpenSource() {
    return (
        <section id='opensource' className='border-t border-border bg-neutral-50'>
            <div className='mx-auto max-w-content px-6 py-20 md:py-28'>
                <div className='flex flex-col items-center text-center'>
                    <div className='mb-6 flex size-12 items-center justify-center rounded-xl border border-border bg-white shadow-subtle'>
                        <Icons.github className='size-6' />
                    </div>
                    <h2 className='mb-4 font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
                        Proudly open source
                    </h2>
                    <p className='mx-auto mb-8 max-w-[520px] text-lg leading-7 text-neutral-500'>
                        Our product is open source and we encourage contributions from our community. Support us by
                        starring the repository.
                    </p>
                    <TrackClick event='github_link_clicked' properties={{ source: 'opensource_section' }}>
                        <Button asChild className='rounded-lg'>
                            <Link href={ExternalLinks.GitHub}>Support us on GitHub</Link>
                        </Button>
                    </TrackClick>
                </div>
            </div>
        </section>
    )
}
