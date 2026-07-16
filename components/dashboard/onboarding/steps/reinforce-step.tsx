'use client'

import * as React from 'react'

import { REINFORCE_CHART } from '@/config/onboarding-flow'
import { cn } from '@/lib/utils'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { CTA, H1, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 11 · Reinforce - "consistency is how you get found": the real follower count
// (when the scrape landed) framed as an audience they're not showing up for,
// plus a benchmark impressions-by-frequency chart with their chosen cadence
// highlighted.
// ---------------------------------------------------------------------------

function compactFollowers(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : n.toString()
}

export function ReinforceStep() {
    const { answers, goNext } = useOnboarding()
    const followers = answers.richSummary?.followers ?? null
    const frequency = Math.max(1, answers.frequency)
    const selectedBar = Math.min(5, frequency)

    React.useEffect(() => {
        track('onb_reinforce_view', { hasFollowers: followers !== null })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className='flex flex-col'>
            <H1 className='mb-5'>Consistency is how you get found.</H1>

            {followers !== null && followers > 0 && (
                <div className='bg-secondary border-border mb-[18px] flex items-center gap-4 rounded-[14px] border p-[18px]'>
                    <div className='font-heading text-primary shrink-0 text-[38px] leading-none font-bold'>
                        {compactFollowers(followers)}
                    </div>
                    <div className='text-muted-foreground text-sm leading-[1.45]'>
                        followers already watching, and most weeks you&rsquo;re not showing up for them.
                    </div>
                </div>
            )}

            <Sub>
                {answers.niche ? `People in ${answers.niche}` : 'People'} who hit {frequency}×/week typically see
                compounding reach within 90 days. Right now, that reach is going to whoever shows up.
            </Sub>

            <div className='bg-secondary border-border mb-[18px] rounded-[14px] border px-[18px] pt-4 pb-3.5'>
                <div className='text-muted-foreground mb-4 font-mono text-[10.5px] font-medium tracking-[0.08em] uppercase'>
                    Est. monthly impressions by posting frequency
                </div>
                <div className='border-border flex h-[168px] items-end gap-3 border-b pt-[22px] pb-[26px]'>
                    {REINFORCE_CHART.map((bar) => {
                        const isSel = bar.n === selectedBar
                        return (
                            <div
                                key={bar.n}
                                className='relative flex h-full flex-1 flex-col items-center justify-end'
                                style={{ '--h': `${bar.height}%` } as React.CSSProperties}>
                                <span
                                    className={cn(
                                        'absolute right-0 left-0 mb-[5px] text-center text-xs',
                                        isSel ? 'text-foreground font-bold' : 'text-muted-foreground font-semibold',
                                    )}
                                    style={{ bottom: 'var(--h)' }}>
                                    {bar.label}
                                </span>
                                <span
                                    className='animate-ob-bargrow w-full max-w-[46px] shrink-0 origin-bottom rounded-t-[7px]'
                                    style={{
                                        height: 'var(--h)',
                                        animationDelay: `${(bar.n - 1) * 0.06}s`,
                                        background: isSel
                                            ? 'linear-gradient(180deg, var(--orange-400), var(--orange-500))'
                                            : 'color-mix(in oklch, var(--petrol-500) 32%, var(--card))',
                                    }}
                                />
                                <span
                                    className={cn(
                                        'absolute -bottom-[22px] font-mono text-xs',
                                        isSel ? 'text-primary font-bold' : 'text-muted-foreground',
                                    )}>
                                    {bar.n}
                                </span>
                            </div>
                        )
                    })}
                </div>
                <div className='text-muted-foreground mt-2 text-center text-[11.5px]'>Posts per week</div>
            </div>

            <CTA onClick={goNext}>Continue</CTA>
        </div>
    )
}
