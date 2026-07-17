// ---------------------------------------------------------------------------
// Cookie-consent state
//
// Single source of truth for the analytics consent choice. Before a choice is
// made, PostHog runs cookieless (memory persistence, no replay) and GTM does
// not load. "accepted" upgrades PostHog to persistent cookies + replay and
// loads GTM; "declined" keeps the cookieless mode permanently.
// ---------------------------------------------------------------------------

export type ConsentChoice = 'accepted' | 'declined'

const CONSENT_KEY = 'lp-consent'
const CONSENT_EVENT = 'lp-consent-change'

export function getConsent(): ConsentChoice | null {
    if (typeof window === 'undefined') return null
    try {
        const value = localStorage.getItem(CONSENT_KEY)
        return value === 'accepted' || value === 'declined' ? value : null
    } catch {
        return null
    }
}

export function setConsent(choice: ConsentChoice): void {
    try {
        localStorage.setItem(CONSENT_KEY, choice)
    } catch {}
    window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_EVENT, { detail: choice }))
}

export function onConsentChange(callback: (choice: ConsentChoice) => void): () => void {
    const handler = (event: Event) => callback((event as CustomEvent<ConsentChoice>).detail)
    window.addEventListener(CONSENT_EVENT, handler)
    return () => window.removeEventListener(CONSENT_EVENT, handler)
}
