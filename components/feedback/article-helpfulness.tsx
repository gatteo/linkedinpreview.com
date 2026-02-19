'use client'

import React from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import posthog from 'posthog-js'

import { feedbackConfig } from '@/config/feedback'

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

        posthog.capture('article_helpful_voted', {
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
        <div className='my-12 rounded-lg border bg-muted/50 p-6 text-center'>
            {vote ? (
                <p className='text-sm font-medium text-muted-foreground'>Thanks for your feedback!</p>
            ) : (
                <>
                    <p className='mb-4 text-sm font-medium'>Was &quot;{title}&quot; helpful?</p>
                    <div className='flex items-center justify-center gap-4'>
                        <button
                            onClick={() => handleVote('yes')}
                            className='flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-muted'>
                            <ThumbsUp className='size-4' />
                            Yes
                        </button>
                        <button
                            onClick={() => handleVote('no')}
                            className='flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-muted'>
                            <ThumbsDown className='size-4' />
                            No
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
