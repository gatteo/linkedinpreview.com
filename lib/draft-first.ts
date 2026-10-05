import { parseEntrySource, type ResolvedEntrySource } from '@/config/entry-sources'

export const ACTIVATION_PARAM = 'activation'
export const PLANNING_PARAM = 'planning'
export const DRAFT_FIRST_VERSION = 'imported_draft_v1'
const KEY = 'lp-draft-first:'
const memory = new Map<string, DraftFirstState>()
let activeUser: string | null = null

export type DraftFirstState = {
    version: typeof DRAFT_FIRST_VERSION
    entrySource: ResolvedEntrySource
    exposureId: string
    eligibilityAt?: string
    draftId?: string
    used?: boolean
}

export function prepareDraftFirst(entrySource: ResolvedEntrySource, exposureId: string): DraftFirstState {
    const state: DraftFirstState = {
        version: DRAFT_FIRST_VERSION,
        entrySource,
        exposureId,
        eligibilityAt: new Date().toISOString(),
    }
    try {
        sessionStorage.setItem(KEY + exposureId, JSON.stringify(state))
    } catch {}
    return state
}

export function intentionalDraftImport(pathname: string, params: URLSearchParams): boolean {
    return (
        pathname === '/dashboard/editor' &&
        !!params.get('import') &&
        ['tool_header', 'tool_footer', 'tool_nudge'].includes(params.get('from') ?? '') &&
        params.get(PLANNING_PARAM) !== '1'
    )
}

export type PlanningGate =
    | 'completed'
    | 'settings'
    | 'oauth'
    | 'resume'
    | 'upgrade_return'
    | 'plan'
    | 'legacy'
    | 'defer'

export function planningGate(input: {
    completed: boolean
    legacy: boolean
    saved: boolean
    linkedinStatus: string | null
    onboardingLinkedinStatus: boolean
    upgradeReturn: boolean
    explicit: boolean
    imported: boolean
    deferred: boolean
}): PlanningGate {
    if (input.completed && !input.explicit) return 'completed'
    if (input.linkedinStatus && !input.onboardingLinkedinStatus) return 'settings'
    if (input.saved && input.linkedinStatus) return 'oauth'
    if (input.upgradeReturn) return 'upgrade_return'
    if (input.saved) return 'resume'
    if (input.explicit) return 'plan'
    if (input.legacy) return 'legacy'
    if (input.imported || input.deferred) return 'defer'
    return 'plan'
}

export function readDraftFirst(userId: string | null): DraftFirstState | null {
    activeUser = userId
    if (!userId) return null
    try {
        const raw = localStorage.getItem(KEY + userId)
        const state = raw ? (JSON.parse(raw) as DraftFirstState) : memory.get(userId)
        if (
            state?.version === DRAFT_FIRST_VERSION &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(state.exposureId)
        ) {
            memory.set(userId, state)
            return state
        }
    } catch {
        return memory.get(userId) ?? null
    }
    return null
}

export function writeDraftFirst(userId: string, state: DraftFirstState) {
    activeUser = userId
    memory.set(userId, state)
    try {
        localStorage.setItem(KEY + userId, JSON.stringify(state))
    } catch {}
}

export function deferPlanning(userId: string, params: URLSearchParams): DraftFirstState {
    const existing = readDraftFirst(userId)
    if (existing) return existing
    const param = params.get(ACTIVATION_PARAM)
    const exposureId =
        param && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param)
            ? param
            : crypto.randomUUID()
    const state: DraftFirstState = {
        version: DRAFT_FIRST_VERSION,
        entrySource: parseEntrySource(params.get('from')),
        exposureId,
    }
    try {
        const raw = sessionStorage.getItem(KEY + exposureId)
        const pending = raw ? JSON.parse(raw) : null
        if (pending?.exposureId === exposureId && pending.version === DRAFT_FIRST_VERSION) {
            state.eligibilityAt = pending.eligibilityAt
            state.entrySource = parseEntrySource(pending.entrySource)
        }
    } catch {}
    writeDraftFirst(userId, state)
    return state
}

export function draftFirstProperties(state = readDraftFirst(activeUser)): Record<string, unknown> {
    return state
        ? {
              activation_version: state.version,
              exposure_id: state.exposureId,
              schema_version: 1,
              enrollment_id: state.exposureId,
              cohort_id: 'exp10_draft_first_v1',
              assigned_variant: 'draft_first',
              assignment_version: state.version,
              eligibility_at: state.eligibilityAt ?? null,
              offer_version: 'existing_offer',
              entry_source: state.entrySource,
          }
        : {}
}

export function requestPlanning() {
    window.dispatchEvent(new Event('lp-request-planning'))
}
