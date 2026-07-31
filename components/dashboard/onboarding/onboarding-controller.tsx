'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { ENTRY_PARAM, parseEntrySource, type ResolvedEntrySource } from '@/config/entry-sources'
import { ONBOARDING_LINKEDIN_STATUSES } from '@/config/linkedin'
import { ApiRoutes, Routes } from '@/config/routes'
import { site } from '@/config/site'
import { createDraft as createDraftApi } from '@/lib/supabase/drafts'
import { upsertOnboardingSession } from '@/lib/supabase/onboarding-session'
import { useBranding } from '@/hooks/use-branding'
import { useStrategy } from '@/hooks/use-strategy'
import { useAuth } from '@/components/dashboard/auth-provider'

import { postTextToDoc, setEntrySource } from './ai'
import { onOnboardingDebug } from './debug-events'
import { OnboardingModal } from './onboarding-modal'
import {
    clearOnboarding,
    initialAnswers,
    persistOnboarding,
    readOnboarding,
    type OnboardingAnswers,
    type StepId,
} from './types'

// Detected posting language (ISO code from the scraped corpus) -> the branding
// writing-style language option. Unknown codes drop rather than guess.
const BRANDING_LANGUAGE_BY_CODE: Record<string, string> = {
    en: 'english',
    de: 'german',
    fr: 'french',
    es: 'spanish',
    it: 'italian',
    pt: 'portuguese',
}

// ---------------------------------------------------------------------------
// OnboardingController - gates the conversion flow and bridges it to persistence.
//
// useBranding/useStrategy are per-call local state (not shared contexts), so the
// controller owns the single instances the gate reacts to and hands their
// updaters down. It mounts inside the dashboard layout (which also wraps
// /dashboard/settings), so it catches the LinkedIn OAuth redirect.
// ---------------------------------------------------------------------------

export function OnboardingController() {
    const { isReady, userId, supabase, email: authEmail } = useAuth()
    const { branding, isLoading: brandingLoading, updateBranding } = useBranding()
    const { strategy, isLoading: strategyLoading, updateStrategy } = useStrategy()
    const router = useRouter()

    const [open, setOpen] = React.useState(false)
    const [mountSeq, setMountSeq] = React.useState(0)
    const [startStepId, setStartStepId] = React.useState<StepId>('welcome')
    const [entry, setEntry] = React.useState<ResolvedEntrySource>('direct')
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

        // Attribute the visit before any branch returns, so entry_source is on
        // every onboarding event including the ones fired by a resumed session.
        // A resumed session keeps the source it started with - the ?from= on a
        // later navigation describes that navigation, not the original entry.
        const entry = saved?.answers.entrySource ?? parseEntrySource(params.get(ENTRY_PARAM))
        setEntrySource(entry)
        setEntry(entry)

        // Already onboarded - never show again; clear any stale saved progress.
        if (branding.meta.onboardedAt) {
            decidedRef.current = true
            if (saved) clearOnboarding()
            return
        }

        // A non-onboarding LinkedIn status (account switch/merge) is the settings
        // page's concern - don't open onboarding or strip its query param.
        if (linkedinStatus && !ONBOARDING_LINKEDIN_STATUSES.includes(linkedinStatus)) {
            decidedRef.current = true
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
                // A successful OAuth supersedes a half-finished URL fetch on the
                // Mirror: drop the stale enrichment so it re-reads with the
                // connected identity. The URL itself stays - the rich scrape it
                // triggered keeps running and the pipeline hook resumes polling.
                // mirrorManual stays too: a user who already chose "continue
                // manually" must not be thrown back onto the failure card.
                ...(connected ? { enrichConfidence: undefined } : {}),
            })
            if (connected) {
                // Resume on the fetching loader: it re-runs the enrich with the
                // connected identity and hands the rich scrape to the pipeline.
                setStartStepId('fetching')
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

    // Dev-only debug menu drives the live modal (open/close) via a window event bus.
    React.useEffect(() => {
        return onOnboardingDebug((command) => {
            if (command === 'open') {
                setResumeAnswers(null)
                setStartStepId('welcome')
                setLinkedinError(null)
                decidedRef.current = true
                finishedRef.current = false
                setOpen(true)
            } else if (command === 'close') {
                setOpen(false)
            } else if (typeof command === 'object' && 'jump' in command) {
                // Jump straight to a step with whatever answers are persisted -
                // steps render their degraded variants when data is missing, which
                // is usually exactly what's being debugged. Key bump remounts the
                // modal so a jump also works while it is already open.
                setResumeAnswers(readOnboarding()?.answers ?? null)
                setStartStepId(command.jump)
                setLinkedinError(null)
                decidedRef.current = true
                finishedRef.current = false
                setMountSeq((s) => s + 1)
                setOpen(true)
            }
        })
    }, [])

    // Server-side mirror of the answers (public.onboarding_sessions) so user
    // types can be analyzed later. Debounced + fire-and-forget: localStorage is
    // the user's safety net, this only carries analytics fidelity. The insights
    // payload is stripped - the server already owns it in its own column.
    const sessionTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const saveSession = React.useCallback(
        (answers: OnboardingAnswers, patch: { resume_at?: string; completed_at?: string; converted?: boolean }) => {
            if (!userId) return
            // Strip PII (email) and the server-owned insights blob before the upsert.
            const { insights: _insights, email: _email, ...slim } = answers
            upsertOnboardingSession(supabase, userId, { answers: slim, ...patch }).catch(() => {})
        },
        [supabase, userId],
    )

    const handlePersist = React.useCallback(
        (answers: OnboardingAnswers, step: StepId) => {
            persistOnboarding(answers, step)
            if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current)
            sessionTimerRef.current = setTimeout(() => saveSession(answers, { resume_at: step }), 1500)
        },
        [saveSession],
    )

    // Write-once at the offer (convert or decline). Persists branding + strategy,
    // stashes the first post as a draft so it survives into the dashboard, and
    // gates the modal closed via meta.onboardedAt.
    const handleFinish = React.useCallback(
        (answers: OnboardingAnswers, converted: boolean) => {
            if (finishedRef.current) return
            finishedRef.current = true
            const now = new Date().toISOString()

            // Final analytics write - a pending debounce must not overwrite it.
            if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current)
            saveSession(answers, { resume_at: 'done', completed_at: now, converted })

            // Everything the pipeline learned lands in branding so the Branding
            // page arrives populated: chosen topics, else the topics we actually
            // read in their posts, else the niche.
            const topics = answers.topics.filter(Boolean)
            const effectiveTopics = topics.length
                ? topics
                : answers.insights?.currentTopics.length
                  ? answers.insights.currentTopics.slice(0, 3)
                  : answers.niche
                    ? [answers.niche]
                    : []
            const goals = answers.goals.length ? answers.goals : answers.primaryGoal ? [answers.primaryGoal] : []
            const donts = answers.writingNotes?.trim()
                ? [...branding.dosDonts.donts, answers.writingNotes.trim()]
                : branding.dosDonts.donts
            const toneNote = answers.tone ? `Preferred tone: ${answers.tone}.` : ''
            const aboutNote = answers.aboutSummary?.trim()
                ? `About (from their LinkedIn profile): ${answers.aboutSummary.trim()}`
                : ''
            const languageNote = answers.language?.trim() ? `Writes in: ${answers.language.trim()}.` : ''
            const clarificationNote = answers.clarification?.trim()
                ? `Their own correction to our read of them: ${answers.clarification.trim()}`
                : ''
            const notes = [branding.knowledgeBase.notes, aboutNote, toneNote, languageNote, clarificationNote]
                .filter(Boolean)
                .join('\n')

            // Style defaults measured from their real posts (deterministic
            // counts, see inferStyleHints); onboarding never asks for these, so
            // the hints only ever replace untouched defaults. The detected
            // posting language maps to the branding language options separately
            // (ISO code -> option value) and is dropped when unknown.
            const { language: detectedLanguage, ...styleDefaults } = answers.richSummary?.styleHints ?? {}
            const brandingLanguage = detectedLanguage ? BRANDING_LANGUAGE_BY_CODE[detectedLanguage] : undefined

            updateBranding({
                profile: answers.profile,
                role: answers.role,
                expertise: { topics: effectiveTopics },
                positioning: { statement: answers.positioning },
                writingStyle: {
                    ...answers.writingStyle,
                    ...styleDefaults,
                    ...(brandingLanguage ? { language: brandingLanguage } : {}),
                },
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
        [branding, updateBranding, updateStrategy, supabase, userId, saveSession],
    )

    const handleComplete = React.useCallback(async () => {
        let id: string | null = null
        try {
            const pending = firstDraftPromiseRef.current
            if (pending) {
                // Never trap the user on the celebration screen if the insert hangs.
                const entry = await Promise.race([
                    pending,
                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
                ])
                id = entry?.id ?? null
            }
        } catch {
            // Fall back to the dashboard if the draft never landed.
        }
        setOpen(false)
        router.push(id ? Routes.DashboardEditor(id) : Routes.Dashboard)
    }, [router])

    const handleConnectLinkedin = React.useCallback((answers: OnboardingAnswers) => {
        persistOnboarding(answers, 'connect')
        // `from=onboarding` makes the callback return to /dashboard instead of
        // settings, whose mount effect would strip the result before the resume
        // gate below can read it.
        window.location.href = `${ApiRoutes.LinkedInAuth}?from=onboarding`
    }, [])

    // The email step captures the user's email at the earned-value moment and
    // binds it to the anonymous user (auth.updateUser keeps user.id, so drafts,
    // billing, and onboarding_sessions stay owned by the same id). Skippable, so
    // a bind failure never hard-blocks the funnel.
    const handleBindEmail = React.useCallback(
        async (email: string): Promise<{ ok: boolean; taken?: boolean }> => {
            try {
                const { error } = await supabase.auth.updateUser(
                    { email },
                    { emailRedirectTo: `${site.url}/auth/confirm` },
                )
                if (error) {
                    const taken = error.status === 422 || /already|registered|exist/i.test(error.message ?? '')
                    return { ok: false, taken }
                }
                return { ok: true }
            } catch {
                return { ok: false }
            }
        },
        [supabase],
    )

    // Prefill the email field from the current auth user when one is already set
    // (a returning user who bound in a prior session). Anonymous users have none.
    // Read it off AuthProvider rather than calling getUser() again: a second call
    // contends for the same Supabase auth-token lock and was timing out at 10s
    // ("Acquiring an exclusive Navigator LockManager lock ... timed out"), which
    // stalls the whole dashboard behind an unresolved session.
    const userEmail = authEmail

    if (!open) return null

    return (
        <OnboardingModal
            key={mountSeq}
            open={open}
            initialAnswers={resumeAnswers ?? { ...initialAnswers(branding, strategy), entrySource: entry }}
            startStepId={startStepId}
            linkedinError={linkedinError}
            onPersist={handlePersist}
            onFinish={handleFinish}
            onComplete={handleComplete}
            onConnectLinkedin={handleConnectLinkedin}
            onBindEmail={handleBindEmail}
            userEmail={userEmail}
        />
    )
}
