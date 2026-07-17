import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Routes } from '@/config/routes'

import { TrackClick } from '../tracking/track-click'
import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'
import { Eyebrow, Section } from './_shared'

// ---------------------------------------------------------------------------
// Plan CTA - the bridge from the free tool to the onboarding funnel: a free
// profile audit that ends in a personalized 90-day plan with drafted posts.
// ---------------------------------------------------------------------------

export function PlanCta() {
    return (
        <Section>
            <div className='relative overflow-hidden py-20 text-center max-sm:py-14'>
                <div
                    aria-hidden
                    className='pointer-events-none absolute inset-x-0 top-0 h-full'
                    style={{
                        background: 'radial-gradient(560px 300px at 50% -40px, var(--glow-warm), transparent 70%)',
                    }}
                />
                <AnimateIn>
                    <Eyebrow className='mb-3.5'>Your 90-day plan</Eyebrow>
                    <h2 className='font-heading mx-auto max-w-[560px] text-[clamp(30px,4.6vw,46px)] leading-[1.05] font-bold tracking-[-0.03em]'>
                        Grow 10× on LinkedIn <span className='text-[color:var(--orange-600)]'>in 90 days.</span>
                    </h2>
                    <p className='text-muted-foreground mx-auto mt-4 mb-8 max-w-[480px] text-[16.5px] leading-[1.55]'>
                        Connect your profile for an honest audit of your recent posts, a personalized posting plan, and
                        your first post already drafted in your voice.
                    </p>
                    <TrackClick
                        event='cta_button_clicked'
                        properties={{ button_name: 'create_plan', source: 'plan_section' }}>
                        <span className='gradient-border'>
                            <Button asChild size='lg' className='h-12 px-6 text-[15px]'>
                                <Link href={Routes.Dashboard}>
                                    Create my LinkedIn plan
                                    <ArrowRight className='size-4' />
                                </Link>
                            </Button>
                        </span>
                    </TrackClick>
                    <div className='text-muted-foreground mt-5 flex items-center justify-center gap-2 font-mono text-xs tracking-[0.02em]'>
                        <span>Free audit</span>
                        <span className='opacity-45'>·</span>
                        <span>No signup</span>
                        <span className='opacity-45'>·</span>
                        <span>About 2 minutes</span>
                    </div>
                </AnimateIn>
            </div>
        </Section>
    )
}
