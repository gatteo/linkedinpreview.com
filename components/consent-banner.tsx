'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Routes } from '@/config/routes'
import { useConsent } from '@/hooks/use-consent'
import { useModalOpen } from '@/hooks/use-modal-open'
import { Button } from '@/components/ui/button'

// Bottom-left so it never covers the Featurebase launcher or the feedback FAB
// (both bottom-right). Not shown inside the third-party /embed variant, and
// deferred while any dialog is open - on small screens the onboarding modal
// leaves little clearance, and this banner's z-index sits above every dialog
// so it would otherwise paint over (and, via body's scroll-lock pointer-events
// none, deafen) the modal's own controls. See GH #25.
export function ConsentBanner() {
    const { consent, isReady, accept, decline } = useConsent()
    const pathname = usePathname()
    const modalOpen = useModalOpen()

    if (!isReady || consent !== null || pathname.startsWith('/embed') || modalOpen) return null

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
