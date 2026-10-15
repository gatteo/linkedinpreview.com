export type RecoveryPreviewOutcome =
    | 'verified_paid_restored'
    | 'grandfathered_preserved'
    | 'stale_test_rejected'
    | 'unknown_rejected'

export interface RecoveryPreviewResult {
    mode: 'synthetic_preview'
    outcome: RecoveryPreviewOutcome
    classification: 'verified_paid' | 'grandfathered_non_revenue' | 'stale_test' | 'unknown'
    plan: 'pro' | 'lifetime' | null
    restored: boolean
    accessPreserved: boolean
    paidImportSimulated: boolean
    grant: 'simulated_restore' | 'legacy_fallback' | 'none'
    writesPerformed: false
    message: string
}

const MAX_BODY_BYTES = 256
const RECOVERY_CODE = /^[a-z0-9-]{1,64}$/
const VERIFIED_PAID_CODE = /^verified-paid-(0[1-9]|1[0-5])$/

export function isEntitlementRecoveryPreviewAvailable(environment: {
    VERCEL_ENV?: string
    NODE_ENV?: string
}): boolean {
    return environment.VERCEL_ENV === 'preview' || environment.NODE_ENV === 'development'
}

export function evaluateSyntheticRecoveryCode(recoveryCode: string): RecoveryPreviewResult {
    const code = recoveryCode.trim().toLowerCase()
    const paidMatch = VERIFIED_PAID_CODE.exec(code)

    if (paidMatch) {
        const paidIndex = Number(paidMatch[1])
        return {
            mode: 'synthetic_preview',
            outcome: 'verified_paid_restored',
            classification: 'verified_paid',
            plan: paidIndex <= 12 ? 'lifetime' : 'pro',
            restored: true,
            accessPreserved: true,
            paidImportSimulated: true,
            grant: 'simulated_restore',
            writesPerformed: false,
            message: 'Verified paid purchase found. Pro access would be restored.',
        }
    }

    if (code === 'grandfathered-lifetime') {
        return {
            mode: 'synthetic_preview',
            outcome: 'grandfathered_preserved',
            classification: 'grandfathered_non_revenue',
            plan: 'lifetime',
            restored: false,
            accessPreserved: true,
            paidImportSimulated: false,
            grant: 'legacy_fallback',
            writesPerformed: false,
            message: 'Existing lifetime access stays preserved. No paid entitlement is imported.',
        }
    }

    if (code === 'stale-test-pro') {
        return {
            mode: 'synthetic_preview',
            outcome: 'stale_test_rejected',
            classification: 'stale_test',
            plan: null,
            restored: false,
            accessPreserved: false,
            paidImportSimulated: false,
            grant: 'none',
            writesPerformed: false,
            message: 'This test-mode record is not eligible. No access is granted.',
        }
    }

    return {
        mode: 'synthetic_preview',
        outcome: 'unknown_rejected',
        classification: 'unknown',
        plan: null,
        restored: false,
        accessPreserved: false,
        paidImportSimulated: false,
        grant: 'none',
        writesPerformed: false,
        message: 'No verified paid purchase was found. No access is granted.',
    }
}

export async function handleEntitlementRecoveryPreview(request: Request, enabled: boolean): Promise<Response> {
    if (!enabled) return Response.json({ error: 'Not found' }, { status: 404 })

    const contentLength = Number(request.headers.get('content-length') ?? '0')
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return Response.json({ error: 'Invalid recovery request' }, { status: 400 })
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'Invalid recovery request' }, { status: 400 })
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return Response.json({ error: 'Invalid recovery request' }, { status: 400 })
    }

    const recoveryCode = (body as { recoveryCode?: unknown }).recoveryCode
    if (typeof recoveryCode !== 'string' || !RECOVERY_CODE.test(recoveryCode.trim().toLowerCase())) {
        return Response.json({ error: 'Invalid recovery request' }, { status: 400 })
    }

    return Response.json(evaluateSyntheticRecoveryCode(recoveryCode))
}
