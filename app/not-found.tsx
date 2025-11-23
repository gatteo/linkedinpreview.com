import Link from 'next/link'
import { UtmUrl } from '@/utils/urls'

import { UtmMediums } from '@/types/urls'

export const metadata = {
    title: '404 - Page Not Found',
    description: 'The page you are looking for could not be found.',
}

export default function NotFound() {
    return (
        <div className='mb-40 mt-52 flex flex-col items-center justify-center gap-12'>
            <h1 className='text-center text-6xl font-bold'>Page Not Found</h1>
            <p className='text-center text-xl text-muted-foreground'>
                Sorry, we couldn't find the page you're looking for.
            </p>
            <Link
                href={UtmUrl('/', {
                    medium: UtmMediums.Homepage,
                    content: '404',
                })}
                className='rounded-lg border px-3 py-2 transition-colors duration-150'>
                Go to Home
            </Link>
        </div>
    )
}
