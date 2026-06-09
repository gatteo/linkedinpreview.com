'use client'

import { BarChart3Icon, PlusIcon, RefreshCwIcon, SparklesIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type StrategyEmptyProps = {
    onCreateStrategy: () => void
}

const BENEFITS = [
    {
        icon: SparklesIcon,
        text: 'Get AI-powered post suggestions tailored to your goals',
    },
    {
        icon: RefreshCwIcon,
        text: 'Maintain consistent posting with smart scheduling',
    },
    {
        icon: BarChart3Icon,
        text: 'Keep track of your monthly progress',
    },
]

export function StrategyEmpty({ onCreateStrategy }: StrategyEmptyProps) {
    return (
        <div className='flex flex-1 flex-col items-center justify-center p-8'>
            <div className='flex w-full max-w-sm flex-col items-center gap-8 text-center'>
                {/* Decorative concentric rings */}
                <div className='relative flex size-32 items-center justify-center'>
                    <div className='border-primary/8 absolute size-32 rounded-full border-2' />
                    <div className='border-primary/15 absolute size-24 rounded-full border-2' />
                    <div className='border-primary/25 absolute size-16 rounded-full border-2' />
                    <div className='bg-primary/10 flex size-10 items-center justify-center rounded-full'>
                        <SparklesIcon className='text-primary size-5' />
                    </div>
                </div>

                {/* Heading */}
                <div className='space-y-2'>
                    <h2 className='text-2xl font-bold'>Get Your Content Strategy</h2>
                    <p className='text-muted-foreground text-sm'>
                        Set up your personalized LinkedIn content strategy in minutes.
                    </p>
                </div>

                {/* Benefits */}
                <ul className='w-full space-y-3 text-left'>
                    {BENEFITS.map(({ icon: Icon, text }) => (
                        <li key={text} className='flex items-start gap-3'>
                            <div className='bg-primary/10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full'>
                                <Icon className='text-primary size-3.5' />
                            </div>
                            <span className='text-sm'>{text}</span>
                        </li>
                    ))}
                </ul>

                {/* CTA */}
                <Button onClick={onCreateStrategy} size='default'>
                    <PlusIcon className='mr-2 size-4' />
                    Create new strategy
                </Button>
            </div>
        </div>
    )
}
