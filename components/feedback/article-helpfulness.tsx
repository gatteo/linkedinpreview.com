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
        <div className='border-border shadow-subtle my-12 rounded-xl border bg-neutral-50 p-6 text-center'>
            {vote ? (
                <p className='text-sm font-medium text-neutral-500'>Thanks for your feedback!</p>
            ) : (
                <>
                    <p className='mb-4 text-sm font-medium text-neutral-900'>Was &quot;{title}&quot; helpful?</p>
                    <div className='flex items-center justify-center gap-4'>
                        <button
                            onClick={() => handleVote('yes')}
                            className='border-border shadow-subtle flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50'>
                            <ThumbsUp className='size-4' />
                            Yes
                        </button>
                        <button
                            onClick={() => handleVote('no')}
                            className='border-border shadow-subtle flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50'>
                            <ThumbsDown className='size-4' />
                            No
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
