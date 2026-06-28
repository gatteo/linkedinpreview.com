'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { Routes } from '@/config/routes'
import { createDraft as createDraftApi } from '@/lib/supabase/drafts'
import { useBranding } from '@/hooks/use-branding'
import { useStrategy } from '@/hooks/use-strategy'
import { useAuth } from '@/components/dashboard/auth-provider'

import { postTextToDoc } from './ai'
import { OnboardingModal } from './onboarding-modal'
import {
    clearOnboarding,
    initialAnswers,
    persistOnboarding,
    readOnboarding,
    type OnboardingAnswers,
    type StepId,
} from './types'

// ---------------------------------------------------------------------------
// OnboardingController - gates the conversion flow and bridges it to persistence.
//
// useBranding/useStrategy are per-call local state (not shared contexts), so the
// controller owns the single instances the gate reacts to and hands their
// updaters down. It mounts inside the dashboard layout (which also wraps
// /dashboard/settings), so it catches the LinkedIn OAuth redirect.
// ---------------------------------------------------------------------------

export function OnboardingController() {
    const { isReady, userId, supabase } = useAuth()
    const { branding, isLoading: brandingLoading, updateBranding } = useBranding()
    const { strategy, isLoading: strategyLoading, updateStrategy } = useStrategy()
    const router = useRouter()

    const [open, setOpen] = React.useState(false)
    const [startStepId, setStartStepId] = React.useState<StepId>('welcome')
    const [linkedinError, setLinkedinError] = React.useState<string | null>(null)
    const [resumeAnswers, setResumeAnswers] = React.useState<OnboardingAnswers | null>(null)
    const decidedRef = React.useRef(false)
    const finishedRef = React.useRef(false)
    const firstDraftPromiseRef = React.useRef<Promise<{ id: string } | null> | null>(null)

    const ready = isReady && !brandingLoading && !strategyLoading

    React.useEffect(() => {
        if (!ready || decidedRef.current) return

        const saved = readOnboarding()
        const params = new URLSearchParams(window.location.search)
        const linkedinStatus = params.get('linkedin')

        // Already onboarded - never show again; clear any stale saved progress.
        if (branding.meta.onboardedAt) {
            decidedRef.current = true
            if (saved) clearOnboarding()
            return
        }

        // Returning from the LinkedIn OAuth round-trip mid-onboarding.
        if (saved && linkedinStatus) {
            decidedRef.current = true
            const connected = linkedinStatus === 'connected'
            setResumeAnswers({
                ...saved.answers,
                profile: {
                    name: saved.answers.profile.name || branding.profile.name,
                    headline: saved.answers.profile.headline || branding.profile.headline,
                    avatarUrl: saved.answers.profile.avatarUrl || branding.profile.avatarUrl,
                },
                linkedinConnected: connected || saved.answers.linkedinConnected,
            })
            if (connected) {
                setStartStepId('mirror')
            } else {
                setStartStepId('connect')
                setLinkedinError(linkedinStatus)
            }
            clearOnboarding()
            setOpen(true)
            router.replace(Routes.Dashboard)
            return
        }

        // Incremental resume after an accidental refresh mid-flow.
        if (saved) {
            decidedRef.current = true
            setResumeAnswers(saved.answers)
            setStartStepId(saved.resumeAt)
            setOpen(true)
            return
        }

        // Pre-existing user (has strategy/role but predates onboardedAt): backfill
        // the flag silently so we don't nag them.
        if (strategy.completedAt || branding.role !== '') {
            decidedRef.current = true
            updateBranding({ meta: { onboardedAt: new Date().toISOString() } })
            return
        }

        // Genuinely new - open the flow.
        decidedRef.current = true
        setOpen(true)
    }, [ready, branding, strategy, updateBranding, router])

    const handlePersist = React.useCallback((answers: OnboardingAnswers, step: StepId) => {
        persistOnboarding(answers, step)
    }, [])

    // Write-once at the offer (convert or decline). Persists branding + strategy,
    // stashes the first post as a draft so it survives into the dashboard, and
    // gates the modal closed via meta.onboardedAt.
    const handleFinish = React.useCallback(
        (answers: OnboardingAnswers, _converted: boolean) => {
            if (finishedRef.current) return
            finishedRef.current = true
            const now = new Date().toISOString()

            const topics = answers.topics.filter(Boolean)
            const effectiveTopics = topics.length ? topics : answers.niche ? [answers.niche] : []
            const goals = answers.goals.length ? answers.goals : answers.primaryGoal ? [answers.primaryGoal] : []
            const donts = answers.writingNotes?.trim()
                ? [...branding.dosDonts.donts, answers.writingNotes.trim()]
                : branding.dosDonts.donts
            const toneNote = answers.tone ? `Preferred tone: ${answers.tone}.` : ''
            const notes = [branding.knowledgeBase.notes, toneNote].filter(Boolean).join('\n')

            updateBranding({
                profile: answers.profile,
                role: answers.role,
                expertise: { topics: effectiveTopics },
                positioning: { statement: answers.positioning },
                writingStyle: answers.writingStyle,
                knowledgeBase: { notes },
                dosDonts: { dos: branding.dosDonts.dos, donts },
                meta: { onboardedAt: now },
            })
            updateStrategy({
                goals,
                audience: answers.audience,
                frequency: answers.frequency,
                schedule: answers.schedule,
                formats: answers.formats,
                completedAt: now,
            })

            // Stash the generated first post as a draft (endowment - it waits for
            // them in the dashboard whether or not they converted). Keep the promise
            // so the done-screen handoff can await it and deep-link to the editor.
            firstDraftPromiseRef.current =
                answers.firstPostText && userId
                    ? createDraftApi(supabase, userId, postTextToDoc(answers.firstPostText), 'My first post').catch(
                          () => null,
                      )
                    : null

            clearOnboarding()
        },
        [branding, updateBranding, updateStrategy, supabase, userId],
    )

    const handleComplete = React.useCallback(async () => {
        let id: string | null = null
        try {
            const entry = await firstDraftPromiseRef.current
            id = entry?.id ?? null
        } catch {
            // Fall back to the dashboard if the draft never landed.
        }
        setOpen(false)
        router.push(id ? Routes.DashboardEditor(id) : Routes.Dashboard)
    }, [router])

    const handleSkipSetup = React.useCallback(() => {
        updateBranding({ meta: { onboardedAt: new Date().toISOString() } })
        clearOnboarding()
        setOpen(false)
    }, [updateBranding])

    const handleConnectLinkedin = React.useCallback((answers: OnboardingAnswers) => {
        persistOnboarding(answers, 'connect')
        window.location.href = '/api/linkedin/auth'
    }, [])

    if (!open) return null

    return (
        <OnboardingModal
            open={open}
            initialAnswers={resumeAnswers ?? initialAnswers(branding, strategy)}
            startStepId={startStepId}
            linkedinError={linkedinError}
            onPersist={handlePersist}
            onFinish={handleFinish}
            onComplete={handleComplete}
            onSkipSetup={handleSkipSetup}
            onConnectLinkedin={handleConnectLinkedin}
        />
    )
}
