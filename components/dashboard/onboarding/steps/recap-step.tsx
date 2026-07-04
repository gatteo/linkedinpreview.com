'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
    BarChart3Icon,
    CalendarDaysIcon,
    FileTextIcon,
    LayoutGridIcon,
    LightbulbIcon,
    MicIcon,
    PieChartIcon,
    TargetIcon,
    type LucideIcon,
} from 'lucide-react'

import { TONE_OPTIONS } from '@/config/ai'
import {
    cadenceOption,
    goalRestated,
    INSIGHT_CATEGORY_LABELS,
    postsPerMonth,
    SPOTLIGHT_CONTENT,
    toneFromSummary,
    type RoleContent,
    type SpotlightFeature,
} from '@/config/onboarding-personalization'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import type { OnboardingAnswers } from '@/components/dashboard/onboarding/types'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { firstName, H2, Sub } from '../primitives'

const FEATURE_ICONS: Record<SpotlightFeature, LucideIcon> = {
    'analytics': BarChart3Icon,
    'calendar': CalendarDaysIcon,
    'carousels': LayoutGridIcon,
    'weekly-ideas': LightbulbIcon,
}

// The one feature to spotlight, prescribed by the user's actual gap when the
// analysis saw their posts, else the role default.
function featureForGap(answers: OnboardingAnswers, roleContent: RoleContent): SpotlightFeature {
    const insights = answers.insights
    if (!insights || insights.kind === 'benchmark') return roleContent.spotlight
    if (insights.missing.some((m) => m.category === 'educational')) return 'carousels'
    if (insights.observed.postsPerWeek === null) return 'calendar'
    if ((insights.observed.followers ?? 0) >= 2000) return 'analytics'
    return roleContent.spotlight
}

export function RecapStep() {
    const { answers, roleContent } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const tone = answers.tone ?? toneFromSummary(answers.toneSummary)
    const toneLabel = TONE_OPTIONS.find((t) => t.value === tone)?.label ?? 'Professional'
    const cadence = cadenceOption(answers.cadence)
    const snippet = (answers.firstPostText ?? '').replace(/\*\*/g, '').split('\n').filter(Boolean)[0] ?? ''
    const insights = answers.insights
    const feature = featureForGap(answers, roleContent)
    const featureContent = SPOTLIGHT_CONTENT[feature]
    const FeatureIcon = FEATURE_ICONS[feature]

    React.useEffect(() => {
        track('onb_recap_view', { feature })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-[18px]'>
            <motion.div variants={fadeUp} className='text-center'>
                <H2>{fn ? `${fn}, your LinkedIn system is ready.` : 'Your LinkedIn system is ready.'}</H2>
                <Sub className='mx-auto mt-1.5 max-w-[440px]'>
                    Positioning, voice, your first post, and a posting calendar - all set up around your goal to{' '}
                    <span className='text-foreground font-medium'>{goalRestated(answers.primaryGoal)}</span>.
                </Sub>
            </motion.div>

            <motion.div variants={staggerItem} className='flex flex-col gap-2.5'>
                {insights && insights.kind === 'posts' && insights.dominant && (
                    <RecapRow icon={PieChartIcon} label={`From your last ${insights.observed.postsAnalyzed} posts`}>
                        Mostly {INSIGHT_CATEGORY_LABELS[insights.dominant].toLowerCase()} ·{' '}
                        {insights.missing.length === 1 ? '1 gap to close' : `${insights.missing.length} gaps to close`}
                    </RecapRow>
                )}
                {answers.positioning && (
                    <RecapRow icon={TargetIcon} label='Your positioning'>
                        {answers.positioning}
                    </RecapRow>
                )}
                <RecapRow icon={MicIcon} label='Your voice'>
                    {toneLabel}
                </RecapRow>
                {snippet && (
                    <RecapRow icon={FileTextIcon} label='First post, ready to publish'>
                        {snippet}
                    </RecapRow>
                )}
                <RecapRow icon={CalendarDaysIcon} label='Your calendar'>
                    {cadence.label} · {postsPerMonth(cadence.frequency)} posts a month planned
                </RecapRow>
                <RecapRow icon={FeatureIcon} label={`In your toolkit: ${featureContent.eyebrow}`}>
                    {featureContent.headline}
                </RecapRow>
            </motion.div>
        </motion.div>
    )
}

function RecapRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
    return (
        <div className='border-border bg-muted/30 flex items-start gap-3 rounded-xl border px-[15px] py-[13px]'>
            <span className='bg-card border-border text-primary flex size-9 shrink-0 items-center justify-center rounded-[10px] border'>
                <Icon className='size-[17px]' />
            </span>
            <div className='flex min-w-0 flex-col'>
                <span className='text-muted-foreground text-xs font-medium'>{label}</span>
                <span className='text-foreground line-clamp-2 text-sm'>{children}</span>
            </div>
        </div>
    )
}
