'use client'

import React from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import posthog from 'posthog-js'

import { feedbackConfig } from '@/config/feedback'
import { Button } from '@/components/ui/button'

function getStorageKey(slug: string) {
    return `${feedbackConfig.storage.articleVotePrefix}${slug}`
}

export function ArticleHelpfulness({ slug, title }: { slug: string; title: string }) {
    const formId = feedbackConfig.formId
    const [vote, setVote] = React.useState<'yes' | 'no' | null>(null)

    React.useEffect(() => {
        const stored = localStorage.getItem(getStorageKey(slug))
        if (stored === 'yes' || stored === 'no') {
            setVote(stored)
        }
    }, [slug])

    if (!formId) return null

    const handleVote = (value: 'yes' | 'no') => {
        localStorage.setItem(getStorageKey(slug), value)
        setVote(value)

        posthog?.capture('article_helpful_voted', {
            article_slug: slug,
            article_title: title,
            vote: value,
        })

        window.Tally?.openPopup(formId, {
            hiddenFields: {
                source: `article-${value}`,
                pageUrl: window.location.href,
            },
        })
    }

    return (
        <div className='border-border shadow-subtle bg-accent my-12 rounded-xl border p-6 text-center'>
            {vote ? (
                <p className='text-muted-foreground text-sm font-medium'>Thanks for your feedback!</p>
            ) : (
                <>
                    <p className='text-foreground mb-4 text-sm font-medium'>Was &quot;{title}&quot; helpful?</p>
                    <div className='flex items-center justify-center gap-4'>
                        <Button variant='outline' size='sm' onClick={() => handleVote('yes')}>
                            <ThumbsUp className='size-4' />
                            Yes
                        </Button>
                        <Button variant='outline' size='sm' onClick={() => handleVote('no')}>
                            <ThumbsDown className='size-4' />
                            No
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
