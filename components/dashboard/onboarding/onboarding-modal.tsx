'use client'

import * as React from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'

import { OB_STEP_META, sectionFor } from '@/config/onboarding-flow'
import { slideStep } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

import { track } from './ai'
import { Confetti } from './confetti'
import { OnboardingProvider } from './context'
import { firstName, PersonAvatar } from './primitives'
import { HeroStage, Stage } from './stage'
import { BuildingStep } from './steps/building-step'
import { BuildplanStep } from './steps/buildplan-step'
import { ConfirmStep } from './steps/confirm-step'
import { ConnectStep } from './steps/connect-step'
import { EmailStep } from './steps/email-step'
import { FetchingStep } from './steps/fetching-step'
import { GoalStep } from './steps/goal-step'
import { PaywallStep } from './steps/paywall-step'
import { PersonaStep } from './steps/persona-step'
import { ProofStep } from './steps/proof-step'
import { ReassureStep } from './steps/reassure-step'
import { RecapStep } from './steps/recap-step'
import { ReinforceStep } from './steps/reinforce-step'
import { RevealStep } from './steps/reveal-step'
import { ScheduleStep } from './steps/schedule-step'
import { TopicsStep } from './steps/topics-step'
import { VoiceStep } from './steps/voice-step'
import { WelcomeStep } from './steps/welcome-step'
import { STEP_ORDER, type OnboardingAnswers, type StepId } from './types'
import { useRichPipeline } from './use-rich-pipeline'

// ---------------------------------------------------------------------------
// The audit-funnel modal (design import: onboarding/flow). Three layouts:
//   hero   - full-bleed illustration card (welcome)
//   split  - content pane + immersive stage on the right
//   report - wide centered column, no stage (reveal · paywall)
// Steps own their CTAs; there is no shared footer.
// ---------------------------------------------------------------------------

const indexOf = (id: StepId) => Math.max(0, STEP_ORDER.indexOf(id))

type OnboardingModalProps = {
    open: boolean
    initialAnswers: OnboardingAnswers
    startStepId?: StepId
    linkedinError?: string | null
    onPersist: (answers: OnboardingAnswers, step: StepId) => void
    onFinish: (answers: OnboardingAnswers, converted: boolean) => void
    onComplete: () => void
    onConnectLinkedin: (answers: OnboardingAnswers) => void
    onBindEmail: (email: string) => Promise<{ ok: boolean; taken?: boolean }>
    userEmail?: string | null
}

export function OnboardingModal({
    open,
    initialAnswers,
    startStepId = 'welcome',
    linkedinError,
    onPersist,
    onFinish,
    onComplete,
    onConnectLinkedin,
    onBindEmail,
    userEmail,
}: OnboardingModalProps) {
    const [answers, setAnswers] = React.useState(initialAnswers)
    const [index, setIndex] = React.useState(() => indexOf(startStepId))
    const [direction, setDirection] = React.useState(1)
    const [converted, setConverted] = React.useState(false)

    const step = STEP_ORDER[index]

    const update = React.useCallback(
        (patch: Partial<OnboardingAnswers>) => setAnswers((prev) => ({ ...prev, ...patch })),
        [],
    )

    // Background rich-scrape polling + insights generation. Lives here (not in a
    // step) because steps remount on every navigation.
    useRichPipeline(answers, update)

    const goNext = React.useCallback(() => {
        setDirection(1)
        setIndex((i) => Math.min(STEP_ORDER.length - 1, i + 1))
    }, [])

    const goBack = React.useCallback(() => {
        setDirection(-1)
        setIndex((i) => Math.max(0, i - 1))
    }, [])

    const goTo = React.useCallback((target: StepId) => {
        setDirection(1)
        setIndex(indexOf(target))
    }, [])

    const skip = React.useCallback(() => {
        track('onb_skip', { step })
        goNext()
    }, [step, goNext])

    const finishOffer = React.useCallback(
        (didConvert: boolean) => {
            setConverted(didConvert)
            onFinish(answers, didConvert)
            goTo('confirm')
        },
        [answers, onFinish, goTo],
    )

    const connectLinkedin = React.useCallback(() => onConnectLinkedin(answers), [answers, onConnectLinkedin])

    // True end of the funnel: the user clicked through the confirm screen into
    // the dashboard (converted or not) - the event the conversion rate hangs on.
    const complete = React.useCallback(() => {
        track('onb_flow_complete', { converted })
        onComplete()
    }, [converted, onComplete])

    // Incremental persistence: stash answers + current step after each change so a
    // refresh or the LinkedIn OAuth round-trip rehydrates without losing progress
    // or re-spending AI calls. The terminal 'confirm' step is already persisted/cleared.
    React.useEffect(() => {
        if (step !== 'confirm') onPersist(answers, step)
    }, [answers, step, onPersist])

    // One funnel event per screen enter so drop-off is tunable in PostHog, plus
    // a completion event for the step just left carrying how long it held the
    // user - the "confused for minutes" vs "breezed through" diagnosis signal.
    const stepEnteredRef = React.useRef<{ step: StepId; at: number } | null>(null)
    React.useEffect(() => {
        const prev = stepEnteredRef.current
        if (prev && prev.step !== step) {
            track('onb_step_completed', { step: prev.step, to: step, duration_ms: Date.now() - prev.at })
        }
        stepEnteredRef.current = { step, at: Date.now() }
        track('onb_step_view', { step })
    }, [step])

    const ctxValue = React.useMemo(
        () => ({
            answers,
            update,
            goNext,
            goBack,
            skip,
            goTo,
            finishOffer,
            complete,
            connectLinkedin,
            bindEmail: onBindEmail,
            userEmail,
            linkedinError,
            converted,
        }),
        [
            answers,
            update,
            goNext,
            goBack,
            skip,
            goTo,
            finishOffer,
            complete,
            connectLinkedin,
            onBindEmail,
            userEmail,
            linkedinError,
            converted,
        ],
    )

    const meta = OB_STEP_META[step] ?? { layout: 'split' as const }
    // The user chip appears once a real identity exists (post-fetch or OAuth).
    const connected = index > indexOf('fetching') && !!answers.profile.name

    return (
        <Dialog open={open}>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className='flex h-[min(790px,90vh)] w-[min(1160px,92vw)] max-w-[min(1160px,92vw)] flex-col gap-0 overflow-hidden rounded-[20px] border-none p-0 shadow-[inset_0_1px_0_0_oklch(1_0_0/0.6),0_0_0_1px_var(--border),0_40px_90px_-24px_oklch(0.12_0.03_222/_0.62),0_12px_30px_-12px_oklch(0.12_0.03_222/_0.5)] sm:max-w-[min(1160px,92vw)]'>
                <MotionConfig reducedMotion='user'>
                    {step === 'confirm' && converted && <Confetti />}
                    {step === 'paywall' && <Confetti count={14} />}

                    <DialogTitle className='sr-only'>Your personalized LinkedIn audit</DialogTitle>
                    <DialogDescription className='sr-only'>
                        Connect your profile, answer a few questions, and get a personalized LinkedIn strategy.
                    </DialogDescription>

                    <OnboardingProvider value={ctxValue}>
                        {meta.layout === 'hero' ? (
                            <div className='relative h-full overflow-hidden'>
                                {meta.stage && <HeroStage stage={meta.stage} />}
                                <div
                                    className='absolute inset-x-0 bottom-0 max-w-[640px] p-[clamp(24px,5vw,58px)]'
                                    style={
                                        {
                                            '--foreground': 'oklch(0.98 0.01 90)',
                                            '--muted-foreground': 'oklch(0.92 0.02 200 / 0.82)',
                                        } as React.CSSProperties
                                    }>
                                    <StepAnim step={step} direction={direction}>
                                        <StepBody step={step} />
                                    </StepAnim>
                                </div>
                            </div>
                        ) : (
                            <div className='flex h-full overflow-hidden'>
                                <div
                                    className='grain bg-card relative flex min-w-0 flex-1 flex-col'
                                    style={{ '--grain-opacity': 0.06 } as React.CSSProperties}>
                                    <TopRow step={step} answers={answers} connected={connected} />
                                    <div className='flex flex-1 flex-col overflow-y-auto'>
                                        <div
                                            className={cn(
                                                'w-full',
                                                meta.layout === 'report'
                                                    ? 'mx-auto max-w-[720px] px-[clamp(20px,4vw,40px)] pt-[30px] pb-11'
                                                    : 'm-auto max-w-[540px] px-[clamp(20px,4vw,44px)] py-[30px]',
                                            )}>
                                            <StepAnim step={step} direction={direction}>
                                                <StepBody step={step} />
                                            </StepAnim>
                                        </div>
                                    </div>
                                </div>
                                {meta.layout === 'split' && meta.stage && <Stage stage={meta.stage} />}
                            </div>
                        )}
                    </OnboardingProvider>
                </MotionConfig>
            </DialogContent>
        </Dialog>
    )
}

// ---------------------------------------------------------------------------
// Chrome pieces
// ---------------------------------------------------------------------------

function TopRow({ step, answers, connected }: { step: StepId; answers: OnboardingAnswers; connected: boolean }) {
    const section = sectionFor(step)
    const meta = OB_STEP_META[step]
    const wide = meta?.layout === 'report'
    return (
        <div className={cn('shrink-0 pt-[22px]', wide ? 'pb-4' : 'pb-1')}>
            <div
                className={cn(
                    'mx-auto flex min-h-[22px] w-full items-center justify-between gap-3',
                    wide ? 'max-w-[720px] px-[clamp(20px,4vw,40px)]' : 'max-w-[540px] px-[clamp(20px,4vw,44px)]',
                )}>
                <span className='text-muted-foreground font-mono text-[11px] font-medium tracking-[0.1em] uppercase'>
                    {section ? `Step ${section.index} / ${section.count} - ${section.name}` : ''}
                </span>
                {connected ? (
                    <span className='text-muted-foreground flex items-center gap-2 text-[13px]'>
                        <PersonAvatar name={answers.profile.name} src={answers.profile.avatarUrl} size={22} />
                        <b className='text-foreground font-semibold'>{firstName(answers.profile.name)}</b>
                    </span>
                ) : (
                    <span />
                )}
            </div>
        </div>
    )
}

function StepAnim({ step, direction, children }: { step: StepId; direction: number; children: React.ReactNode }) {
    return (
        <AnimatePresence mode='wait' custom={direction} initial={false}>
            <motion.div key={step} custom={direction} variants={slideStep} initial='enter' animate='center' exit='exit'>
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

// ---------------------------------------------------------------------------
// Step body switch
// ---------------------------------------------------------------------------

function StepBody({ step }: { step: StepId }) {
    switch (step) {
        case 'welcome':
            return <WelcomeStep />
        case 'connect':
            return <ConnectStep />
        case 'fetching':
            return <FetchingStep />
        case 'reassure':
            return <ReassureStep />
        case 'goal':
            return <GoalStep />
        case 'persona':
            return <PersonaStep />
        case 'recap':
            return <RecapStep />
        case 'proof':
            return <ProofStep />
        case 'voice':
            return <VoiceStep />
        case 'topics':
            return <TopicsStep />
        case 'schedule':
            return <ScheduleStep />
        case 'reinforce':
            return <ReinforceStep />
        case 'building':
            return <BuildingStep />
        case 'reveal':
            return <RevealStep />
        case 'email':
            return <EmailStep />
        case 'buildplan':
            return <BuildplanStep />
        case 'paywall':
            return <PaywallStep />
        case 'confirm':
            return <ConfirmStep />
    }
}
