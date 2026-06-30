// ---------------------------------------------------------------------------
// Debug command channel for the onboarding modal.
//
// The OnboardingController owns the modal's open state, but the dev-only debug
// menu (a sibling in the dashboard layout) needs to drive it imperatively
// (open / close the live modal). A tiny window CustomEvent bus keeps the two
// decoupled without threading a context through the layout.
// ---------------------------------------------------------------------------

export type OnboardingDebugCommand = 'open' | 'close'

const EVENT = 'lp-onboarding-debug'

export function emitOnboardingDebug(command: OnboardingDebugCommand) {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent<OnboardingDebugCommand>(EVENT, { detail: command }))
}

export function onOnboardingDebug(handler: (command: OnboardingDebugCommand) => void) {
    const listener = (e: Event) => handler((e as CustomEvent<OnboardingDebugCommand>).detail)
    window.addEventListener(EVENT, listener)
    return () => window.removeEventListener(EVENT, listener)
}
