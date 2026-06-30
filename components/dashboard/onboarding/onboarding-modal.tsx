'use client'

import * as React from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

import { EASE_OUT, slideStep } from '@/lib/motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

import { track } from './ai'
import { BrandStage } from './brand-stage'
import { Confetti } from './confetti'
import { OnboardingProvider } from './context'
import { BuildingStep } from './steps/building-step'
import { CadenceStep } from './steps/cadence-step'
import { ConnectStep } from './steps/connect-step'
import { DoneStep } from './steps/done-step'
import { GoalStep } from './steps/goal-step'
import { MirrorStep } from './steps/mirror-step'
import { OfferStep } from './steps/offer-step'
import { PreviewStep } from './steps/preview-step'
import { ProofStep } from './steps/proof-step'
import { RecapStep } from './steps/recap-step'
import { SpotlightStep } from './steps/spotlight-step'
import { VoiceStep } from './steps/voice-step'
import { WelcomeStep } from './steps/welcome-step'
import type { OnboardingAnswers, StepId } from './types'

// ---------------------------------------------------------------------------
// Step machine (docs/onboarding-conversion-redesign.md §2)
// ---------------------------------------------------------------------------

const STEP_ORDER: StepId[] = [
    'welcome',
    'connect',
    'mirror',
    'goal',
    'proof',
    'preview',
    'voice',
    'spotlight',
    'cadence',
    'building',
    'recap',
    'offer',
    'done',
]

// Only COLLECT (data) steps fill the progress bar; value/milestone steps read as
// rewards, not work, so they don't advance it.
const DATA_STEPS: StepId[] = ['welcome', 'connect', 'goal', 'voice', 'cadence']

type FooterConfig = { back: boolean; skip: 'data' | null; primary: string | null }

// Steps with all-falsy config own their footer entirely (body renders actions).
const FOOTER: Record<StepId, FooterConfig> = {
    welcome: { back: false, skip: null, primary: null },
    connect: { back: true, skip: 'data', primary: null },
    // Mirror owns its own forward button (rendered in the body) so it can't be
    // confirmed while the "reading" spinner is still running.
    mirror: { back: true, skip: null, primary: null },
    goal: { back: true, skip: 'data', primary: 'Continue' },
    proof: { back: true, skip: null, primary: 'Continue' },
    preview: { back: true, skip: null, primary: 'Continue' },
    voice: { back: true, skip: 'data', primary: 'Continue' },
    spotlight: { back: true, skip: null, primary: 'Continue' },
    cadence: { back: true, skip: 'data', primary: 'Continue' },
    building: { back: false, skip: null, primary: null },
    recap: { back: false, skip: null, primary: 'See my offer' },
    offer: { back: false, skip: null, primary: null },
    done: { back: false, skip: null, primary: null },
}

const indexOf = (id: StepId) => Math.max(0, STEP_ORDER.indexOf(id))

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

type OnboardingModalProps = {
    open: boolean
    initialAnswers: OnboardingAnswers
    startStepId?: StepId
    linkedinError?: string | null
    onPersist: (answers: OnboardingAnswers, step: StepId) => void
    onFinish: (answers: OnboardingAnswers, converted: boolean) => void
    onComplete: () => void
    onSkipSetup: () => void
    onConnectLinkedin: (answers: OnboardingAnswers) => void
}

export function OnboardingModal({
    open,
    initialAnswers,
    startStepId = 'welcome',
    linkedinError,
    onPersist,
    onFinish,
    onComplete,
    onSkipSetup,
    onConnectLinkedin,
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
        if (step === 'connect') track('onb_connect_method', { method: 'manual' })
        goNext()
    }, [step, goNext])

    const finishOffer = React.useCallback(
        (didConvert: boolean) => {
            setConverted(didConvert)
            onFinish(answers, didConvert)
            goTo('done')
        },
        [answers, onFinish, goTo],
    )

    const skipSetup = React.useCallback(() => onSkipSetup(), [onSkipSetup])
    const connectLinkedin = React.useCallback(() => onConnectLinkedin(answers), [answers, onConnectLinkedin])

    // Incremental persistence: stash answers + current step after each change so a
    // refresh or the LinkedIn OAuth round-trip rehydrates without losing progress
    // or re-spending AI calls. The terminal 'done' step is already persisted/cleared.
    React.useEffect(() => {
        if (step !== 'done') onPersist(answers, step)
    }, [answers, step, onPersist])

    // One funnel event per screen enter so drop-off is tunable in PostHog.
    React.useEffect(() => {
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
            complete: onComplete,
            skipSetup,
            connectLinkedin,
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
            onComplete,
            skipSetup,
            connectLinkedin,
            linkedinError,
            converted,
        ],
    )

    const footer = FOOTER[step]
    const showBack = footer.back && index > 0
    const showFooter = footer.back || !!footer.skip || !!footer.primary

    const handlePrimary = () => {
        if (step === 'goal') track('onb_goal_confirm')
        goNext()
    }

    // Don't let the user skip past the "aha" before the first post has rendered.
    const primaryDisabled = step === 'preview' && !answers.firstPostText

    const dataDone = DATA_STEPS.filter((s) => STEP_ORDER.indexOf(s) < index).length
    const progress = (dataDone / DATA_STEPS.length) * 100
    const isData = DATA_STEPS.includes(step)
    const metaLabel = isData ? `Step ${dataDone + 1}` : 'Your tailored setup'

    return (
        <Dialog open={open}>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className='flex h-[min(790px,90vh)] w-[min(1160px,92vw)] max-w-[min(1160px,92vw)] flex-col gap-0 overflow-hidden rounded-[20px] p-0 shadow-[0_40px_90px_-24px_oklch(0.12_0.03_222_/_0.62),0_12px_30px_-12px_oklch(0.12_0.03_222_/_0.5)] sm:max-w-[min(1160px,92vw)]'>
                <MotionConfig reducedMotion='user'>
                    {step === 'done' && converted && <Confetti />}

                    <DialogTitle className='sr-only'>Set up your LinkedIn growth system</DialogTitle>
                    <DialogDescription className='sr-only'>
                        A short, personalized setup for your LinkedIn content.
                    </DialogDescription>

                    <div className='flex h-full overflow-hidden max-md:flex-col'>
                        <BrandStage step={step} dataDone={dataDone} total={DATA_STEPS.length} />

                        {/* Content column */}
                        <div
                            className='grain bg-background relative flex min-w-0 flex-1 flex-col'
                            style={{ '--grain-opacity': 0.05 } as React.CSSProperties}>
                            {/* Top: meta + progress */}
                            <div className='shrink-0 px-[clamp(20px,4vw,56px)] pt-[clamp(18px,2.4vw,26px)]'>
                                <div className='mb-3 flex items-center justify-between pr-8'>
                                    <span className='text-muted-foreground font-mono text-[11px] font-medium tracking-[0.1em] whitespace-nowrap uppercase'>
                                        {metaLabel}
                                    </span>
                                    {step !== 'welcome' && (
                                        <span className='text-muted-foreground font-mono text-[11px]'>
                                            {Math.round(progress)}%
                                        </span>
                                    )}
                                </div>
                                <div className='bg-muted h-1 w-full overflow-hidden rounded-full'>
                                    <motion.div
                                        className='bg-primary h-full rounded-full'
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.45, ease: EASE_OUT }}
                                    />
                                </div>
                            </div>

                            {/* Body - vertically centered when short */}
                            <div className='flex flex-1 flex-col overflow-y-auto'>
                                <div className='m-auto w-full max-w-[580px] px-[clamp(20px,4vw,56px)] py-[clamp(24px,3vw,40px)]'>
                                    <OnboardingProvider value={ctxValue}>
                                        <AnimatePresence mode='wait' custom={direction} initial={false}>
                                            <motion.div
                                                key={step}
                                                custom={direction}
                                                variants={slideStep}
                                                initial='enter'
                                                animate='center'
                                                exit='exit'>
                                                <StepBody step={step} />
                                            </motion.div>
                                        </AnimatePresence>
                                    </OnboardingProvider>
                                </div>
                            </div>

                            {/* Footer */}
                            {showFooter && (
                                <div className='border-border flex shrink-0 items-center justify-between gap-2 border-t px-[clamp(20px,4vw,56px)] py-3.5'>
                                    <div>
                                        {showBack && (
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                className='text-muted-foreground'
                                                onClick={goBack}>
                                                <ArrowLeftIcon className='size-4' />
                                                Back
                                            </Button>
                                        )}
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        {footer.skip && (
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                className='text-muted-foreground'
                                                onClick={skip}>
                                                {step === 'connect' ? "I'll set it up manually" : 'Skip for now'}
                                            </Button>
                                        )}
                                        {footer.primary &&
                                            (footer.primary === 'See my offer' ? (
                                                <span className='gradient-border'>
                                                    <Button onClick={handlePrimary} disabled={primaryDisabled}>
                                                        {footer.primary}
                                                        <ArrowRightIcon className='size-4' />
                                                    </Button>
                                                </span>
                                            ) : (
                                                <Button onClick={handlePrimary} disabled={primaryDisabled}>
                                                    {footer.primary}
                                                    <ArrowRightIcon className='size-4' />
                                                </Button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </MotionConfig>
            </DialogContent>
        </Dialog>
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
        case 'mirror':
            return <MirrorStep />
        case 'goal':
            return <GoalStep />
        case 'proof':
            return <ProofStep />
        case 'preview':
            return <PreviewStep />
        case 'voice':
            return <VoiceStep />
        case 'spotlight':
            return <SpotlightStep />
        case 'cadence':
            return <CadenceStep />
        case 'building':
            return <BuildingStep />
        case 'recap':
            return <RecapStep />
        case 'offer':
            return <OfferStep />
        case 'done':
            return <DoneStep />
    }
}
