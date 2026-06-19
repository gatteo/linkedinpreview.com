'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Routes } from '@/config/routes'
import { useBranding } from '@/hooks/use-branding'
import { useStrategy } from '@/hooks/use-strategy'
import { useAuth } from '@/components/dashboard/auth-provider'

import { OnboardingModal, type StepId } from './onboarding-modal'
import { clearResume, initialAnswers, persistResume, readResume, type OnboardingAnswers } from './types'

// ---------------------------------------------------------------------------
// OnboardingController — gates the setup modal and bridges it to persistence.
//
// useBranding/useStrategy are per-call local state (not shared contexts), so the
// controller owns the single instances the gate reacts to and hands their
// updaters down. It mounts inside the dashboard layout, which also wraps
// /dashboard/settings — that's how it catches the LinkedIn OAuth redirect.
// ---------------------------------------------------------------------------

export function OnboardingController() {
    const { isReady } = useAuth()
    const { branding, isLoading: brandingLoading, updateBranding } = useBranding()
    const { strategy, isLoading: strategyLoading, updateStrategy } = useStrategy()
    const router = useRouter()

    const [open, setOpen] = React.useState(false)
    const [startStepId, setStartStepId] = React.useState<StepId>('welcome')
    const [linkedinError, setLinkedinError] = React.useState<string | null>(null)
    const [resumeAnswers, setResumeAnswers] = React.useState<OnboardingAnswers | null>(null)
    const decidedRef = React.useRef(false)

    const ready = isReady && !brandingLoading && !strategyLoading

    React.useEffect(() => {
        if (!ready || decidedRef.current) return

        // 1. Resuming the LinkedIn OAuth round-trip?
        const resume = readResume()
        if (resume) {
            decidedRef.current = true
            const params = new URLSearchParams(window.location.search)
            const status = params.get('linkedin')
            const connected = status === 'connected'

            // Prefer the user's own answers, but fill identity gaps from the
            // freshly-synced branding profile (name/avatar from LinkedIn).
            setResumeAnswers({
                ...resume.answers,
                profile: {
                    name: resume.answers.profile.name || branding.profile.name,
                    headline: resume.answers.profile.headline || branding.profile.headline,
                    avatarUrl: resume.answers.profile.avatarUrl || branding.profile.avatarUrl,
                },
                linkedinConnected: connected || resume.answers.linkedinConnected,
            })
            if (connected) {
                setStartStepId('profile')
            } else {
                setStartStepId('linkedin')
                if (status) setLinkedinError(status)
            }
            clearResume()
            setOpen(true)
            // Drop the ?linkedin=… param and land back on the dashboard; the
            // controller (and modal) persist across this same-layout navigation.
            router.replace(Routes.Dashboard)
            return
        }

        // 2. Already onboarded — never show again.
        if (branding.meta.onboardedAt) {
            decidedRef.current = true
            return
        }

        // 3. Pre-existing user (has strategy/role but predates onboardedAt):
        // silently backfill the flag so we don't nag them.
        if (strategy.completedAt || branding.role !== '') {
            decidedRef.current = true
            updateBranding({ meta: { onboardedAt: new Date().toISOString() } })
            return
        }

        // 4. Genuinely new — open the setup.
        decidedRef.current = true
        setOpen(true)
    }, [ready, branding, strategy, updateBranding, router])

    const handleFinish = (answers: OnboardingAnswers) => {
        const now = new Date().toISOString()
        updateBranding({
            profile: answers.profile,
            role: answers.role,
            expertise: { topics: answers.topics.filter(Boolean) },
            positioning: { statement: answers.positioning },
            writingStyle: answers.writingStyle,
            meta: { onboardedAt: now },
        })
        updateStrategy({
            goals: answers.goals,
            audience: answers.audience,
            frequency: answers.frequency,
            schedule: answers.schedule,
            formats: answers.formats,
            completedAt: now,
        })
        setOpen(false)
        toast.success("You're all set — your brand is ready.")
    }

    const handleSkipSetup = () => {
        updateBranding({ meta: { onboardedAt: new Date().toISOString() } })
        setOpen(false)
    }

    const handleConnectLinkedin = (answers: OnboardingAnswers) => {
        persistResume(answers)
        window.location.href = '/api/linkedin/auth'
    }

    if (!open) return null

    return (
        <OnboardingModal
            open={open}
            initialAnswers={resumeAnswers ?? initialAnswers(branding, strategy)}
            startStepId={startStepId}
            linkedinError={linkedinError}
            onFinish={handleFinish}
            onSkipSetup={handleSkipSetup}
            onConnectLinkedin={handleConnectLinkedin}
        />
    )
}
