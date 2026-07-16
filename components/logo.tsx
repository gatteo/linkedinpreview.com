import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
    return (
        <Link href='/' className={cn('', className)} aria-label='Homepage'>
            <div className='block'>
                <Image src='/images/logo.svg' height={40} width={40} alt='' unoptimized />
            </div>
        </Link>
    )
}
