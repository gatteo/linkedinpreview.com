'use client'

import * as React from 'react'

import { getRoleContent, resolveRole, type Role, type RoleContent } from '@/config/onboarding-personalization'

import type { OnboardingAnswers, StepId } from './types'

// ---------------------------------------------------------------------------
// Onboarding context
//
// The flow has 13 steps that all need the same handlers (answers, navigation,
// finish, LinkedIn connect) plus the role-derived personalization. A context
// keeps each step component small and avoids threading a dozen props through the
// modal's step switch.
// ---------------------------------------------------------------------------

export type OnboardingContextValue = {
    answers: OnboardingAnswers
    update: (patch: Partial<OnboardingAnswers>) => void
    goNext: () => void
    goBack: () => void
    /** Skip the current (data) step - advances using whatever data we have. */
    skip: () => void
    goTo: (step: StepId) => void
    /** Leaving the offer: persist everything, then land on the done screen. */
    finishOffer: (converted: boolean) => void
    /** Done screen handoff: close the modal and open the first post. */
    complete: () => void
    connectLinkedin: () => void
    /** Bind the entered email to the anonymous Supabase user (converts it to
     *  permanent without changing user.id). `taken` = the email already belongs
     *  to another account, so the step surfaces a soft message and still advances. */
    bindEmail: (email: string) => Promise<{ ok: boolean; taken?: boolean }>
    /** The current auth user's email, if one is already set (resume prefill). */
    userEmail?: string | null
    linkedinError?: string | null
    /** Whether the user converted (set when leaving the offer); drives the done screen. */
    converted: boolean
    /** Resolved role (defaults to creator/generalist) and its content cell. */
    role: Role
    roleContent: RoleContent
    /** Suppresses Escape/outside-click/X dismissal while a step is showing an
     *  overlay that must not be interrupted (the commitment popup, an
     *  in-flight/open Stripe checkout) - normal dismissal resumes once cleared. */
    setUninterruptible: (value: boolean) => void
}

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null)

export function useOnboarding(): OnboardingContextValue {
    const ctx = React.useContext(OnboardingContext)
    if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider')
    return ctx
}

type ProviderProps = {
    value: Omit<OnboardingContextValue, 'role' | 'roleContent'>
    children: React.ReactNode
}

export function OnboardingProvider({ value, children }: ProviderProps) {
    const full = React.useMemo<OnboardingContextValue>(
        () => ({
            ...value,
            role: resolveRole(value.answers.role),
            roleContent: getRoleContent(value.answers.role),
        }),
        [value],
    )
    return <OnboardingContext.Provider value={full}>{children}</OnboardingContext.Provider>
}
