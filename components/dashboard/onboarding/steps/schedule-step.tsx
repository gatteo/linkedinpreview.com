'use client'

import * as React from 'react'
import { AnimatePresence } from 'framer-motion'
import { CheckIcon, ClockIcon, SparklesIcon } from 'lucide-react'

import { DEFAULT_SLOT, frequencyForGoal, scheduleReaction, suggestedDays } from '@/config/onboarding-flow'
import { DAYS_OF_WEEK, type DayOfWeek, type ScheduleSlot } from '@/lib/strategy'
import { cn } from '@/lib/utils'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { CTA, FieldLabel, firstName, H1, Reaction, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 10 · Schedule (rail 5/5) - frequency + a weekly calendar. Picking a number
// auto-suggests a day spread; toggling days updates the number both ways.
// "Choose for me" picks a rhythm tuned to the goal. Maps straight onto the
// strategy's frequency + schedule slots.
// ---------------------------------------------------------------------------

const MAX_SLOTS = 2

export function ScheduleStep() {
    const { answers, update, goNext } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const slots = answers.schedule.length ? answers.schedule : [DEFAULT_SLOT]
    const totalDays = slots.reduce((n, s) => n + s.days.length, 0)
    const frequency = Math.max(1, totalDays || answers.frequency)
    // The insight only surfaces once the user actually tunes the rhythm, so it
    // never pops over the untouched default calendar.
    const [touched, setTouched] = React.useState(false)

    const commit = (nextSlots: ScheduleSlot[]) => {
        setTouched(true)
        const days = nextSlots.reduce((n, s) => n + s.days.length, 0)
        update({ schedule: nextSlots, frequency: Math.max(1, days) })
    }

    const setFrequency = (n: number) => {
        // A frequency pick re-suggests the spread on the first slot and drops
        // extras - the explicit day grid below stays the fine-tuning surface.
        commit([{ time: slots[0]?.time ?? '09:00', days: suggestedDays(n) }])
        track('onb_schedule_frequency', { frequency: n })
    }

    const chooseForMe = () => {
        const n = frequencyForGoal(answers.goalId)
        setFrequency(n)
        track('onb_schedule_choose_for_me', { frequency: n })
    }

    const toggleDay = (slotIndex: number, day: DayOfWeek) => {
        const next = slots.map((slot, i) => {
            if (i !== slotIndex) return slot
            const has = slot.days.includes(day)
            return { ...slot, days: has ? slot.days.filter((d) => d !== day) : [...slot.days, day] }
        })
        commit(next)
    }

    const setTime = (slotIndex: number, time: string) => {
        commit(slots.map((slot, i) => (i === slotIndex ? { ...slot, time: time || slot.time } : slot)))
    }

    const addSlot = () => {
        if (slots.length >= MAX_SLOTS) return
        commit([...slots, { time: '17:00', days: [] }])
    }

    const allDays = slots.flatMap((s) => s.days)

    return (
        <div className='flex flex-col'>
            <H1>{fn ? `${fn}, set your posting rhythm.` : 'Set your posting rhythm.'}</H1>
            <Sub className='mb-4'>Choose how often you want to post</Sub>

            <div className='mb-2.5 flex items-center gap-2.5'>
                <FieldLabel className='m-0'>Posts per week</FieldLabel>
                <button
                    type='button'
                    onClick={chooseForMe}
                    className='text-primary hover:bg-accent inline-flex cursor-pointer items-center gap-[5px] rounded-lg px-1.5 py-1 text-[12.5px] font-medium'>
                    <SparklesIcon className='size-[13px]' />
                    Choose for me
                </button>
            </div>
            <div className='mb-4 flex gap-2'>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                        key={n}
                        type='button'
                        onClick={() => setFrequency(n)}
                        className={cn(
                            'font-heading aspect-square max-w-[52px] flex-1 cursor-pointer rounded-[11px] border text-base font-semibold shadow-[var(--shadow-subtle)] transition-colors',
                            n === frequency
                                ? 'bg-primary text-primary-foreground border-primary shadow-[var(--btn-rest)]'
                                : 'border-border bg-card text-foreground hover:border-primary/50',
                        )}>
                        {n}
                    </button>
                ))}
            </div>

            <FieldLabel className='mb-2.5'>Posting schedule</FieldLabel>
            <div className='border-border mb-4 overflow-hidden rounded-[13px] border'>
                <div className='bg-secondary border-border grid grid-cols-[88px_repeat(7,1fr)] items-center border-b py-[9px]'>
                    <span className='text-muted-foreground pl-3.5 text-left font-mono text-[10px] tracking-[0.04em]'>
                        TIME
                    </span>
                    {DAYS_OF_WEEK.map((d) => (
                        <span
                            key={d.value}
                            className='text-muted-foreground text-center font-mono text-[10px] tracking-[0.04em] uppercase'>
                            {d.label}
                        </span>
                    ))}
                </div>
                {slots.map((slot, si) => (
                    <div key={si} className='grid grid-cols-[88px_repeat(7,1fr)] items-center py-[9px]'>
                        <span className='ml-2.5'>
                            <input
                                type='time'
                                value={slot.time}
                                onChange={(e) => setTime(si, e.target.value)}
                                aria-label='Posting time'
                                className='border-border bg-card text-foreground w-[74px] rounded-lg border px-1.5 py-[5px] text-[12.5px] tabular-nums focus-visible:outline-none'
                            />
                        </span>
                        {DAYS_OF_WEEK.map((d) => {
                            const on = slot.days.includes(d.value)
                            return (
                                <button
                                    key={d.value}
                                    type='button'
                                    onClick={() => toggleDay(si, d.value)}
                                    aria-pressed={on}
                                    aria-label={`${d.label} ${slot.time}`}
                                    className={cn(
                                        'grid size-[26px] cursor-pointer place-items-center justify-self-center rounded-full border-[1.5px] transition-colors',
                                        on
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'border-border-strong hover:border-primary/60 bg-transparent',
                                    )}>
                                    {on && <CheckIcon className='size-[13px]' strokeWidth={2.5} />}
                                </button>
                            )
                        })}
                    </div>
                ))}
                {slots.length < MAX_SLOTS && (
                    <button
                        type='button'
                        onClick={addSlot}
                        className='border-border text-primary flex w-full cursor-pointer items-center gap-1.5 border-t px-3.5 py-[11px] text-left text-[13px] font-medium'>
                        <ClockIcon className='size-[13px]' />
                        Add time slot
                    </button>
                )}
            </div>

            <AnimatePresence initial={false}>
                {touched && (
                    <Reaction key={`${frequency}-${allDays.join()}`} reaction={scheduleReaction(frequency, allDays)} />
                )}
            </AnimatePresence>

            <CTA onClick={goNext} disabled={totalDays === 0}>
                Continue
            </CTA>
        </div>
    )
}
