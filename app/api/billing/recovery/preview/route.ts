import {
    handleEntitlementRecoveryPreview,
    isEntitlementRecoveryPreviewAvailable,
} from '@/lib/billing/entitlement-recovery-preview'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    return handleEntitlementRecoveryPreview(request, isEntitlementRecoveryPreviewAvailable(process.env))
}
