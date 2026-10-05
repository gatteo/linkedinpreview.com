import { parseEntrySource, type ResolvedEntrySource } from '@/config/entry-sources'

export const MONTHLY_COHORT = 'exp9_monthly_first_v2'
export const MONTHLY_OFFER_VERSION = 'monthly_first_v2'
const KEY = 'lp-monthly-offer:'
const FIRST_TOUCH = 'lp-offer-first-touch'
const memory = new Map<string, MonthlyEnrollment>()
let activeUser: string | null = null
let firstTouch: ResolvedEntrySource | null = null
let arrivalSource: ResolvedEntrySource = 'direct'

export type MonthlyEnrollment = {
    enrollmentId: string
    eligibilityAt: string
    entrySource: ResolvedEntrySource
    billingState: 'free' | 'paid' | 'unknown'
    identityState: 'authenticated' | 'anonymous'
    releaseSha: string
    deviceClass: 'mobile' | 'desktop'
}

export function rememberOfferEntry(source: ResolvedEntrySource) {
    arrivalSource = source
    try {
        const stored = localStorage.getItem(FIRST_TOUCH)
        if (stored) firstTouch = parseEntrySource(stored)
        if (!firstTouch && !['billing_return', 'oauth_return'].includes(source)) {
            firstTouch = source
            localStorage.setItem(FIRST_TOUCH, source)
        }
    } catch {
        if (!firstTouch && !['billing_return', 'oauth_return'].includes(source)) firstTouch = source
    }
}

export function readMonthlyEnrollment(userId = activeUser): MonthlyEnrollment | null {
    if (!userId) return null
    try {
        const raw = localStorage.getItem(KEY + userId)
        const value = raw ? JSON.parse(raw) : memory.get(userId)
        if (value && /^[0-9a-f-]{36}$/i.test(value.enrollmentId) && Number.isFinite(Date.parse(value.eligibilityAt))) {
            memory.set(userId, value)
            return value
        }
    } catch {}
    return memory.get(userId) ?? null
}

export function enrollMonthlyOffer(input: {
    userId: string | null
    billingState: MonthlyEnrollment['billingState']
    isAnonymous: boolean
    capture: (event: string, props: Record<string, unknown>) => void
}): MonthlyEnrollment {
    let anonymousId: string
    try {
        anonymousId = localStorage.getItem(KEY + 'anonymous-id') || crypto.randomUUID()
        localStorage.setItem(KEY + 'anonymous-id', anonymousId)
    } catch {
        anonymousId = activeUser || crypto.randomUUID()
    }
    const userId = input.userId || anonymousId
    activeUser = userId
    const existing = readMonthlyEnrollment(userId) || (input.userId ? readMonthlyEnrollment(anonymousId) : null)
    if (existing) {
        if (input.userId && !readMonthlyEnrollment(userId)) {
            memory.set(userId, existing)
            try {
                localStorage.setItem(KEY + userId, JSON.stringify(existing))
            } catch {}
            input.capture('paid_conversion_identity_linked', {
                ...monthlyOfferProperties(existing),
                identity_state: 'authenticated',
            })
        }
        return existing
    }
    const state: MonthlyEnrollment = {
        enrollmentId: crypto.randomUUID(),
        eligibilityAt: new Date().toISOString(),
        entrySource: firstTouch || 'direct',
        billingState: input.billingState,
        identityState: input.userId && !input.isAnonymous ? 'authenticated' : 'anonymous',
        releaseSha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unavailable',
        deviceClass: window.innerWidth < 768 ? 'mobile' : 'desktop',
    }
    memory.set(userId, state)
    try {
        localStorage.setItem(KEY + userId, JSON.stringify(state))
    } catch {}
    input.capture('paid_conversion_eligible', monthlyOfferProperties(state))
    return state
}

export function monthlyOfferProperties(state = readMonthlyEnrollment()): Record<string, unknown> {
    return state
        ? {
              schema_version: 1,
              enrollment_id: state.enrollmentId,
              cohort_id: MONTHLY_COHORT,
              assigned_variant: 'monthly_first',
              eligibility_at: state.eligibilityAt,
              assignment_version: MONTHLY_OFFER_VERSION,
              release_sha: state.releaseSha,
              offer_version: MONTHLY_OFFER_VERSION,
              entry_source: state.entrySource,
              arrival_source: arrivalSource,
              device_class: state.deviceClass,
              billing_state_at_assignment: state.billingState,
              identity_state: state.identityState,
          }
        : {}
}

export function monthlyCheckoutAttribution(userId: string | null) {
    activeUser = userId
    const state = readMonthlyEnrollment(userId)
    return state
        ? {
              enrollmentId: state.enrollmentId,
              cohortId: MONTHLY_COHORT,
              assignedVariant: 'monthly_first' as const,
              eligibilityAt: state.eligibilityAt,
              offerVersion: MONTHLY_OFFER_VERSION,
              entrySource: state.entrySource,
              billingState: state.billingState,
              releaseSha: state.releaseSha,
          }
        : undefined
}
