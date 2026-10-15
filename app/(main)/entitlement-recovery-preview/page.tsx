import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { isEntitlementRecoveryPreviewAvailable } from '@/lib/billing/entitlement-recovery-preview'
import { EntitlementRecoveryPreview } from '@/components/billing/entitlement-recovery-preview'

export const metadata: Metadata = {
    title: 'Entitlement recovery preview - LinkedInPreview.com',
    robots: { index: false, follow: false },
}

export default function EntitlementRecoveryPreviewPage() {
    if (!isEntitlementRecoveryPreviewAvailable(process.env)) notFound()

    return (
        <section className='px-4 py-16 sm:px-6'>
            <div className='mx-auto max-w-2xl space-y-6'>
                <div className='space-y-2'>
                    <p className='text-primary text-sm font-semibold'>Preview environment only</p>
                    <h1 className='text-3xl font-bold tracking-tight'>Recover paid access safely</h1>
                    <p className='text-muted-foreground'>
                        Rehearse the self-service recovery outcomes without touching a customer, payment, or entitlement
                        record.
                    </p>
                </div>
                <EntitlementRecoveryPreview />
            </div>
        </section>
    )
}
