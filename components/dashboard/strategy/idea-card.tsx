'use client'

import { useRouter } from 'next/navigation'

import type { PostIdea } from '@/lib/strategy'
import { FORMAT_CATEGORIES } from '@/lib/strategy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type IdeaCardProps = {
    idea: PostIdea
}

const CATEGORY_STYLES: Record<string, string> = {
    personal: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    educational: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    organizational: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    promotional: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
}

export function IdeaCard({ idea }: IdeaCardProps) {
    const router = useRouter()
    const category = FORMAT_CATEGORIES[idea.format] ?? 'educational'
    const categoryStyle = CATEGORY_STYLES[category]

    return (
        <Card className='flex flex-col'>
            <CardContent className='flex flex-1 flex-col gap-3 py-4'>
                {/* Format badge */}
                <span
                    className={cn(
                        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                        categoryStyle,
                    )}>
                    {idea.format}
                </span>

                {/* Topic */}
                <p className='text-sm leading-snug font-medium'>{idea.topic}</p>

                {/* Hook */}
                <p className='text-muted-foreground text-sm leading-relaxed'>"{idea.hook}"</p>

                {/* Create post button */}
                <div className='mt-auto pt-1'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => router.push('/dashboard/editor')}
                        className='w-full'>
                        Create Post
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
