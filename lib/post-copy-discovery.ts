export const JOB_DISCOVERY_KEY = 'lp-post-copy-job-shown-at'
export const JOB_DISCOVERY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export const VISITOR_JOBS = [
    { value: 'own_posts', label: 'My own LinkedIn posts' },
    { value: 'client_company_posts', label: 'Posts for clients or a company' },
    { value: 'ad_creative', label: 'Ad creative' },
    { value: 'other', label: 'Something else' },
] as const

export type VisitorJob = (typeof VISITOR_JOBS)[number]['value']
export type DiscoverySource = 'homepage' | 'formatter'

export function discoverySource(pathname: string, embedded: boolean): DiscoverySource | null {
    if (embedded) return null
    if (pathname === '/') return 'homepage'
    if (pathname === '/formatter') return 'formatter'
    return null
}

export function discoveryAvailable(local: Storage, session: Storage, now: number): boolean {
    if (session.getItem('fb_session_shown')) return false
    for (const key of [JOB_DISCOVERY_KEY, 'fb_dismissed_at']) {
        const raw = local.getItem(key)
        if (raw === null) continue
        const at = Number(raw)
        if (!raw.trim() || !Number.isFinite(at) || at <= 0 || now - at < JOB_DISCOVERY_COOLDOWN_MS) return false
    }
    return true
}

export function discoveryOverlap(local: Storage, session: Storage): 'local_marker_present' | 'unknown' {
    for (const storage of [local, session]) {
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i)
            if (key?.startsWith('lp-draft-first:')) return 'local_marker_present'
            if (key?.startsWith('lp-monthly-offer:') && key !== 'lp-monthly-offer:anonymous-id') {
                return 'local_marker_present'
            }
        }
    }
    return 'unknown'
}
