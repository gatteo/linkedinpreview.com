import Link from 'next/link'
import { UtmUrl } from '@/utils/urls'

import { UtmMediums } from '@/types/urls'

export const metadata = {
    title: '404 - Page Not Found',
    description: 'The page you are looking for could not be found.',
}

export default function NotFound() {
    return (
        <div className='flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6'>
            <div className='text-center'>
                <p className='mb-2 text-sm font-medium tracking-wider text-neutral-400 uppercase'>404</p>
                <h1 className='font-heading mb-4 text-4xl font-bold text-neutral-900'>Page not found</h1>
                <p className='text-lg text-neutral-500'>
                    Sorry, we couldn&apos;t find the page you&apos;re looking for.
                </p>
            </div>
            <Link
                href={UtmUrl('/', {
                    medium: UtmMediums.Homepage,
                    content: '404',
                })}
                className='bg-primary text-primary-foreground shadow-subtle hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors'>
                Go to Home
            </Link>
        </div>
    )
}
