'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2Icon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Routes } from '@/config/routes'
import { textToTipTapJson } from '@/lib/editor-utils'
import type { PostIdea } from '@/lib/strategy'
import { FORMAT_CATEGORIES } from '@/lib/strategy'
import { cn } from '@/lib/utils'
import { useDrafts } from '@/hooks/use-drafts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type IdeaCardProps = {
    idea: PostIdea
    onDismiss: () => void
}

const CATEGORY_STYLES: Record<string, string> = {
    personal: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    educational: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    organizational: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    promotional: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
}

export function IdeaCard({ idea, onDismiss }: IdeaCardProps) {
    const router = useRouter()
    const { createDraft, updateDraft } = useDrafts()
    const [isCreating, setIsCreating] = React.useState(false)
    const category = FORMAT_CATEGORIES[idea.format] ?? 'educational'
    const categoryStyle = CATEGORY_STYLES[category]

    const handleCreatePost = async () => {
        setIsCreating(true)
        try {
            const content = textToTipTapJson(idea.hook)
            const draft = await createDraft(content)
            if (idea.format) {
                await updateDraft(draft.id, { label: idea.format })
            }
            router.push(Routes.DashboardEditor(draft.id))
        } catch {
            toast.error('Failed to create draft')
            setIsCreating(false)
        }
    }

    return (
        <Card className='relative flex flex-col'>
            <CardContent className='flex flex-1 flex-col gap-3 py-4'>
                {/* Dismiss */}
                <Button
                    variant='ghost'
                    size='icon-sm'
                    onClick={onDismiss}
                    aria-label='Dismiss idea'
                    className='text-muted-foreground absolute top-2 right-2'>
                    <XIcon />
                </Button>

                {/* Format badge */}
                <span
                    className={cn(
                        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                        categoryStyle,
                    )}>
                    {idea.format}
                </span>

                {/* Topic */}
                <p className='pr-7 text-sm leading-snug font-medium'>{idea.topic}</p>

                {/* Hook */}
                <p className='text-muted-foreground text-sm leading-relaxed'>"{idea.hook}"</p>

                {/* Create post button */}
                <div className='mt-auto pt-1'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={handleCreatePost}
                        disabled={isCreating}
                        className='w-full'>
                        {isCreating && <Loader2Icon className='size-3.5 animate-spin' />}
                        {isCreating ? 'Creating...' : 'Create Post'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
