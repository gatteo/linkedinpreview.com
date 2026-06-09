'use client'

import { PencilIcon } from 'lucide-react'

import type { BrandingData } from '@/lib/branding'
import type { StrategyData } from '@/lib/strategy'
import { STRATEGY_AUDIENCES, STRATEGY_GOALS } from '@/lib/strategy'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type OverviewSectionProps = {
    strategy: StrategyData
    branding: BrandingData
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase'>{children}</p>
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span
            className={cn(
                'bg-muted text-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                className,
            )}>
            {children}
        </span>
    )
}

export function OverviewSection({ strategy, branding }: OverviewSectionProps) {
    const { profile, positioning, expertise } = branding
    const { goals, audience } = strategy

    const goalLabels = goals.map((g) => STRATEGY_GOALS.find((sg) => sg.value === g)?.label).filter(Boolean) as string[]

    const audienceLabels = audience
        .map((a) => STRATEGY_AUDIENCES.find((sa) => sa.value === a)?.label)
        .filter(Boolean) as string[]

    const initials = profile.name
        ? profile.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'YO'

    return (
        <section>
            <h2 className='mb-4 text-base font-semibold'>Overview</h2>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                {/* Profile card */}
                <Card>
                    <CardHeader>
                        <SectionLabel>Profile</SectionLabel>
                    </CardHeader>
                    <CardContent className='flex flex-col items-center gap-3 pb-4 text-center'>
                        <Avatar className='size-16'>
                            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                            <AvatarFallback className='text-lg font-semibold'>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className='font-semibold'>{profile.name || 'Your Name'}</p>
                            {profile.headline && (
                                <p className='text-muted-foreground mt-0.5 text-xs'>{profile.headline}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Purpose statement card */}
                <Card>
                    <CardHeader>
                        <div className='flex items-start justify-between'>
                            <SectionLabel>Purpose Statement</SectionLabel>
                            <PencilIcon className='text-muted-foreground size-3.5 shrink-0' />
                        </div>
                    </CardHeader>
                    <CardContent className='pb-4'>
                        {positioning.statement ? (
                            <p className='text-sm leading-relaxed'>{positioning.statement}</p>
                        ) : (
                            <p className='text-muted-foreground text-sm italic'>No positioning statement set yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Goals card */}
                <Card>
                    <CardHeader>
                        <SectionLabel>Goals</SectionLabel>
                    </CardHeader>
                    <CardContent className='pb-4'>
                        {goalLabels.length > 0 ? (
                            <div className='flex flex-wrap gap-1.5'>
                                {goalLabels.map((label) => (
                                    <Chip key={label}>{label}</Chip>
                                ))}
                            </div>
                        ) : (
                            <p className='text-muted-foreground text-sm italic'>No goals selected.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Audience + Topics card */}
                <Card>
                    <CardHeader>
                        <SectionLabel>Audience & Topics</SectionLabel>
                    </CardHeader>
                    <CardContent className='space-y-3 pb-4'>
                        {audienceLabels.length > 0 && (
                            <div className='flex flex-wrap gap-1.5'>
                                {audienceLabels.map((label) => (
                                    <Chip key={label}>{label}</Chip>
                                ))}
                            </div>
                        )}
                        {expertise.topics.length > 0 && (
                            <div className='flex flex-wrap gap-1.5'>
                                {expertise.topics.filter(Boolean).map((topic) => (
                                    <Chip key={topic} className='bg-primary/10 text-primary border-primary/20 border'>
                                        {topic}
                                    </Chip>
                                ))}
                            </div>
                        )}
                        {audienceLabels.length === 0 && expertise.topics.length === 0 && (
                            <p className='text-muted-foreground text-sm italic'>No audience or topics set.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
