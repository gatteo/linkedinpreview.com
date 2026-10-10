'use client'

import * as React from 'react'
import posthog from 'posthog-js'

import { feedbackConfig } from '@/config/feedback'
import { PRICING, purchasePolicyCopy, type CheckoutPlan } from '@/config/pricing'
import { fetchBilling } from '@/lib/supabase/billing'
import { createClient } from '@/lib/supabase/client'
import {
    readVisitorWritingPlan,
    readWritingEnrollment,
    VISITOR_WRITING_KEY,
    VISITOR_WRITING_VERSION,
    writingExclusion,
    writingProperties,
    type WritingEnrollment,
} from '@/lib/visitor-writing'
import { Button } from '@/components/ui/button'

const jobs = [
    ['format', 'Format an existing post'],
    ['write', 'Write or improve a post'],
    ['later', 'Prepare posts to finish later'],
    ['other', 'Something else'],
] as const
const formats = [
    ['personal', 'A personal post (not an ad)'],
    ['company', 'A post for a client or company (not an ad)'],
    ['ad', 'Ad creative'],
    ['other', 'Something else'],
] as const

type WritingContext = {
    enabled: boolean
    discovery: () => boolean
    start: () => void
    inserted: (doc: unknown) => void
    previewed: (doc: unknown) => void
    copied: (doc: unknown) => void
    failed: () => void
    registerAI: (handler: (() => void) | null) => void
    tryAI: () => void
    enrollment: WritingEnrollment | null
    showPrompt: boolean
    valueReady: boolean
    job: string | null
    format: string | null
    showFormat: boolean
    chooseJob: (job: string) => void
    chooseFormat: (format: string) => void
    dismiss: () => void
    followup: () => void
    offer: () => Promise<void>
    checkout: (plan: CheckoutPlan) => Promise<void>
    offerOpen: boolean
    busy: boolean
    message: string | null
}

const empty = () => {}
const Context = React.createContext<WritingContext>({
    enabled: false,
    discovery: () => false,
    start: empty,
    inserted: empty,
    previewed: empty,
    copied: empty,
    failed: empty,
    registerAI: empty,
    tryAI: empty,
    enrollment: null,
    showPrompt: false,
    valueReady: false,
    job: null,
    format: null,
    showFormat: false,
    chooseJob: empty,
    chooseFormat: empty,
    dismiss: empty,
    followup: empty,
    offer: async () => {},
    checkout: async () => {},
    offerOpen: false,
    busy: false,
    message: null,
})

export const useVisitorWriting = () => React.useContext(Context)
export const VisitorWritingContext = Context

export function useVisitorWritingController(candidate: boolean): WritingContext {
    const [enabled, setEnabled] = React.useState(false)
    const [showPrompt, setShowPrompt] = React.useState(false)
    const [job, setJob] = React.useState<string | null>(null)
    const [format, setFormat] = React.useState<string | null>(null)
    const [showFormat, setShowFormat] = React.useState(false)
    const [valueReady, setValueReady] = React.useState(false)
    const [enrollment, setEnrollment] = React.useState<WritingEnrollment | null>(null)
    const [offerOpen, setOfferOpen] = React.useState(false)
    const [busy, setBusy] = React.useState(false)
    const [message, setMessage] = React.useState<string | null>(null)
    const openAI = React.useRef<(() => void) | null>(null)
    const registerAI = React.useCallback((handler: (() => void) | null) => {
        openAI.current = handler
    }, [])
    const accepted = React.useRef<string | null>(null)
    const visible = React.useRef(false)
    const attempt = React.useRef<string | null>(null)
    const active = React.useRef(true)
    const busyRef = React.useRef(false)
    const identity = React.useRef<string | null>(null)
    const client = React.useRef<ReturnType<typeof createClient> | null>(null)
    const epoch = React.useRef(0)

    React.useEffect(() => {
        active.current = true
        setEnabled(candidate && window.location.pathname === '/')
        return () => {
            active.current = false
        }
    }, [candidate])

    const capture = React.useCallback((event: string, props: Record<string, unknown> = {}) => {
        posthog?.capture(event, {
            job_flow_version: VISITOR_WRITING_VERSION,
            job_source: 'public_post_copy',
            writing_attempt_id: attempt.current,
            historical_overlap: 'unknown',
            ...props,
        })
    }, [])

    const currentFree = React.useCallback(async () => {
        const excluded = writingExclusion(localStorage, sessionStorage)
        if (excluded) throw new Error(excluded)
        const stored = readWritingEnrollment(localStorage)
        if (identity.current && stored?.userId !== identity.current) throw new Error('identity_changed')
        client.current ??= createClient()
        const { data, error } = await client.current.auth.getUser()
        if (error || !data.user) throw new Error('billing_unresolved')
        const userId = data.user.id
        if (identity.current && identity.current !== userId) throw new Error('identity_changed')
        const plan = await readVisitorWritingPlan(client.current, userId)
        if (plan !== 'free') throw new Error('not_free')
        const latest = await client.current.auth.getUser()
        if (latest.error || latest.data.user?.id !== userId) throw new Error('identity_changed')
        const recheck = writingExclusion(localStorage, sessionStorage)
        if (recheck) throw new Error(recheck)
        return userId
    }, [])

    const suppress = React.useCallback(
        (event: string) => {
            setOfferOpen(false)
            setMessage('This offer is not available for this session. The free editor is still available.')
            capture(event, enrollment ? writingProperties(enrollment) : {})
        },
        [capture, enrollment],
    )

    React.useEffect(() => {
        if (!enrollment || !client.current) return
        const { data } = client.current.auth.onAuthStateChange((_event, session) => {
            if (session?.user.id === enrollment.userId) return
            epoch.current++
            suppress('job_identity_changed')
        })
        const changed = () => {
            try {
                if (
                    writingExclusion(localStorage, sessionStorage) ||
                    readWritingEnrollment(localStorage)?.userId !== enrollment.userId
                ) {
                    epoch.current++
                    suppress('job_storage_changed')
                }
            } catch {
                suppress('job_storage_changed')
            }
        }
        window.addEventListener('storage', changed)
        const resized = () => requestAnimationFrame(changed)
        window.addEventListener('resize', resized)
        window.addEventListener('focus', changed)
        return () => {
            data.subscription.unsubscribe()
            window.removeEventListener('storage', changed)
            window.removeEventListener('resize', resized)
            window.removeEventListener('focus', changed)
        }
    }, [enrollment, suppress])

    const offer = React.useCallback(async () => {
        if (!enabled || !valueReady || busyRef.current) return
        busyRef.current = true
        setBusy(true)
        const version = epoch.current
        try {
            const userId = await currentFree()
            if (!active.current || version !== epoch.current) return
            const previous = readWritingEnrollment(localStorage)
            if (previous && previous.userId !== userId) throw new Error('identity_changed')
            const next = previous ?? {
                enrollmentId: crypto.randomUUID(),
                eligibilityAt: new Date().toISOString(),
                userId,
                releaseSha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unavailable',
                version: VISITOR_WRITING_VERSION,
                historicalOverlap: 'unknown' as const,
            }
            localStorage.setItem(VISITOR_WRITING_KEY, JSON.stringify(next))
            if (readWritingEnrollment(localStorage)?.enrollmentId !== next.enrollmentId)
                throw new Error('storage_unavailable')
            identity.current = userId
            posthog?.identify(userId)
            if (!previous) capture('job_flow_eligible', writingProperties(next))
            setEnrollment(next)
            setMessage(null)
            setOfferOpen(true)
        } catch {
            if (active.current) suppress('job_offer_suppressed')
        } finally {
            busyRef.current = false
            if (active.current) setBusy(false)
        }
    }, [enabled, valueReady, currentFree, capture, suppress])

    const checkout = React.useCallback(
        async (plan: CheckoutPlan) => {
            if (!enrollment || !offerOpen || busyRef.current) return
            busyRef.current = true
            setBusy(true)
            capture('job_checkout_started', { ...writingProperties(enrollment), plan })
            try {
                const userId = await currentFree()
                if (
                    !active.current ||
                    userId !== enrollment.userId ||
                    JSON.stringify(readWritingEnrollment(localStorage)) !== JSON.stringify(enrollment)
                )
                    throw new Error('identity_changed')
                const res = await fetch('/api/billing/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan, source: 'visitor_job', jobOffer: enrollment }),
                })
                const result = await res.json()
                if (!res.ok || !result.url) throw new Error('checkout_failed')
                if (!active.current) return
                const latest = await currentFree()
                if (
                    latest !== userId ||
                    JSON.stringify(readWritingEnrollment(localStorage)) !== JSON.stringify(enrollment)
                )
                    throw new Error('identity_changed')
                capture('job_checkout_result', {
                    ...writingProperties(enrollment),
                    plan,
                    result: 'opened',
                    session_id: result.sessionId,
                })
                window.location.assign(result.url)
            } catch {
                if (active.current) suppress('job_checkout_failed')
            } finally {
                busyRef.current = false
                if (active.current) setBusy(false)
            }
        },
        [enrollment, offerOpen, capture, currentFree, suppress],
    )

    React.useEffect(() => {
        if (!enabled) return
        const params = new URLSearchParams(window.location.search)
        if (params.get('source') !== 'visitor_job') return
        const status = params.get('checkout')
        if (status !== 'success' && status !== 'cancelled') return
        try {
            const stored = readWritingEnrollment(localStorage)
            if (!stored || params.get('job_enrollment') !== stored.enrollmentId) return
            const sessionId = params.get('session_id')
            capture('job_checkout_return', { ...writingProperties(stored), result: status, session_id: sessionId })
            setMessage(
                status === 'success'
                    ? 'Checking your plan. Your draft is still in the editor.'
                    : 'Checkout cancelled. Your draft is still in the editor.',
            )
            for (const key of ['source', 'checkout', 'plan', 'session_id', 'job_enrollment']) params.delete(key)
            window.history.replaceState(window.history.state, '', `/${params.size ? `?${params}` : ''}#tool`)
            if (status === 'success') {
                client.current ??= createClient()
                const supabase = client.current
                supabase.auth
                    .getUser()
                    .then(async ({ data, error }) => {
                        if (error || data.user?.id !== stored.userId) return
                        const billing = await fetchBilling(supabase, stored.userId)
                        if (active.current && billing.plan !== 'free') {
                            setMessage('Your paid plan is active. Continue writing in the editor.')
                            capture('job_paid_return_verified', writingProperties(stored))
                        }
                    })
                    .catch(() => {})
            }
        } catch {
            setMessage('Your draft is still available. Check your plan in the dashboard.')
        }
    }, [enabled, capture])

    const context: WritingContext = {
        enabled,
        registerAI,
        tryAI: () => openAI.current?.(),
        enrollment,
        showPrompt,
        valueReady,
        job,
        format,
        showFormat,
        offer,
        checkout,
        offerOpen,
        busy,
        message,
        discovery: () => {
            if (!enabled) return false
            setShowPrompt(true)
            return true
        },
        start: () => {
            if (!enabled) return
            attempt.current = crypto.randomUUID()
            accepted.current = null
            visible.current = false
            setValueReady(false)
            setOfferOpen(false)
            capture('visitor_writing_started')
        },
        inserted: (doc) => {
            if (!enabled || !attempt.current) return
            accepted.current = JSON.stringify(doc)
            visible.current = false
            setValueReady(false)
            capture('job_ai_insert_accepted')
        },
        previewed: (doc) => {
            if (!enabled || !accepted.current || accepted.current !== JSON.stringify(doc) || visible.current) return
            visible.current = true
            capture('job_preview_visible')
        },
        copied: (doc) => {
            if (!enabled || !visible.current || accepted.current !== JSON.stringify(doc)) return
            if (!valueReady) capture('job_useful_copy')
            setValueReady(true)
        },
        failed: () => {
            if (enabled && attempt.current) capture('job_ai_failed')
        },
        chooseJob: (choice) => {
            setJob(choice)
            setShowFormat(['format', 'write', 'later'].includes(choice))
            capture('visitor_job_prompt_answered', { job: choice })
        },
        chooseFormat: (choice) => {
            setFormat(choice)
            setShowFormat(false)
            capture('visitor_format_answered', { format: choice })
        },
        dismiss: () => {
            capture(showFormat ? 'visitor_format_skipped' : 'visitor_job_prompt_skipped')
            setShowFormat(false)
            if (showFormat) return
            setShowPrompt(false)
            setOfferOpen(false)
            setValueReady(false)
            try {
                localStorage.setItem(feedbackConfig.storage.dismissedAt, String(Date.now()))
            } catch {}
        },
        followup: () => {
            if (!feedbackConfig.formId || !window.Tally) return
            capture('visitor_job_followup_opened')
            window.Tally.openPopup(feedbackConfig.formId, {
                hiddenFields: { source: 'visitor-job-followup', pageUrl: window.location.pathname },
                onOpen: () => capture('visitor_job_followup_shown'),
            })
        },
    }
    return context
}

export function VisitorWritingPanel() {
    const flow = useVisitorWriting()
    const root = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        if (!flow.showPrompt || !root.current) return
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return
            posthog?.capture('visitor_job_prompt_shown', {
                job_flow_version: VISITOR_WRITING_VERSION,
                job_source: 'public_post_copy',
            })
            observer.disconnect()
        })
        observer.observe(root.current)
        return () => observer.disconnect()
    }, [flow.showPrompt])
    React.useEffect(() => {
        if (!flow.offerOpen || !flow.enrollment || !root.current) return
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return
            posthog?.capture('job_offer_seen', writingProperties(flow.enrollment!))
            observer.disconnect()
        })
        observer.observe(root.current)
        return () => observer.disconnect()
    }, [flow.offerOpen, flow.enrollment])
    if (!flow.enabled || (!flow.showPrompt && !flow.valueReady && !flow.message)) return null
    return (
        <div
            ref={root}
            className='border-border bg-card mt-4 flex flex-col gap-3 rounded-xl border p-4'
            aria-label='Optional writing help'>
            {flow.showPrompt && !flow.job && (
                <>
                    <p className='font-medium'>What were you trying to get done with this post?</p>
                    <div className='flex flex-wrap gap-2'>
                        {jobs.map(([value, label]) => (
                            <Button key={value} size='sm' variant='outline' onClick={() => flow.chooseJob(value)}>
                                {label}
                            </Button>
                        ))}
                    </div>
                    <Button size='sm' variant='ghost' className='self-start' onClick={flow.dismiss}>
                        Skip
                    </Button>
                </>
            )}
            {flow.showPrompt && flow.showFormat && (
                <>
                    <p className='font-medium'>What are you preparing?</p>
                    <div className='flex flex-wrap gap-2'>
                        {formats.map(([value, label]) => (
                            <Button key={value} size='sm' variant='outline' onClick={() => flow.chooseFormat(value)}>
                                {label}
                            </Button>
                        ))}
                    </div>
                    <Button size='sm' variant='ghost' className='self-start' onClick={flow.dismiss}>
                        Skip
                    </Button>
                </>
            )}
            {flow.showPrompt && flow.job && !flow.showFormat && (
                <>
                    <p className='text-muted-foreground text-sm'>
                        Optional. Please don&apos;t include your post text, email address or other personal details.
                    </p>
                    <div className='flex flex-wrap gap-2'>
                        <Button variant='outline' size='sm' onClick={flow.tryAI}>
                            Try existing AI writing help
                        </Button>
                        {feedbackConfig.formId && (
                            <Button variant='ghost' size='sm' onClick={flow.followup}>
                                Tell us more
                            </Button>
                        )}
                        <Button variant='ghost' size='sm' onClick={flow.dismiss}>
                            Keep using the free editor
                        </Button>
                    </div>
                </>
            )}
            {flow.valueReady && !flow.offerOpen && (
                <Button className='self-start' disabled={flow.busy} onClick={flow.offer}>
                    I want more AI writing help
                </Button>
            )}
            {flow.offerOpen && (
                <>
                    <p className='font-medium'>Need more AI help with your next draft?</p>
                    <p className='text-sm'>
                        Pro gives you up to 50 generations and 200 refinements per rolling 24 hours.{' '}
                        {PRICING.monthly.display}/month. Cancel anytime.
                    </p>
                    <p className='text-muted-foreground text-sm'>{purchasePolicyCopy('monthly')}</p>
                    <Button disabled={flow.busy} onClick={() => flow.checkout('monthly')}>
                        Continue with Pro - {PRICING.monthly.display}/month
                    </Button>
                    <p className='text-muted-foreground text-sm'>
                        Lifetime: {PRICING.lifetime.display} once. {purchasePolicyCopy('lifetime')}.
                    </p>
                    <Button variant='outline' disabled={flow.busy} onClick={() => flow.checkout('lifetime')}>
                        Get lifetime - {PRICING.lifetime.display}
                    </Button>
                    <Button variant='ghost' onClick={flow.dismiss}>
                        Keep using the free editor
                    </Button>
                </>
            )}
            {flow.message && (
                <p role='status' className='text-muted-foreground text-sm'>
                    {flow.message}
                </p>
            )}
        </div>
    )
}
