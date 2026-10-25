import type { SupabaseClient } from '@supabase/supabase-js'

export const VISITOR_WRITING_VERSION = 'visitor_writing_v1'
export const VISITOR_WRITING_KEY = 'lp-visitor-writing-v1'

export type WritingEnrollment = {
    enrollmentId: string
    eligibilityAt: string
    userId: string
    releaseSha: string
    version: typeof VISITOR_WRITING_VERSION
    historicalOverlap: 'unknown'
}

type ReadableStorage = Pick<Storage, 'getItem' | 'key' | 'length'>
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function writingExclusion(local: ReadableStorage, session: ReadableStorage): string | null {
    try {
        for (const store of [local, session]) {
            for (let i = 0; i < store.length; i++) {
                const key = store.key(i)
                if (!key) continue
                if (
                    key === 'lp-daily-test-enrollment-v1' ||
                    key.startsWith('lp-draft-first:') ||
                    (key.startsWith('lp-monthly-offer:') && key !== 'lp-monthly-offer:anonymous-id')
                ) {
                    const raw = store.getItem(key)
                    if (raw !== null) {
                        try {
                            JSON.parse(raw)
                        } catch {
                            return 'corrupt_exclusion_state'
                        }
                        return 'known_enrollment'
                    }
                }
            }
        }
        const anonymousId = local.getItem('lp-monthly-offer:anonymous-id')
        if (anonymousId !== null && !uuid.test(anonymousId)) return 'corrupt_exclusion_state'
        return null
    } catch {
        return 'storage_unavailable'
    }
}

export function readWritingEnrollment(store: Pick<Storage, 'getItem'>): WritingEnrollment | null {
    const raw = store.getItem(VISITOR_WRITING_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as WritingEnrollment
    if (
        value.version !== VISITOR_WRITING_VERSION ||
        value.historicalOverlap !== 'unknown' ||
        !uuid.test(value.enrollmentId) ||
        !uuid.test(value.userId) ||
        !Number.isFinite(Date.parse(value.eligibilityAt)) ||
        !/^([0-9a-f]{40}|unavailable)$/.test(value.releaseSha)
    ) {
        throw new Error('Invalid writing enrollment')
    }
    return value
}

export function writingProperties(enrollment: WritingEnrollment) {
    return {
        job_enrollment_id: enrollment.enrollmentId,
        job_eligibility_at: enrollment.eligibilityAt,
        job_flow_version: enrollment.version,
        job_source: 'public_post_copy',
        job: 'writing_help',
        historical_overlap: enrollment.historicalOverlap,
        billing_state_at_assignment: 'free',
        release_sha: enrollment.releaseSha,
    }
}

export function acceptedWritingValue(text: string): boolean {
    const value = text.trim()
    return !!value && !value.startsWith('[REFUSED]') && !value.startsWith('[RATE_LIMITED]')
}

export async function readVisitorWritingPlan(client: SupabaseClient, userId: string): Promise<'free' | 'unavailable'> {
    const { data, error } = await client
        .from('billing')
        .select('user_id, plan, stripe_customer_id, stripe_subscription_id')
        .eq('user_id', userId)
        .maybeSingle()
    if (error) throw error
    if (!data) return 'free'
    if (data.user_id !== userId || !['free', 'pro', 'lifetime'].includes(data.plan))
        throw new Error('Billing unresolved')
    if (data.plan !== 'free' || data.stripe_customer_id || data.stripe_subscription_id) return 'unavailable'
    return 'free'
}
