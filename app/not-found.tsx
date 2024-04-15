import Link from 'next/link'
import { UtmUrl } from '@/utils/urls'

import { UtmMediums } from '@/types/urls'

export const metadata = {
    title: '404',
}

export default function NotFound() {
    return (
        <div className='mb-40 mt-52 flex flex-col items-center justify-center gap-12'>
            <h1 className='text-center text-6xl font-bold'>oopz qui non c'è nulla.</h1>
            <Link
                href={UtmUrl('/', {
                    medium: UtmMediums.Homepage,
                    content: 'hero',
                })}
                className='rounded-lg border px-3 py-2 transition-colors duration-150'>
                vai alla home
            </Link>
        </div>
    )
}
