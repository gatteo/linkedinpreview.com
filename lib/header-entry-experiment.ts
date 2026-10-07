export const HEADER_ENTRY_TEST = 'EXP-11'
export const HEADER_ENTRY_FLAG = 'onb-header-pro-entry'
export const DAILY_ENROLLMENT_KEY = 'lp-daily-test-enrollment-v1'
export const HEADER_ASSIGNMENT_VERSION = 'exp11_header_v1'

export type HeaderEnrollment = {
    testId: typeof HEADER_ENTRY_TEST
    enrollmentId: string
    eligibilityAt: string
    assignmentVersion: typeof HEADER_ASSIGNMENT_VERSION
    variant: 'control' | 'pro'
    assignmentStatus: 'assigned' | 'flag_unavailable' | 'storage_unavailable' | 'analytics_unavailable'
    releaseSha: string
}

export type HeaderAssignment = { enrollment: HeaderEnrollment; renderedVariant: 'control' | 'pro' }

const memory = new Map<string, HeaderEnrollment>()

export function headerEntryProperties(state: HeaderEnrollment, renderedVariant = state.variant) {
    return {
        test_id: state.testId,
        enrollment_id: state.enrollmentId,
        eligibility_at: state.eligibilityAt,
        assignment_version: state.assignmentVersion,
        variant: state.variant,
        rendered_variant: renderedVariant,
        assignment_status: state.assignmentStatus,
        entry_source: 'navbar',
        release_sha: state.releaseSha,
        downstream_release_cohort: 'not_resolved_at_header',
        billing_state_at_assignment: 'unknown',
    }
}

function validEnrollment(value: unknown): value is HeaderEnrollment {
    if (!value || typeof value !== 'object') return false
    const state = value as HeaderEnrollment
    return (
        state.testId === HEADER_ENTRY_TEST &&
        state.assignmentVersion === HEADER_ASSIGNMENT_VERSION &&
        typeof state.enrollmentId === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(state.enrollmentId) &&
        typeof state.eligibilityAt === 'string' &&
        Number.isFinite(Date.parse(state.eligibilityAt)) &&
        (state.variant === 'control' || state.variant === 'pro') &&
        ['assigned', 'flag_unavailable', 'storage_unavailable', 'analytics_unavailable'].includes(
            state.assignmentStatus,
        ) &&
        typeof state.releaseSha === 'string'
    )
}

export function enrollHeaderEntry(input: {
    storage: Pick<Storage, 'getItem' | 'setItem'>
    readVariant: () => string | undefined
    capture: (event: string, props: Record<string, unknown>) => void
    releaseSha: string
    createId: () => string
    now: () => string
}): HeaderAssignment | null {
    let stored: HeaderEnrollment | undefined
    let storageAvailable = true
    try {
        const raw = input.storage.getItem(DAILY_ENROLLMENT_KEY)
        const value: unknown = raw ? JSON.parse(raw) : undefined
        if (value && typeof value === 'object' && 'testId' in value && value.testId !== HEADER_ENTRY_TEST) return null
        if (validEnrollment(value)) stored = value
        else if (raw) storageAvailable = false
    } catch {
        storageAvailable = false
    }
    stored ??= memory.get(DAILY_ENROLLMENT_KEY)
    const state: HeaderEnrollment = stored ?? {
        testId: HEADER_ENTRY_TEST,
        enrollmentId: input.createId(),
        eligibilityAt: input.now(),
        assignmentVersion: HEADER_ASSIGNMENT_VERSION,
        variant: 'control',
        assignmentStatus: 'flag_unavailable',
        releaseSha: input.releaseSha,
    }
    let analyticsAvailable = true
    try {
        input.capture('daily_test_eligible', {
            ...headerEntryProperties(state),
            variant: stored ? state.variant : 'pending',
            rendered_variant: 'control',
            resumed: !!stored,
        })
    } catch {
        analyticsAvailable = false
    }
    let liveVariant: string | undefined
    try {
        liveVariant = input.readVariant()
    } catch {}
    const flagAvailable = liveVariant === 'control' || liveVariant === 'pro'
    if (!stored) {
        state.variant = liveVariant === 'pro' && storageAvailable && analyticsAvailable ? 'pro' : 'control'
        state.assignmentStatus = !analyticsAvailable
            ? 'analytics_unavailable'
            : !storageAvailable
              ? 'storage_unavailable'
              : flagAvailable
                ? 'assigned'
                : 'flag_unavailable'
        try {
            input.storage.setItem(DAILY_ENROLLMENT_KEY, JSON.stringify(state))
        } catch {
            state.variant = 'control'
            state.assignmentStatus = 'storage_unavailable'
            storageAvailable = false
        }
        memory.set(DAILY_ENROLLMENT_KEY, state)
    }
    try {
        input.capture('daily_test_assigned', { ...headerEntryProperties(state), resumed: !!stored })
    } catch {
        analyticsAvailable = false
    }
    const renderedVariant = flagAvailable && storageAvailable && analyticsAvailable ? state.variant : 'control'
    return { enrollment: state, renderedVariant }
}
