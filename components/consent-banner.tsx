'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Routes } from '@/config/routes'
import { useConsent } from '@/hooks/use-consent'
import { Button } from '@/components/ui/button'

// Bottom-left so it never covers the Featurebase launcher or the feedback FAB
// (both bottom-right). Not shown inside the third-party /embed variant.
export function ConsentBanner() {
    const { consent, isReady, accept, decline } = useConsent()
    const pathname = usePathname()

    if (!isReady || consent !== null || pathname.startsWith('/embed')) return null

    return (
        <div className='bg-background border-border shadow-subtle fixed bottom-4 left-4 z-[130] w-[calc(100%-2rem)] max-w-sm rounded-xl border p-4'>
            <p className='text-muted-foreground text-[13px] leading-relaxed'>
                We use cookies for analytics to understand how the product is used and improve it. See our{' '}
                <Link href={Routes.Privacy} className='text-foreground underline underline-offset-2'>
                    Privacy Policy
                </Link>
                .
            </p>
            <div className='mt-3 flex justify-end gap-2'>
                <Button variant='outline' size='sm' onClick={decline}>
                    Decline
                </Button>
                <Button size='sm' onClick={accept}>
                    Accept
                </Button>
            </div>
        </div>
    )
}
