'use client'

import * as React from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from 'lucide-react'

import { EASE_OUT, slideStep } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { AudienceStep } from '@/components/dashboard/strategy/wizard-steps/audience-step'
import { ExpertiseStep } from '@/components/dashboard/strategy/wizard-steps/expertise-step'
import { FrequencyStep } from '@/components/dashboard/strategy/wizard-steps/frequency-step'
import { GoalsStep } from '@/components/dashboard/strategy/wizard-steps/goals-step'
import { RoleStep } from '@/components/dashboard/strategy/wizard-steps/role-step'

import { Confetti } from './confetti'
import { BuildingStep } from './steps/building-step'
import { CompleteStep } from './steps/complete-step'
import { LinkedinStep } from './steps/linkedin-step'
import { ProfileStep } from './steps/profile-step'
import { WelcomeStep } from './steps/welcome-step'
import { WritingStyleStep } from './steps/writing-style-step'
import type { OnboardingAnswers } from './types'

// ---------------------------------------------------------------------------
// Step registry
// ---------------------------------------------------------------------------

export type StepId =
    | 'welcome'
    | 'linkedin'
    | 'profile'
    | 'role'
    | 'goals'
    | 'audience'
    | 'expertise'
    | 'writing-style'
    | 'frequency'
    | 'building'
    | 'complete'

type StepMeta = {
    id: StepId
    /** Accessible title (also shown as a visible header for `chrome: 'header'`). */
    title: string
    subtitle?: string
    /** 'header' renders a visible title/subtitle above the body; 'bare' lets the body own its heading. */
    chrome: 'header' | 'bare'
    skippable: boolean
}

const STEPS: StepMeta[] = [
    { id: 'welcome', title: 'Welcome', chrome: 'bare', skippable: false },
    { id: 'linkedin', title: 'Connect LinkedIn', chrome: 'bare', skippable: true },
    {
        id: 'profile',
        title: 'Your profile',
        subtitle: "This is how you'll appear on LinkedIn.",
        chrome: 'header',
        skippable: true,
    },
    {
        id: 'role',
        title: 'What best describes you?',
        subtitle: "We'll tailor suggestions to your role.",
        chrome: 'header',
        skippable: true,
    },
    { id: 'goals', title: 'What are your goals?', subtitle: 'Pick up to three.', chrome: 'header', skippable: true },
    {
        id: 'audience',
        title: 'Who are you writing for?',
        subtitle: 'Select all that apply.',
        chrome: 'header',
        skippable: true,
    },
    {
        id: 'expertise',
        title: 'What do you know best?',
        subtitle: 'Add a couple of topics you want to be known for.',
        chrome: 'header',
        skippable: true,
    },
    {
        id: 'writing-style',
        title: 'How do you like to write?',
        subtitle: "We'll match your voice in every draft.",
        chrome: 'header',
        skippable: true,
    },
    {
        id: 'frequency',
        title: 'How often will you post?',
        subtitle: 'Set a rhythm you can keep.',
        chrome: 'header',
        skippable: true,
    },
    { id: 'building', title: 'Building your setup', chrome: 'bare', skippable: false },
    { id: 'complete', title: 'All set', chrome: 'bare', skippable: false },
]

const indexOf = (id: StepId) => STEPS.findIndex((s) => s.id === id)

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

type OnboardingModalProps = {
    open: boolean
    initialAnswers: OnboardingAnswers
    startStepId?: StepId
    linkedinError?: string | null
    onFinish: (answers: OnboardingAnswers) => void
    onSkipSetup: () => void
    onConnectLinkedin: (answers: OnboardingAnswers) => void
}

export function OnboardingModal({
    open,
    initialAnswers,
    startStepId = 'welcome',
    linkedinError,
    onFinish,
    onSkipSetup,
    onConnectLinkedin,
}: OnboardingModalProps) {
    const [answers, setAnswers] = React.useState(initialAnswers)
    const [index, setIndex] = React.useState(() => Math.max(0, indexOf(startStepId)))
    const [direction, setDirection] = React.useState(1)

    const step = STEPS[index]
    const isLast = step.id === 'complete'

    const update = React.useCallback(
        (patch: Partial<OnboardingAnswers>) => setAnswers((prev) => ({ ...prev, ...patch })),
        [],
    )

    const goNext = React.useCallback(() => {
        setDirection(1)
        setIndex((i) => Math.min(STEPS.length - 1, i + 1))
    }, [])

    const goBack = React.useCallback(() => {
        setDirection(-1)
        setIndex((i) => Math.max(0, i - 1))
    }, [])

    const nextIsBuilding = STEPS[index + 1]?.id === 'building'
    const progress = (index / (STEPS.length - 1)) * 100

    const primaryLabel =
        step.id === 'welcome' ? "Let's go" : isLast ? 'Go to dashboard' : nextIsBuilding ? 'Build my setup' : 'Continue'
    const handlePrimary = () => (isLast ? onFinish(answers) : goNext())

    const showBack = index > 0 && step.id !== 'building' && step.id !== 'complete'
    const showFooter = step.id !== 'building'

    return (
        <Dialog open={open}>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                className='flex max-h-[88vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl'>
                <MotionConfig reducedMotion='user'>
                    {step.id === 'complete' && <Confetti />}

                    {/* Progress */}
                    <div className='bg-muted h-1 w-full shrink-0'>
                        <motion.div
                            className='bg-primary h-full'
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: EASE_OUT }}
                        />
                    </div>

                    {/* Always-present accessible title */}
                    <DialogTitle className='sr-only'>{step.title}</DialogTitle>

                    {/* Body */}
                    <div className='flex-1 overflow-y-auto px-6 pt-6 pb-4'>
                        {step.chrome === 'header' && (
                            <div className='mb-5 flex flex-col gap-1'>
                                <h2 className='font-heading text-xl tracking-tight'>{step.title}</h2>
                                {step.subtitle && <DialogDescription>{step.subtitle}</DialogDescription>}
                            </div>
                        )}

                        <AnimatePresence mode='wait' custom={direction} initial={false}>
                            <motion.div
                                key={step.id}
                                custom={direction}
                                variants={slideStep}
                                initial='enter'
                                animate='center'
                                exit='exit'
                                className='flex justify-center'>
                                <div className='w-full'>
                                    <StepBody
                                        step={step.id}
                                        answers={answers}
                                        update={update}
                                        linkedinError={linkedinError}
                                        onConnectLinkedin={() => onConnectLinkedin(answers)}
                                        onBuildingDone={(positioning, formats) => {
                                            update({ positioning, formats })
                                            goNext()
                                        }}
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {showFooter && (
                        <div className='bg-muted/40 flex shrink-0 items-center justify-between gap-2 border-t px-6 py-3.5'>
                            <div>
                                {showBack && (
                                    <Button variant='ghost' size='sm' onClick={goBack}>
                                        <ArrowLeftIcon className='size-4' />
                                        Back
                                    </Button>
                                )}
                                {step.id === 'welcome' && (
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        className='text-muted-foreground'
                                        onClick={onSkipSetup}>
                                        Skip setup
                                    </Button>
                                )}
                            </div>
                            <div className='flex items-center gap-2'>
                                {step.skippable && (
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        className='text-muted-foreground'
                                        onClick={goNext}>
                                        {step.id === 'linkedin' ? "I'll do this later" : 'Skip for now'}
                                    </Button>
                                )}
                                <Button onClick={handlePrimary} className={cn(nextIsBuilding && 'pr-3')}>
                                    {nextIsBuilding && <SparklesIcon className='size-4' />}
                                    {primaryLabel}
                                    {!nextIsBuilding && !isLast && <ArrowRightIcon className='size-4' />}
                                </Button>
                            </div>
                        </div>
                    )}
                </MotionConfig>
            </DialogContent>
        </Dialog>
    )
}

// ---------------------------------------------------------------------------
// Step body switch
// ---------------------------------------------------------------------------

type StepBodyProps = {
    step: StepId
    answers: OnboardingAnswers
    update: (patch: Partial<OnboardingAnswers>) => void
    linkedinError?: string | null
    onConnectLinkedin: () => void
    onBuildingDone: (positioning: string, formats: OnboardingAnswers['formats']) => void
}

function StepBody({ step, answers, update, linkedinError, onConnectLinkedin, onBuildingDone }: StepBodyProps) {
    switch (step) {
        case 'welcome':
            return <WelcomeStep />
        case 'linkedin':
            return <LinkedinStep answers={answers} onConnect={onConnectLinkedin} error={linkedinError} />
        case 'profile':
            return <ProfileStep answers={answers} update={update} />
        case 'role':
            return <RoleStep value={answers.role} onChange={(v) => update({ role: v })} />
        case 'goals':
            return <GoalsStep value={answers.goals} onChange={(v) => update({ goals: v })} />
        case 'audience':
            return <AudienceStep value={answers.audience} onChange={(v) => update({ audience: v })} />
        case 'expertise':
            return <ExpertiseStep value={answers.topics} onChange={(v) => update({ topics: v })} />
        case 'writing-style':
            return <WritingStyleStep answers={answers} update={update} />
        case 'frequency':
            return (
                <FrequencyStep
                    frequency={answers.frequency}
                    schedule={answers.schedule}
                    onFrequencyChange={(v) => update({ frequency: v })}
                    onScheduleChange={(v) => update({ schedule: v })}
                />
            )
        case 'building':
            return <BuildingStep answers={answers} onDone={onBuildingDone} />
        case 'complete':
            return <CompleteStep answers={answers} update={update} />
    }
}
