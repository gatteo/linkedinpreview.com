'use client'

import { PlusIcon } from 'lucide-react'

import { DAYS_OF_WEEK, type DayOfWeek, type ScheduleSlot } from '@/lib/strategy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FrequencyStepProps = {
    frequency: number
    schedule: ScheduleSlot[]
    onFrequencyChange: (value: number) => void
    onScheduleChange: (value: ScheduleSlot[]) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FrequencyStep({ frequency, schedule, onFrequencyChange, onScheduleChange }: FrequencyStepProps) {
    const updateSlotTime = (index: number, time: string) => {
        const next = schedule.map((slot, i) => (i === index ? { ...slot, time } : slot))
        onScheduleChange(next)
    }

    const toggleSlotDay = (slotIndex: number, day: DayOfWeek) => {
        const next = schedule.map((slot, i) => {
            if (i !== slotIndex) return slot
            const days = slot.days.includes(day) ? slot.days.filter((d) => d !== day) : [...slot.days, day]
            return { ...slot, days }
        })
        onScheduleChange(next)
    }

    const addSlot = () => {
        onScheduleChange([...schedule, { time: '09:00', days: [] }])
    }

    return (
        <div className='flex w-full flex-col gap-6'>
            {/* Number picker */}
            <div className='flex justify-center gap-2'>
                {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
                    <button
                        key={n}
                        type='button'
                        onClick={() => onFrequencyChange(n)}
                        className={cn(
                            'flex size-11 items-center justify-center rounded-lg border text-sm font-semibold transition-all',
                            frequency === n
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-muted/30 text-foreground hover:bg-muted/50',
                        )}>
                        {n}
                    </button>
                ))}
            </div>

            {/* Schedule grid */}
            <div className='w-full overflow-x-auto rounded-lg border'>
                <table className='w-full text-xs'>
                    <thead>
                        <tr className='border-b'>
                            <th className='text-muted-foreground px-3 py-2.5 text-left font-medium tracking-wide uppercase'>
                                TIME
                            </th>
                            {DAYS_OF_WEEK.map((day) => (
                                <th
                                    key={day.value}
                                    className='text-muted-foreground px-2 py-2.5 text-center font-medium tracking-wide uppercase'>
                                    {day.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((slot, slotIndex) => (
                            <tr key={slotIndex} className='border-b last:border-0'>
                                <td className='px-3 py-2'>
                                    <input
                                        type='time'
                                        value={slot.time}
                                        onChange={(e) => updateSlotTime(slotIndex, e.target.value)}
                                        className='border-input bg-background focus-visible:ring-ring/50 rounded border px-2 py-1 text-xs outline-none focus-visible:ring-2'
                                    />
                                </td>
                                {DAYS_OF_WEEK.map((day) => {
                                    const checked = slot.days.includes(day.value)
                                    return (
                                        <td key={day.value} className='px-2 py-2 text-center'>
                                            <button
                                                type='button'
                                                onClick={() => toggleSlotDay(slotIndex, day.value)}
                                                className={cn(
                                                    'mx-auto flex size-5 items-center justify-center rounded-full border transition-all',
                                                    checked
                                                        ? 'border-primary bg-primary'
                                                        : 'border-border bg-muted/30 hover:border-border/80',
                                                )}>
                                                {checked && (
                                                    <svg
                                                        viewBox='0 0 8 8'
                                                        className='text-primary-foreground size-2.5'
                                                        fill='none'>
                                                        <path
                                                            d='M1.5 4L3 5.5L6.5 2'
                                                            stroke='currentColor'
                                                            strokeWidth='1.5'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='px-3 py-2'>
                    <Button variant='ghost' size='sm' onClick={addSlot} className='text-muted-foreground gap-1.5'>
                        <PlusIcon className='size-3.5' />
                        Add Time Slot
                    </Button>
                </div>
            </div>
        </div>
    )
}
