import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

import LogoImage from '/public/images/logo-rounded-rectangle.png'

export function Logo({ className }: { className?: string }) {
    return (
        <Link href='/' className={cn('', className)} aria-label='Homepage'>
            <div className='block'>
                <Image src={LogoImage} placeholder='blur' height={40} width={40} alt='Tech Career Launch Logo' />
            </div>
        </Link>
    )
}
