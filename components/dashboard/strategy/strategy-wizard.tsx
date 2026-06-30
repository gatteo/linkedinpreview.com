'use client'

import * as React from 'react'
import { XIcon } from 'lucide-react'

import type { BrandingData, BrandingRole } from '@/lib/branding'
import {
    DEFAULT_STRATEGY,
    type ScheduleSlot,
    type StrategyAudience,
    type StrategyFormat,
    type StrategyGoal,
} from '@/lib/strategy'
import type { StrategyData } from '@/lib/strategy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

import { AudienceStep } from './wizard-steps/audience-step'
import { ExpertiseStep } from './wizard-steps/expertise-step'
import { FormatsStep } from './wizard-steps/formats-step'
import { FrequencyStep } from './wizard-steps/frequency-step'
import { GoalsStep } from './wizard-steps/goals-step'
import { PositioningStep } from './wizard-steps/positioning-step'
import { RoleStep } from './wizard-steps/role-step'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep = 'role' | 'goals' | 'audience' | 'expertise' | 'frequency' | 'positioning' | 'formats'

type StrategyWizardProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialBranding: BrandingData
    initialStrategy: StrategyData
    onComplete: (strategyData: StrategyData, brandingUpdates: Partial<BrandingData>) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS: WizardStep[] = ['role', 'goals', 'audience', 'expertise', 'frequency', 'positioning', 'formats']

const STEP_TITLES: Record<WizardStep, string> = {
    role: 'Tell us about your primary role',
    goals: 'Choose your main goals',
    audience: 'Choose your target audience',
    expertise: 'What are your main areas of expertise?',
    frequency: 'Set your posting frequency & schedule',
    positioning: 'Your Positioning Statement',
    formats: 'Suggested Content Strategy',
}

const STEP_SUBTITLES: Record<WizardStep, string> = {
    role: 'This helps us tailor recommendations and content relevant to your work.',
    goals: 'Select up to 3 goals',
    audience: 'Who do you want to reach?',
    expertise: 'List up to 4 topics you know best. We use these to suggest relevant post ideas.',
    frequency: "Choose how often you want to post. We'll suggest a schedule you can adjust.",
    positioning: 'Review and refine your generated statement below. This will guide your content creation.',
    formats: 'Edit the suggested post formats to your preferences.',
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isStepValid(step: WizardStep, state: WizardFormState): boolean {
    switch (step) {
        case 'role':
            return state.role !== ''
        case 'goals':
            return state.goals.length >= 1
        case 'audience':
            return state.audience.length >= 1
        case 'expertise':
            return state.topics.filter(Boolean).length >= 2
        case 'frequency':
            return true
        case 'positioning':
            return state.positioning.trim().length > 0
        case 'formats':
            return state.formats.filter((f) => f.enabled).length >= 1
        default:
            return true
    }
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

type WizardFormState = {
    role: BrandingRole
    goals: StrategyGoal[]
    audience: StrategyAudience[]
    topics: string[]
    frequency: number
    schedule: ScheduleSlot[]
    positioning: string
    formats: StrategyFormat[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StrategyWizard({
    open,
    onOpenChange,
    initialBranding,
    initialStrategy,
    onComplete,
}: StrategyWizardProps) {
    const [step, setStep] = React.useState<WizardStep>('role')

    const [form, setForm] = React.useState<WizardFormState>(() => ({
        role: initialBranding.role || '',
        goals: initialStrategy.goals,
        audience: initialStrategy.audience,
        topics:
            initialBranding.expertise.topics.length > 0
                ? [...initialBranding.expertise.topics, '', '', ''].slice(0, 4)
                : ['', '', '', ''],
        frequency: initialStrategy.frequency ?? DEFAULT_STRATEGY.frequency,
        schedule: initialStrategy.schedule.length > 0 ? initialStrategy.schedule : DEFAULT_STRATEGY.schedule,
        positioning: initialBranding.positioning.statement,
        formats: initialStrategy.formats,
    }))

    // Re-initialize when dialog opens with latest data
    React.useEffect(() => {
        if (open) {
            setStep('role')
            setForm({
                role: initialBranding.role || '',
                goals: initialStrategy.goals,
                audience: initialStrategy.audience,
                topics:
                    initialBranding.expertise.topics.length > 0
                        ? [...initialBranding.expertise.topics, '', '', ''].slice(0, 4)
                        : ['', '', '', ''],
                frequency: initialStrategy.frequency ?? DEFAULT_STRATEGY.frequency,
                schedule: initialStrategy.schedule.length > 0 ? initialStrategy.schedule : DEFAULT_STRATEGY.schedule,
                positioning: initialBranding.positioning.statement,
                formats: initialStrategy.formats,
            })
        }
    }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

    const currentIndex = STEPS.indexOf(step)
    const isLastStep = step === 'formats'
    const isFirstStep = step === 'role'
    const progressPct = ((currentIndex + 1) / STEPS.length) * 100
    const canContinue = isStepValid(step, form)

    const goNext = () => {
        if (!canContinue) return
        if (isLastStep) {
            handleComplete()
        } else {
            setStep(STEPS[currentIndex + 1])
        }
    }

    const goBack = () => {
        if (!isFirstStep) {
            setStep(STEPS[currentIndex - 1])
        }
    }

    const handleComplete = () => {
        const strategyData: StrategyData = {
            goals: form.goals,
            audience: form.audience,
            frequency: form.frequency,
            schedule: form.schedule,
            formats: form.formats,
            weeklyIdeas: initialStrategy.weeklyIdeas,
            completedAt: new Date().toISOString(),
        }

        const brandingUpdates: Partial<BrandingData> = {
            role: form.role,
            expertise: { topics: form.topics.filter(Boolean) },
            positioning: { statement: form.positioning },
        }

        onComplete(strategyData, brandingUpdates)
        onOpenChange(false)
    }

    const updateForm = (updates: Partial<WizardFormState>) => {
        setForm((prev) => ({ ...prev, ...updates }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className='flex h-[90svh] max-h-[700px] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'>
                {/* Cancel button */}
                <div className='flex shrink-0 items-center justify-end px-5 pt-4'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onOpenChange(false)}
                        className='rounded-full px-4'>
                        <XIcon className='mr-1.5 size-3.5' />
                        Cancel
                    </Button>
                </div>

                {/* Step content */}
                <div className='flex flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-6'>
                    <div className='flex w-full max-w-xl flex-col items-center gap-6'>
                        {/* Heading */}
                        <div className='text-center'>
                            <h2 className='text-2xl font-bold tracking-tight'>{STEP_TITLES[step]}</h2>
                            <p className='text-muted-foreground mt-2 text-sm'>{STEP_SUBTITLES[step]}</p>
                        </div>

                        {/* Step body */}
                        <div className='w-full'>
                            {step === 'role' && (
                                <RoleStep value={form.role} onChange={(role) => updateForm({ role })} />
                            )}
                            {step === 'goals' && (
                                <GoalsStep value={form.goals} onChange={(goals) => updateForm({ goals })} />
                            )}
                            {step === 'audience' && (
                                <AudienceStep value={form.audience} onChange={(audience) => updateForm({ audience })} />
                            )}
                            {step === 'expertise' && (
                                <ExpertiseStep value={form.topics} onChange={(topics) => updateForm({ topics })} />
                            )}
                            {step === 'frequency' && (
                                <FrequencyStep
                                    frequency={form.frequency}
                                    schedule={form.schedule}
                                    onFrequencyChange={(frequency) => updateForm({ frequency })}
                                    onScheduleChange={(schedule) => updateForm({ schedule })}
                                />
                            )}
                            {step === 'positioning' && (
                                <PositioningStep
                                    value={form.positioning}
                                    onChange={(positioning) => updateForm({ positioning })}
                                    role={form.role}
                                    goals={form.goals}
                                    audience={form.audience}
                                    topics={form.topics}
                                />
                            )}
                            {step === 'formats' && (
                                <FormatsStep
                                    value={form.formats}
                                    onChange={(formats) => updateForm({ formats })}
                                    role={form.role}
                                    goals={form.goals}
                                    audience={form.audience}
                                    topics={form.topics}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer: progress bar + nav */}
                <div className='shrink-0'>
                    {/* Progress bar */}
                    <div className='bg-muted h-1 w-full'>
                        <div
                            className='bg-primary h-full transition-all duration-300'
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>

                    {/* Navigation */}
                    <div className='flex items-center justify-between px-5 py-4'>
                        {!isFirstStep ? (
                            <Button variant='outline' size='sm' onClick={goBack} className='rounded-full px-4'>
                                Back
                            </Button>
                        ) : (
                            <div />
                        )}

                        <Button
                            size='sm'
                            onClick={goNext}
                            disabled={!canContinue}
                            className={cn('rounded-full px-5', isLastStep && 'px-6')}>
                            {isLastStep ? 'Save & Finish Strategy' : 'Continue'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
